import type { VercelRequest, VercelResponse } from '@vercel/node'
import { kieService } from '../_lib/services/kie'
import { supabase } from '../_lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET'])
        return res.status(405).end(`Method ${req.method} Not Allowed`)
    }

    try {
        const taskId = req.query.taskId as string
        const generationId = req.query.generationId as string | undefined

        if (!taskId || typeof taskId !== 'string') {
            return res.status(400).json({ error: 'Missing taskId' })
        }

        // Check status from Kie.ai
        const taskInfo = await kieService.getTaskStatus(taskId)

        let status = 'pending'
        let videoUrl = null
        let progress = 0

        // Get task metadata from Supabase
        let videoRecord = null
        if (generationId) {
            const { data } = await supabase
                .from('videos')
                .select('*')
                .eq('id', generationId)
                .single()
            videoRecord = data
        }

        const totalScenes = videoRecord?.total_scenes || 1
        const sceneUrls = videoRecord?.videourls_scenes || []

        if (taskInfo.successFlag === 1) {
            const sceneUrl = taskInfo.response?.resultUrls[0]
            console.log(`[Status] Kie.ai task completed. Scene URL: ${sceneUrl}`)
            console.log(`[Status] Current sceneUrls in DB: ${JSON.stringify(sceneUrls)}`)
            console.log(`[Status] totalScenes: ${totalScenes}`)

            // Add scene URL if not already added
            if (sceneUrl && !sceneUrls.includes(sceneUrl)) {
                sceneUrls.push(sceneUrl)
                console.log(`[Status] Adding new scene URL. New array: ${JSON.stringify(sceneUrls)}`)

                // Update Supabase
                if (generationId) {
                    const newStatus = sceneUrls.length >= totalScenes
                        ? (totalScenes === 1 ? 'completed' : 'ready_to_combine')
                        : `generating_scene_${sceneUrls.length + 1}`

                    console.log(`[Status] Updating Supabase: current_scene=${sceneUrls.length}, status=${newStatus}`)

                    const updateData: Record<string, unknown> = {
                        current_scene: sceneUrls.length,
                        videourls_scenes: sceneUrls,
                        status: newStatus
                    }

                    // For single-scene videos, also set final_video_url immediately
                    if (totalScenes === 1) {
                        updateData.final_video_url = sceneUrl
                        console.log(`[Status] Single scene video - setting final_video_url: ${sceneUrl}`)
                    }

                    const { error: updateError } = await supabase
                        .from('videos')
                        .update(updateData)
                        .eq('id', generationId)

                    if (updateError) {
                        console.error(`[Status] Supabase update error:`, updateError)
                    } else {
                        console.log(`[Status] Supabase updated successfully`)
                    }
                }
            }

            const completedScenes = sceneUrls.length
            progress = Math.round((completedScenes / totalScenes) * 100)

            if (completedScenes < totalScenes) {
                status = 'processing_next_scene'
            } else if (totalScenes === 1) {
                status = 'completed'
                videoUrl = sceneUrl
                console.log(`[Status] Single scene completed! Video URL: ${videoUrl}`)
            } else {
                status = 'combining'
                console.log(`[Status] All ${totalScenes} scenes complete, ready to combine`)
            }
        } else if (taskInfo.successFlag === 0) {
            status = 'processing'
            progress = Math.round(((sceneUrls.length) / totalScenes) * 100)
        } else {
            status = 'failed'
        }

        return res.json({
            taskId,
            status,
            videoUrl,
            progress,
            currentScene: sceneUrls.length + 1,
            totalScenes,
            sceneUrls,
            details: taskInfo
        })
    } catch (error) {
        console.error('Status check error:', error)
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
}
