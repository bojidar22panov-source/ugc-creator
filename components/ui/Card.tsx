import { type ReactNode, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode
    className?: string
    variant?: 'default' | 'glass' | 'elevated' | 'interactive'
    padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({
    children,
    className,
    variant = 'default',
    padding = 'md',
    ...props
}: CardProps) {
    const variants = {
        default: 'bg-surface-800 border border-surface-700',
        glass: 'glass',
        elevated: 'bg-surface-800 border border-surface-700 shadow-elevated',
        interactive: 'bg-surface-800 border border-surface-700 hover:border-primary-500/50 hover:shadow-lg transition-all duration-200 cursor-pointer'
    }

    const paddings = {
        none: '',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6'
    }

    return (
        <div
            className={cn(
                'rounded-xl',
                variants[variant],
                paddings[padding],
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
}

export interface CardHeaderProps {
    children: ReactNode
    className?: string
}

export function CardHeader({ children, className }: CardHeaderProps) {
    return (
        <div className={cn('mb-4', className)}>
            {children}
        </div>
    )
}

export interface CardTitleProps {
    children: ReactNode
    className?: string
}

export function CardTitle({ children, className }: CardTitleProps) {
    return (
        <h3 className={cn('text-lg font-semibold text-surface-100', className)}>
            {children}
        </h3>
    )
}

export interface CardDescriptionProps {
    children: ReactNode
    className?: string
}

export function CardDescription({ children, className }: CardDescriptionProps) {
    return (
        <p className={cn('text-sm text-surface-400 mt-1', className)}>
            {children}
        </p>
    )
}

export interface CardContentProps {
    children: ReactNode
    className?: string
}

export function CardContent({ children, className }: CardContentProps) {
    return (
        <div className={cn('', className)}>
            {children}
        </div>
    )
}

export interface CardFooterProps {
    children: ReactNode
    className?: string
}

export function CardFooter({ children, className }: CardFooterProps) {
    return (
        <div className={cn('mt-4 pt-4 border-t border-surface-700 flex items-center gap-3', className)}>
            {children}
        </div>
    )
}
