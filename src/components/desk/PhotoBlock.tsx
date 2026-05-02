'use client'

import React, { memo, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import PhotoSlot from './PhotoSlot'
import CameraModal from './CameraModal'
import { useE2EEStore } from '@/store/e2ee'
import { encryptBytes, encryptString } from '@/lib/e2ee/crypto'

export interface Photo {
  id?: string
  url?: string
  encryptedRef?: string
  encryptedRefIV?: string
  rotation: number
  position: 1 | 2
}

interface PhotoBlockProps {
  photos: Photo[]
  onPhotoAdd?: (position: 1 | 2, photo: Pick<Photo, 'url' | 'encryptedRef' | 'encryptedRefIV'>) => void
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

      const state = useE2EEStore.getState()
      const masterKey = state.masterKey
      const isE2EEReady = state.isEnabled && state.isUnlocked && masterKey !== null

      if (isE2EEReady && masterKey) {
        // E2EE path: encrypt the raw bytes, upload as opaque blob
        try {
          const buffer = await file.arrayBuffer()
          const { ciphertext, iv } = await encryptBytes(buffer, masterKey)
          // Convert base64 ciphertext to raw bytes for the upload body
          const binaryStr = atob(ciphertext)
          const cipherBytes = new Uint8Array(binaryStr.length)
          for (let i = 0; i < binaryStr.length; i++) {
            cipherBytes[i] = binaryStr.charCodeAt(i)
          }
          const res = await fetch('/api/photos', {
            method: 'POST',
            body: cipherBytes,
            headers: { 'Content-Type': 'application/octet-stream' },
          })
          if (!res.ok) throw new Error(`photo upload failed: ${res.status}`)
          const { handle } = (await res.json()) as { handle: string }
          // Encrypt the {handle, iv} reference so the server stores only opaque data
          const refEncrypted = await encryptString(JSON.stringify({ handle, iv }), masterKey)
          onPhotoAdd(position, {
            encryptedRef: refEncrypted.ciphertext,
            encryptedRefIV: refEncrypted.iv,
          })
        } catch (err) {
          console.error('E2EE photo upload failed:', err)
        }
        return
      }

      // Non-E2EE path: read as data URL (existing behavior)
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        if (dataUrl) {
          onPhotoAdd(position, { url: dataUrl })
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
      // Camera captures always produce a data URL — E2EE upload not applicable here
      // (camera modal doesn't give us a File/ArrayBuffer, only a JPEG data URL)
      onPhotoAdd(activePosition, { url: dataUrl })
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
