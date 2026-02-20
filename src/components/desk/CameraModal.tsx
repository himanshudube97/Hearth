'use client'

import React, { memo, useRef, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeStore } from '@/store/theme'

interface CameraModalProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (dataUrl: string) => void
}

const MAX_WIDTH = 1200
const POLAROID_ASPECT_RATIO = 4 / 5

const FILTERS = [
  { name: 'None', css: 'none' },
  { name: 'B&W', css: 'grayscale(100%)' },
  { name: 'Sepia', css: 'sepia(80%)' },
  { name: 'Warm', css: 'saturate(1.4) hue-rotate(-10deg)' },
  { name: 'Cool', css: 'saturate(0.9) hue-rotate(20deg) brightness(1.05)' },
  { name: 'Vintage', css: 'sepia(40%) contrast(1.1) brightness(0.95)' },
  { name: 'Vivid', css: 'saturate(1.8) contrast(1.1)' },
  { name: 'Soft', css: 'brightness(1.1) contrast(0.9) saturate(0.9)' },
] as const

const CameraModal = memo(function CameraModal({
  isOpen,
  onClose,
  onCapture,
}: CameraModalProps) {
  const { theme } = useThemeStore()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [activeFilter, setActiveFilter] = useState(0)
  const [thumbnailSrc, setThumbnailSrc] = useState<string | null>(null)

  const startCamera = useCallback(async () => {
    try {
      setError(null)

      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: MAX_WIDTH },
          height: { ideal: MAX_WIDTH / POLAROID_ASPECT_RATIO },
        },
        audio: false,
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setIsStreaming(true)
      }
    } catch (err) {
      console.error('Camera access error:', err)
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Camera access denied. Please allow camera access in your browser settings.')
        } else if (err.name === 'NotFoundError') {
          setError('No camera found on this device.')
        } else {
          setError('Could not access camera. Please try again.')
        }
      } else {
        setError('Could not access camera.')
      }
    }
  }, [facingMode])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsStreaming(false)
  }, [])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !isStreaming) return

    const video = videoRef.current
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Calculate crop for polaroid aspect ratio
    const videoWidth = video.videoWidth
    const videoHeight = video.videoHeight
    const targetHeight = videoWidth / POLAROID_ASPECT_RATIO

    let sx = 0, sy = 0, sw = videoWidth, sh = videoHeight

    if (videoHeight > targetHeight) {
      // Crop top and bottom
      sy = (videoHeight - targetHeight) / 2
      sh = targetHeight
    } else {
      // Crop left and right
      const targetWidth = videoHeight * POLAROID_ASPECT_RATIO
      sx = (videoWidth - targetWidth) / 2
      sw = targetWidth
    }

    // Set canvas size
    const outputWidth = Math.min(sw, MAX_WIDTH)
    const outputHeight = outputWidth / POLAROID_ASPECT_RATIO

    canvas.width = outputWidth
    canvas.height = outputHeight

    // Mirror horizontally for front camera to match preview
    if (facingMode === 'user') {
      ctx.translate(outputWidth, 0)
      ctx.scale(-1, 1)
    }

    // Apply selected filter
    const filterCss = FILTERS[activeFilter].css
    if (filterCss !== 'none') {
      ctx.filter = filterCss
    }

    // Draw cropped video frame
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, outputWidth, outputHeight)

    // Get data URL
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    setCapturedImage(dataUrl)
    stopCamera()
  }, [isStreaming, stopCamera, facingMode, activeFilter])

  const retakePhoto = useCallback(() => {
    setCapturedImage(null)
    startCamera()
  }, [startCamera])

  const usePhoto = useCallback(() => {
    if (capturedImage) {
      onCapture(capturedImage)
      setCapturedImage(null)
      onClose()
    }
  }, [capturedImage, onCapture, onClose])

  const toggleCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }, [])

  // Start camera when modal opens
  useEffect(() => {
    if (isOpen && !capturedImage) {
      // Use void to indicate intentional fire-and-forget
      void startCamera()
    }
    return () => {
      stopCamera()
    }
  }, [isOpen, startCamera, stopCamera, capturedImage])

  // Restart camera when facing mode changes
  useEffect(() => {
    if (isOpen && isStreaming) {
      void startCamera()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode])

  // Grab a small snapshot for filter thumbnails
  useEffect(() => {
    if (!isStreaming || !videoRef.current) {
      setThumbnailSrc(null)
      return
    }
    const grabFrame = () => {
      const video = videoRef.current
      if (!video || video.videoWidth === 0) return
      const c = document.createElement('canvas')
      c.width = 48
      c.height = 60
      const cx = c.getContext('2d')
      if (!cx) return
      if (facingMode === 'user') {
        cx.translate(48, 0)
        cx.scale(-1, 1)
      }
      cx.drawImage(video, 0, 0, 48, 60)
      setThumbnailSrc(c.toDataURL('image/jpeg', 0.5))
    }
    grabFrame()
    const id = setInterval(grabFrame, 2000)
    return () => clearInterval(id)
  }, [isStreaming, facingMode])

  const handleClose = useCallback(() => {
    stopCamera()
    setCapturedImage(null)
    setError(null)
    setActiveFilter(0)
    setThumbnailSrc(null)
    onClose()
  }, [stopCamera, onClose])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.8)' }}
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative max-w-lg w-full rounded-xl overflow-hidden"
          style={{
            background: theme.glass.bg,
            backdropFilter: `blur(${theme.glass.blur})`,
            border: `1px solid ${theme.glass.border}`,
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between p-4 border-b"
            style={{ borderColor: theme.glass.border }}
          >
            <h3 className="text-lg font-medium" style={{ color: theme.text.primary }}>
              Take Photo
            </h3>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
              style={{ color: theme.text.muted }}
            >
              X
            </button>
          </div>

          {/* Camera view / Captured image */}
          <div className="relative" style={{ aspectRatio: '4/5' }}>
            {error ? (
              <div
                className="absolute inset-0 flex items-center justify-center p-8 text-center"
                style={{ color: theme.text.muted }}
              >
                <div>
                  <div className="text-4xl mb-4 opacity-50">:(</div>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            ) : capturedImage ? (
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-full object-cover"
              />
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{
                    transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
                    filter: FILTERS[activeFilter].css,
                  }}
                />
                {!isStreaming && (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.5)' }}
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-8 h-8 border-2 border-white border-t-transparent rounded-full"
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Filters */}
          {!capturedImage && !error && (
            <div
              className="flex gap-2 px-4 py-2 overflow-x-auto"
              style={{ borderTop: `1px solid ${theme.glass.border}` }}
            >
              {FILTERS.map((f, i) => (
                <button
                  key={f.name}
                  onClick={() => setActiveFilter(i)}
                  className="shrink-0 flex flex-col items-center gap-1"
                >
                  <div
                    className="w-12 h-12 rounded-lg overflow-hidden border-2 transition-all"
                    style={{
                      borderColor: activeFilter === i ? theme.accent.warm : 'transparent',
                      opacity: activeFilter === i ? 1 : 0.7,
                    }}
                  >
                    {thumbnailSrc ? (
                      <img
                        src={thumbnailSrc}
                        alt={f.name}
                        className="w-full h-full object-cover"
                        style={{ filter: f.css }}
                      />
                    ) : (
                      <div
                        className="w-full h-full"
                        style={{ background: 'rgba(255,255,255,0.1)' }}
                      />
                    )}
                  </div>
                  <span
                    className="text-[9px]"
                    style={{
                      color: activeFilter === i ? theme.accent.warm : theme.text.muted,
                      fontWeight: activeFilter === i ? 600 : 400,
                    }}
                  >
                    {f.name}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Controls */}
          <div className="p-4 flex items-center justify-center gap-4">
            {capturedImage ? (
              <>
                <motion.button
                  onClick={retakePhoto}
                  className="px-6 py-3 rounded-full text-sm font-medium"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    color: theme.text.primary,
                    border: `1px solid ${theme.glass.border}`,
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Retake
                </motion.button>
                <motion.button
                  onClick={usePhoto}
                  className="px-8 py-3 rounded-full text-sm font-medium"
                  style={{
                    background: theme.accent.warm,
                    color: 'white',
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Use Photo
                </motion.button>
              </>
            ) : (
              <>
                <motion.button
                  onClick={toggleCamera}
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    color: theme.text.primary,
                    border: `1px solid ${theme.glass.border}`,
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Switch camera"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9h4.5l1.5-3h6l1.5 3H21"/>
                    <path d="M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/>
                    <path d="M20 4h-2"/>
                    <path d="M17 4v3"/>
                  </svg>
                </motion.button>
                <motion.button
                  onClick={capturePhoto}
                  disabled={!isStreaming}
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{
                    background: isStreaming ? theme.accent.warm : 'rgba(255,255,255,0.1)',
                    color: 'white',
                    opacity: isStreaming ? 1 : 0.5,
                  }}
                  whileHover={isStreaming ? { scale: 1.1 } : {}}
                  whileTap={isStreaming ? { scale: 0.9 } : {}}
                >
                  <div
                    className="w-12 h-12 rounded-full border-4"
                    style={{ borderColor: 'white' }}
                  />
                </motion.button>
                <div className="w-12" /> {/* Spacer for alignment */}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
})

export default CameraModal
