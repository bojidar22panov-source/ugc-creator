import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyAuth } from '../_lib/auth'
import { supabase } from '../_lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const user = await verifyAuth(req)
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    const { id } = req.query
    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Video ID is required' })
    }

    switch (req.method) {
        case 'GET':
            return handleGetVideo(req, res, id, user.id)
        case 'PATCH':
            return handleUpdateVideo(req, res, id, user.id)
        case 'DELETE':
            return handleDeleteVideo(req, res, id, user.id)
        default:
            res.setHeader('Allow', ['GET', 'PATCH', 'DELETE'])
            return res.status(405).end(`Method ${req.method} Not Allowed`)
    }
}

async function handleGetVideo(req: VercelRequest, res: VercelResponse, id: string, userId: string) {
    try {
        const { data, error } = await supabase
            .from('videos')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single()

        if (error) {
            console.error('Supabase fetch error:', error)
            return res.status(404).json({ error: 'Video not found' })
        }

        return res.json({ success: true, video: data })
    } catch (error) {
        console.error('Get video error:', error)
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
}

async function handleUpdateVideo(req: VercelRequest, res: VercelResponse, id: string, userId: string) {
    try {
        const updates = { ...req.body }

        // Remove fields that shouldn't be updated directly
        delete updates.id
        delete updates.user_id
        delete updates.created_at

        const { data, error } = await supabase
            .from('videos')
            .update(updates)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single()

        if (error) {
            console.error('Supabase update error:', error)
            return res.status(500).json({ error: error.message })
        }

        return res.json({ success: true, video: data })
    } catch (error) {
        console.error('Update video error:', error)
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
}

async function handleDeleteVideo(req: VercelRequest, res: VercelResponse, id: string, userId: string) {
    try {
        const { error } = await supabase
            .from('videos')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)

        if (error) {
            console.error('Supabase delete error:', error)
            return res.status(500).json({ error: error.message })
        }

        return res.json({ success: true })
    } catch (error) {
        console.error('Delete video error:', error)
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
}
