import { Router } from 'express'
import { supabase } from '../config/supabase.ts'
import { authMiddleware } from '../middleware/auth.ts'
import type { AuthRequest } from '../middleware/auth.ts'

const router = Router()

// POST /api/products - Save a product image URL
router.post('/', authMiddleware, async (req, res) => {
    const authReq = req as AuthRequest
    try {
        const { imageUrl, name } = req.body

        if (!imageUrl) {
            res.status(400).json({ error: 'Missing imageUrl' })
            return
        }

        const { data, error } = await supabase
            .from('products')
            .insert({
                user_id: authReq.user!.id,
                image_url: imageUrl,
                name: name || null
            })
            .select()
            .single()

        if (error) {
            console.error('Supabase insert error:', error)
            res.status(500).json({ error: error.message })
            return
        }

        res.json({ success: true, product: data })
    } catch (error) {
        console.error('Product save error:', error)
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
})

// GET /api/products/latest - Get user's latest product
router.get('/latest', authMiddleware, async (req, res) => {
    const authReq = req as AuthRequest
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('user_id', authReq.user!.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
            console.error('Supabase fetch error:', error)
            res.status(500).json({ error: error.message })
            return
        }

        res.json({ success: true, product: data || null })
    } catch (error) {
        console.error('Product fetch error:', error)
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
})

// GET /api/products/:id - Get a specific product
router.get('/:id', authMiddleware, async (req, res) => {
    const authReq = req as AuthRequest
    const { id } = req.params

    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .eq('user_id', authReq.user!.id)
            .single()

        if (error) {
            console.error('Supabase fetch error:', error)
            res.status(404).json({ error: 'Product not found' })
            return
        }

        res.json({ success: true, product: data })
    } catch (error) {
        console.error('Product fetch error:', error)
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
})

export const productsRouter = router
