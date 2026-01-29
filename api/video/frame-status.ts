import type { VercelRequest, VercelResponse } from '@vercel/node'
import { falService } from '../_lib/services/fal'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET'])
        return res.status(405).end(`Method ${req.method} Not Allowed`)
    }

    try {
        const requestId = req.query.requestId as string

        if (!requestId || typeof requestId !== 'string') {
            return res.status(400).json({ error: 'Missing requestId' })
        }

        const { status, completed } = await falService.checkRequestStatus(requestId)

        let frameUrl = null
        if (completed) {
            frameUrl = await falService.getExtractFrameResult(requestId)
        }

        return res.json({
            requestId,
            status,
            completed,
            frameUrl
        })
    } catch (error) {
        console.error('Frame status error:', error)
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
}
