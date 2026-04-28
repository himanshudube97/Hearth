'use client'

import React, { useEffect, useRef, useState } from 'react'

interface Props {
  onCapture: (dataUrl: string) => void
  onClose: () => void
}

export default function CameraModal({ onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("your browser doesn't support camera capture")
      return
    }

    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      .then((stream) => {
        if (!active) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }
        setReady(true)
      })
      .catch((err: Error) => {
        if (active) setError(err.message || 'camera access denied')
      })

    return () => {
      active = false
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  function snap() {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88)
    onCapture(dataUrl)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10, 8, 6, 0.85)' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: '#1a1614',
          maxWidth: 720,
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        }}
      >
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{
            background: '#0d0a08',
            color: '#f4ecd8',
            fontFamily: 'var(--font-caveat), cursive',
            fontSize: 18,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <span>📷 take a photo</span>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#f4ecd8',
              fontSize: 22,
              cursor: 'pointer',
              lineHeight: 1,
              opacity: 0.7,
            }}
            title="close"
          >
            ×
          </button>
        </div>

        {error ? (
          <div
            className="p-10 text-center"
            style={{
              color: '#f8d4c8',
              fontFamily: 'var(--font-caveat), cursive',
              fontSize: 18,
            }}
          >
            {error}
            <div style={{ marginTop: 14 }}>
              <button
                onClick={onClose}
                style={{
                  padding: '8px 18px',
                  borderRadius: 999,
                  background: '#3a3429',
                  color: '#f4ecd8',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-caveat), cursive',
                  fontSize: 16,
                }}
              >
                close
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="relative" style={{ background: '#000', aspectRatio: '4 / 3' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full"
                style={{ display: 'block', objectFit: 'cover' }}
              />
              {!ready && (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    color: '#f4ecd8',
                    fontFamily: 'var(--font-caveat), cursive',
                    fontSize: 18,
                  }}
                >
                  warming up the camera…
                </div>
              )}
            </div>
            <div
              className="flex items-center justify-center gap-3 p-4"
              style={{ background: '#0d0a08' }}
            >
              <button
                onClick={onClose}
                style={{
                  padding: '8px 18px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.08)',
                  color: '#f4ecd8',
                  border: '1px solid rgba(255,255,255,0.12)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-caveat), cursive',
                  fontSize: 16,
                }}
              >
                cancel
              </button>
              <button
                onClick={snap}
                disabled={!ready}
                style={{
                  padding: '10px 24px',
                  borderRadius: 999,
                  background: ready ? '#a3413a' : 'rgba(163, 65, 58, 0.45)',
                  color: '#fff',
                  border: 'none',
                  cursor: ready ? 'pointer' : 'not-allowed',
                  fontFamily: 'var(--font-caveat), cursive',
                  fontSize: 18,
                  fontWeight: 'bold',
                  boxShadow: ready ? '0 3px 10px rgba(163, 65, 58, 0.5)' : 'none',
                }}
              >
                📷 snap
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
