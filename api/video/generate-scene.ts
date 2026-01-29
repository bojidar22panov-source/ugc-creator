import type { VercelRequest, VercelResponse } from '@vercel/node'
import { kieService } from '../_lib/services/kie'
import { supabase } from '../_lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST'])
        return res.status(405).end(`Method ${req.method} Not Allowed`)
    }

    try {
        const { generationId, frameUrl, sceneNumber } = req.body

        if (!generationId || !frameUrl) {
            return res.status(400).json({ error: 'Missing generationId or frameUrl' })
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

        const sceneScripts = videoRecord.scene_scripts || []
        const currentSceneScript = sceneScripts[sceneNumber - 1]

        if (!currentSceneScript) {
            return res.status(400).json({ error: 'Scene script not found' })
        }

        console.log(`Generating scene ${sceneNumber} with extracted frame`)

        // Generate next scene using the extracted frame
        const newTaskId = await kieService.generateVideo({
            prompt: currentSceneScript,
            imageUrl: frameUrl,
            aspectRatio: videoRecord.aspect_ratio || '9:16',
            language: videoRecord.language,
            productUrl: undefined,
            isContinuation: true
        })

        // Update Supabase with new task ID
        await supabase
            .from('videos')
            .update({
                current_task_id: newTaskId,
                current_scene: sceneNumber,
                status: `generating_scene_${sceneNumber}`
            })
            .eq('id', generationId)

        return res.json({
            success: true,
            sceneTaskId: newTaskId,
            sceneNumber
        })
    } catch (error) {
        console.error('Generate scene error:', error)
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
}
