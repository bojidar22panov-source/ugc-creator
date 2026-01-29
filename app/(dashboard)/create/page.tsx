'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, ChevronLeft, Check, Wand2, Loader2, Download, AlertCircle } from 'lucide-react'
import { Button, Card, Progress, Badge } from '@/components/ui'
import { ProductUploader } from '@/components/upload'
import { AvatarGrid } from '@/components/avatar'
import { ScriptEditor } from '@/components/script'
import { BackgroundSelector } from '@/components/background'
import { useWizardStore } from '@/stores'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { uploadProductImage } from '@/lib/supabase/client'
import { videoApi, scriptApi, productsApi } from '@/lib/api'
import { DEMO_AVATARS } from '@/lib/constants'
import axios from 'axios'

const steps = [
    { id: 'product', label: 'Продукт' },
    { id: 'avatar', label: 'Аватар' },
    { id: 'script', label: 'Скрипт' },
    { id: 'background', label: 'Фон' },
    { id: 'review', label: 'Преглед' },
    { id: 'progress', label: 'Генерация' },
    { id: 'result', label: 'Резултат' },
]

export default function CreateVideoPage() {
    const store = useWizardStore()
    const [isGenerating, setIsGenerating] = useState(false)
    const [taskId, setTaskId] = useState<string | null>(null)
    const [_generationId, setGenerationId] = useState<string | null>(null)
    const [videoUrl, setVideoUrl] = useState<string | null>(null)
    const [generationStatus, setGenerationStatus] = useState<'pending' | 'processing' | 'processing_next_scene' | 'combining' | 'completed' | 'failed'>('pending')
    const [generationError, setGenerationError] = useState<string | null>(null)
    const [isUploadingProduct, setIsUploadingProduct] = useState(false)
    const [storedProductUrl, setStoredProductUrl] = useState<string | null>(null)
    const pollingInterval = useRef<ReturnType<typeof setInterval> | null>(null)
    const { user } = useAuthStore()

    const currentStepIndex = steps.findIndex(s => s.id === store.currentStep)
    const progress = ((currentStepIndex + 1) / steps.length) * 100

    useEffect(() => {
        return () => {
            if (pollingInterval.current) clearInterval(pollingInterval.current)
        }
    }, [])

    const canProceed = () => {
        switch (store.currentStep) {
            case 'product': return !!storedProductUrl && !isUploadingProduct
            case 'avatar': return !!store.avatar.id
            case 'script': return !!store.script.content
            case 'background': return !!store.background.backgroundId || !!store.background.customDescription
            default: return true
        }
    }

    const handleProductImageUpload = async (file: File, previewUrl: string) => {
        store.setProductImage(previewUrl, file)

        if (!user) {
            alert('Моля, влезте в системата')
            return
        }

        setIsUploadingProduct(true)
        try {
            const publicUrl = await uploadProductImage(file, user.id)
            await productsApi.save(publicUrl, store.product.name || undefined)
            setStoredProductUrl(publicUrl)
        } catch (error) {
            console.error('Product upload failed:', error)
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            alert(`Грешка при качване на изображението: ${errorMessage}`)
            store.setProductImage(null, null)
        } finally {
            setIsUploadingProduct(false)
        }
    }

    const handleClearProduct = () => {
        store.setProductImage(null, null)
        setStoredProductUrl(null)
    }

    const startPolling = (tid: string, gid: string) => {
        if (pollingInterval.current) clearInterval(pollingInterval.current)
        setGenerationError(null)

        pollingInterval.current = setInterval(async () => {
            try {
                const status = await videoApi.getStatus(tid, gid)
                setGenerationStatus(status.status)

                if (status.status === 'completed' && status.videoUrl) {
                    setVideoUrl(status.videoUrl)
                    store.setStep('result')
                    if (pollingInterval.current) clearInterval(pollingInterval.current)
                } else if (status.status === 'failed') {
                    if (pollingInterval.current) clearInterval(pollingInterval.current)
                    setGenerationError('Грешка при генерация')
                }
            } catch (error) {
                console.error('Polling error:', error)
            }
        }, 10000)
    }

    const handleGenerateVideo = async () => {
        try {
            setIsGenerating(true)
            store.setStep('progress')

            const selectedAvatar = DEMO_AVATARS.find(a => a.id === store.avatar.id)
            const avatarUrl = selectedAvatar?.thumbnailUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=720&h=1280&fit=crop'

            const response = await videoApi.generate(
                store.script.content,
                avatarUrl,
                store.avatar.id || null,
                '9:16',
                store.script.duration,
                'bg',
                storedProductUrl,
                store.product.name || null,
                user?.id
            )

            if (response.success && response.taskId) {
                setTaskId(response.taskId)
                setGenerationId(response.generationId || null)
                setGenerationStatus('processing')
                startPolling(response.taskId, response.generationId || response.taskId)
            }
        } catch (error) {
            console.error('Generation failed:', error)
            let message = 'Възникна грешка при стартиране на генерацията.'
            if (axios.isAxiosError(error)) {
                if (error.response) {
                    message = error.response.data?.error || message
                } else if (error.request) {
                    message = 'Сървърът не отговаря.'
                }
            }
            alert(`Грешка: ${message}`)
            store.setStep('review')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleGenerateScript = async () => {
        store.setScriptGenerated(false)
        setIsGenerating(true)

        try {
            const productName = store.product.name || "този продукт"
            const response = await scriptApi.generate(
                productName,
                store.product.description,
                store.script.tone,
                store.script.duration
            )

            if (response.success && response.script) {
                store.setScriptContent(response.script)
                store.setScriptGenerated(true)
            }
        } catch (error) {
            console.error('Script generation failed:', error)
            alert('Грешка при генериране на скрипт.')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleNext = () => {
        if (store.currentStep === 'review') {
            handleGenerateVideo()
        } else {
            store.nextStep()
        }
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-surface-100">Създай ново видео</h1>
                    <p className="text-surface-400">Стъпка {currentStepIndex + 1} от {steps.length}</p>
                </div>
                <div className="w-1/3">
                    <Progress value={progress} size="sm" variant="gradient" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-6">
                    <Card className="min-h-[500px] p-6">
                        {store.currentStep === 'product' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-surface-100">Качете снимка на продукта</h2>
                                <ProductUploader
                                    onImageSelect={handleProductImageUpload}
                                    currentImage={store.product.imageUrl}
                                    onClear={handleClearProduct}
                                />
                                {isUploadingProduct && (
                                    <div className="flex items-center gap-2 text-sm text-surface-400">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Качване на изображението...
                                    </div>
                                )}
                                {store.product.imageUrl && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-surface-200 mb-1.5">Име на продукта</label>
                                            <input
                                                type="text"
                                                value={store.product.name}
                                                onChange={(e) => store.setProductName(e.target.value)}
                                                placeholder="Напр. Хидратиращ крем Rose"
                                                className="w-full px-3 py-2 bg-surface-800 border border-surface-600 rounded-lg text-surface-100 focus:ring-2 focus:ring-primary-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-surface-200 mb-1.5">Описание на продукта</label>
                                            <textarea
                                                value={store.product.description}
                                                onChange={(e) => store.setProductDescription(e.target.value)}
                                                placeholder="Опишете продукта..."
                                                rows={4}
                                                className="w-full px-3 py-2 bg-surface-800 border border-surface-600 rounded-lg text-surface-100 focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        )}

                        {store.currentStep === 'avatar' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-surface-100">Изберете AI водещ</h2>
                                <AvatarGrid selectedId={store.avatar.id} onSelect={store.setAvatarId} />
                            </div>
                        )}

                        {store.currentStep === 'script' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-surface-100">Генериране на скрипт</h2>
                                <ScriptEditor
                                    content={store.script.content}
                                    onChange={store.setScriptContent}
                                    tone={store.script.tone}
                                    onToneChange={store.setScriptTone}
                                    duration={store.script.duration}
                                    onDurationChange={store.setScriptDuration}
                                    isGenerating={false}
                                    onGenerate={handleGenerateScript}
                                />
                            </div>
                        )}

                        {store.currentStep === 'background' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-surface-100">Изберете фон</h2>
                                <BackgroundSelector settings={store.background} onChange={store.setBackgroundSettings} />
                            </div>
                        )}

                        {store.currentStep === 'review' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-surface-100">Преглед преди генерация</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-4 bg-surface-800 rounded-lg border border-surface-700">
                                        <p className="text-sm text-surface-400">Продукт</p>
                                        <p className="font-medium text-surface-100">{store.product.name || 'Без име'}</p>
                                    </div>
                                    <div className="p-4 bg-surface-800 rounded-lg border border-surface-700">
                                        <p className="text-sm text-surface-400">Времетраене</p>
                                        <p className="font-medium text-surface-100">{store.script.duration} секунди</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-surface-800 rounded-lg border border-surface-700">
                                    <p className="text-sm text-surface-400 mb-2">Скрипт</p>
                                    <p className="text-sm text-surface-200 line-clamp-4 italic">{store.script.content}</p>
                                </div>
                            </div>
                        )}

                        {store.currentStep === 'progress' && (
                            <div className="flex flex-col items-center justify-center py-12 space-y-8">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-primary-500/20 blur-xl rounded-full" />
                                    <div className="relative w-24 h-24 rounded-full bg-surface-800 border border-surface-600 flex items-center justify-center">
                                        {generationStatus === 'failed' ? (
                                            <AlertCircle className="w-10 h-10 text-error" />
                                        ) : (
                                            <Loader2 className="w-10 h-10 text-primary-400 animate-spin" />
                                        )}
                                    </div>
                                </div>
                                <div className="text-center space-y-2">
                                    <h2 className="text-xl font-bold text-white mb-2">
                                        {generationStatus === 'failed' ? 'Грешка при генерация' : 'Генериране на видео...'}
                                    </h2>
                                    <p className="text-surface-400 max-w-md mx-auto">
                                        {generationStatus === 'failed' ? generationError : 'Това може да отнеме няколко минути.'}
                                    </p>
                                </div>
                                {taskId && <Badge variant="default" className="font-mono text-xs">Task ID: {taskId}</Badge>}
                            </div>
                        )}

                        {store.currentStep === 'result' && videoUrl && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-surface-100 text-center">Видеото е готово! 🎉</h2>
                                <div className="aspect-[9/16] max-h-[500px] mx-auto bg-black rounded-xl overflow-hidden">
                                    <video src={videoUrl} controls className="w-full h-full object-contain" autoPlay loop />
                                </div>
                                <div className="flex justify-center gap-4">
                                    <Button variant="primary" onClick={() => window.open(videoUrl, '_blank')}>
                                        <Download className="w-4 h-4 mr-2" />
                                        Свали видео
                                    </Button>
                                    <Button variant="secondary" onClick={() => store.reset()}>Създай ново</Button>
                                </div>
                            </div>
                        )}
                    </Card>

                    {store.currentStep !== 'progress' && store.currentStep !== 'result' && (
                        <div className="flex justify-between pt-4">
                            <Button variant="secondary" onClick={store.prevStep} disabled={currentStepIndex === 0}>
                                <ChevronLeft className="w-4 h-4" />
                                Назад
                            </Button>
                            <Button variant="primary" onClick={handleNext} disabled={!canProceed() || isGenerating} isLoading={isGenerating}>
                                {store.currentStep === 'review' ? (
                                    <>Генерирай видео<Wand2 className="w-4 h-4" /></>
                                ) : (
                                    <>Напред<ChevronRight className="w-4 h-4" /></>
                                )}
                            </Button>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-4">
                    <Card className="sticky top-24 p-6 bg-surface-800/50 backdrop-blur-sm border-surface-700">
                        <h3 className="font-semibold text-lg mb-4">Вашият проект</h3>
                        <div className="space-y-4">
                            {steps.map((step, index) => {
                                const isActive = store.currentStep === step.id
                                const isCompleted = index < currentStepIndex
                                return (
                                    <div key={step.id} className="flex items-start gap-3">
                                        <div className={cn(
                                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0",
                                            isActive ? "bg-primary-500 text-white" :
                                                isCompleted ? "bg-success text-white" : "bg-surface-700 text-surface-400"
                                        )}>
                                            {isCompleted ? <Check className="w-3.5 h-3.5" /> : index + 1}
                                        </div>
                                        <p className={cn(
                                            "text-sm font-medium",
                                            isActive ? "text-primary-400" : isCompleted ? "text-surface-200" : "text-surface-500"
                                        )}>{step.label}</p>
                                    </div>
                                )
                            })}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
