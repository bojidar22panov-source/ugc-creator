import type { VercelRequest } from '@vercel/node'
import { supabaseAuth } from './supabase'

export interface AuthUser {
    id: string
    email?: string
}

export async function verifyAuth(req: VercelRequest): Promise<AuthUser | null> {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null
    }

    const token = authHeader.split(' ')[1]

    try {
        const { data: { user }, error } = await supabaseAuth.auth.getUser(token)

        if (error || !user) {
            return null
        }

        return {
            id: user.id,
            email: user.email
        }
    } catch (error) {
        console.error('Auth verification error:', error)
        return null
    }
}
