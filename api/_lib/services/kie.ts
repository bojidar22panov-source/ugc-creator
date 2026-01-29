import axios from 'axios'
import { applyStressMarks } from './stressMarker'

const API_BASE_URL = 'https://api.kie.ai/api/v1/veo'

interface GenerateParams {
    prompt: string
    imageUrl: string
    aspectRatio?: '16:9' | '9:16' | '1:1'
    watermark?: string
    callBackUrl?: string
    language?: string
    productUrl?: string
    isContinuation?: boolean
}

interface GenerateResponse {
    code: number
    msg: string
    data: {
        taskId: string
    }
}

interface TaskStatusResponse {
    code: number
    msg: string
    data: {
        taskId: string
        paramJson: string
        completeTime: string | null
        response: {
            taskId: string
            resultUrls: string[]
            originUrls: string[]
            resolution: string
        } | null
        successFlag: number
        errorCode: string | null
        errorMessage: string
        createTime: string
        fallbackFlag: boolean
    }
}

function buildUGCDirectorInstructions(productUrl?: string, isContinuation?: boolean): string {
    let instructions = ''

    instructions += ' IMPORTANT: No voiceover or narration. Only the avatar speaks directly to camera. No background voice.'

    instructions += ' The video should look like a smartphone selfie, with the camera about 50cm from the avatar. Focus mostly on the face and natural expressions. The avatar breathes naturally with subtle shoulder movement and blinks every few seconds. Facial expressions should match the emotional tone of the message.'

    if (productUrl) {
        instructions += ' The left hand holds the product at chest level, about 15cm from camera with the label visible. The right hand rests out of frame. At the end, the left hand lowers the product smoothly.'
        instructions += ' CRITICAL: The product MUST be clearly visible in the final frame of the scene. Position the product prominently in the last 2 seconds so it can be used as the starting frame for the next scene.'
    } else {
        instructions += ' Both hands rest out of frame. If a small gesture is needed, just the right hand can briefly appear and quickly exit within 2 seconds.'
    }

    instructions += ' CRITICAL: The avatar must finish speaking on a COMPLETE WORD - never cut mid-word. The final spoken word should be clearly articulated.'
    instructions += ' At the scene end, the avatar holds a comfortable, still pose for about 1.5 seconds, like pressing pause mid-conversation. Avoid fading, zooming, waving or looking away. The camera should be completely still for the final 2 seconds, with the avatar centered and visible for smooth transition.'

    if (!isContinuation) {
        instructions += ' Start with a medium close-up showing shoulders to head. Make direct eye contact within the first 2 seconds. Use a natural handheld camera feel.'
    } else {
        instructions += ' Continue the talking-head style from before with a slight camera angle change.'
    }

    instructions += ' Deliver the message naturally at a conversational pace with 16-22 words, including natural pauses for breathing.'

    return instructions
}


export const kieService = {
    async generateVideo({ prompt, imageUrl, aspectRatio = '16:9', watermark = 'UGC Creator', callBackUrl, language, productUrl, isContinuation = false }: GenerateParams): Promise<string> {
        const API_KEY = process.env.KIE_AI_API_KEY
        if (!API_KEY) {
            throw new Error('KIE_AI_API_KEY is not defined in environment variables')
        }

        try {
            const imageUrls = [imageUrl]
            if (productUrl) {
                imageUrls.push(productUrl)
            }

            const stressedScript = applyStressMarks(prompt)
            let finalPrompt = stressedScript

            const ugcInstructions = buildUGCDirectorInstructions(productUrl, isContinuation)
            finalPrompt += ugcInstructions

            console.log(`[Kie.ai] Original script: ${prompt}`)
            console.log(`[Kie.ai] Stressed script: ${stressedScript}`)
            console.log(`[Kie.ai] Generating ${isContinuation ? 'continuation' : 'first'} scene`)
            console.log(`[Kie.ai] Script word count: ~${prompt.split(' ').length} words`)

            const payload: any = {
                prompt: finalPrompt,
                imageUrls,
                model: 'veo3_fast',
                callBackUrl,
                aspectRatio,
                seeds: Math.floor(Math.random() * 89999) + 10000,
                enableFallback: false,
                enableTranslation: true,
                generationType: isContinuation ? 'FIRST_AND_LAST_FRAMES_2_VIDEO' : 'REFERENCE_2_VIDEO'
            }

            const response = await axios.post<GenerateResponse>(
                `${API_BASE_URL}/generate`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            )

            if (response.data.code === 200 && response.data.data?.taskId) {
                return response.data.data.taskId
            } else {
                throw new Error(`Kie.ai API Error: ${response.data.msg}`)
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`Wrapper API Error: ${error.response?.data?.msg || error.message}`)
            }
            throw error
        }
    },

    async getTaskStatus(taskId: string): Promise<TaskStatusResponse['data']> {
        const API_KEY = process.env.KIE_AI_API_KEY
        if (!API_KEY) {
            throw new Error('KIE_AI_API_KEY is not defined in environment variables')
        }

        try {
            const response = await axios.get<TaskStatusResponse>(
                `${API_BASE_URL}/record-info`,
                {
                    headers: {
                        'Authorization': `Bearer ${API_KEY}`
                    },
                    params: {
                        taskId
                    }
                }
            )

            if (response.data.code === 200) {
                return response.data.data
            } else {
                throw new Error(`Kie.ai Status Error: ${response.data.msg}`)
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`Wrapper API Error: ${error.response?.data?.msg || error.message}`)
            }
            throw error
        }
    }
}
