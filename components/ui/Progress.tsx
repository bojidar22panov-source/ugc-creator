import { cn } from '@/lib/utils'

export interface ProgressProps {
    value: number // 0-100
    size?: 'sm' | 'md' | 'lg'
    showLabel?: boolean
    variant?: 'default' | 'gradient'
    className?: string
}

export function Progress({
    value,
    size = 'md',
    showLabel = false,
    variant = 'default',
    className
}: ProgressProps) {
    const clampedValue = Math.min(100, Math.max(0, value))

    const sizes = {
        sm: 'h-1.5',
        md: 'h-2.5',
        lg: 'h-4'
    }

    const barVariants = {
        default: 'bg-primary-500',
        gradient: 'bg-gradient-to-r from-primary-500 to-accent-500'
    }

    return (
        <div className={cn('w-full', className)}>
            {showLabel && (
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-surface-400">Прогрес</span>
                    <span className="text-sm font-medium text-surface-200">{Math.round(clampedValue)}%</span>
                </div>
            )}
            <div className={cn(
                'w-full rounded-full bg-surface-700 overflow-hidden',
                sizes[size]
            )}>
                <div
                    className={cn(
                        'h-full rounded-full transition-all duration-500 ease-out',
                        barVariants[variant]
                    )}
                    style={{ width: `${clampedValue}%` }}
                />
            </div>
        </div>
    )
}
