'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    LayoutDashboard,
    Video,
    FolderOpen,
    Settings,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Library
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
    href: string
    icon: React.ReactNode
    label: string
}

const navItems: NavItem[] = [
    { href: '/', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Начало' },
    { href: '/create', icon: <Sparkles className="w-5 h-5" />, label: 'Създай видео' },
    { href: '/library', icon: <Library className="w-5 h-5" />, label: 'Моите видеа' },
    { href: '/projects', icon: <FolderOpen className="w-5 h-5" />, label: 'Проекти' },
    { href: '/settings', icon: <Settings className="w-5 h-5" />, label: 'Настройки' },
]

export function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const pathname = usePathname()

    return (
        <motion.aside
            initial={false}
            animate={{ width: isCollapsed ? 72 : 240 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="fixed left-0 top-0 h-screen glass border-r border-surface-700 z-40 flex flex-col"
        >
            {/* Logo */}
            <div className="h-16 flex items-center px-4 border-b border-surface-700">
                <Link href="/" className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                        <Video className="w-5 h-5 text-white" />
                    </div>
                    <AnimatePresence>
                        {!isCollapsed && (
                            <motion.span
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                className="font-bold text-lg text-gradient overflow-hidden whitespace-nowrap"
                            >
                                UGC Studio
                            </motion.span>
                        )}
                    </AnimatePresence>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3">
                <ul className="space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href

                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                                        'hover:bg-surface-700/50',
                                        isActive && 'bg-primary-500/20 text-primary-400',
                                        !isActive && 'text-surface-400 hover:text-surface-100'
                                    )}
                                >
                                    <span className={cn(
                                        'flex-shrink-0',
                                        isActive && 'text-primary-400'
                                    )}>
                                        {item.icon}
                                    </span>
                                    <AnimatePresence>
                                        {!isCollapsed && (
                                            <motion.span
                                                initial={{ opacity: 0, width: 0 }}
                                                animate={{ opacity: 1, width: 'auto' }}
                                                exit={{ opacity: 0, width: 0 }}
                                                className="font-medium text-sm overflow-hidden whitespace-nowrap"
                                            >
                                                {item.label}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            </nav>

            {/* Collapse toggle */}
            <div className="p-3 border-t border-surface-700">
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-surface-400 hover:text-surface-100 hover:bg-surface-700/50 transition-all"
                >
                    {isCollapsed ? (
                        <ChevronRight className="w-5 h-5" />
                    ) : (
                        <>
                            <ChevronLeft className="w-5 h-5" />
                            <span className="text-sm">Свий</span>
                        </>
                    )}
                </button>
            </div>
        </motion.aside>
    )
}
