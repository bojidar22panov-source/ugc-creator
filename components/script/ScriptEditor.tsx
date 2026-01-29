import { useState } from 'react'
import { Wand2, Clock, AlignLeft, RotateCcw, Copy, Check } from 'lucide-react'
import { cn, estimateSpeakingTime, formatDuration } from '@/lib/utils'
import { Textarea, Button, Select, Card } from '@/components/ui'
import type { ScriptTone, ScriptDuration } from '@/types'

interface ScriptEditorProps {
    content: string
    onChange: (content: string) => void
    tone: ScriptTone
    onToneChange: (tone: ScriptTone) => void
    duration: ScriptDuration
    onDurationChange: (duration: ScriptDuration) => void
    isGenerating: boolean
    onGenerate: () => void
}

const toneOptions = [
    { value: 'energetic', label: 'Енергичен' },
    { value: 'professional', label: 'Професионален' },
    { value: 'friendly', label: 'Приятелски' },
    { value: 'persuasive', label: 'Убедителен' },
    { value: 'educational', label: 'Образователен' },
]

const durationOptions = [
    { value: '8', label: '8 секунди' },
    { value: '16', label: '16 секунди' },
    { value: '24', label: '24 секунди' },
    { value: '32', label: '32 секунди' },
    { value: '40', label: '40 секунди' },
    { value: '48', label: '48 секунди' },
    { value: '56', label: '56 секунди' },
    { value: '64', label: '64 секунди' },
]

export function ScriptEditor({
    content,
    onChange,
    tone,
    onToneChange,
    duration,
    onDurationChange,
    isGenerating,
    onGenerate
}: ScriptEditorProps) {
    const [copied, setCopied] = useState(false)
    const wordCount = content.trim().split(/\s+/).filter(Boolean).length
    const estimatedTime = estimateSpeakingTime(content)
    const isOverLimit = estimatedTime > duration + 5 // 5s buffer

    const handleCopy = () => {
        navigator.clipboard.writeText(content)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                    label="Тон на гласа"
                    options={toneOptions}
                    value={tone}
                    onChange={(v) => onToneChange(v as ScriptTone)}
                />
                <Select
                    label="Продължителност"
                    options={durationOptions}
                    value={duration.toString()}
                    onChange={(v) => onDurationChange(parseInt(v) as ScriptDuration)}
                />

            </div>

            {/* Generate button */}
            <Card variant="default" className="bg-primary-500/5 border-primary-500/20">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                            <Wand2 className="w-5 h-5 text-primary-400" />
                        </div>
                        <div>
                            <p className="font-medium text-surface-100">AI Генератор на скриптове</p>
                            <p className="text-sm text-surface-400">
                                Автоматично създаване на скрипт базиран на продукта
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={onGenerate}
                        isLoading={isGenerating}
                        variant="primary"
                        className="w-full md:w-auto"
                    >
                        <Wand2 className="w-4 h-4" />
                        Генерирай нов скрипт
                    </Button>
                </div>
            </Card>

            {/* Editor */}
            <div className="relative">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-surface-200">
                        Редактор на скрипта
                    </label>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopy}
                            className="h-8 px-2"
                            title="Копирай"
                        >
                            {copied ? (
                                <Check className="w-4 h-4 text-success" />
                            ) : (
                                <Copy className="w-4 h-4" />
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onChange('')}
                            className="h-8 px-2"
                            title="Изчисти"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <Textarea
                    value={content}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Тук ще се появи генерираният скрипт..."
                    className="min-h-[300px] font-mono text-base leading-relaxed"
                    helperText="Можете да редактирате текста свободно."
                />

                {/* Stats bar */}
                <div className="absolute bottom-4 right-4 flex items-center gap-3 px-3 py-1.5 rounded-lg bg-surface-900/90 border border-surface-700 backdrop-blur-sm text-xs font-medium">
                    <div className="flex items-center gap-1.5 text-surface-300">
                        <AlignLeft className="w-3.5 h-3.5" />
                        <span>{wordCount} думи</span>
                    </div>
                    <div className="w-px h-3 bg-surface-700" />
                    <div className={cn(
                        'flex items-center gap-1.5',
                        isOverLimit ? 'text-error' : 'text-success'
                    )}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>~{formatDuration(estimatedTime)}</span>
                    </div>
                </div>
            </div>

            {/* Tips */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { title: 'Hook (3 сек)', desc: 'Грабнете вниманието веднага' },
                    { title: 'Body', desc: 'Представете ползите на продукта' },
                    { title: 'Call to Action', desc: 'Кажете какво да направят' },
                ].map((tip, i) => (
                    <div key={i} className="p-3 rounded-lg bg-surface-800/50 border border-surface-700 text-sm">
                        <p className="font-medium text-surface-200 mb-1">{tip.title}</p>
                        <p className="text-surface-400">{tip.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}
