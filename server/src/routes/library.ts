import { Router } from 'express'
import { supabase } from '../config/supabase.ts'
import { authMiddleware } from '../middleware/auth.ts'
import type { AuthRequest } from '../middleware/auth.ts'

const router = Router()

// POST /api/library/videos - Save a video to library
router.post('/videos', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { videoUrl, thumbnailUrl, title, duration } = req.body
        const userId = req.user?.id

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' })
            return
        }

        if (!videoUrl) {
            res.status(400).json({ error: 'Missing videoUrl' })
            return
        }

        const { data, error } = await supabase
            .from('saved_videos')
            .insert({
                user_id: userId,
                video_url: videoUrl,
                thumbnail_url: thumbnailUrl || null,
                title: title || null,
                duration: duration || 0
            })
            .select()
            .single()

        if (error) {
            console.error('Supabase error:', error)
            res.status(500).json({ error: error.message })
            return
        }

        res.json({ success: true, video: data })
    } catch (error) {
        console.error('Save video error:', error)
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
})

// GET /api/library/videos - Get all user's videos
router.get('/videos', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.id

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' })
            return
        }

        const { data, error } = await supabase
            .from('saved_videos')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Supabase error:', error)
            res.status(500).json({ error: error.message })
            return
        }

        res.json(data || [])
    } catch (error) {
        console.error('Get videos error:', error)
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
})

// DELETE /api/library/videos/:id - Delete a video
router.delete('/videos/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params
        const userId = req.user?.id

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' })
            return
        }

        const { error } = await supabase
            .from('saved_videos')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)

        if (error) {
            console.error('Supabase error:', error)
            res.status(500).json({ error: error.message })
            return
        }

        res.json({ success: true })
    } catch (error) {
        console.error('Delete video error:', error)
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
})

export const libraryRouter = router
