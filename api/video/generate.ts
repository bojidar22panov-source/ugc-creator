import type { VercelRequest, VercelResponse } from '@vercel/node'
import { kieService } from '../_lib/services/kie'
import { supabase } from '../_lib/supabase'

// Calculate number of scenes based on duration
function calculateSceneCount(duration: number): number {
    return Math.ceil(duration / 8)
}

// Split full script into individual scene scripts
function splitScriptIntoScenes(fullScript: string, sceneCount: number): string[] {
    const words = fullScript.trim().split(/\s+/)
    const wordsPerScene = Math.ceil(words.length / sceneCount)
    const scenes: string[] = []

    for (let i = 0; i < sceneCount; i++) {
        const start = i * wordsPerScene
        const end = Math.min((i + 1) * wordsPerScene, words.length)
        const sceneWords = words.slice(start, end)
        scenes.push(sceneWords.join(' '))
    }

    console.log(`[Script Split] Total words: ${words.length}, Scenes: ${sceneCount}, Words per scene: ~${wordsPerScene}`)
    return scenes
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST'])
        return res.status(405).end(`Method ${req.method} Not Allowed`)
    }

    try {
        const { script, avatarUrl, avatarId, aspectRatio, language, productUrl, productName, duration, userId } = req.body

        if (!script || !avatarUrl) {
            return res.status(400).json({ error: 'Missing script or avatarUrl' })
        }

        const totalScenes = calculateSceneCount(duration || 8)
        console.log(`Starting multi-scene generation: ${totalScenes} scenes for ${duration}s video`)

        // Split script into individual scene scripts
        const sceneScripts = splitScriptIntoScenes(script, totalScenes)

        // Create video generation record in Supabase (always create, even without userId)
        let generationId: string | null = null
        console.log(`[Generate] Creating Supabase record. userId: ${userId || 'ANONYMOUS'}`)

        const { data, error } = await supabase
            .from('videos')
            .insert({
                user_id: userId || null, // Allow null for anonymous users
                script: script,
                avatar_url: avatarUrl,
                avatar_id: avatarId || null,
                product_image_url: productUrl || null,
                product_name: productName || null,
                aspect_ratio: aspectRatio || '9:16',
                language: language || 'bg',
                duration: duration || 8,
                total_scenes: totalScenes,
                current_scene: 0,
                status: 'generating_scene_1',
                scene_scripts: sceneScripts
            })
            .select()
            .single()

        if (error) {
            console.error('[Supabase] Error creating video record:', error)
            // Don't fail the request, but log the error
        } else if (data) {
            generationId = data.id
            console.log(`[Supabase] Created video record with id: ${generationId}`)
        }

        // Start first scene generation
        const taskId = await kieService.generateVideo({
            prompt: sceneScripts[0],
            imageUrl: avatarUrl,
            aspectRatio: aspectRatio || '9:16',
            language,
            productUrl
        })

        // Store task metadata in Supabase for persistence
        if (generationId) {
            await supabase
                .from('videos')
                .update({
                    current_task_id: taskId,
                    scene_scripts: sceneScripts
                })
                .eq('id', generationId)
        }

        return res.json({
            success: true,
            taskId,
            generationId,
            totalScenes
        })
    } catch (error) {
        console.error('Generation error:', error)
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
}
