import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Check, Play, User, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, Badge, Button, Select } from '@/components/ui'
import type { AvatarGender, AvatarAgeGroup, AvatarStyle } from '@/types'
import { DEMO_AVATARS } from '@/lib/constants'



interface AvatarGridProps {
    selectedId: string | null
    onSelect: (id: string) => void
}

const genderOptions = [
    { value: '', label: 'Всички' },
    { value: 'male', label: 'Мъже' },
    { value: 'female', label: 'Жени' },
]

const ageOptions = [
    { value: '', label: 'Всички възрасти' },
    { value: '18-25', label: '18-25 години' },
    { value: '25-35', label: '25-35 години' },
    { value: '35-45', label: '35-45 години' },
    { value: '45+', label: '45+ години' },
]

const styleOptions = [
    { value: '', label: 'Всички стилове' },
    { value: 'professional', label: 'Професионален' },
    { value: 'casual', label: 'Ежедневен' },
    { value: 'sporty', label: 'Спортен' },
    { value: 'elegant', label: 'Елегантен' },
]

export function AvatarGrid({ selectedId, onSelect }: AvatarGridProps) {
    const [filters, setFilters] = useState({
        gender: '' as AvatarGender | '',
        ageGroup: '' as AvatarAgeGroup | '',
        style: '' as AvatarStyle | ''
    })
    const [showFilters, setShowFilters] = useState(false)

    const filteredAvatars = useMemo(() => {
        return DEMO_AVATARS.filter((avatar) => {
            if (filters.gender && avatar.gender !== filters.gender) return false
            if (filters.ageGroup && avatar.ageGroup !== filters.ageGroup) return false
            if (filters.style && avatar.style !== filters.style) return false
            return true
        })
    }, [filters])

    return (
        <div className="space-y-4">
            {/* Filter toggle */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-surface-400">
                    {filteredAvatars.length} аватара
                </p>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(showFilters && 'text-primary-400')}
                >
                    <Filter className="w-4 h-4" />
                    Филтри
                </Button>
            </div>

            {/* Filters */}
            {showFilters && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-surface-800/50 border border-surface-700"
                >
                    <Select
                        label="Пол"
                        options={genderOptions}
                        value={filters.gender}
                        onChange={(v) => setFilters({ ...filters, gender: v as AvatarGender | '' })}
                    />
                    <Select
                        label="Възраст"
                        options={ageOptions}
                        value={filters.ageGroup}
                        onChange={(v) => setFilters({ ...filters, ageGroup: v as AvatarAgeGroup | '' })}
                    />
                    <Select
                        label="Стил"
                        options={styleOptions}
                        value={filters.style}
                        onChange={(v) => setFilters({ ...filters, style: v as AvatarStyle | '' })}
                    />
                </motion.div>
            )}

            {/* Avatar grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredAvatars.map((avatar, index) => {
                    const isSelected = selectedId === avatar.id

                    return (
                        <motion.div
                            key={avatar.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                            <Card
                                variant="interactive"
                                padding="none"
                                className={cn(
                                    'overflow-hidden',
                                    isSelected && 'ring-2 ring-primary-500 border-primary-500'
                                )}
                                onClick={() => onSelect(avatar.id)}
                            >
                                {/* Avatar image placeholder */}
                                <div className="aspect-[3/4] bg-gradient-to-br from-surface-700 to-surface-800 relative group">
                                    {avatar.thumbnailUrl ? (
                                        <img
                                            src={avatar.thumbnailUrl}
                                            alt={avatar.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-20 h-20 rounded-full bg-surface-600 flex items-center justify-center">
                                                <User className="w-10 h-10 text-surface-400" />
                                            </div>
                                        </div>
                                    )}

                                    {/* Play preview button */}
                                    <button className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
                                        <div className="w-12 h-12 rounded-full bg-white/0 group-hover:bg-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                            <Play className="w-6 h-6 text-white" />
                                        </div>
                                    </button>

                                    {/* Selected indicator */}
                                    {isSelected && (
                                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                                            <Check className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                </div>

                                {/* Avatar info */}
                                <div className="p-3">
                                    <p className="font-medium text-surface-100">{avatar.name}</p>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        <Badge size="sm" variant="default">
                                            {avatar.style === 'professional' && 'Проф.'}
                                            {avatar.style === 'casual' && 'Ежедн.'}
                                            {avatar.style === 'sporty' && 'Спортен'}
                                            {avatar.style === 'elegant' && 'Елегант.'}
                                        </Badge>
                                        <Badge size="sm" variant="default">
                                            {avatar.ageGroup}
                                        </Badge>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    )
                })}
            </div>

            {/* Empty state */}
            {filteredAvatars.length === 0 && (
                <div className="text-center py-12">
                    <User className="w-12 h-12 text-surface-500 mx-auto mb-3" />
                    <p className="text-surface-400">Няма аватари с избраните филтри</p>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={() => setFilters({ gender: '', ageGroup: '', style: '' })}
                    >
                        Изчисти филтрите
                    </Button>
                </div>
            )}
        </div>
    )
}
