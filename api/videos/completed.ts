import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyAuth } from '../_lib/auth'
import { supabase } from '../_lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const user = await verifyAuth(req)
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    try {
        const { data, error } = await supabase
            .from('videos')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'completed')
            .not('final_video_url', 'is', null)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Supabase fetch error:', error)
            return res.status(500).json({ error: error.message })
        }

        return res.json(data || [])
    } catch (error) {
        console.error('Get completed videos error:', error)
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
}
