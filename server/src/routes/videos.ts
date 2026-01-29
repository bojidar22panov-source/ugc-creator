import { Router } from 'express'
import { supabase } from '../config/supabase.ts'
import { authMiddleware } from '../middleware/auth.ts'
import type { AuthRequest } from '../middleware/auth.ts'

const router = Router()

// POST /api/videos - Create a new video record (when starting generation)
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
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
        const userId = req.user?.id

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' })
            return
        }

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
            res.status(500).json({ error: error.message })
            return
        }

        res.json({ success: true, video: data })
    } catch (error) {
        console.error('Create video error:', error)
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
})

// GET /api/videos - Get all user's videos
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.id

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' })
            return
        }

        const { data, error } = await supabase
            .from('videos')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Supabase fetch error:', error)
            res.status(500).json({ error: error.message })
            return
        }

        res.json(data || [])
    } catch (error) {
        console.error('Get videos error:', error)
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
})

// GET /api/videos/completed - Get only completed videos for library
router.get('/completed', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.id

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' })
            return
        }

        const { data, error } = await supabase
            .from('videos')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .not('final_video_url', 'is', null)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Supabase fetch error:', error)
            res.status(500).json({ error: error.message })
            return
        }

        res.json(data || [])
    } catch (error) {
        console.error('Get completed videos error:', error)
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
})

// GET /api/videos/:id - Get a specific video
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params
        const userId = req.user?.id

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' })
            return
        }

        const { data, error } = await supabase
            .from('videos')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single()

        if (error) {
            console.error('Supabase fetch error:', error)
            res.status(404).json({ error: 'Video not found' })
            return
        }

        res.json({ success: true, video: data })
    } catch (error) {
        console.error('Get video error:', error)
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
})

// PATCH /api/videos/:id - Update video record (for generation progress)
router.patch('/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params
        const userId = req.user?.id
        const updates = req.body

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' })
            return
        }

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
            res.status(500).json({ error: error.message })
            return
        }

        res.json({ success: true, video: data })
    } catch (error) {
        console.error('Update video error:', error)
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
})

// DELETE /api/videos/:id - Delete a video
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params
        const userId = req.user?.id

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' })
            return
        }

        const { error } = await supabase
            .from('videos')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)

        if (error) {
            console.error('Supabase delete error:', error)
            res.status(500).json({ error: error.message })
            return
        }

        res.json({ success: true })
    } catch (error) {
        console.error('Delete video error:', error)
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
})

export const videosRouter = router
