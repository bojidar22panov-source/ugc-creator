'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, Lock, LogIn, Loader2 } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { useAuthStore } from '@/stores/authStore'

export default function LoginPage() {
    const router = useRouter()
    const { signIn, isLoading } = useAuthStore()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        const result = await signIn(email, password)

        if (result.error) {
            setError(result.error)
        } else {
            router.push('/')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-950 px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <Card className="p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-surface-100 mb-2">
                            Добре дошли обратно
                        </h1>
                        <p className="text-surface-400">
                            Влезте в акаунта си
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-surface-200">
                                Имейл
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full pl-10 pr-4 py-2.5 bg-surface-800 border border-surface-600 rounded-lg text-surface-100 focus:ring-2 focus:ring-primary-500 outline-none"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-surface-200">
                                Парола
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-4 py-2.5 bg-surface-800 border border-surface-600 rounded-lg text-surface-100 focus:ring-2 focus:ring-primary-500 outline-none"
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5" />
                                    Влез
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-surface-400">
                            Нямате акаунт?{' '}
                            <Link href="/register" className="text-primary-400 hover:text-primary-300 font-medium">
                                Регистрирайте се
                            </Link>
                        </p>
                    </div>
                </Card>
            </motion.div>
        </div>
    )
}
