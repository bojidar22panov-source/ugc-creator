import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    Sparkles,
    Video,
    TrendingUp,
    Clock,
    ArrowRight,
    Play
} from 'lucide-react'
import { Card, CardContent, Button, Badge } from '@/components/ui'
import { useAuthStore } from '@/stores'

// Demo data
const recentVideos = [
    { id: '1', name: 'Крем за лице - промо', thumbnail: null, status: 'completed' as const, createdAt: '2026-01-12' },
    { id: '2', name: 'Фитнес добавка реклама', thumbnail: null, status: 'processing' as const, createdAt: '2026-01-11' },
    { id: '3', name: 'Онлайн курс UGC', thumbnail: null, status: 'completed' as const, createdAt: '2026-01-10' },
]

const stats = [
    { label: 'Общо видеа', value: '12', icon: Video, color: 'primary' },
    { label: 'Този месец', value: '5', icon: TrendingUp, color: 'accent' },
    { label: 'Чакащи', value: '1', icon: Clock, color: 'warning' },
]

export function Dashboard() {
    const { user } = useAuthStore()

    return (
        <div className="space-y-8">
            {/* Welcome section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <h1 className="text-3xl font-bold text-surface-100">
                    Добре дошъл, {user?.email?.split('@')[0] || 'Потребител'}! 👋
                </h1>
                <p className="text-surface-400 mt-2">
                    Готов ли си да създадеш невероятно UGC видео?
                </p>
            </motion.div>

            {/* Quick action - Create video CTA */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
            >
                <Card variant="glass" className="overflow-hidden">
                    <div className="relative p-6 md:p-8">
                        {/* Background gradient */}
                        <div className="absolute inset-0 gradient-primary opacity-10" />
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center animate-pulse-glow">
                                    <Sparkles className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-surface-100">
                                        Създай ново UGC видео
                                    </h2>
                                    <p className="text-surface-400 mt-1">
                                        Качи продукт, избери аватар и генерирай професионално видео за минути
                                    </p>
                                </div>
                            </div>

                            <Link to="/create">
                                <Button size="lg" className="shrink-0">
                                    <Sparkles className="w-5 h-5" />
                                    Започни сега
                                    <ArrowRight className="w-5 h-5" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </Card>
            </motion.div>

            {/* Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
                {stats.map((stat, _index) => (
                    <Card key={stat.label} variant="default" className="group hover:border-primary-500/50 transition-colors">
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-surface-400">{stat.label}</p>
                                    <p className="text-3xl font-bold text-surface-100 mt-1">{stat.value}</p>
                                </div>
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color === 'primary' ? 'bg-primary-500/20 text-primary-400' :
                                    stat.color === 'accent' ? 'bg-accent-500/20 text-accent-400' :
                                        'bg-warning/20 text-warning'
                                    }`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </motion.div>

            {/* Recent videos */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-surface-100">Последни видеа</h2>
                    <Link to="/library" className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
                        Виж всички
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recentVideos.map((video) => (
                        <Card key={video.id} variant="interactive" padding="none">
                            {/* Thumbnail */}
                            <div className="aspect-video bg-surface-700 rounded-t-xl flex items-center justify-center relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-accent-500/20" />
                                <Play className="w-12 h-12 text-surface-500 group-hover:text-surface-300 transition-colors" />

                                {/* Status badge */}
                                <div className="absolute top-2 right-2">
                                    <Badge
                                        variant={video.status === 'completed' ? 'success' : 'warning'}
                                        size="sm"
                                    >
                                        {video.status === 'completed' ? 'Готово' : 'В процес...'}
                                    </Badge>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-4">
                                <h3 className="font-medium text-surface-100 truncate">{video.name}</h3>
                                <p className="text-sm text-surface-400 mt-1">{video.createdAt}</p>
                            </div>
                        </Card>
                    ))}
                </div>
            </motion.div>

            {/* Templates section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-surface-100">Популярни шаблони</h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['Козметика', 'Фитнес', 'E-commerce', 'Услуги'].map((template) => (
                        <Card key={template} variant="interactive" className="text-center">
                            <CardContent>
                                <div className="w-12 h-12 mx-auto rounded-xl bg-surface-700 flex items-center justify-center mb-3">
                                    <Video className="w-6 h-6 text-surface-400" />
                                </div>
                                <p className="font-medium text-surface-200">{template}</p>
                                <p className="text-xs text-surface-500 mt-1">5+ шаблона</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </motion.div>
        </div>
    )
}
