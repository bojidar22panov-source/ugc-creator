import axios from 'axios'
import { getSupabaseClient } from '@/lib/supabase/client'

// Use relative path for single-server deployment (frontend and backend on same origin)
const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
})

// Add auth token to requests
api.interceptors.request.use(async (config) => {
    const supabase = getSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`
    }
    return config
})

// Unified Video interface matching the new videos table
export interface Video {
    id: string
    user_id: string
    product_image_url: string | null
    product_name: string | null
    status: string
    total_scenes: number
    current_scene: number
    videourls_scenes: string[] | null
    frame_extraction_request_id: string | null
    combine_video_request_id: string | null
    final_video_url: string | null
    thumbnail_url: string | null
    title: string | null
    duration: number
    avatar_url: string | null
    script: string | null
    aspect_ratio: string
    language: string
    created_at: string
    updated_at: string
}

// Video generation API (for the generation process itself)
export const videoApi = {
    generate: async (
        script: string,
        avatarUrl: string,
        avatarId: string | null,
        aspectRatio: string,
        duration: number,
        language?: string,
        productUrl?: string | null,
        productName?: string | null,
        userId?: string
    ) => {
        const response = await api.post<{
            success: boolean,
            taskId: string,
            generationId?: string,
            totalScenes: number
        }>('/video/generate', {
            script,
            avatarUrl,
            avatarId,
            aspectRatio,
            language,
            productUrl,
            productName,
            duration,
            userId
        })
        return response.data
    },

    getStatus: async (taskId: string, generationId?: string) => {
        const response = await api.get<{
            taskId: string,
            status: 'pending' | 'processing' | 'processing_next_scene' | 'combining' | 'completed' | 'failed',
            videoUrl: string | null,
            progress: number,
            currentScene: number,
            totalScenes: number,
            sceneUrls: string[]
            sceneScripts: string[]
        }>(`/video/status/${taskId}`, { params: { generationId } })
        return response.data
    },

    startNextScene: async (generationId: string, previousVideoUrl: string) => {
        const response = await api.post<{ success: boolean, requestId: string }>('/video/next-scene', {
            generationId,
            previousVideoUrl
        })
        return response.data
    },

    getFrameStatus: async (requestId: string) => {
        const response = await api.get<{
            requestId: string,
            status: string,
            completed: boolean,
            frameUrl: string | null
        }>(`/video/frame-status/${requestId}`)
        return response.data
    },

    generateScene: async (generationId: string, frameUrl: string, sceneNumber: number) => {
        const response = await api.post<{
            success: boolean,
            sceneTaskId: string,
            sceneNumber: number
        }>('/video/generate-scene', {
            generationId,
            frameUrl,
            sceneNumber
        })
        return response.data
    },

    getSceneStatus: async (generationId: string, sceneTaskId: string) => {
        const response = await api.get<{
            sceneTaskId: string,
            status: string,
            sceneUrl: string | null,
            sceneScript: string | null,
            sceneNumber: number,
            totalScenes: number,
            allScenesComplete: boolean,
            sceneUrls: string[]
        }>(`/video/scene-status/${generationId}/${sceneTaskId}`)
        return response.data
    },

    combineScenes: async (generationId: string) => {
        const response = await api.post<{ success: boolean, requestId: string }>('/video/combine', {
            generationId
        })
        return response.data
    },

    getCombineStatus: async (requestId: string, generationId: string) => {
        const response = await api.get<{
            requestId: string,
            status: string,
            completed: boolean,
            videoUrl: string | null,
            thumbnailUrl: string | null
        }>(`/video/combine-status/${requestId}`, { params: { generationId } })
        return response.data
    },

    startLipSync: async (generationId: string, sceneIndex: number, videoUrl: string, script: string, avatarId?: string) => {
        const response = await api.post<{
            success: boolean,
            syncTaskId: string,
            sceneIndex: number
        }>('/video/lipsync', {
            generationId,
            sceneIndex,
            videoUrl,
            script,
            avatarId
        })
        return response.data
    },

    getLipSyncStatus: async (syncTaskId: string, generationId?: string, sceneIndex?: number) => {
        const response = await api.get<{
            syncTaskId: string,
            status: string,
            isCompleted: boolean,
            isProcessing: boolean,
            isFailed: boolean,
            outputUrl: string | null,
            error: string | null
        }>(`/video/lipsync-status/${syncTaskId}`, { params: { generationId, sceneIndex } })
        return response.data
    }
}

// Script generation API
export const scriptApi = {
    generate: async (productName: string, productDescription: string, tone: string, duration: number) => {
        const response = await api.post<{ success: boolean, script: string }>('/video/script/generate', {
            productName,
            productDescription,
            tone,
            duration
        })
        return response.data
    }
}

// Unified Videos CRUD API
export const videosApi = {
    create: async (data: {
        productImageUrl?: string,
        productName?: string,
        avatarUrl?: string,
        script?: string,
        aspectRatio?: string,
        language?: string,
        totalScenes?: number
    }) => {
        const response = await api.post<{ success: boolean, video: Video }>('/videos', data)
        return response.data
    },

    getAll: async () => {
        const response = await api.get<Video[]>('/videos')
        return response.data
    },

    getCompleted: async () => {
        const response = await api.get<Video[]>('/videos/completed')
        return response.data
    },

    getById: async (id: string) => {
        const response = await api.get<{ success: boolean, video: Video }>(`/videos/${id}`)
        return response.data
    },

    update: async (id: string, data: Partial<Video>) => {
        const response = await api.patch<{ success: boolean, video: Video }>(`/videos/${id}`, data)
        return response.data
    },

    delete: async (id: string) => {
        const response = await api.delete<{ success: boolean }>(`/videos/${id}`)
        return response.data
    }
}

// Backward compatibility aliases
export const productsApi = {
    save: async (imageUrl: string, name?: string) => {
        return videosApi.create({ productImageUrl: imageUrl, productName: name })
    },

    getLatest: async () => {
        const videos = await videosApi.getAll()
        const latest = videos.length > 0 ? videos[0] : null
        return {
            success: true,
            product: latest ? {
                id: latest.id,
                user_id: latest.user_id,
                image_url: latest.product_image_url || '',
                name: latest.product_name,
                created_at: latest.created_at
            } : null
        }
    },

    getById: async (id: string) => {
        const { video } = await videosApi.getById(id)
        return {
            success: true,
            product: {
                id: video.id,
                user_id: video.user_id,
                image_url: video.product_image_url || '',
                name: video.product_name,
                created_at: video.created_at
            }
        }
    }
}

export const videosLibraryApi = {
    save: async (videoUrl: string, thumbnailUrl?: string, title?: string, _duration?: number) => {
        return videosApi.create({
            productImageUrl: thumbnailUrl,
            productName: title
        }).then(res => ({
            success: res.success,
            video: {
                id: res.video.id,
                user_id: res.video.user_id,
                video_url: res.video.final_video_url || videoUrl,
                thumbnail_url: res.video.thumbnail_url,
                title: res.video.title,
                duration: res.video.duration,
                created_at: res.video.created_at
            }
        }))
    },

    getAll: async () => {
        const videos = await videosApi.getCompleted()
        return videos.map(v => ({
            id: v.id,
            user_id: v.user_id,
            video_url: v.final_video_url || '',
            thumbnail_url: v.thumbnail_url,
            title: v.title || v.product_name,
            duration: v.duration,
            created_at: v.created_at
        }))
    },

    delete: async (id: string) => {
        return videosApi.delete(id)
    }
}
