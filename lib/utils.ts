import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combines class names with Tailwind CSS merge for proper specificity handling
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Format duration in seconds to MM:SS format
 */
export function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Format file size to human readable format
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Estimate speaking time for script based on word count
 * Average Bulgarian speech rate: ~130 words per minute
 */
export function estimateSpeakingTime(text: string): number {
    const words = text.trim().split(/\s+/).filter(Boolean).length
    const wordsPerSecond = 130 / 60 // ~2.17 words per second
    return Math.ceil(words / wordsPerSecond)
}

/**
 * Generate unique ID
 */
export function generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength - 3) + '...'
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>
    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => fn(...args), delay)
    }
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Check if file is valid image type
 */
export function isValidImageType(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    return validTypes.includes(file.type)
}

/**
 * Check if file size is within limit (10MB)
 */
export function isValidFileSize(file: File, maxSizeMB = 10): boolean {
    return file.size <= maxSizeMB * 1024 * 1024
}
