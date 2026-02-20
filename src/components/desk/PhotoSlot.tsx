'use client'

import React, { memo, useRef, useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import { useDiaryStore } from '@/store/diary'
import { diaryThemes } from '@/lib/diaryThemes'

interface PhotoSlotProps {
  photo?: {
    url: string
    rotation: number
  } | null
  position: 1 | 2
  spread: number
  onPhotoAdd?: (file: File) => void
  onCameraCapture?: () => void
  disabled?: boolean
  className?: string
}

const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB
const MAX_WIDTH = 1200
const POLAROID_ASPECT_RATIO = 4 / 5 // 4:5 aspect ratio

// Compress and resize image client-side
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
      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }

      // Calculate dimensions maintaining aspect ratio
      let width = img.width
      let height = img.height

      // Resize to max width if needed
      if (width > MAX_WIDTH) {
        height = (height * MAX_WIDTH) / width
        width = MAX_WIDTH
      }

      // Crop to polaroid aspect ratio (center crop)
      const targetHeight = width / POLAROID_ASPECT_RATIO
      let sx = 0, sy = 0, sw = img.width, sh = img.height

      if (height > targetHeight) {
        // Crop top and bottom
        const cropAmount = (height - targetHeight) / 2
        sy = (cropAmount / height) * img.height
        sh = img.height - (2 * sy)
        height = targetHeight
      } else if (height < targetHeight) {
        // Crop left and right
        const targetWidth = height * POLAROID_ASPECT_RATIO
        const cropAmount = (width - targetWidth) / 2
        sx = (cropAmount / width) * img.width
        sw = img.width - (2 * sx)
        width = targetWidth
      }

      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height)

      // Convert to JPEG with compression
      let quality = 0.85
      let dataUrl = canvas.toDataURL('image/jpeg', quality)

      // Reduce quality if still too large
      while (dataUrl.length > MAX_SIZE_BYTES * 1.37 && quality > 0.3) {
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

const PhotoSlot = memo(function PhotoSlot({
  photo,
  position,
  spread: _spread, // Used by parent for tracking, not needed here
  onPhotoAdd,
  onCameraCapture,
  disabled = false,
  className = '',
}: PhotoSlotProps) {
  void _spread // Acknowledge unused parameter
  const { theme } = useThemeStore()
  const { currentDiaryTheme } = useDiaryStore()
  const diaryTheme = diaryThemes[currentDiaryTheme]
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isHovering, setIsHovering] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const isGlass = currentDiaryTheme === 'glass'
  const mutedColor = isGlass ? theme.text.muted : diaryTheme.pages.mutedColor
  const borderColor = isGlass ? 'rgba(255,255,255,0.2)' : diaryTheme.pages.mutedColor

  // Random rotation for polaroid effect (-15 to 15 degrees)
  const defaultRotation = position === 1 ? -8 : 8

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onPhotoAdd) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size
    if (file.size > MAX_SIZE_BYTES) {
      alert('Image must be less than 5MB')
      return
    }

    setIsProcessing(true)

    try {
      await processImage(file)
      onPhotoAdd(file)
    } catch (error) {
      console.error('Failed to process image:', error)
      alert('Failed to process image')
    } finally {
      setIsProcessing(false)
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [onPhotoAdd])

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleCameraClick = useCallback(() => {
    onCameraCapture?.()
  }, [onCameraCapture])

  // If photo exists, show the polaroid
  if (photo) {
    return (
      <motion.div
        className={`relative ${className}`}
        style={{
          transform: `rotate(${photo.rotation || defaultRotation}deg)`,
          transformOrigin: 'center center',
        }}
        initial={{ opacity: 0, scale: 0.8, rotate: 0 }}
        animate={{ opacity: 1, scale: 1, rotate: photo.rotation || defaultRotation }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {/* Polaroid frame */}
        <div
          className="rounded-sm overflow-hidden shadow-lg"
          style={{
            background: 'white',
            padding: '8px 8px 24px 8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <div
            className="w-full overflow-hidden rounded-sm"
            style={{ aspectRatio: '4/5' }}
          >
            <img
              src={photo.url}
              alt="Journal photo"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </motion.div>
    )
  }

  // Empty slot - show add button
  if (disabled) {
    return (
      <div
        className={`relative flex items-center justify-center ${className}`}
        style={{
          aspectRatio: '4/5',
          border: `2px dashed ${borderColor}`,
          borderRadius: '4px',
          opacity: 0.3,
        }}
      >
        <span style={{ color: mutedColor, fontSize: '12px' }}>Photo</span>
      </div>
    )
  }

  return (
    <motion.div
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={{
        transform: `rotate(${defaultRotation}deg)`,
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Polaroid frame with upload/camera options inside */}
      <div
        className="w-full flex flex-col items-center justify-center"
        style={{
          aspectRatio: '4/5',
          border: `2px dashed ${isHovering ? theme.accent.warm : borderColor}`,
          borderRadius: '4px',
          background: isGlass ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
          padding: '6px',
        }}
      >
        {isProcessing ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="text-lg"
            style={{ color: mutedColor }}
          >
            ...
          </motion.div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 w-full">
            <motion.button
              onClick={handleUploadClick}
              className="w-full py-1.5 rounded text-[10px] flex items-center justify-center gap-1 cursor-pointer"
              style={{
                color: mutedColor,
                background: isGlass ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
              }}
              whileHover={{ scale: 1.03, backgroundColor: isGlass ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)' }}
              whileTap={{ scale: 0.97 }}
            >
              Upload
            </motion.button>
            {onCameraCapture && (
              <motion.button
                onClick={handleCameraClick}
                className="w-full py-1.5 rounded text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                style={{
                  color: mutedColor,
                  background: isGlass ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                }}
                whileHover={{ scale: 1.03, backgroundColor: isGlass ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)' }}
                whileTap={{ scale: 0.97 }}
              >
                Click
              </motion.button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
})

export default PhotoSlot
