import axios from 'axios'

const FAL_KEY = process.env.FAL_KEY
const FAL_BASE_URL = 'https://queue.fal.run/fal-ai/ffmpeg-api'

interface QueueResponse {
    status: 'IN_QUEUE' | 'COMPLETED' | 'FAILED'
    request_id: string
    response_url: string | null
    status_url: string | null
    cancel_url: string | null
    logs: unknown
    metrics: Record<string, unknown>
    queue_position?: number
}

interface ExtractFrameResult {
    images: Array<{
        url: string
        content_type?: string
        file_name?: string
        file_size?: number
        width?: number
        height?: number
    }>
}

interface CombineVideoResult {
    video_url: string
    thumbnail_url: string
}

interface VideoKeyframe {
    url: string
    timestamp: number
    duration: number
}

export const falService = {
    /**
     * Extract the last frame from a video
     */
    async extractLastFrame(videoUrl: string): Promise<{ requestId: string }> {
        const response = await axios.post<QueueResponse>(
            `${FAL_BASE_URL}/extract-frame`,
            {
                video_url: videoUrl,
                frame_type: 'last'
            },
            {
                headers: {
                    'Authorization': `Key ${FAL_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        )

        const data = Array.isArray(response.data) ? response.data[0] : response.data
        return { requestId: data.request_id }
    },

    /**
     * Check the status of a fal.ai request
     */
    async checkRequestStatus(requestId: string): Promise<{ status: string; completed: boolean }> {
        const response = await axios.get<QueueResponse | QueueResponse[]>(
            `${FAL_BASE_URL}/requests/${requestId}/status`,
            {
                headers: {
                    'Authorization': `Key ${FAL_KEY}`
                }
            }
        )

        const data = Array.isArray(response.data) ? response.data[0] : response.data
        return {
            status: data.status,
            completed: data.status === 'COMPLETED'
        }
    },

    /**
     * Get the result of a completed frame extraction request
     */
    async getExtractFrameResult(requestId: string): Promise<string> {
        const response = await axios.get<ExtractFrameResult | ExtractFrameResult[]>(
            `${FAL_BASE_URL}/requests/${requestId}`,
            {
                headers: {
                    'Authorization': `Key ${FAL_KEY}`
                }
            }
        )

        const data = Array.isArray(response.data) ? response.data[0] : response.data
        if (!data.images || data.images.length === 0) {
            throw new Error('No images returned from frame extraction')
        }
        return data.images[0].url
    },

    /**
     * Combine multiple video scenes into one video
     */
    async combineVideos(sceneUrls: string[]): Promise<{ requestId: string }> {
        const keyframes: VideoKeyframe[] = sceneUrls.map((url, index) => ({
            url,
            timestamp: index * 8,
            duration: 8
        }))

        const response = await axios.post<QueueResponse>(
            `${FAL_BASE_URL}/compose`,
            {
                tracks: [
                    {
                        id: '1',
                        type: 'video',
                        keyframes
                    }
                ]
            },
            {
                headers: {
                    'Authorization': `Key ${FAL_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        )

        const data = Array.isArray(response.data) ? response.data[0] : response.data
        return { requestId: data.request_id }
    },

    /**
     * Get the result of a completed video combine request
     */
    async getCombineVideoResult(requestId: string): Promise<{ videoUrl: string; thumbnailUrl: string }> {
        const response = await axios.get<CombineVideoResult | CombineVideoResult[]>(
            `${FAL_BASE_URL}/requests/${requestId}`,
            {
                headers: {
                    'Authorization': `Key ${FAL_KEY}`
                }
            }
        )

        const data = Array.isArray(response.data) ? response.data[0] : response.data
        return {
            videoUrl: data.video_url,
            thumbnailUrl: data.thumbnail_url
        }
    },

    /**
     * Poll until a request is completed (with timeout)
     */
    async pollUntilComplete(
        requestId: string,
        maxAttempts: number = 60,
        intervalMs: number = 10000
    ): Promise<boolean> {
        for (let i = 0; i < maxAttempts; i++) {
            const { status, completed } = await this.checkRequestStatus(requestId)

            if (completed) {
                return true
            }

            if (status !== 'IN_QUEUE' && status !== 'COMPLETED') {
                throw new Error(`Request failed with status: ${status}`)
            }

            // Wait before next poll
            await new Promise(resolve => setTimeout(resolve, intervalMs))
        }

        throw new Error('Request timed out')
    }
}
