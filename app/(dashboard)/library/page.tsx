'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Video, Play, Download, Trash2, Loader2, Clock } from 'lucide-react'
import { Card, Button, Badge } from '@/components/ui'
import { useAuthStore } from '@/stores/authStore'
import { videosLibraryApi } from '@/lib/api'

interface SavedVideo {
    id: string
    user_id: string
    video_url: string
    thumbnail_url: string | null
    title: string | null
    duration: number
    created_at: string
}

export default function LibraryPage() {
    const { user } = useAuthStore()
    const [videos, setVideos] = useState<SavedVideo[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (user) {
            loadVideos()
        }
    }, [user])

    const loadVideos = async () => {
        setIsLoading(true)
        try {
            const data = await videosLibraryApi.getAll()
            setVideos(data)
        } catch (error) {
            console.error('Failed to load videos:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Сигурни ли сте, че искате да изтриете това видео?')) return

        try {
            await videosLibraryApi.delete(id)
            setVideos(videos.filter(v => v.id !== id))
        } catch (error) {
            console.error('Failed to delete video:', error)
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('bg-BG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-3xl font-bold text-surface-100">Моите видеа</h1>
                <p className="text-surface-400 mt-2">
                    Всички ваши генерирани UGC видеа
                </p>
            </motion.div>

            {videos.length === 0 ? (
                <Card className="p-12 text-center">
                    <Video className="w-16 h-16 text-surface-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-surface-200">Нямате видеа</h2>
                    <p className="text-surface-400 mt-2">
                        Създайте първото си UGC видео, за да го видите тук.
                    </p>
                </Card>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {videos.map((video) => (
                        <Card key={video.id} variant="interactive" padding="none" className="overflow-hidden">
                            {/* Thumbnail / Video Preview */}
                            <div className="aspect-[9/16] bg-surface-800 relative group">
                                {video.thumbnail_url ? (
                                    <img
                                        src={video.thumbnail_url}
                                        alt={video.title || 'Video'}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <video
                                        src={video.video_url}
                                        className="w-full h-full object-cover"
                                        muted
                                        preload="metadata"
                                    />
                                )}

                                {/* Play overlay */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <a
                                        href={video.video_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                                    >
                                        <Play className="w-8 h-8 text-white" />
                                    </a>
                                </div>

                                {/* Duration badge */}
                                <div className="absolute bottom-2 right-2">
                                    <Badge variant="default" size="sm" className="bg-black/60">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {video.duration}s
                                    </Badge>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-4">
                                <h3 className="font-medium text-surface-100 truncate">
                                    {video.title || 'Без заглавие'}
                                </h3>
                                <p className="text-sm text-surface-400 mt-1">
                                    {formatDate(video.created_at)}
                                </p>

                                {/* Actions */}
                                <div className="flex gap-2 mt-4">
                                    <a
                                        href={video.video_url}
                                        download
                                        className="flex-1"
                                    >
                                        <Button variant="secondary" size="sm" className="w-full">
                                            <Download className="w-4 h-4" />
                                            Изтегли
                                        </Button>
                                    </a>
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => handleDelete(video.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </motion.div>
            )}
        </div>
    )
}
