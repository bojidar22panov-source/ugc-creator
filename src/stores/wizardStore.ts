import { create } from 'zustand'
import type { WizardState, WizardStep, ScriptTone, ScriptDuration, VideoAspectRatio, VideoResolution, BackgroundSettings } from '@/types'

const initialBackgroundSettings: BackgroundSettings = {
    backgroundId: null,
    customDescription: null,
    timeOfDay: 'day',
    lightingStyle: 'natural',
    colorMood: 'vibrant'
}

const initialState: WizardState = {
    currentStep: 'product',
    product: {
        id: null,
        name: '',
        description: '',
        category: '',
        imageUrl: null,
        imageFile: null
    },
    avatar: {
        id: null
    },
    script: {
        content: '',
        tone: 'friendly',
        duration: 32,
        isGenerated: false
    },
    background: initialBackgroundSettings,
    settings: {
        aspectRatio: '9:16',
        resolution: '1080p'
    }
}

interface WizardActions {
    // Navigation
    setStep: (step: WizardStep) => void
    nextStep: () => void
    prevStep: () => void

    // Product
    setProductName: (name: string) => void
    setProductDescription: (description: string) => void
    setProductCategory: (category: string) => void
    setProductImage: (imageUrl: string | null, imageFile: File | null) => void
    setProductId: (id: string | null) => void

    // Avatar
    setAvatarId: (id: string | null) => void

    // Script
    setScriptContent: (content: string) => void
    setScriptTone: (tone: ScriptTone) => void
    setScriptDuration: (duration: ScriptDuration) => void
    setScriptGenerated: (isGenerated: boolean) => void

    // Background
    setBackgroundId: (id: string | null) => void
    setCustomBackground: (description: string | null) => void
    setBackgroundSettings: (settings: Partial<BackgroundSettings>) => void

    // Video settings
    setAspectRatio: (ratio: VideoAspectRatio) => void
    setResolution: (resolution: VideoResolution) => void

    // Reset
    reset: () => void
}

type WizardStore = WizardState & WizardActions

const stepOrder: WizardStep[] = ['product', 'avatar', 'script', 'background', 'review', 'progress', 'result']

export const useWizardStore = create<WizardStore>()((set) => ({
    ...initialState,

    // Navigation
    setStep: (step) => set({ currentStep: step }),

    nextStep: () => set((state) => {
        const currentIndex = stepOrder.indexOf(state.currentStep)
        if (currentIndex < stepOrder.length - 1) {
            return { currentStep: stepOrder[currentIndex + 1] }
        }
        return state
    }),

    prevStep: () => set((state) => {
        const currentIndex = stepOrder.indexOf(state.currentStep)
        if (currentIndex > 0) {
            return { currentStep: stepOrder[currentIndex - 1] }
        }
        return state
    }),

    // Product
    setProductName: (name) => set((state) => ({
        product: { ...state.product, name }
    })),

    setProductDescription: (description) => set((state) => ({
        product: { ...state.product, description }
    })),

    setProductCategory: (category) => set((state) => ({
        product: { ...state.product, category }
    })),

    setProductImage: (imageUrl, imageFile) => set((state) => ({
        product: { ...state.product, imageUrl, imageFile }
    })),

    setProductId: (id) => set((state) => ({
        product: { ...state.product, id }
    })),

    // Avatar
    setAvatarId: (id) => set((state) => ({
        avatar: { ...state.avatar, id }
    })),

    // Script
    setScriptContent: (content) => set((state) => ({
        script: { ...state.script, content }
    })),

    setScriptTone: (tone) => set((state) => ({
        script: { ...state.script, tone }
    })),

    setScriptDuration: (duration) => set((state) => ({
        script: { ...state.script, duration }
    })),

    setScriptGenerated: (isGenerated) => set((state) => ({
        script: { ...state.script, isGenerated }
    })),



    // Background
    setBackgroundId: (id) => set((state) => ({
        background: { ...state.background, backgroundId: id }
    })),

    setCustomBackground: (description) => set((state) => ({
        background: { ...state.background, customDescription: description }
    })),

    setBackgroundSettings: (settings) => set((state) => ({
        background: { ...state.background, ...settings }
    })),

    // Video settings
    setAspectRatio: (aspectRatio) => set((state) => ({
        settings: { ...state.settings, aspectRatio }
    })),

    setResolution: (resolution) => set((state) => ({
        settings: { ...state.settings, resolution }
    })),

    // Reset
    reset: () => set(initialState)
}))
