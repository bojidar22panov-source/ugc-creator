import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyAuth } from '../_lib/auth'
import { supabase } from '../_lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Verify authentication
    const user = await verifyAuth(req)
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    switch (req.method) {
        case 'GET':
            return handleGetVideos(req, res, user.id)
        case 'POST':
            return handleCreateVideo(req, res, user.id)
        default:
            res.setHeader('Allow', ['GET', 'POST'])
            return res.status(405).end(`Method ${req.method} Not Allowed`)
    }
}

async function handleGetVideos(req: VercelRequest, res: VercelResponse, userId: string) {
    try {
        const { data, error } = await supabase
            .from('videos')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Supabase fetch error:', error)
            return res.status(500).json({ error: error.message })
        }

        return res.json(data || [])
    } catch (error) {
        console.error('Get videos error:', error)
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
}

async function handleCreateVideo(req: VercelRequest, res: VercelResponse, userId: string) {
    try {
        const {
            productImageUrl,
            productName,
            avatarUrl,
            script,
            aspectRatio,
            language,
            totalScenes
        } = req.body

        const { data, error } = await supabase
            .from('videos')
            .insert({
                user_id: userId,
                product_image_url: productImageUrl || null,
                product_name: productName || null,
                avatar_url: avatarUrl || null,
                script: script || null,
                aspect_ratio: aspectRatio || '9:16',
                language: language || 'bg',
                total_scenes: totalScenes || 1,
                current_scene: 0,
                status: 'pending'
            })
            .select()
            .single()

        if (error) {
            console.error('Supabase insert error:', error)
            return res.status(500).json({ error: error.message })
        }

        return res.json({ success: true, video: data })
    } catch (error) {
        console.error('Create video error:', error)
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
}
