import { cn } from '@/lib/utils'

export interface BadgeProps {
    children: React.ReactNode
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'
    size?: 'sm' | 'md'
    className?: string
}

export function Badge({
    children,
    variant = 'default',
    size = 'sm',
    className
}: BadgeProps) {
    const variants = {
        default: 'bg-surface-700 text-surface-300',
        primary: 'bg-primary-500/20 text-primary-400 border border-primary-500/30',
        success: 'bg-accent-500/20 text-accent-400 border border-accent-500/30',
        warning: 'bg-warning/20 text-warning border border-warning/30',
        error: 'bg-error/20 text-error border border-error/30',
        info: 'bg-info/20 text-info border border-info/30'
    }

    const sizes = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm'
    }

    return (
        <span className={cn(
            'inline-flex items-center font-medium rounded-full',
            variants[variant],
            sizes[size],
            className
        )}>
            {children}
        </span>
    )
}
