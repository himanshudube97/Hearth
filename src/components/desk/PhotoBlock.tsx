'use client'

import React, { memo, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import PhotoSlot from './PhotoSlot'
import CameraModal from './CameraModal'

interface Photo {
  id?: string
  url: string
  rotation: number
  position: 1 | 2
}

interface PhotoBlockProps {
  photos: Photo[]
  onPhotoAdd?: (position: 1 | 2, dataUrl: string) => void
  /** When set, each filled polaroid shows a × on hover that calls this with
   *  the slot position. Omit for read-only entries. */
  onPhotoRemove?: (position: 1 | 2) => void
  disabled?: boolean
  className?: string
  dateCaption?: string
}

const PhotoBlock = memo(function PhotoBlock({
  photos,
  onPhotoAdd,
  onPhotoRemove,
  disabled = false,
  className = '',
  dateCaption,
}: PhotoBlockProps) {
  const [cameraModalOpen, setCameraModalOpen] = useState(false)
  const [activePosition, setActivePosition] = useState<1 | 2>(1)

  const photo1 = photos.find(p => p.position === 1)
  const photo2 = photos.find(p => p.position === 2)

  const handlePhotoAdd = useCallback((position: 1 | 2) => {
    return async (file: File) => {
      if (!onPhotoAdd) return

      // Read file as data URL
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        if (dataUrl) {
          onPhotoAdd(position, dataUrl)
        }
      }
      reader.readAsDataURL(file)
    }
  }, [onPhotoAdd])

  const handleCameraOpen = useCallback((position: 1 | 2) => {
    return () => {
      setActivePosition(position)
      setCameraModalOpen(true)
    }
  }, [])

  const handleCameraCapture = useCallback((dataUrl: string) => {
    if (onPhotoAdd) {
      onPhotoAdd(activePosition, dataUrl)
    }
  }, [onPhotoAdd, activePosition])

  return (
    <>
      <motion.div
        className={`relative flex items-start justify-center gap-2 ${className}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {/* Photo 1 - slightly overlapping to the left */}
        <div className="relative z-10" style={{ marginRight: '-12px' }}>
          <PhotoSlot
            photo={photo1}
            position={1}
            spread={1}
            onPhotoAdd={handlePhotoAdd(1)}
            onCameraCapture={handleCameraOpen(1)}
            onRemove={onPhotoRemove ? () => onPhotoRemove(1) : undefined}
            disabled={disabled || !!photo1}
            className="w-28"
            dateCaption={dateCaption}
          />
        </div>

        {/* Photo 2 - slightly overlapping to the right */}
        <div className="relative z-0" style={{ marginLeft: '-12px', marginTop: '8px' }}>
          <PhotoSlot
            photo={photo2}
            position={2}
            spread={1}
            onPhotoAdd={handlePhotoAdd(2)}
            onCameraCapture={handleCameraOpen(2)}
            onRemove={onPhotoRemove ? () => onPhotoRemove(2) : undefined}
            disabled={disabled || !!photo2}
            className="w-28"
            dateCaption={dateCaption}
          />
        </div>
      </motion.div>

      {/* Camera Modal */}
      <CameraModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onCapture={handleCameraCapture}
      />
    </>
  )
})

export default PhotoBlock
