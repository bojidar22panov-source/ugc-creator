import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react'
import { cn, isValidImageType, isValidFileSize } from '@/lib/utils'

interface ProductUploaderProps {
    onImageSelect: (file: File, previewUrl: string) => void
    currentImage: string | null
    onClear: () => void
}

export function ProductUploader({ onImageSelect, currentImage, onClear }: ProductUploaderProps) {
    const [error, setError] = useState<string | null>(null)

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setError(null)

        if (acceptedFiles.length === 0) return

        const file = acceptedFiles[0]

        // Validate file type
        if (!isValidImageType(file)) {
            setError('Невалиден формат. Моля, качете JPG, PNG или WebP файл.')
            return
        }

        // Validate file size
        if (!isValidFileSize(file, 10)) {
            setError('Файлът е твърде голям. Максималният размер е 10MB.')
            return
        }

        // Create preview URL
        const previewUrl = URL.createObjectURL(file)
        onImageSelect(file, previewUrl)
    }, [onImageSelect])

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        onDrop,
        accept: {
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'image/webp': ['.webp']
        },
        maxSize: 10 * 1024 * 1024, // 10MB
        multiple: false
    })

    return (
        <div className="w-full">
            <AnimatePresence mode="wait">
                {currentImage ? (
                    <motion.div
                        key="preview"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="relative"
                    >
                        {/* Image preview */}
                        <div className="relative rounded-xl overflow-hidden border-2 border-primary-500/50 bg-surface-800">
                            <img
                                src={currentImage}
                                alt="Преглед на продукт"
                                className="w-full h-64 object-contain bg-surface-900"
                            />

                            {/* Remove button */}
                            <button
                                onClick={onClear}
                                className="absolute top-3 right-3 p-2 rounded-lg bg-surface-900/80 text-surface-300 hover:text-white hover:bg-error transition-colors"
                                aria-label="Премахни изображение"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Success indicator */}
                            <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-accent-500/20 text-accent-400 text-sm font-medium flex items-center gap-2">
                                <ImageIcon className="w-4 h-4" />
                                Изображението е качено
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="dropzone"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div
                            {...getRootProps()}
                            className={cn(
                                'relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200',
                                'hover:border-primary-500/50 hover:bg-surface-800/50',
                                isDragActive && 'border-primary-500 bg-primary-500/10',
                                isDragReject && 'border-error bg-error/10',
                                !isDragActive && !isDragReject && 'border-surface-600 bg-surface-800/30'
                            )}
                        >
                            <input {...getInputProps()} />

                            <div className="flex flex-col items-center gap-4">
                                <div className={cn(
                                    'w-16 h-16 rounded-2xl flex items-center justify-center transition-colors',
                                    isDragActive ? 'bg-primary-500/20 text-primary-400' : 'bg-surface-700 text-surface-400'
                                )}>
                                    <Upload className="w-8 h-8" />
                                </div>

                                <div>
                                    <p className="text-lg font-medium text-surface-100">
                                        {isDragActive ? 'Пусни файла тук' : 'Качи снимка на продукта'}
                                    </p>
                                    <p className="text-sm text-surface-400 mt-1">
                                        Плъзни и пусни или кликни за избор
                                    </p>
                                </div>

                                <div className="flex items-center gap-4 text-xs text-surface-500">
                                    <span>JPG, PNG, WebP</span>
                                    <span>•</span>
                                    <span>Макс. 10MB</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error message */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-3 p-3 rounded-lg bg-error/10 border border-error/30 flex items-start gap-2"
                    >
                        <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
                        <p className="text-sm text-error">{error}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
