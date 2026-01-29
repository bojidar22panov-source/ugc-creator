import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Upload a file to Supabase Storage and return the public URL
 */
export async function uploadProductImage(file: File, userId: string): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`

    const { data, error } = await supabase.storage
        .from('products')
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
        })

    if (error) {
        throw new Error(`Upload failed: ${error.message}`)
    }

    // Get public URL
    const { data: urlData } = supabase.storage
        .from('products')
        .getPublicUrl(data.path)

    return urlData.publicUrl
}
