import type { VercelRequest, VercelResponse } from '@vercel/node'
import { openaiService } from '../_lib/services/openai'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST'])
        return res.status(405).end(`Method ${req.method} Not Allowed`)
    }

    try {
        const { productName, productDescription, tone, duration } = req.body

        if (!productName) {
            return res.status(400).json({ error: 'Missing productName' })
        }

        const script = await openaiService.generateScript({
            productName,
            productDescription,
            tone: tone || 'friendly',
            duration: duration || 32
        })

        return res.json({ success: true, script })
    } catch (error) {
        console.error('Script generation error:', error)
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
}
