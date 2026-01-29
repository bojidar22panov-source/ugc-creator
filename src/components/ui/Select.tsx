import { cn } from '@/lib/utils'

export interface SelectOption {
    value: string
    label: string
}

export interface SelectProps {
    options: SelectOption[]
    value: string
    onChange: (value: string) => void
    label?: string
    error?: string
    placeholder?: string
    className?: string
    disabled?: boolean
}

export function Select({
    options,
    value,
    onChange,
    label,
    error,
    placeholder = 'Избери опция',
    className,
    disabled
}: SelectProps) {
    const selectId = label?.toLowerCase().replace(/\s+/g, '-')

    return (
        <div className="w-full">
            {label && (
                <label
                    htmlFor={selectId}
                    className="block text-sm font-medium text-surface-200 mb-1.5"
                >
                    {label}
                </label>
            )}
            <select
                id={selectId}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className={cn(
                    'w-full h-10 px-3 rounded-lg bg-surface-800 border border-surface-600',
                    'text-surface-100',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                    'transition-all duration-200',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'cursor-pointer',
                    error && 'border-error focus:ring-error',
                    !value && 'text-surface-500',
                    className
                )}
            >
                <option value="" disabled className="text-surface-500">
                    {placeholder}
                </option>
                {options.map((option) => (
                    <option
                        key={option.value}
                        value={option.value}
                        className="bg-surface-800 text-surface-100"
                    >
                        {option.label}
                    </option>
                ))}
            </select>
            {error && (
                <p className="mt-1.5 text-sm text-error">{error}</p>
            )}
        </div>
    )
}
