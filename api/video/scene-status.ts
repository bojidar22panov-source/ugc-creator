import type { VercelRequest, VercelResponse } from '@vercel/node'
import { kieService } from '../_lib/services/kie'
import { supabase } from '../_lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET'])
        return res.status(405).end(`Method ${req.method} Not Allowed`)
    }

    try {
        const generationId = req.query.generationId as string
        const sceneTaskId = req.query.sceneTaskId as string

        if (!generationId || !sceneTaskId || typeof sceneTaskId !== 'string') {
            return res.status(400).json({ error: 'Missing generationId or sceneTaskId' })
        }

        // Get video record from Supabase
        const { data: videoRecord, error: fetchError } = await supabase
            .from('videos')
            .select('*')
            .eq('id', generationId)
            .single()

        if (fetchError || !videoRecord) {
            return res.status(404).json({ error: 'Video record not found' })
        }

        // Check status of the scene from Kie.ai
        const taskInfo = await kieService.getTaskStatus(sceneTaskId)

        let status = 'pending'
        let sceneUrl = null
        const sceneUrls = videoRecord.videourls_scenes || []
        const totalScenes = videoRecord.total_scenes || 1

        if (taskInfo.successFlag === 1) {
            status = 'completed'
            sceneUrl = taskInfo.response?.resultUrls[0]

            // Add scene URL if not already added
            if (sceneUrl && !sceneUrls.includes(sceneUrl)) {
                sceneUrls.push(sceneUrl)
                console.log(`Scene completed, total scenes: ${sceneUrls.length}/${totalScenes}`)

                // Update Supabase
                await supabase
                    .from('videos')
                    .update({
                        current_scene: sceneUrls.length,
                        videourls_scenes: sceneUrls,
                        status: sceneUrls.length >= totalScenes ? 'ready_to_combine' : `generating_scene_${sceneUrls.length + 1}`
                    })
                    .eq('id', generationId)
            }
        } else if (taskInfo.successFlag === 0) {
            status = 'processing'
        } else {
            status = 'failed'
        }

        // Get the script for this scene from stored scene_scripts
        const sceneScripts = videoRecord.scene_scripts || []
        const currentSceneIndex = (videoRecord.current_scene || 1) - 1
        const sceneScript = sceneScripts[currentSceneIndex] || null

        return res.json({
            sceneTaskId,
            status,
            sceneUrl,
            sceneScript,
            sceneNumber: videoRecord.current_scene || 1,
            totalScenes,
            allScenesComplete: sceneUrls.length >= totalScenes,
            sceneUrls
        })
    } catch (error) {
        console.error('Scene status error:', error)
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
}
