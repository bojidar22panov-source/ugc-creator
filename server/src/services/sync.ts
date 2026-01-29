import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SYNC_SO_API_KEY = process.env.SYNC_SO_API_KEY
const SYNC_SO_BASE_URL = 'https://api.sync.so/v2'

// Voice ID for Maria avatar
const MARIA_VOICE_ID = 'M1ydWt7KnBCiuv4CnEDC'

if (!SYNC_SO_API_KEY) {
    console.warn('Warning: Missing SYNC_SO_API_KEY. Lip sync will not work.')
}

interface LipSyncResponse {
    id: string
    createdAt: string
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REJECTED'
    model: string
    input: Array<{
        type: string
        url?: string
        provider?: {
            script?: string
            voiceId?: string
        }
    }>
    outputUrl?: string
    outputDuration?: number
    error?: string | null
}

export const syncService = {
    /**
     * Get the voice ID for an avatar
     */
    getVoiceIdForAvatar(avatarId: string | null): string | null {
        // Currently only Maria has a custom voice
        if (avatarId === 'maria' || avatarId === 'avatar_maria') {
            return MARIA_VOICE_ID
        }
        // Add more avatars here as needed
        return MARIA_VOICE_ID // Default to Maria for now
    },

    /**
     * Start lip sync for a video
     */
    async startLipSync(
        videoUrl: string,
        script: string,
        voiceId: string | null
    ): Promise<{ taskId: string; status: string }> {
        console.log(`[Sync.so] Starting lip sync for video: ${videoUrl.substring(0, 50)}...`)
        console.log(`[Sync.so] Script: ${script.substring(0, 50)}...`)
        console.log(`[Sync.so] Voice ID: ${voiceId || MARIA_VOICE_ID}`)

        const response = await axios.post<LipSyncResponse>(
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
                            voiceId: voiceId || MARIA_VOICE_ID,
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

        console.log(`[Sync.so] Started task: ${response.data.id}, status: ${response.data.status}`)

        return {
            taskId: response.data.id,
            status: response.data.status
        }
    },

    /**
     * Check the status of a lip sync task
     */
    async getLipSyncStatus(taskId: string): Promise<{
        status: string
        isCompleted: boolean
        isFailed: boolean
        outputUrl: string | null
        error: string | null
    }> {
        const response = await axios.get<LipSyncResponse>(
            `${SYNC_SO_BASE_URL}/generate/${taskId}`,
            {
                headers: {
                    'x-api-key': SYNC_SO_API_KEY
                }
            }
        )

        const data = response.data
        const isCompleted = data.status === 'COMPLETED'
        const isFailed = data.status === 'FAILED' || data.status === 'REJECTED'

        console.log(`[Sync.so] Task ${taskId} status: ${data.status}`)

        return {
            status: data.status,
            isCompleted,
            isFailed,
            outputUrl: isCompleted ? data.outputUrl || null : null,
            error: data.error || null
        }
    },

    /**
     * Poll until lip sync is complete (with timeout)
     */
    async pollUntilComplete(
        taskId: string,
        maxAttempts: number = 60,
        intervalMs: number = 10000
    ): Promise<{ success: boolean; outputUrl: string | null; error: string | null }> {
        for (let i = 0; i < maxAttempts; i++) {
            const result = await this.getLipSyncStatus(taskId)

            if (result.isCompleted) {
                return {
                    success: true,
                    outputUrl: result.outputUrl,
                    error: null
                }
            }

            if (result.isFailed) {
                return {
                    success: false,
                    outputUrl: null,
                    error: result.error || 'Lip sync failed'
                }
            }

            // Wait before next poll
            await new Promise(resolve => setTimeout(resolve, intervalMs))
        }

        return {
            success: false,
            outputUrl: null,
            error: 'Lip sync timed out'
        }
    }
}
