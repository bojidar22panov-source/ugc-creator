import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, UserPlus, Loader2 } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { useAuthStore } from '@/stores/authStore'

export function Register() {
    const { signUp, isLoading } = useAuthStore()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (password !== confirmPassword) {
            setError('Паролите не съвпадат')
            return
        }

        if (password.length < 6) {
            setError('Паролата трябва да е поне 6 символа')
            return
        }

        const result = await signUp(email, password)

        if (result.error) {
            setError(result.error)
        } else {
            setSuccess(true)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface-950 px-4">
                <Card className="p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center">
                        <UserPlus className="w-8 h-8 text-success" />
                    </div>
                    <h1 className="text-2xl font-bold text-surface-100 mb-2">
                        Успешна регистрация!
                    </h1>
                    <p className="text-surface-400 mb-6">
                        Моля, проверете имейла си за потвърждение на акаунта.
                    </p>
                    <Link to="/login">
                        <Button variant="primary" className="w-full">
                            Към вход
                        </Button>
                    </Link>
                </Card>
            </div>
        )
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
                            Създайте акаунт
                        </h1>
                        <p className="text-surface-400">
                            Започнете да създавате UGC видеа
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

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-surface-200">
                                Потвърди парола
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                                    <UserPlus className="w-5 h-5" />
                                    Регистрация
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-surface-400">
                            Вече имате акаунт?{' '}
                            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
                                Влезте
                            </Link>
                        </p>
                    </div>
                </Card>
            </motion.div>
        </div>
    )
}
