import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load env vars before using them
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl) {
    console.warn('Warning: Missing SUPABASE_URL. Supabase features will not work.')
}

// Use service role key for database operations (bypasses RLS)
export const supabase = supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : supabaseUrl && supabaseAnonKey
        ? createClient(supabaseUrl, supabaseAnonKey)
        : null as any

// Separate client for auth verification (uses anon key)
export const supabaseAuth = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null as any
