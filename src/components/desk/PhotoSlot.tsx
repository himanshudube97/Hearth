'use client'

import React, { memo, useRef, useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'

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
  dateCaption?: string  // e.g. "apr 27"
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
  dateCaption = '~',
}: PhotoSlotProps) {
  void _spread // Acknowledge unused parameter
  const { theme } = useThemeStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isHovering, setIsHovering] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const mutedColor = theme.text.muted
  const borderColor = 'rgba(255,255,255,0.2)'

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
        <div
          className="relative"
          style={{
            background: '#f5efdc',
            padding: '8px 8px 22px',
            boxShadow: '0 6px 14px rgba(0,0,0,0.35)',
          }}
        >
          {/* Washi-tape strip */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: '-8px',
              left: '50%',
              transform: 'translateX(-50%) rotate(-2deg)',
              width: '50px',
              height: '14px',
              background: 'rgba(220, 200, 140, 0.55)',
              border: '1px solid rgba(220, 200, 140, 0.25)',
              pointerEvents: 'none',
            }}
          />

          {/* Photo */}
          <div
            className="w-full overflow-hidden"
            style={{ aspectRatio: '4/5' }}
          >
            <img
              src={photo.url}
              alt="Journal photo"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Date caption */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              bottom: '4px',
              left: '8px',
              right: '8px',
              display: 'flex',
              justifyContent: 'flex-end',
              fontFamily: "'Caveat', cursive",
              fontSize: '11px',
              color: 'rgba(60,40,20,0.6)',
            }}
          >
            {dateCaption}
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
        transformOrigin: 'center center',
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Polaroid card (cream paper) */}
      <div
        className="relative"
        style={{
          background: '#f5efdc',
          padding: '8px 8px 22px',
          boxShadow: '0 6px 14px rgba(0,0,0,0.35)',
        }}
      >
        {/* Washi-tape strip at the top */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '-8px',
            left: '50%',
            transform: 'translateX(-50%) rotate(-2deg)',
            width: '50px',
            height: '14px',
            background: 'rgba(220, 200, 140, 0.55)',
            border: '1px solid rgba(220, 200, 140, 0.25)',
            pointerEvents: 'none',
          }}
        />

        {/* Inner photo well (empty state) */}
        <div
          className="w-full flex flex-col items-center justify-center"
          style={{
            aspectRatio: '4/5',
            background: 'rgba(40,60,45,0.4)',
            border: `1px dashed ${
              isHovering ? 'rgba(60,40,20,0.55)' : 'rgba(60,40,20,0.3)'
            }`,
          }}
        >
          {isProcessing ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="text-lg"
              style={{ color: 'rgba(60,40,20,0.5)' }}
            >
              ...
            </motion.div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 w-3/4">
              <motion.button
                onClick={handleUploadClick}
                className="w-full py-1.5 rounded text-[11px] cursor-pointer"
                style={{
                  fontFamily: "'Caveat', cursive",
                  color: 'rgba(60,40,20,0.65)',
                  background: 'rgba(255,250,235,0.6)',
                  border: '1px solid rgba(60,40,20,0.15)',
                }}
                whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,250,235,0.85)' }}
                whileTap={{ scale: 0.97 }}
              >
                Upload
              </motion.button>
              {onCameraCapture && (
                <motion.button
                  onClick={handleCameraClick}
                  className="w-full py-1.5 rounded text-[11px] cursor-pointer"
                  style={{
                    fontFamily: "'Caveat', cursive",
                    color: 'rgba(60,40,20,0.65)',
                    background: 'rgba(255,250,235,0.6)',
                    border: '1px solid rgba(60,40,20,0.15)',
                  }}
                  whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,250,235,0.85)' }}
                  whileTap={{ scale: 0.97 }}
                >
                  Click
                </motion.button>
              )}
            </div>
          )}
        </div>

        {/* Date caption strip below photo well */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            bottom: '4px',
            left: '8px',
            right: '8px',
            display: 'flex',
            justifyContent: 'flex-end',
            fontFamily: "'Caveat', cursive",
            fontSize: '11px',
            color: 'rgba(60,40,20,0.5)',
          }}
        >
          ~
        </div>
      </div>
    </motion.div>
  )
})

export default PhotoSlot
