import { type ReactNode, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ModalProps {
    isOpen: boolean
    onClose: () => void
    children: ReactNode
    title?: string
    description?: string
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
    showCloseButton?: boolean
}

export function Modal({
    isOpen,
    onClose,
    children,
    title,
    description,
    size = 'md',
    showCloseButton = true
}: ModalProps) {
    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }

        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
            document.body.style.overflow = 'hidden'
        }

        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = 'unset'
        }
    }, [isOpen, onClose])

    const sizes = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-2xl',
        full: 'max-w-4xl'
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className={cn(
                            'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
                            'w-full mx-4',
                            sizes[size]
                        )}
                    >
                        <div className="glass rounded-2xl shadow-2xl overflow-hidden">
                            {/* Header */}
                            {(title || showCloseButton) && (
                                <div className="flex items-start justify-between p-4 border-b border-surface-700">
                                    <div>
                                        {title && (
                                            <h2 className="text-lg font-semibold text-surface-100">
                                                {title}
                                            </h2>
                                        )}
                                        {description && (
                                            <p className="text-sm text-surface-400 mt-1">
                                                {description}
                                            </p>
                                        )}
                                    </div>
                                    {showCloseButton && (
                                        <button
                                            onClick={onClose}
                                            className="p-1.5 rounded-lg text-surface-400 hover:text-surface-100 hover:bg-surface-700 transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Content */}
                            <div className="p-4">
                                {children}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
