import type { Request, Response, NextFunction } from 'express'
import { supabaseAuth } from '../config/supabase.ts'

export interface AuthRequest extends Request {
    user?: {
        id: string
        email?: string
    }
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or invalid authorization header' })
        return
    }

    const token = authHeader.split(' ')[1]

    try {
        const { data: { user }, error } = await supabaseAuth.auth.getUser(token)

        if (error || !user) {
            res.status(401).json({ error: 'Invalid or expired token' })
            return
        }

        req.user = {
            id: user.id,
            email: user.email
        }

        next()
    } catch (error) {
        console.error('Auth middleware error:', error)
        res.status(500).json({ error: 'Authentication error' })
    }
}
