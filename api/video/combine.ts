import type { VercelRequest, VercelResponse } from '@vercel/node'
import { falService } from '../_lib/services/fal'
import { supabase } from '../_lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // POST: Start combining videos
    if (req.method === 'POST') {
        return handleStartCombine(req, res)
    }

    // GET: Check combine status
    if (req.method === 'GET') {
        return handleCombineStatus(req, res)
    }

    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
}

async function handleStartCombine(req: VercelRequest, res: VercelResponse) {
    try {
        const { generationId } = req.body

        if (!generationId) {
            return res.status(400).json({ error: 'Missing generationId' })
        }

        // Get video record from Supabase
        const { data: videoRecord, error: fetchError } = await supabase
            .from('videos')
            .select('*')
            .eq('id', generationId)
            .single()

        if (fetchError || !videoRecord) {
            return res.status(404).json({ error: 'Video record not found' })
        }

        // Use lip-synced scene URLs if available, otherwise fallback to original Kie.ai URLs
        const syncedUrls = videoRecord.synced_scene_urls || []
        const originalUrls = videoRecord.videourls_scenes || []

        // Prefer synced URLs, but fallback to original if synced not available for a scene
        const sceneUrls = syncedUrls.length > 0
            ? syncedUrls.map((url: string, i: number) => url || originalUrls[i])
            : originalUrls

        if (sceneUrls.length < 2) {
            return res.status(400).json({ error: 'Need at least 2 scenes to combine' })
        }

        console.log(`Combining ${sceneUrls.length} scenes for generation ${generationId}`)
        console.log(`Using ${syncedUrls.length > 0 ? 'lip-synced' : 'original'} scene URLs`)

        // Start video combining
        const { requestId } = await falService.combineVideos(sceneUrls)

        // Update Supabase
        await supabase
            .from('videos')
            .update({
                combine_video_request_id: requestId,
                status: 'combining_videos'
            })
            .eq('id', generationId)

        return res.json({
            success: true,
            requestId,
            message: 'Video combining started'
        })
    } catch (error) {
        console.error('Combine error:', error)
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
}

async function handleCombineStatus(req: VercelRequest, res: VercelResponse) {
    try {
        const requestId = req.query.requestId as string
        const generationId = req.query.generationId as string | undefined

        if (!requestId) {
            return res.status(400).json({ error: 'Missing requestId' })
        }

        const { status, completed } = await falService.checkRequestStatus(requestId)

        let videoUrl = null
        let thumbnailUrl = null

        if (completed) {
            const result = await falService.getCombineVideoResult(requestId)
            videoUrl = result.videoUrl
            thumbnailUrl = result.thumbnailUrl

            // Update Supabase with final video URL
            if (generationId) {
                console.log(`[Supabase] Updating final_video_url for generation ${generationId}:`, videoUrl)
                await supabase
                    .from('videos')
                    .update({
                        final_video_url: videoUrl,
                        thumbnail_url: thumbnailUrl,
                        status: 'completed'
                    })
                    .eq('id', generationId)
            } else {
                // Fallback: lookup by combine_video_request_id
                const { data: videoRecord } = await supabase
                    .from('videos')
                    .select('id')
                    .eq('combine_video_request_id', requestId)
                    .single()

                if (videoRecord) {
                    await supabase
                        .from('videos')
                        .update({
                            final_video_url: videoUrl,
                            thumbnail_url: thumbnailUrl,
                            status: 'completed'
                        })
                        .eq('id', videoRecord.id)
                }
            }
        }

        return res.json({
            requestId,
            status,
            completed,
            videoUrl,
            thumbnailUrl
        })
    } catch (error) {
        console.error('Combine status error:', error)
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
}
