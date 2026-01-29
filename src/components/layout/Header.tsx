import { Bell, CreditCard, User } from 'lucide-react'
import { useAuthStore } from '@/stores'
import { Badge } from '@/components/ui'

export function Header() {
    const { user, isAuthenticated } = useAuthStore()

    return (
        <header className="h-16 glass border-b border-surface-700 flex items-center justify-between px-6">
            {/* Left section - Page title or breadcrumb */}
            <div>
                {/* Will be filled dynamically by pages */}
            </div>

            {/* Right section - User actions */}
            <div className="flex items-center gap-4">
                {/* Credits indicator - placeholder for future implementation */}
                {isAuthenticated && user && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-800 border border-surface-700">
                        <CreditCard className="w-4 h-4 text-primary-400" />
                        <span className="text-sm font-medium text-surface-200">
                            0 кредита
                        </span>
                    </div>
                )}

                {/* Notifications */}
                <button className="relative p-2 rounded-lg text-surface-400 hover:text-surface-100 hover:bg-surface-700 transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full" />
                </button>

                {/* User menu */}
                {isAuthenticated && user ? (
                    <button className="flex items-center gap-3 p-1.5 pr-3 rounded-lg hover:bg-surface-700 transition-colors">
                        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-medium text-surface-100">
                                {user.email || 'Потребител'}
                            </p>
                            <Badge variant="primary" size="sm">
                                Безплатен
                            </Badge>
                        </div>
                    </button>
                ) : (
                    <button className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors">
                        Вход
                    </button>
                )}
            </div>
        </header>
    )
}
