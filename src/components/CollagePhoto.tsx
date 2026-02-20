'use client'

import { useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeStore } from '@/store/theme'

interface CollagePhotoProps {
  position: 'top-right' | 'bottom-left'
  photo: string | null
  onPhotoChange: (dataUrl: string | null) => void
}

const MAX_WIDTH = 1200
const POLAROID_ASPECT_RATIO = 4 / 5

async function processImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()

    reader.onload = (e) => {
      img.src = e.target?.result as string
    }

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('No canvas context')); return }

      let width = img.width
      let height = img.height
      if (width > MAX_WIDTH) {
        height = (height * MAX_WIDTH) / width
        width = MAX_WIDTH
      }

      const targetHeight = width / POLAROID_ASPECT_RATIO
      let sx = 0, sy = 0, sw = img.width, sh = img.height

      if (height > targetHeight) {
        const cropAmount = (height - targetHeight) / 2
        sy = (cropAmount / height) * img.height
        sh = img.height - (2 * sy)
        height = targetHeight
      } else if (height < targetHeight) {
        const targetWidth = height * POLAROID_ASPECT_RATIO
        const cropAmount = (width - targetWidth) / 2
        sx = (cropAmount / width) * img.width
        sw = img.width - (2 * sx)
        width = targetWidth
      }

      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height)

      let quality = 0.85
      let dataUrl = canvas.toDataURL('image/jpeg', quality)
      while (dataUrl.length > 5 * 1024 * 1024 * 1.37 && quality > 0.3) {
        quality -= 0.1
        dataUrl = canvas.toDataURL('image/jpeg', quality)
      }
      resolve(dataUrl)
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export default function CollagePhoto({ position, photo, onPhotoChange }: CollagePhotoProps) {
  const { theme } = useThemeStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const rotation = position === 'top-right' ? 7 : -7

  const positionStyle: React.CSSProperties = position === 'top-right'
    ? { top: -30, right: -110, zIndex: 10, position: 'absolute' }
    : { bottom: -30, left: -110, zIndex: 10, position: 'absolute' }

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return

    setIsProcessing(true)
    setShowMenu(false)
    try {
      const dataUrl = await processImage(file)
      onPhotoChange(dataUrl)
    } catch (error) {
      console.error('Failed to process image:', error)
    } finally {
      setIsProcessing(false)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }, [onPhotoChange])

  if (photo) {
    return (
      <motion.div
        style={{ ...positionStyle, transform: `rotate(${rotation}deg)` }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <div
          className="rounded-sm overflow-hidden shadow-lg cursor-pointer group relative"
          style={{
            background: 'white',
            padding: '6px 6px 20px 6px',
            width: 120,
            boxShadow: '0 6px 20px rgba(0,0,0,0.25), 0 2px 6px rgba(0,0,0,0.15)',
          }}
          onClick={() => onPhotoChange(null)}
          title="Remove photo"
        >
          <div className="w-full overflow-hidden rounded-sm" style={{ aspectRatio: '4/5' }}>
            <img src={photo} alt="Collage photo" className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-sm">
            <span className="text-white text-lg font-light">x</span>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      style={positionStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8, duration: 0.6 }}
      onMouseLeave={() => setShowMenu(false)}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      <motion.button
        onClick={() => setShowMenu(!showMenu)}
        className="flex flex-col items-center justify-center relative"
        animate={{ rotate: rotation }}
        style={{
          width: 100,
          aspectRatio: '4/5',
          border: `2px dashed ${theme.accent.warm}60`,
          borderRadius: '4px',
          background: `${theme.glass.bg}`,
          padding: '6px 6px 18px 6px',
        }}
        whileHover={{ scale: 1.05, rotate: rotation, borderColor: theme.accent.warm }}
        whileTap={{ scale: 0.95, rotate: rotation }}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="text-sm"
            style={{ color: theme.text.muted }}
          >
            ...
          </motion.span>
        ) : (
          <>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={theme.text.secondary} strokeWidth="1.5" className="mb-1">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="12" cy="13" r="4" />
              <path d="M5 3v2M19 3v2" />
            </svg>
            <span className="text-[10px] font-medium" style={{ color: theme.text.secondary }}>
              add photo
            </span>
          </>
        )}
      </motion.button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {showMenu && !isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-20 rounded-lg overflow-hidden shadow-xl"
            style={{
              ...(position === 'top-right'
                ? { top: '100%', right: 0, marginTop: 6 }
                : { bottom: '100%', left: 0, marginBottom: 6 }
              ),
              background: theme.glass.bg,
              backdropFilter: `blur(20px)`,
              border: `1px solid ${theme.glass.border}`,
              transform: `rotate(${-rotation}deg)`,
              minWidth: 130,
            }}
          >
            <button
              onClick={() => {
                fileInputRef.current?.click()
                setShowMenu(false)
              }}
              className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-white/10 transition-colors"
              style={{ color: theme.text.primary }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload
            </button>
            <button
              onClick={() => {
                cameraInputRef.current?.click()
                setShowMenu(false)
              }}
              className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-white/10 transition-colors border-t"
              style={{
                color: theme.text.primary,
                borderColor: theme.glass.border,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Camera
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
