import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Image, Type, Sun, Moon, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, Textarea, Select, Badge } from '@/components/ui'
import type { BackgroundType, TimeOfDay, Background, BackgroundSettings } from '@/types'

// Demo backgrounds
const backgroundCategories = [
    { id: 'home', label: 'Домашен уют', icon: Image },
    { id: 'outdoor', label: 'На открито', icon: Sun },
    { id: 'studio', label: 'Студио', icon: Image },
    { id: 'lifestyle', label: 'Лайфстайл', icon: Image },
]

const demoBackgrounds: Background[] = [
    { id: 'bg_1', name: 'Модерна кухня', type: 'home', category: 'kitchen', description: 'Bright modern kitchen with island', previewUrl: null, timeOfDay: 'day', isActive: true },
    { id: 'bg_2', name: 'Уютен хол', type: 'home', category: 'living_room', description: 'Cozy living room with sofa', previewUrl: null, timeOfDay: 'evening', isActive: true },
    { id: 'bg_3', name: 'Градски парк', type: 'outdoor', category: 'park', description: 'Sunny park with trees', previewUrl: null, timeOfDay: 'day', isActive: true },
    { id: 'bg_4', name: 'Офис пространство', type: 'lifestyle', category: 'office', description: 'Modern office workspace', previewUrl: null, timeOfDay: 'day', isActive: true },
    { id: 'bg_5', name: 'Студио (Тъмно)', type: 'studio', category: 'studio', description: 'Professional dark studio background', previewUrl: null, timeOfDay: null, isActive: true },
    { id: 'bg_6', name: 'Кафене', type: 'lifestyle', category: 'cafe', description: 'Cozy cafe interior', previewUrl: null, timeOfDay: 'day', isActive: true },
]

interface BackgroundSelectorProps {
    settings: BackgroundSettings
    onChange: (settings: Partial<BackgroundSettings>) => void
}

const timeOptions = [
    { value: 'morning', label: 'Сутрин' },
    { value: 'day', label: 'Ден' },
    { value: 'evening', label: 'Вечер' },
    { value: 'night', label: 'Нощ' },
]

const lightingOptions = [
    { value: 'natural', label: 'Естествена' },
    { value: 'studio', label: 'Студийна' },
    { value: 'dramatic', label: 'Драматична' },
    { value: 'soft', label: 'Мека' },
]

export function BackgroundSelector({ settings, onChange }: BackgroundSelectorProps) {
    const [activeTab, setActiveTab] = useState<BackgroundType | 'custom'>('home')

    const filteredBackgrounds = demoBackgrounds.filter(bg => bg.type === activeTab)

    return (
        <div className="space-y-6">
            {/* Category Tabs */}
            <div className="flex p-1 bg-surface-800 rounded-xl overflow-x-auto">
                {backgroundCategories.map((category) => (
                    <button
                        key={category.id}
                        onClick={() => setActiveTab(category.id as BackgroundType)}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                            activeTab === category.id
                                ? 'bg-surface-700 text-surface-100 shadow-sm'
                                : 'text-surface-400 hover:text-surface-200 hover:bg-surface-700/50'
                        )}
                    >
                        <category.icon className="w-4 h-4" />
                        {category.label}
                    </button>
                ))}
                <button
                    onClick={() => setActiveTab('custom')}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                        activeTab === 'custom'
                            ? 'bg-surface-700 text-surface-100 shadow-sm'
                            : 'text-surface-400 hover:text-surface-200 hover:bg-surface-700/50'
                    )}
                >
                    <Type className="w-4 h-4" />
                    По поръчка (AI)
                </button>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
                {activeTab === 'custom' ? (
                    <motion.div
                        key="custom"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="space-y-4"
                    >
                        <Card className="p-4 bg-primary-500/5 border-primary-500/20">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center shrink-0">
                                    <Type className="w-5 h-5 text-primary-400" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-surface-100">AI Background Generator</h3>
                                    <p className="text-sm text-surface-400 mt-1">
                                        Опишете желаната обстановка и AI ще я създаде специално за вашето видео.
                                    </p>
                                </div>
                            </div>
                        </Card>

                        <Textarea
                            label="Описание на сцената"
                            placeholder="Например: Модерна кухня с мраморен плот, слънчева светлина, минималистичен стил..."
                            value={settings.customDescription || ''}
                            onChange={(e) => onChange({ customDescription: e.target.value, backgroundId: null })}
                            helperText="Бъдете колкото се може по-детайлни за най-добър резултат."
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select
                                label="Част от деня"
                                options={timeOptions}
                                value={settings.timeOfDay}
                                onChange={(v) => onChange({ timeOfDay: v as TimeOfDay })}
                            />
                            <Select
                                label="Осветление"
                                options={lightingOptions}
                                value={settings.lightingStyle}
                                onChange={(v) => onChange({ lightingStyle: v as any })}
                            />
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="gallery"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="grid grid-cols-2 md:grid-cols-3 gap-4"
                    >
                        {filteredBackgrounds.map((bg) => {
                            const isSelected = settings.backgroundId === bg.id

                            return (
                                <Card
                                    key={bg.id}
                                    variant="interactive"
                                    padding="none"
                                    className={cn(
                                        'overflow-hidden group',
                                        isSelected && 'ring-2 ring-primary-500 border-primary-500'
                                    )}
                                    onClick={() => onChange({ backgroundId: bg.id, customDescription: null })}
                                >
                                    <div className="aspect-video bg-surface-700 relative">
                                        {/* Placeholder for BG image */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-surface-600 to-surface-800" />

                                        {/* Selected indicator */}
                                        {isSelected && (
                                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center shadow-lg">
                                                <Check className="w-4 h-4 text-white" />
                                            </div>
                                        )}

                                        {/* Type badge */}
                                        <div className="absolute bottom-2 left-2">
                                            <Badge size="sm" variant="default" className="bg-black/50 backdrop-blur-sm border-none text-white">
                                                {bg.timeOfDay === 'morning' && <Sun className="w-3 h-3 mr-1" />}
                                                {bg.timeOfDay === 'evening' && <Moon className="w-3 h-3 mr-1" />}
                                                {bg.name}
                                            </Badge>
                                        </div>
                                    </div>
                                </Card>
                            )
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
