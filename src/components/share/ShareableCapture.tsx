'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Plant } from '@/components/constellation/garden/Plant'
import { useThemeStore } from '@/store/theme'
import { captureToBlob, downloadBlob, makeShareFilename, shareOrDownload, type ShareSurface } from '@/lib/share'
import CameraIcon from './CameraIcon'

// Hue rotations matching PromptCard's butterfly palette.
const BUTTERFLY_HUES = [0, -55, 200, 280, 95]

type Phase = 'closed' | 'butterfly' | 'preview'

interface UseShareableCaptureOptions {
  /** The composed off-screen card (e.g. <JournalShareCard entry={...} />). */
  cardContent: React.ReactNode
  surface: ShareSurface
  /** Date used for filename + (if shown) the frame footer. */
  date: Date
}

export function useShareableCapture({ cardContent, surface, date }: UseShareableCaptureOptions) {
  const { theme } = useThemeStore()
  const [phase, setPhase] = useState<Phase>('closed')
  const [butterflyHue, setButterflyHue] = useState(0)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageBlob, setImageBlob] = useState<Blob | null>(null)
  const [captureError, setCaptureError] = useState(false)
  const [mounted, setMounted] = useState(false)
  const offscreenRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Esc closes
  useEffect(() => {
    if (phase === 'closed') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase])

  // Cleanup blob URL on close / unmount
  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl)
    }
  }, [imageUrl])

  const open = useCallback(async () => {
    setCaptureError(false)
    setImageUrl(null)
    setImageBlob(null)
    setButterflyHue(BUTTERFLY_HUES[Math.floor(Math.random() * BUTTERFLY_HUES.length)])
    setPhase('butterfly')

    // Wait for the off-screen card to mount + fonts/images to settle.
    // The phase change above mounts the off-screen container.
    await new Promise((r) => setTimeout(r, 250))

    if (!offscreenRef.current) {
      setCaptureError(true)
      return
    }

    const blob = await captureToBlob(offscreenRef.current)
    if (!blob) {
      setCaptureError(true)
      return
    }
    setImageBlob(blob)
    setImageUrl(URL.createObjectURL(blob))
  }, [])

  const close = useCallback(() => {
    setPhase('closed')
    setCaptureError(false)
    // imageUrl revoked by cleanup effect on next state change
  }, [])

  const reveal = useCallback(() => {
    if (imageUrl) setPhase('preview')
  }, [imageUrl])

  const handleShare = useCallback(async () => {
    if (!imageBlob) return
    await shareOrDownload(imageBlob, makeShareFilename(surface, date))
  }, [imageBlob, surface, date])

  const handleSave = useCallback(() => {
    if (!imageBlob) return
    downloadBlob(imageBlob, makeShareFilename(surface, date))
  }, [imageBlob, surface, date])

  const CameraButton = (
    <button
      type="button"
      onClick={open}
      disabled={phase !== 'closed'}
      aria-label="Share this page"
      style={{
        background: 'transparent',
        border: 'none',
        padding: 8,
        cursor: phase !== 'closed' ? 'default' : 'pointer',
        color: theme.text.muted,
        opacity: 0.55,
        transition: 'opacity 0.2s ease',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.95')}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.55')}
    >
      <CameraIcon size={20} />
    </button>
  )

  const Capture = mounted ? createPortal(
    <>
      {/* Off-screen capture container — mounted only while overlay is open */}
      {phase !== 'closed' && (
        <div
          ref={offscreenRef}
          style={{
            position: 'fixed',
            left: '-9999px',
            top: 0,
            zIndex: -1,
            pointerEvents: 'none',
          }}
        >
          {cardContent}
        </div>
      )}

      <AnimatePresence>
        {phase !== 'closed' && (
          <motion.div
            key="share-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.4 } }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            onClick={() => {
              if (phase === 'preview') close()
            }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: phase === 'preview' ? `${theme.bg.primary}E6` : `${theme.bg.primary}99`,
              backdropFilter: 'blur(10px) saturate(1.05)',
              WebkitBackdropFilter: 'blur(10px) saturate(1.05)',
              transition: 'background 0.4s ease',
              cursor: phase === 'preview' ? 'pointer' : 'default',
              pointerEvents: phase === 'preview' ? 'auto' : 'none',
            }}
          >
            {/* Butterfly phase */}
            <AnimatePresence>
              {phase === 'butterfly' && !captureError && (
                <motion.button
                  key="butterfly"
                  type="button"
                  initial={{ opacity: 0, x: -360, y: 220, rotate: -25, scale: 0.6 }}
                  animate={{
                    opacity: 1,
                    x: [-360, -120, 60, 0, 0],
                    y: [220, 60, -40, 10, 0],
                    rotate: [-25, 12, -8, 4, 0],
                    scale: [0.6, 0.95, 1.05, 1, 1],
                  }}
                  exit={{ opacity: 0, scale: 0.4, y: -80, rotate: 20, transition: { duration: 0.5 } }}
                  transition={{ duration: 1.6, ease: 'easeOut', times: [0, 0.35, 0.6, 0.85, 1] }}
                  onClick={(e) => { e.stopPropagation(); reveal() }}
                  style={{
                    position: 'relative',
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    cursor: imageUrl ? 'pointer' : 'default',
                    pointerEvents: 'auto',
                  }}
                  disabled={!imageUrl}
                  aria-label="Reveal share preview"
                >
                  <motion.div
                    aria-hidden
                    animate={{ opacity: [0.25, 0.55, 0.25], scale: [1, 1.18, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                      position: 'absolute',
                      inset: '-30%',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(255,200,140,0.55) 0%, rgba(255,180,90,0.18) 40%, transparent 70%)',
                      filter: 'blur(8px)',
                      pointerEvents: 'none',
                    }}
                  />
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <motion.div
                      animate={{ scaleX: [1, 0.55, 1, 0.55, 1] }}
                      transition={{ duration: 0.4, repeat: Infinity, ease: 'easeInOut' }}
                      style={{ transformOrigin: 'center' }}
                    >
                      <Plant name="butterfly" width={130} saturate={1.05} hueRotate={butterflyHue} opacity={0.98} />
                    </motion.div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: imageUrl ? 0.85 : 0.45 }}
                    transition={{ delay: 1.4, duration: 0.6 }}
                    style={{
                      marginTop: 14,
                      textAlign: 'center',
                      fontFamily: 'Georgia, serif',
                      fontStyle: 'italic',
                      fontSize: 13,
                      letterSpacing: '0.08em',
                      color: theme.text.muted,
                    }}
                  >
                    {imageUrl ? 'catch it' : 'preparing…'}
                  </motion.div>
                </motion.button>
              )}
            </AnimatePresence>

            {/* Capture failure */}
            <AnimatePresence>
              {captureError && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  onClick={close}
                  style={{
                    pointerEvents: 'auto',
                    cursor: 'pointer',
                    color: theme.text.muted,
                    fontFamily: 'Georgia, serif',
                    fontStyle: 'italic',
                    fontSize: 15,
                    background: 'rgba(0,0,0,0.25)',
                    padding: '14px 22px',
                    borderRadius: 10,
                  }}
                >
                  couldn't snap that page — tap to dismiss
                </motion.div>
              )}
            </AnimatePresence>

            {/* Preview phase */}
            <AnimatePresence>
              {phase === 'preview' && imageUrl && (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, scale: 0.9, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 8 }}
                  transition={{ type: 'spring', duration: 0.6 }}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'relative',
                    background: '#fff',
                    borderRadius: 18,
                    padding: 16,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
                    maxWidth: 'min(90vw, 540px)',
                    maxHeight: '92vh',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                  }}
                >
                  <img
                    src={imageUrl}
                    alt="Share preview"
                    style={{
                      display: 'block',
                      width: '100%',
                      height: 'auto',
                      maxHeight: 'calc(92vh - 100px)',
                      objectFit: 'contain',
                      borderRadius: 8,
                    }}
                  />
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <button
                      type="button"
                      onClick={handleShare}
                      style={{
                        flex: 1,
                        padding: '12px 20px',
                        borderRadius: 999,
                        border: 'none',
                        background: `linear-gradient(135deg, ${theme.accent.primary}, ${theme.accent.warm})`,
                        color: '#fff',
                        fontSize: 15,
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
                      }}
                    >
                      Share
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      style={{
                        flex: 1,
                        padding: '12px 20px',
                        borderRadius: 999,
                        border: '1px solid rgba(0,0,0,0.12)',
                        background: '#f5f0e6',
                        color: '#5a4a3e',
                        fontSize: 15,
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      Save
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body,
  ) : null

  return { CameraButton, Capture, isOpen: phase !== 'closed' }
}
