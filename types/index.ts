// User types
export interface User {
    id: string
    email: string
    name: string | null
    company: string | null
    industry: string | null
    subscriptionTier: 'free' | 'pro' | 'agency'
    credits: number
    createdAt: string
}

// Product types
export interface Product {
    id: string
    userId: string
    name: string
    category: string | null
    description: string | null
    imageUrls: string[]
    createdAt: string
}

// Avatar types
export type AvatarGender = 'male' | 'female'
export type AvatarAgeGroup = '18-25' | '25-35' | '35-45' | '45+'
export type AvatarStyle = 'professional' | 'casual' | 'sporty' | 'elegant'
export type AvatarIndustry = 'beauty' | 'tech' | 'food' | 'fashion' | 'fitness' | 'general'

export interface Avatar {
    id: string
    name: string
    heygenId: string
    gender: AvatarGender
    ageGroup: AvatarAgeGroup
    style: AvatarStyle
    industry: AvatarIndustry
    thumbnailUrl: string
    previewUrl: string | null
    isActive: boolean
}

// Script types
export type ScriptTone = 'energetic' | 'professional' | 'friendly' | 'persuasive' | 'educational'
export type ScriptDuration = 8 | 16 | 24 | 32 | 40 | 48 | 56 | 64

export interface Script {
    id: string
    videoId: string
    content: string
    tone: ScriptTone
    duration: ScriptDuration
    language: string
    createdAt: string
}

export interface ScriptGenerationInput {
    productName: string
    productCategory: string
    targetAudience: {
        ageRange: string
        gender: 'all' | 'male' | 'female'
        interests: string[]
    }
    tone: ScriptTone
    duration: ScriptDuration
    keyBenefits: string[]
    callToAction: 'buy_now' | 'learn_more' | 'visit_website' | 'call'
}

// Background types
export type BackgroundType = 'home' | 'outdoor' | 'studio' | 'lifestyle'
export type TimeOfDay = 'morning' | 'day' | 'evening' | 'night'
export type LightingStyle = 'natural' | 'studio' | 'dramatic' | 'soft'

export interface Background {
    id: string
    name: string
    type: BackgroundType
    category: string
    description: string
    previewUrl: string | null
    timeOfDay: TimeOfDay | null
    isActive: boolean
}

export interface BackgroundSettings {
    backgroundId: string | null
    customDescription: string | null
    timeOfDay: TimeOfDay
    lightingStyle: LightingStyle
    colorMood: string
}

// Video types
export type VideoStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type VideoAspectRatio = '9:16' | '16:9' | '1:1'
export type VideoResolution = '720p' | '1080p' | '4K'

export interface Video {
    id: string
    userId: string
    projectId: string | null
    productId: string | null
    avatarId: string
    backgroundType: BackgroundType
    backgroundDesc: string | null
    status: VideoStatus
    progress: number
    videoUrl: string | null
    thumbnailUrl: string | null
    resolution: VideoResolution
    aspectRatio: VideoAspectRatio
    duration: ScriptDuration
    hasWatermark: boolean
    createdAt: string
    completedAt: string | null
    script?: Script
    avatar?: Avatar
    product?: Product
}

export interface VideoGenerationSettings {
    productId: string | null
    avatarId: string
    scriptContent: string
    scriptTone: ScriptTone
    duration: ScriptDuration
    background: BackgroundSettings
    aspectRatio: VideoAspectRatio
    resolution: VideoResolution
}

// Project types
export interface Project {
    id: string
    userId: string
    name: string
    description: string | null
    createdAt: string
    videos?: Video[]
}

// API Response types
export interface ApiResponse<T> {
    success: boolean
    data?: T
    error?: string
    message?: string
}

export interface PaginatedResponse<T> {
    items: T[]
    total: number
    page: number
    pageSize: number
    totalPages: number
}

// Video creation wizard state
export type WizardStep = 'product' | 'avatar' | 'script' | 'background' | 'review' | 'progress' | 'result'

export interface WizardState {
    currentStep: WizardStep
    product: {
        id: string | null
        name: string
        description: string
        category: string
        imageUrl: string | null
        imageFile: File | null
    }
    avatar: {
        id: string | null
    }
    script: {
        content: string
        tone: ScriptTone
        duration: ScriptDuration
        isGenerated: boolean
    }
    background: BackgroundSettings
    settings: {
        aspectRatio: VideoAspectRatio
        resolution: VideoResolution
    }
}
