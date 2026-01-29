import type { VercelRequest, VercelResponse } from '@vercel/node'
import { syncService } from '../_lib/services/sync'
import { supabase } from '../_lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // POST: Start lip sync for a scene
    if (req.method === 'POST') {
        return handleStartLipSync(req, res)
    }

    // GET: Check lip sync status
    if (req.method === 'GET') {
        return handleLipSyncStatus(req, res)
    }

    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
}

async function handleStartLipSync(req: VercelRequest, res: VercelResponse) {
    try {
        const { generationId, sceneIndex, videoUrl, script, avatarId } = req.body

        if (!generationId || sceneIndex === undefined || !videoUrl || !script) {
            return res.status(400).json({ error: 'Missing required fields: generationId, sceneIndex, videoUrl, script' })
        }

        console.log(`[LipSync] Starting lip sync for generation ${generationId}, scene ${sceneIndex}`)

        // Start lip sync with Sync.so
        const syncTaskId = await syncService.generateLipSync({
            videoUrl,
            script,
            avatarId
        })

        // Get current sync_task_ids from database
        const { data: videoRecord, error: fetchError } = await supabase
            .from('videos')
            .select('sync_task_ids')
            .eq('id', generationId)
            .single()

        if (fetchError) {
            console.error('[Supabase] Error fetching video record:', fetchError)
            return res.status(500).json({ error: 'Failed to fetch video record' })
        }

        // Update sync_task_ids array
        const syncTaskIds = videoRecord?.sync_task_ids || []
        syncTaskIds[sceneIndex] = syncTaskId

        // Update database
        await supabase
            .from('videos')
            .update({
                sync_task_ids: syncTaskIds,
                current_lip_sync_scene: sceneIndex,
                status: `lip_syncing_scene_${sceneIndex + 1}`
            })
            .eq('id', generationId)

        return res.json({
            success: true,
            syncTaskId,
            sceneIndex,
            message: 'Lip sync started'
        })
    } catch (error) {
        console.error('Lip sync start error:', error)
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
}

async function handleLipSyncStatus(req: VercelRequest, res: VercelResponse) {
    try {
        const syncTaskId = req.query.syncTaskId as string
        const generationId = req.query.generationId as string | undefined
        const sceneIndex = parseInt(req.query.sceneIndex as string)

        if (!syncTaskId) {
            return res.status(400).json({ error: 'Missing syncTaskId' })
        }

        // Check status from Sync.so
        const taskStatus = await syncService.getTaskStatus(syncTaskId)

        let outputUrl = null
        const isCompleted = taskStatus.status === 'COMPLETED'
        const isProcessing = syncService.isProcessing(taskStatus.status)
        const isFailed = syncService.isFailed(taskStatus.status)

        if (isCompleted && taskStatus.outputUrl) {
            outputUrl = taskStatus.outputUrl
            console.log(`[LipSync] Scene ${sceneIndex} completed with URL: ${outputUrl}`)

            // Update database with synced video URL
            if (generationId && !isNaN(sceneIndex)) {
                const { data: videoRecord } = await supabase
                    .from('videos')
                    .select('synced_scene_urls, total_scenes')
                    .eq('id', generationId)
                    .single()

                const syncedUrls = videoRecord?.synced_scene_urls || []
                syncedUrls[sceneIndex] = outputUrl

                await supabase
                    .from('videos')
                    .update({
                        synced_scene_urls: syncedUrls,
                        status: syncedUrls.filter(Boolean).length >= (videoRecord?.total_scenes || 1)
                            ? 'ready_to_combine'
                            : `lip_sync_scene_${sceneIndex + 1}_completed`
                    })
                    .eq('id', generationId)
            }
        }

        return res.json({
            syncTaskId,
            status: taskStatus.status,
            isCompleted,
            isProcessing,
            isFailed,
            outputUrl,
            error: taskStatus.error
        })
    } catch (error) {
        console.error('Lip sync status error:', error)
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
}
