import axios from 'axios'

const SYNC_SO_API_KEY = process.env.SYNC_SO_API_KEY
const SYNC_SO_BASE_URL = 'https://api.sync.so/v2'

// Voice ID for Maria avatar
const MARIA_VOICE_ID = 'M1ydWt7KnBCiuv4CnEDC'

interface GenerateLipSyncParams {
    videoUrl: string
    script: string
    avatarId?: string
}

interface SyncSoGenerateResponse {
    id: string
    createdAt: string
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REJECTED'
    model: string
    input: Array<{
        type: string
        url?: string
        provider?: {
            name?: string
            voiceId?: string
            script?: string
        }
    }>
    outputUrl?: string
    outputDuration?: number
    error?: string | null
}

export const syncService = {
    /**
     * Start lip sync generation for a video
     */
    async generateLipSync({ videoUrl, script, avatarId }: GenerateLipSyncParams): Promise<string> {
        if (!SYNC_SO_API_KEY) {
            throw new Error('SYNC_SO_API_KEY is not defined in environment variables')
        }

        // Determine voice ID based on avatar (Maria uses specific voice)
        const voiceId = avatarId === 'maria' ? MARIA_VOICE_ID : MARIA_VOICE_ID // Default to Maria for now

        console.log(`[Sync.so] Starting lip sync for video: ${videoUrl.substring(0, 50)}...`)
        console.log(`[Sync.so] Script (first 100 chars): ${script.substring(0, 100)}...`)
        console.log(`[Sync.so] Voice ID: ${voiceId}`)

        try {
            const response = await axios.post<SyncSoGenerateResponse>(
                `${SYNC_SO_BASE_URL}/generate`,
                {
                    model: 'lipsync-2',
                    input: [
                        {
                            type: 'video',
                            url: videoUrl
                        },
                        {
                            type: 'text',
                            provider: {
                                name: 'elevenlabs',
                                voiceId: voiceId,
                                script: script
                            }
                        }
                    ],
                    options: {
                        sync_mode: 'loop'
                    }
                },
                {
                    headers: {
                        'x-api-key': SYNC_SO_API_KEY,
                        'Content-Type': 'application/json'
                    }
                }
            )

            const taskId = response.data.id
            console.log(`[Sync.so] Lip sync task started with ID: ${taskId}`)
            return taskId
        } catch (error) {
            console.error('[Sync.so] Error starting lip sync:', error)
            if (axios.isAxiosError(error)) {
                throw new Error(`Sync.so Error: ${error.response?.data?.error || error.message}`)
            }
            throw error
        }
    },

    /**
     * Check status of a lip sync task
     */
    async getTaskStatus(taskId: string): Promise<SyncSoGenerateResponse> {
        if (!SYNC_SO_API_KEY) {
            throw new Error('SYNC_SO_API_KEY is not defined in environment variables')
        }

        try {
            const response = await axios.get<SyncSoGenerateResponse>(
                `${SYNC_SO_BASE_URL}/generate/${taskId}`,
                {
                    headers: {
                        'x-api-key': SYNC_SO_API_KEY
                    }
                }
            )

            console.log(`[Sync.so] Task ${taskId} status: ${response.data.status}`)
            return response.data
        } catch (error) {
            console.error('[Sync.so] Error checking task status:', error)
            if (axios.isAxiosError(error)) {
                throw new Error(`Sync.so Error: ${error.response?.data?.error || error.message}`)
            }
            throw error
        }
    },

    /**
     * Check if a status indicates the task is still processing
     */
    isProcessing(status: string): boolean {
        return status === 'PENDING' || status === 'PROCESSING'
    },

    /**
     * Check if a status indicates failure
     */
    isFailed(status: string): boolean {
        return status === 'FAILED' || status === 'REJECTED'
    }
}
