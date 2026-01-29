import { Router } from 'express'
import { kieService } from '../services/kie.ts'
import { openaiService } from '../services/openai.ts'
import { falService } from '../services/fal.ts'
import { syncService } from '../services/sync.ts'
import { supabase } from '../config/supabase.ts'
import { authMiddleware } from '../middleware/auth.ts'
import type { AuthRequest } from '../middleware/auth.ts'

const router = Router()

// In-memory store for demo purposes (should be DB)
const tasks: Record<string, any> = {}

// Calculate number of scenes based on duration
function calculateSceneCount(duration: number): number {
    return Math.ceil(duration / 8)
}

/**
 * Split full script into individual scene scripts
 * Each scene should be approximately 16-22 words
 */
function splitScriptIntoScenes(fullScript: string, sceneCount: number): string[] {
    const words = fullScript.trim().split(/\s+/)
    const wordsPerScene = Math.ceil(words.length / sceneCount)
    const scenes: string[] = []

    for (let i = 0; i < sceneCount; i++) {
        const start = i * wordsPerScene
        const end = Math.min((i + 1) * wordsPerScene, words.length)
        const sceneWords = words.slice(start, end)
        scenes.push(sceneWords.join(' '))
    }

    console.log(`[Script Split] Total words: ${words.length}, Scenes: ${sceneCount}, Words per scene: ~${wordsPerScene}`)
    scenes.forEach((scene, i) => {
        console.log(`  Scene ${i + 1}: ${scene.split(' ').length} words`)
    })

    return scenes
}


// POST /api/videos/script/generate
router.post('/script/generate', async (req, res) => {
    try {
        const { productName, productDescription, tone, duration } = req.body

        if (!productName) {
            res.status(400).json({ error: 'Missing productName' })
            return
        }

        const script = await openaiService.generateScript({
            productName,
            productDescription,
            tone: tone || 'friendly',
            duration: duration || 32
        })

        res.json({ success: true, script })
    } catch (error) {
        console.error('Script generation error:', error)
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
})

// POST /api/videos/generate - Multi-scene video generation
router.post('/generate', async (req, res) => {
    try {
        console.log('=== /generate RECEIVED REQUEST ===')
        console.log('Full req.body:', JSON.stringify(req.body, null, 2))

        const { script, avatarUrl, aspectRatio, language, productUrl, duration, userId } = req.body

        console.log('[Generate] Extracted values:')
        console.log('  - script:', script ? `"${script.substring(0, 50)}..."` : 'NULL/UNDEFINED')
        console.log('  - avatarUrl:', avatarUrl || 'NULL/UNDEFINED')
        console.log('  - duration:', duration, `(type: ${typeof duration})`)
        console.log('  - userId:', userId || 'NULL/UNDEFINED')

        if (!script || !avatarUrl) {
            res.status(400).json({ error: 'Missing script or avatarUrl' })
            return
        }

        const totalScenes = calculateSceneCount(duration || 8)
        console.log(`Starting multi-scene generation: ${totalScenes} scenes for ${duration}s video`)

        // Split script into individual scene scripts
        const sceneScripts = splitScriptIntoScenes(script, totalScenes)

        // Create video generation record in Supabase (always create, even without userId)
        let generationId: string | null = null
        console.log(`[Generate] Creating Supabase record. userId: ${userId || 'ANONYMOUS'}`)

        const { data, error } = await supabase
            .from('videos')
            .insert({
                user_id: userId || null, // Allow null for anonymous users
                script: script,
                avatar_url: avatarUrl,
                product_image_url: productUrl || null,
                aspect_ratio: aspectRatio || '9:16',
                language: language || 'bg',
                duration: duration || 8,
                total_scenes: totalScenes,
                current_scene: 0,
                status: 'generating_scene_1',
                scene_scripts: sceneScripts // Store scene scripts for lip sync
            })
            .select()
            .single()

        if (error) {
            console.error('[Supabase] Error creating video record:', error)
        } else if (data) {
            generationId = data.id
            console.log(`[Supabase] Created video record with id: ${generationId}`)
        }

        // Start first scene generation with ONLY Scene 1 script
        const taskId = await kieService.generateVideo({
            prompt: sceneScripts[0], // Use ONLY first scene script, not full script
            imageUrl: avatarUrl,
            aspectRatio: aspectRatio || '9:16',
            language,
            productUrl
        })

        console.log('[Generate DEBUG] Kie service returned taskId:', taskId)

        // Store task info with multi-scene metadata and all scene scripts
        tasks[taskId] = {
            id: taskId,
            generationId,
            status: 'pending',
            createdAt: new Date(),
            script, // Full script for reference
            sceneScripts, // Individual scene scripts
            avatarUrl,
            productUrl,
            totalScenes,
            currentScene: 1,
            sceneUrls: [],
            aspectRatio: aspectRatio || '9:16',
            language
        }

        // Update Supabase with taskId for persistence
        if (generationId) {
            console.log('[Generate DEBUG] Updating Supabase with taskId...')
            const { error: updateError } = await supabase
                .from('videos')
                .update({
                    current_task_id: taskId,
                    scene_scripts: sceneScripts
                })
                .eq('id', generationId)

            if (updateError) {
                console.error('[Generate DEBUG] Supabase update failed:', updateError)
            } else {
                console.log('[Generate DEBUG] Supabase update successful')
            }
        } else {
            console.log('[Generate DEBUG] No generationId, skipping Supabase update')
        }

        console.log('[Generate DEBUG] Sending response to client')
        res.json({
            success: true,
            taskId,
            generationId,
            totalScenes
        })
    } catch (error) {
        console.error('Generation error:', error)
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
})

// Helper: Get Task or Restore from DB
async function getOrRestoreTask(taskId: string): Promise<any | null> {
    if (tasks[taskId]) {
        return tasks[taskId]
    }

    console.log(`[Task Restore] Task ${taskId} not in memory, checking Supabase...`)

    // Check if taskId looks like a UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(taskId)

    let query = supabase.from('videos').select('*')

    if (isUuid) {
        // If it is a UUID, it might be the row ID
        query = query.eq('id', taskId)
    } else {
        // If not a UUID, it must be the Kie task ID
        query = query.eq('current_task_id', taskId)
    }

    const { data: videoRecord, error } = await query.single()

    if (error || !videoRecord) {
        console.log(`[Task Restore] Task not found in Supabase (UUID check: ${isUuid})`)
        if (error) console.error('[Task Restore] DB Error:', error.message)
        return null
    }

    console.log(`[Task Restore] Found record in Supabase: ${videoRecord.id}`)

    // Reconstruct task in memory
    const actualTaskId = videoRecord.current_task_id || taskId

    const task = {
        id: actualTaskId,
        generationId: videoRecord.id,
        status: videoRecord.status || 'pending',
        createdAt: new Date(videoRecord.created_at),
        script: videoRecord.script,
        sceneScripts: videoRecord.scene_scripts || [],
        avatarUrl: videoRecord.avatar_url,
        productUrl: videoRecord.product_image_url,
        totalScenes: videoRecord.total_scenes || 1,
        currentScene: (videoRecord.current_scene || 0) + 1, // 0-based in DB, 1-based in memory
        sceneUrls: videoRecord.videourls_scenes || [],
        aspectRatio: videoRecord.aspect_ratio || '9:16',
        language: videoRecord.language || 'bg',

        // Restore specific request IDs if available
        frameExtractionRequestId: videoRecord.frame_extraction_request_id,
        combineRequestId: videoRecord.combine_video_request_id,

        currentSceneTaskId: actualTaskId
    }

    // Save back to memory cache
    tasks[taskId] = task // Map requested ID to task
    if (actualTaskId !== taskId) {
        tasks[actualTaskId] = task // Map actual ID too
    }

    return task
}

// GET /api/videos/status/:taskId - Enhanced for multi-scene
router.get('/status/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params
        const task = await getOrRestoreTask(taskId) // Use helper

        // Check status from Kie.ai
        const taskInfo = await kieService.getTaskStatus(taskId)
        console.log(`[Status DEBUG] TaskInfo for ${taskId}:`, JSON.stringify(taskInfo, null, 2))

        let status = 'pending'
        let videoUrl = null
        let progress = 0

        // Robust success check
        const isSuccess = taskInfo.successFlag === 1 || (taskInfo as any).status === 'success' || (taskInfo as any).status === 'COMPLETED' || (taskInfo as any).status === 'SUCCEEDED'
        const isProcessing = taskInfo.successFlag === 0 || (taskInfo as any).status === 'processing' || (taskInfo as any).status === 'RUNNING'

        if (isSuccess) {
            // Robust URL extraction
            const sceneUrl = taskInfo.response?.resultUrls?.[0] ||
                (taskInfo as any).resultUrl ||
                (taskInfo as any).result ||
                (taskInfo as any).videoUrl ||
                ((taskInfo as any).data?.videoUrl)

            console.log(`[Status DEBUG] Extracted sceneUrl:`, sceneUrl)

            if (!sceneUrl) {
                console.error(`[Status ERROR] Task marked as success but NO VIDEO URL found! Keys:`, Object.keys(taskInfo))
            } else if (task) {
                // Add scene URL to list
                if (!task.sceneUrls.includes(sceneUrl)) {
                    task.sceneUrls.push(sceneUrl)
                }

                const completedScenes = task.sceneUrls.length
                progress = Math.round((completedScenes / task.totalScenes) * 100)

                // Check if more scenes needed
                if (completedScenes < task.totalScenes) {
                    status = 'processing_next_scene'
                    task.status = status
                    task.currentScene = completedScenes + 1

                    // Update Supabase
                    if (task.generationId) {
                        console.log(`[Supabase] Updating generation ${task.generationId} after scene ${completedScenes} completed`)
                        console.log(`[Supabase] New videourls_scenes:`, task.sceneUrls)

                        const { error } = await supabase
                            .from('videos')
                            .update({
                                current_scene: completedScenes,
                                videourls_scenes: task.sceneUrls,
                                status: `generating_scene_${completedScenes + 1}`
                            })
                            .eq('id', task.generationId)

                        if (error) {
                            console.error('[Supabase] CRITICAL UPDATE ERROR:', JSON.stringify(error, null, 2))
                        } else {
                            console.log('[Supabase] Update successful')

                            // Trigger Lip Sync for Scene 1 if needed
                            // We are inside "processing_next_scene" block because completedScenes < totalScenes
                            // But actually Scene 1 (index 0) is done.
                            // We should trigger Lip Sync for it.
                            const sceneIndex = completedScenes - 1 // e.g. 1 completed -> index 0

                            // Check if already syncing? We can just fire and forget if API handles dupes or if we blindly trust flow
                            try {
                                console.log(`[Auto-Trigger] Starting Lip Sync for Scene ${completedScenes} (from Status)`)
                                const { taskId: syncTaskId } = await syncService.startLipSync(
                                    sceneUrl,
                                    task.sceneScripts[sceneIndex],
                                    syncService.getVoiceIdForAvatar(task.avatarUrl)
                                )
                                // Update DB
                                const { data: currentRecord } = await supabase
                                    .from('videos')
                                    .select('sync_task_ids')
                                    .eq('id', task.generationId)
                                    .single()
                                const syncs = currentRecord?.sync_task_ids || []
                                syncs[sceneIndex] = syncTaskId

                                await supabase.from('videos').update({ sync_task_ids: syncs }).eq('id', task.generationId)
                            } catch (e) {
                                console.error('[Auto-Trigger] Lip Sync error:', e)
                            }
                        }
                    } else {
                        console.log('[Supabase] No generationId, skipping update')
                    }
                } else if (completedScenes === task.totalScenes) {
                    // All scenes done
                    console.log(`[Status] All ${task.totalScenes} scenes completed.`)

                    if (task.totalScenes === 1) {
                        // Single scene - directly completed
                        status = 'completed'
                        videoUrl = sceneUrl
                        task.status = status
                        task.videoUrl = videoUrl

                        // Update Supabase for single scene completion
                        if (task.generationId) {
                            await supabase
                                .from('videos')
                                .update({
                                    status: 'completed',
                                    final_video_url: videoUrl,
                                    videourls_scenes: task.sceneUrls
                                })
                                .eq('id', task.generationId)
                        }

                    } else {
                        // Multi-scene - need to combine
                        // BUT WAIT! We must lip sync the LAST scene first!
                        // Currently we only lip sync intermediate scenes.
                        // If we are here, it means ALL scenes are generated.
                        // Scene N (last one) completed.
                        const lastSceneIndex = task.totalScenes - 1
                        console.log(`[Status] All scenes generated. Triggering Lip Sync for LAST scene ${task.totalScenes}`)

                        try {
                            const { taskId: syncTaskId } = await syncService.startLipSync(
                                sceneUrl, // This is the url of the LAST scene we just got
                                task.sceneScripts[lastSceneIndex],
                                syncService.getVoiceIdForAvatar(task.avatarUrl)
                            )

                            if (task.generationId) {
                                const { data: currentRecord } = await supabase
                                    .from('videos')
                                    .select('sync_task_ids')
                                    .eq('id', task.generationId)
                                    .single()
                                const syncs = currentRecord?.sync_task_ids || []
                                syncs[lastSceneIndex] = syncTaskId

                                await supabase
                                    .from('videos')
                                    .update({
                                        sync_task_ids: syncs,
                                        status: `lip_syncing_scene_${task.totalScenes}` // Update status to reflect syncing
                                    })
                                    .eq('id', task.generationId)
                            }
                        } catch (e) {
                            console.error('[Status] Lip Sync for LAST scene error:', e)
                        }

                        // Don't set status to 'combining' yet!
                        // We need to wait for Sync to finish.
                        // The Sync Polling logic (or frontend polling lipsync-status) will handle transition to combine?
                        // Actually, my flow relies on polling `lipsync-status`.
                        // If I set status to 'combining' now, backend might try to combine unsynced videos?
                        // No, backend checks db `synced_scene_urls` in `POST /combine`.
                        // But frontend might call `POST /combine` immediately if it sees 'combining' status.
                        // So I should set status to `lip_syncing_scene_N`.

                        status = `lip_syncing_scene_${task.totalScenes}`
                        task.status = status
                    }
                }
            } else {
                // Task object missing even after fallback logic??
                // Just return what we found from Kie
                status = 'completed'
                videoUrl = sceneUrl
            }
        } else if (isProcessing) {
            status = 'processing'
            if (task) {
                progress = Math.round(((task.currentScene - 1) / task.totalScenes) * 100)
            }
        } else {
            status = 'failed'
        }

        res.json({
            taskId,
            status,
            videoUrl,
            progress,
            currentScene: task?.currentScene || 1,
            totalScenes: task?.totalScenes || 1,
            sceneUrls: task?.sceneUrls || [],
            sceneScripts: task?.sceneScripts || [],
            details: taskInfo
        })
    } catch (error) {
        console.error('Status check error:', error)
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
})

// POST /api/videos/next-scene - Generate next scene after frame extraction
router.post('/next-scene', async (req, res) => {
    try {
        console.log('[DEBUG ROUTE] /next-scene HIT!')
        console.log('[DEBUG ROUTE] Body:', JSON.stringify(req.body, null, 2))

        const { taskId, previousVideoUrl } = req.body
        const task = await getOrRestoreTask(taskId) // Use helper

        if (!task) {
            console.log('[DEBUG ROUTE] Task not found after restore attempt')
            res.status(404).json({ error: 'Task not found' })
            return
        }

        console.log(`Extracting last frame from scene ${task.currentScene - 1}`)

        // Extract last frame from previous scene
        const { requestId } = await falService.extractLastFrame(previousVideoUrl)

        // Store request ID
        task.frameExtractionRequestId = requestId

        // Update Supabase
        if (task.generationId) {
            await supabase
                .from('videos')
                .update({
                    frame_extraction_request_id: requestId,
                    status: 'extracting_frame'
                })
                .eq('id', task.generationId)
        }

        res.json({
            success: true,
            requestId,
            message: 'Frame extraction started'
        })
    } catch (error) {
        console.error('Next scene error:', error)
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
})

// GET /api/videos/frame-status/:requestId - Check frame extraction status
router.get('/frame-status/:requestId', async (req, res) => {
    try {
        const { requestId } = req.params
        const { status, completed } = await falService.checkRequestStatus(requestId)

        let frameUrl = null
        if (completed) {
            frameUrl = await falService.getExtractFrameResult(requestId)
        }

        res.json({
            requestId,
            status,
            completed,
            frameUrl
        })
    } catch (error) {
        console.error('Frame status error:', error)
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
})

// POST /api/videos/generate-scene - Generate a scene with extracted frame
router.post('/generate-scene', async (req, res) => {
    try {
        const { taskId, frameUrl } = req.body
        const task = await getOrRestoreTask(taskId) // Use helper

        if (!task) {
            res.status(404).json({ error: 'Task not found' })
            return
        }

        console.log(`Generating scene ${task.currentScene} with extracted frame`)

        // Get the script for current scene (scenes are 0-indexed in array)
        const currentSceneScript = task.sceneScripts[task.currentScene - 1]
        console.log(`Using scene ${task.currentScene} script: ${currentSceneScript.split(' ').length} words`)

        // Generate next scene using the extracted frame as avatar
        const newTaskId = await kieService.generateVideo({
            prompt: currentSceneScript, // Use ONLY this scene's script
            imageUrl: frameUrl, // Use extracted frame
            aspectRatio: task.aspectRatio,
            language: task.language,
            productUrl: undefined, // No product for continuation scenes
            isContinuation: true // Use FIRST_AND_LAST_FRAMES_2_VIDEO generation type without watermark
        })

        // Update task with new scene taskId
        task.currentSceneTaskId = newTaskId

        // Store scene taskIds for tracking
        if (!task.sceneTaskIds) {
            task.sceneTaskIds = [taskId] // First scene taskId
        }
        task.sceneTaskIds.push(newTaskId)

        res.json({
            success: true,
            sceneTaskId: newTaskId,
            sceneNumber: task.currentScene
        })
    } catch (error) {
        console.error('Generate scene error:', error)
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
})

// GET /api/videos/scene-status/:taskId/:sceneTaskId - Check status of a specific scene
router.get('/scene-status/:taskId/:sceneTaskId', async (req, res) => {
    try {
        const { taskId, sceneTaskId } = req.params
        const task = await getOrRestoreTask(taskId) // Use helper (taskId is parent ID)

        if (!task) {
            res.status(404).json({ error: 'Task not found' })
            return
        }

        // Check status of the scene from Kie.ai
        const taskInfo = await kieService.getTaskStatus(sceneTaskId)

        let status = 'pending'
        let sceneUrl = null

        if (taskInfo.successFlag === 1) {
            status = 'completed'
            sceneUrl = taskInfo.response?.resultUrls[0]

            // Add scene URL to list if not already added
            if (sceneUrl && !task.sceneUrls.includes(sceneUrl)) {
                task.sceneUrls.push(sceneUrl)
                console.log(`Scene ${task.currentScene} completed, total scenes: ${task.sceneUrls.length}/${task.totalScenes}`)

                // Trigger Lip Sync immediately for this scene
                const sceneIndex = task.currentScene - 1
                const scriptForScene = task.sceneScripts[sceneIndex]

                // Only trigger if not already syncing this scene
                // Store syncTaskId in DB to avoid dupes? 
                // We'll rely on the client or controller call to startLipSync? 
                // Actually, the user says "След като генерираш ... ще се добавя lip sync".
                // Triggering here is server-side automation.
                // But startLipSync is also exposed as POST.

                // Let's trigger it internally:
                try {
                    console.log(`[Auto-Trigger] Starting Lip Sync for Scene ${task.currentScene}`)
                    const { taskId: syncTaskId } = await syncService.startLipSync(
                        sceneUrl,
                        scriptForScene,
                        syncService.getVoiceIdForAvatar(task.avatarUrl) // Assuming simple mapping for now
                    )

                    // Update Supabase with Sync Info
                    if (task.generationId) {
                        // Fetch existing first
                        const { data: currentRecord } = await supabase
                            .from('videos')
                            .select('sync_task_ids, videourls_scenes')
                            .eq('id', task.generationId)
                            .single()

                        const currentSyncIds = currentRecord?.sync_task_ids || []
                        currentSyncIds[sceneIndex] = syncTaskId

                        await supabase
                            .from('videos')
                            .update({
                                current_scene: task.sceneUrls.length,
                                videourls_scenes: task.sceneUrls,
                                sync_task_ids: currentSyncIds,
                                status: `lip_syncing_scene_${task.currentScene}`
                            })
                            .eq('id', task.generationId)
                    }
                } catch (err) {
                    console.error('[Auto-Trigger] Lip Sync start failed:', err)
                }
            }

            // Check if all scenes are done
            if (task.sceneUrls.length >= task.totalScenes && sceneUrl) {
                // Last scene completed! Trigger Lip Sync for it.
                const lastSceneIndex = task.totalScenes - 1
                const scriptForLast = task.sceneScripts[lastSceneIndex] || ''
                console.log(`[Scene Status] All scenes generated. Triggering Lip Sync for LAST scene ${task.totalScenes}`)

                try {
                    const { taskId: syncTaskId } = await syncService.startLipSync(
                        sceneUrl, // This is the url of the LAST scene we just got
                        scriptForLast,
                        syncService.getVoiceIdForAvatar(task.avatarUrl)
                    )

                    if (task.generationId) {
                        const { data: currentRecord } = await supabase
                            .from('videos')
                            .select('sync_task_ids')
                            .eq('id', task.generationId)
                            .single()
                        const syncs = currentRecord?.sync_task_ids || []
                        syncs[lastSceneIndex] = syncTaskId

                        await supabase
                            .from('videos')
                            .update({
                                sync_task_ids: syncs,
                                status: `lip_syncing_scene_${task.totalScenes}`
                            })
                            .eq('id', task.generationId)
                    }
                } catch (e) {
                    console.error('[Scene Status] Lip Sync for LAST scene error:', e)
                }

                task.status = `lip_syncing_scene_${task.totalScenes}`
            } else {
                task.status = 'processing_next_scene'
                task.currentScene = task.sceneUrls.length + 1
            }
        } else if (taskInfo.successFlag === 0) {
            status = 'processing'
        } else {
            status = 'failed'
        }

        res.json({
            sceneTaskId,
            status,
            sceneUrl,
            sceneNumber: task.currentScene,
            totalScenes: task.totalScenes,
            allScenesComplete: task.sceneUrls.length >= task.totalScenes,
            sceneUrls: task.sceneUrls
        })
    } catch (error) {
        console.error('Scene status error:', error)
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
})

// POST /api/videos/combine - Combine all scenes into final video
router.post('/combine', async (req, res) => {
    try {
        const { taskId, generationId } = req.body
        const task = taskId ? await getOrRestoreTask(taskId) : null

        // If generationId provided, get synced URLs from Supabase
        let urlsToUse: string[] = []
        let genId = generationId

        if (generationId) {
            const { data: videoRecord, error } = await supabase
                .from('videos')
                .select('synced_scene_urls, videourls_scenes')
                .eq('id', generationId)
                .single()

            if (!error && videoRecord) {
                // Prefer synced URLs (lip-synced) over original URLs
                const syncedUrls = videoRecord.synced_scene_urls || []
                const originalUrls = videoRecord.videourls_scenes || []

                // Use synced URL if available, otherwise fallback to original
                urlsToUse = syncedUrls.length > 0
                    ? syncedUrls.map((url: string, i: number) => url || originalUrls[i])
                    : originalUrls

                console.log(`[Combine] Using ${syncedUrls.length > 0 ? 'lip-synced' : 'original'} scene URLs from Supabase`)
            }
        } else if (task) {
            urlsToUse = task.sceneUrls
            genId = task.generationId
        }

        if (!urlsToUse || urlsToUse.length < 2) {
            res.status(400).json({ error: 'Need at least 2 scenes to combine' })
            return
        }

        console.log(`Combining ${urlsToUse.length} scenes`)

        // Start video combining
        const { requestId } = await falService.combineVideos(urlsToUse)

        if (task) {
            task.combineRequestId = requestId
            task.status = 'combining'
        }

        // Update Supabase
        if (genId) {
            console.log(`[Combine] Updating requestid_combinevideo in Supabase for ${genId}`)
            const { error } = await supabase
                .from('videos')
                .update({
                    requestid_combinevideo: requestId, // User specified column name (snake_case/lowercase variation?)
                    // Also update legacy column just in case or if migration failed
                    combine_video_request_id: requestId,
                    status: 'combining_videos'
                })
                .eq('id', genId)

            if (error) {
                console.error('[Combine] Supabase update error:', error)
            }
        }

        res.json({
            success: true,
            requestId,
            message: 'Video combining started'
        })
    } catch (error) {
        console.error('Combine error:', error)
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
})

// GET /api/videos/combine-status/:requestId - Check combine status
router.get('/combine-status/:requestId', async (req, res) => {
    try {
        const { requestId } = req.params
        const { taskId } = req.query

        const { status, completed } = await falService.checkRequestStatus(requestId)

        let videoUrl = null
        let thumbnailUrl = null

        if (completed) {
            const result = await falService.getCombineVideoResult(requestId)
            videoUrl = result.videoUrl
            thumbnailUrl = result.thumbnailUrl

            // Try to update via in-memory task first
            const task = tasks[taskId as string]
            console.log(`[Combine] Looking up task with taskId: ${taskId}`)
            console.log(`[Combine] Task found in memory:`, task ? 'yes' : 'no')

            if (task) {
                task.status = 'completed'
                task.videoUrl = videoUrl
                task.thumbnailUrl = thumbnailUrl

                // Update Supabase via task.generationId
                if (task.generationId) {
                    console.log(`[Supabase] Updating final_video_url for generation ${task.generationId}:`, videoUrl)
                    const { data, error } = await supabase
                        .from('videos')
                        .update({
                            final_video_url: videoUrl,
                            thumbnail_url: thumbnailUrl,
                            status: 'completed'
                        })
                        .eq('id', task.generationId)
                        .select()

                    if (error) {
                        console.error('[Supabase] Failed to update final_video_url:', error)
                    } else {
                        console.log('[Supabase] Successfully updated final_video_url:', data)
                    }
                }
            } else {
                // Fallback: lookup video record by combine_video_request_id
                // This handles server restarts where in-memory tasks are lost
                console.log(`[Combine] Task not in memory, looking up by combine_video_request_id: ${requestId}`)

                const { data: videoRecord, error: lookupError } = await supabase
                    .from('videos')
                    .select('id')
                    .or(`combine_video_request_id.eq.${requestId},requestid_combinevideo.eq.${requestId}`)
                    .single()

                if (lookupError) {
                    console.error('[Supabase] Failed to lookup video by combine_video_request_id:', lookupError)
                } else if (videoRecord) {
                    console.log(`[Supabase] Found video record by combine_video_request_id: ${videoRecord.id}`)

                    const { data, error } = await supabase
                        .from('videos')
                        .update({
                            final_video_url: videoUrl,
                            thumbnail_url: thumbnailUrl,
                            status: 'completed'
                        })
                        .eq('id', videoRecord.id)
                        .select()

                    if (error) {
                        console.error('[Supabase] Failed to update final_video_url:', error)
                    } else {
                        console.log('[Supabase] Successfully updated final_video_url via fallback:', data)
                    }
                } else {
                    console.warn('[Supabase] Could not find video record by combine_video_request_id')
                }
            }
        }

        res.json({
            requestId,
            status,
            completed,
            videoUrl,
            thumbnailUrl
        })
    } catch (error) {
        console.error('Combine status error:', error)
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
})

// POST /api/videos/lipsync - Start lip sync for a scene
router.post('/lipsync', async (req, res) => {
    try {
        const { generationId, sceneIndex, videoUrl, script, avatarId } = req.body

        if (!generationId || sceneIndex === undefined || !videoUrl || !script) {
            res.status(400).json({ error: 'Missing generationId, sceneIndex, videoUrl, or script' })
            return
        }

        console.log(`[Lip Sync] Starting for scene ${sceneIndex + 1} of generation ${generationId}`)
        console.log(`[Lip Sync] Video URL: ${videoUrl.substring(0, 50)}...`)

        // Get voice ID for avatar
        const voiceId = syncService.getVoiceIdForAvatar(avatarId)

        // Start lip sync
        const { taskId, status } = await syncService.startLipSync(videoUrl, script, voiceId)

        // Update Supabase with sync task ID
        const { data: videoRecord } = await supabase
            .from('videos')
            .select('sync_task_ids')
            .eq('id', generationId)
            .single()

        const syncTaskIds = videoRecord?.sync_task_ids || []
        syncTaskIds[sceneIndex] = taskId

        await supabase
            .from('videos')
            .update({
                sync_task_ids: syncTaskIds,
                status: `lip_syncing_scene_${sceneIndex + 1}`
            })
            .eq('id', generationId)

        console.log(`[Lip Sync] Started task ${taskId} for scene ${sceneIndex + 1}`)

        res.json({
            success: true,
            syncTaskId: taskId,
            status,
            sceneIndex
        })
    } catch (error) {
        console.error('Lip sync start error:', error)
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
})

// GET /api/videos/lipsync-status/:taskId - Check lip sync status
router.get('/lipsync-status/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params
        const { generationId, sceneIndex } = req.query

        const result = await syncService.getLipSyncStatus(taskId)

        // If completed, update Supabase with synced URL
        if (result.isCompleted && result.outputUrl && generationId && sceneIndex !== undefined) {
            const sceneIdx = parseInt(sceneIndex as string, 10)

            const { data: videoRecord } = await supabase
                .from('videos')
                .select('synced_scene_urls, total_scenes')
                .eq('id', generationId)
                .single()

            const syncedUrls = videoRecord?.synced_scene_urls || []
            syncedUrls[sceneIdx] = result.outputUrl

            const totalScenes = videoRecord?.total_scenes || 1
            const allSynced = syncedUrls.filter(Boolean).length >= totalScenes
            await supabase
                .from('videos')
                .update({
                    synced_scene_urls: syncedUrls,
                    current_lip_sync_scene: sceneIdx + 1,
                    status: allSynced ? 'ready_to_combine' : `lip_syncing_scene_${sceneIdx + 2}`
                })
                .eq('id', generationId)

            console.log(`[Lip Sync] Scene ${sceneIdx + 1} completed. Synced URL saved.`)
        }

        res.json({
            taskId,
            status: result.status,
            isCompleted: result.isCompleted,
            isFailed: result.isFailed,
            outputUrl: result.outputUrl,
            error: result.error
        })
    } catch (error) {
        console.error('Lip sync status error:', error)
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
})

export const videoRouter = router
