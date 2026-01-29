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
import { uploadProductImage } from '@/lib/supabase'
import { videoApi, scriptApi, productsApi } from '@/services/api'
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

export function CreateVideo() {
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

    // Cleanup polling on unmount
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

    // Handle product image upload to Supabase Storage
    const handleProductImageUpload = async (file: File, previewUrl: string) => {
        // Set preview immediately for UX
        store.setProductImage(previewUrl, file)

        if (!user) {
            alert('Моля, влезте в системата')
            return
        }

        setIsUploadingProduct(true)
        try {
            // Upload to Supabase Storage
            const publicUrl = await uploadProductImage(file, user.id)

            // Save to database
            await productsApi.save(publicUrl, store.product.name || undefined)

            // Store the public URL for video generation
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

        let frameExtractionRequestId: string | null = null
        let combineRequestId: string | null = null
        let isExtractingFrame = false
        let isCombining = false
        let lastProcessedScene = 0
        const lipSyncStartedFor = new Set<number>()

        pollingInterval.current = setInterval(async () => {
            try {
                const status = await videoApi.getStatus(tid, gid)
                console.log('Poll status:', status)

                setGenerationStatus(status.status)

                // UNIFIED LIP SYNC LOGIC
                // Check all available scenes and start lip sync if not already started
                if (status.sceneUrls && status.sceneScripts) {
                    status.sceneUrls.forEach((url, idx) => {
                        if (url && !lipSyncStartedFor.has(idx)) {
                            const script = status.sceneScripts[idx]
                            if (script) {
                                console.log(`[Unified Sync] Starting lip sync for scene ${idx + 1}`)
                                lipSyncStartedFor.add(idx)

                                // Call API to start sync
                                videoApi.startLipSync(
                                    gid,
                                    idx,
                                    url,
                                    script,
                                    store.avatar.id || undefined
                                ).then((res) => {
                                    console.log(`[Unified Sync] Sync started: ${res.syncTaskId}`)
                                    // Start polling for this sync task
                                    const pollSync = setInterval(async () => {
                                        try {
                                            const syncStatus = await videoApi.getLipSyncStatus(res.syncTaskId, gid, idx)
                                            if (syncStatus.isCompleted) {
                                                clearInterval(pollSync)
                                                console.log(`[Unified Sync] Scene ${idx + 1} synced!`)
                                            } else if (syncStatus.isFailed) {
                                                clearInterval(pollSync)
                                                console.error(`[Unified Sync] Scene ${idx + 1} failed sync`)
                                            }
                                        } catch (e) { console.error('Sync poll error:', e) }
                                    }, 5000)
                                }).catch(err => {
                                    console.error(`[Unified Sync] Failed to start:`, err)
                                    lipSyncStartedFor.delete(idx) // Retry next time
                                })
                            }
                        }
                    })
                }

                if (status.status === 'completed' && status.videoUrl) {
                    setVideoUrl(status.videoUrl)
                    store.setStep('result')
                    if (pollingInterval.current) clearInterval(pollingInterval.current)
                    // Video is already saved by backend to the videos table
                    console.log('Video completed and saved to library')
                } else if (status.status === 'processing_next_scene' && !isExtractingFrame) {
                    // Only start frame extraction once per scene
                    const currentSceneToExtract = status.sceneUrls.length
                    if (currentSceneToExtract > lastProcessedScene) {
                        isExtractingFrame = true
                        lastProcessedScene = currentSceneToExtract

                        const lastSceneUrl = status.sceneUrls[status.sceneUrls.length - 1]
                        console.log(`Scene ${currentSceneToExtract} done, extracting frame for scene ${status.currentScene}`)

                        // Start frame extraction
                        const extractResult = await videoApi.startNextScene(gid, lastSceneUrl)
                        frameExtractionRequestId = extractResult.requestId

                        // Poll for frame extraction completion
                        const pollFrame = setInterval(async () => {
                            try {
                                const frameStatus = await videoApi.getFrameStatus(frameExtractionRequestId!)
                                console.log('Frame extraction status:', frameStatus)

                                if (frameStatus.completed && frameStatus.frameUrl) {
                                    clearInterval(pollFrame)
                                    // Generate next scene with extracted frame
                                    const sceneResult = await videoApi.generateScene(gid, frameStatus.frameUrl, status.currentScene)
                                    console.log(`Started scene ${sceneResult.sceneNumber} generation`)

                                    // Poll for this scene to complete
                                    const pollScene = setInterval(async () => {
                                        try {
                                            const sceneStatus = await videoApi.getSceneStatus(gid, sceneResult.sceneTaskId)
                                            console.log('Scene status:', sceneStatus)

                                            if (sceneStatus.status === 'completed') {
                                                clearInterval(pollScene)

                                                console.log(`Scene ${sceneResult.sceneNumber} completed, starting lip sync...`)

                                                // Lip sync is now handled by the main loop
                                                if (sceneStatus.allScenesComplete) {
                                                    console.log('All scenes complete, ready to combine')
                                                }
                                            } else if (sceneStatus.status === 'failed') {
                                                clearInterval(pollScene)
                                                setGenerationError('Scene generation failed')
                                                isExtractingFrame = false
                                            }
                                        } catch (err) {
                                            console.error('Scene polling error:', err)
                                        }
                                    }, 5000) // Poll every 5 seconds for scene completion
                                } else if (frameStatus.status !== 'IN_QUEUE' && frameStatus.status !== 'COMPLETED') {
                                    clearInterval(pollFrame)
                                    setGenerationError(`Frame extraction failed: ${frameStatus.status}`)
                                    isExtractingFrame = false
                                }
                            } catch (err) {
                                console.error('Frame polling error:', err)
                            }
                        }, 10000) // Poll every 10 seconds for frame extraction
                    }
                } else if (status.status === 'combining' && !isCombining) {
                    // All scenes done, start combining (only once)
                    isCombining = true
                    console.log('All scenes done, starting combine')
                    const combineResult = await videoApi.combineScenes(gid)
                    combineRequestId = combineResult.requestId

                    // Poll for combine completion
                    const pollCombine = setInterval(async () => {
                        try {
                            const combineStatus = await videoApi.getCombineStatus(combineRequestId!, gid)
                            console.log('Combine status:', combineStatus)

                            if (combineStatus.completed && combineStatus.videoUrl) {
                                clearInterval(pollCombine)
                                setVideoUrl(combineStatus.videoUrl)
                                store.setStep('result')
                                if (pollingInterval.current) clearInterval(pollingInterval.current)
                                // Video is already saved by backend to the videos table
                                console.log('Combined video completed and saved to library')
                            } else if (combineStatus.status !== 'IN_QUEUE' && combineStatus.status !== 'COMPLETED') {
                                clearInterval(pollCombine)
                                setGenerationError(`Video combining failed: ${combineStatus.status}`)
                            }
                        } catch (err) {
                            console.error('Combine polling error:', err)
                        }
                    }, 10000) // Poll every 10 seconds for combining
                } else if (status.status === 'failed') {
                    if (pollingInterval.current) clearInterval(pollingInterval.current)
                    // @ts-ignore
                    const msg = status.details?.errorMessage || 'Неизвестна грешка'
                    setGenerationError(msg)
                }
            } catch (error) {
                console.error('Polling error:', error)
            }
        }, 10000) // Poll every 10 seconds as per Kie API docs
    }

    const handleGenerateVideo = async () => {
        try {
            setIsGenerating(true)
            store.setStep('progress')

            // Find selected avatar from constants
            const selectedAvatar = DEMO_AVATARS.find(a => a.id === store.avatar.id)

            // Use avatar demo url if available, otherwise use a default fallback
            // For Maria, we now have a public URL in constants
            const avatarUrl = selectedAvatar?.thumbnailUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=720&h=1280&fit=crop'

            console.log('[Frontend] Sending generate request...', {
                duration: store.script.duration,
                userId: user?.id,
                hasProduct: !!storedProductUrl
            })

            const response = await videoApi.generate(
                store.script.content,
                avatarUrl,
                store.avatar.id || null, // Pass avatar ID for voice selection
                '9:16', // Enforce 9:16 as requested
                store.script.duration, // Pass duration for multi-scene
                'bg', // Force Bulgarian
                storedProductUrl, // Pass product URL from database
                store.product.name || null, // Pass product name for database
                user?.id // Pass user ID for Supabase tracking
            )

            console.log('[Frontend] Generation response:', response)

            if (response.success && response.taskId) {
                setTaskId(response.taskId)
                setGenerationId(response.generationId || null)
                setGenerationStatus('processing')
                startPolling(response.taskId, response.generationId || response.taskId)
            }
        } catch (error) {
            console.error('Generation failed:', error)
            console.error('Generation failed:', error)
            let message = 'Възникна грешка при стартиране на генерацията.'
            if (axios.isAxiosError(error)) {
                if (error.response) {
                    message = error.response.data?.error || message
                } else if (error.request) {
                    message = 'Сървърът не отговаря. Моля, уверете се, че backend сървърът е стартиран (npm run server).'
                }
            }
            alert(`Грешка: ${message}`)
            store.setStep('review')
        } finally {
            setIsGenerating(false)
        }
    }

    // Generate function for script using OpenAI
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
            alert('Грешка при генериране на скрипт. Моля опитайте отново.')
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
            {/* Header */}
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
                {/* Main Content */}
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
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="space-y-4"
                                    >
                                        <div>
                                            <label className="block text-sm font-medium text-surface-200 mb-1.5">
                                                Име на продукта
                                            </label>
                                            <input
                                                type="text"
                                                value={store.product.name}
                                                onChange={(e) => store.setProductName(e.target.value)}
                                                placeholder="Напр. Хидратиращ крем Rose"
                                                className="w-full px-3 py-2 bg-surface-800 border border-surface-600 rounded-lg text-surface-100 focus:ring-2 focus:ring-primary-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-surface-200 mb-1.5">
                                                Описание на продукта
                                            </label>
                                            <textarea
                                                value={store.product.description}
                                                onChange={(e) => store.setProductDescription(e.target.value)}
                                                placeholder="Опишете продукта, неговите предимства и за кого е предназначен. Това ще помогне за генериране на по-добър скрипт."
                                                rows={4}
                                                className="w-full px-3 py-2 bg-surface-800 border border-surface-600 rounded-lg text-surface-100 focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                                            />
                                            <p className="text-xs text-surface-500 mt-1.5">
                                                Това описание ще се използва за генериране на скрипта
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        )}

                        {store.currentStep === 'avatar' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-surface-100">Изберете AI водещ</h2>
                                <AvatarGrid
                                    selectedId={store.avatar.id}
                                    onSelect={store.setAvatarId}
                                />
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
                                    isGenerating={!store.script.isGenerated && store.script.content === '' && false}
                                    onGenerate={handleGenerateScript}
                                />
                            </div>
                        )}

                        {store.currentStep === 'background' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-surface-100">Изберете фон</h2>
                                <BackgroundSelector
                                    settings={store.background}
                                    onChange={store.setBackgroundSettings}
                                />
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
                                        {generationStatus === 'failed' && 'Грешка при генерация'}
                                        {generationStatus === 'processing' && 'Генериране на видео...'}
                                        {generationStatus === 'pending' && 'Инициализиране...'}
                                    </h2>
                                    <p className="text-surface-400 max-w-md mx-auto">
                                        {generationStatus === 'failed'
                                            ? (generationError || 'Моля, опитайте отново по-късно.')
                                            : 'Това може да отнеме няколко минути. Можете да затворите тази страница, ще получите известие когато е готово.'}
                                    </p>
                                </div>

                                {taskId && (
                                    <Badge variant="default" className="font-mono text-xs">
                                        Task ID: {taskId}
                                    </Badge>
                                )}
                            </div>
                        )}

                        {store.currentStep === 'result' && videoUrl && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-surface-100 text-center">Видеото е готово! 🎉</h2>

                                <div className="aspect-[9/16] max-h-[500px] mx-auto bg-black rounded-xl overflow-hidden shadow-2xl border border-surface-700">
                                    <video
                                        src={videoUrl}
                                        controls
                                        className="w-full h-full object-contain"
                                        autoPlay
                                        loop
                                    />
                                </div>

                                <div className="flex justify-center gap-4">
                                    <Button
                                        variant="primary"
                                        onClick={() => window.open(videoUrl, '_blank')}
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Свали видео
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={() => store.reset()}
                                    >
                                        Създай ново
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Navigation Buttons */}
                    {store.currentStep !== 'progress' && store.currentStep !== 'result' && (
                        <div className="flex justify-between pt-4">
                            <Button
                                variant="secondary"
                                onClick={store.prevStep}
                                disabled={currentStepIndex === 0}
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Назад
                            </Button>

                            <Button
                                variant="primary"
                                onClick={handleNext}
                                disabled={!canProceed() || isGenerating}
                                isLoading={isGenerating}
                            >
                                {store.currentStep === 'review' ? (
                                    <>
                                        Генерирай видео
                                        <Wand2 className="w-4 h-4" />
                                    </>
                                ) : (
                                    <>
                                        Напред
                                        <ChevronRight className="w-4 h-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Sidebar Summary */}
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
                                                isCompleted ? "bg-success text-white" :
                                                    "bg-surface-700 text-surface-400"
                                        )}>
                                            {isCompleted ? <Check className="w-3.5 h-3.5" /> : index + 1}
                                        </div>
                                        <div>
                                            <p className={cn(
                                                "text-sm font-medium",
                                                isActive ? "text-primary-400" :
                                                    isCompleted ? "text-surface-200" :
                                                        "text-surface-500"
                                            )}>{step.label}</p>
                                        </div>
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
