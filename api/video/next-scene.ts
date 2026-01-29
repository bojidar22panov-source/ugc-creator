import type { VercelRequest, VercelResponse } from '@vercel/node'
import { falService } from '../_lib/services/fal'
import { supabase } from '../_lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST'])
        return res.status(405).end(`Method ${req.method} Not Allowed`)
    }

    try {
        const { generationId, previousVideoUrl } = req.body

        if (!generationId || !previousVideoUrl) {
            return res.status(400).json({ error: 'Missing generationId or previousVideoUrl' })
        }

        console.log(`Extracting last frame from video for generation ${generationId}`)

        // Extract last frame from previous scene
        const { requestId } = await falService.extractLastFrame(previousVideoUrl)

        // Update Supabase with extraction request
        await supabase
            .from('videos')
            .update({
                frame_extraction_request_id: requestId,
                status: 'extracting_frame'
            })
            .eq('id', generationId)

        return res.json({
            success: true,
            requestId,
            message: 'Frame extraction started'
        })
    } catch (error) {
        console.error('Next scene error:', error)
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
}
