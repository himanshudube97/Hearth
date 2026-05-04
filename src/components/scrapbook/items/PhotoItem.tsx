'use client'

import React, { useEffect, useRef } from 'react'
import { PhotoItemData } from '@/lib/scrapbook'
import { usePhotoSrc } from '@/hooks/usePhotoSrc'

interface Props {
  item: PhotoItemData
  isEditing: boolean
  onChange: (next: PhotoItemData) => void
  onRequestCamera: () => void
  onRequestUpload: () => void
}

export default function PhotoItem({
  item,
  isEditing,
  onChange,
  onRequestCamera,
  onRequestUpload,
}: Props) {
  const captionRef = useRef<HTMLDivElement>(null)
  // Resolves the three storage modes (data: legacy, /api/photos handle,
  // E2EE encryptedRef) into a renderable URL. Returns null while loading.
  const resolvedSrc = usePhotoSrc({
    url: item.src ?? undefined,
    encryptedRef: item.encryptedRef,
    encryptedRefIV: item.encryptedRefIV,
  })
  const hasPhoto = item.src !== null || !!item.encryptedRef

  useEffect(() => {
    if (captionRef.current && captionRef.current.innerText !== (item.caption ?? '')) {
      captionRef.current.innerText = item.caption ?? ''
    }
  }, [item.caption])

  // ----- placeholder mode: no src yet, show two big options -----
  if (!hasPhoto) {
    return (
      <div
        className="w-full h-full flex flex-col"
        style={{
          background: '#fefdf8',
          padding: '8px 8px 26px 8px',
          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)',
        }}
      >
        <div
          className="flex-1 flex flex-col items-center justify-center gap-2"
          style={{
            background:
              'repeating-linear-gradient(135deg, #f0e8d4 0 8px, #ebe2c8 8px 16px)',
            border: '2px dashed rgba(58, 52, 41, 0.28)',
            borderRadius: 4,
            padding: 8,
          }}
        >
          <PlaceholderButton
            icon="📷"
            label="click"
            onClick={onRequestCamera}
          />
          <div
            style={{
              fontFamily: 'var(--font-caveat), cursive',
              fontSize: 13,
              color: 'rgba(58, 52, 41, 0.5)',
            }}
          >
            or
          </div>
          <PlaceholderButton
            icon="⬆"
            label="upload"
            onClick={onRequestUpload}
          />
        </div>
        <div
          style={{
            marginTop: 6,
            fontFamily: 'var(--font-caveat), cursive',
            fontSize: 14,
            color: 'rgba(58, 52, 41, 0.45)',
            textAlign: 'center',
          }}
        >
          your photo
        </div>
      </div>
    )
  }

  // ----- normal photo mode -----
  if (item.polaroid) {
    return (
      <div
        className="w-full h-full flex flex-col"
        style={{
          background: '#fefdf8',
          padding: '8px 8px 26px 8px',
          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)',
        }}
      >
        <div
          className="flex-1 overflow-hidden"
          style={{
            background: '#1a1614',
            backgroundImage: resolvedSrc ? `url(${resolvedSrc})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        {/* DOM children owned by the caption-sync useEffect — never pass
            {item.caption} as JSX children, or React resets the caret on
            every keystroke (backwards typing). */}
        <div
          ref={captionRef}
          contentEditable={isEditing}
          suppressContentEditableWarning
          onInput={(e) =>
            onChange({ ...item, caption: (e.currentTarget as HTMLDivElement).innerText })
          }
          onPointerDown={(e) => {
            if (isEditing) e.stopPropagation()
          }}
          spellCheck={false}
          className="text-center outline-none"
          style={{
            marginTop: 6,
            fontFamily: 'var(--font-caveat), cursive',
            fontSize: 16,
            color: '#3a3429',
            cursor: isEditing ? 'text' : 'inherit',
            minHeight: 18,
          }}
        />
      </div>
    )
  }

  return (
    <div
      className="w-full h-full"
      style={{
        backgroundImage: resolvedSrc ? `url(${resolvedSrc})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius: 4,
      }}
    />
  )
}

function PlaceholderButton({
  icon,
  label,
  onClick,
}: {
  icon: string
  label: string
  onClick: () => void
}) {
  return (
    <button
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="flex items-center gap-1.5 transition-all"
      style={{
        padding: '6px 14px',
        borderRadius: 999,
        background: '#3a3429',
        color: '#f4ecd8',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'var(--font-caveat), cursive',
        fontSize: 17,
        boxShadow: '0 2px 5px rgba(0,0,0,0.18)',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.background = '#5a4d3e'
        ;(e.currentTarget as HTMLElement).style.transform = 'scale(1.04)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.background = '#3a3429'
        ;(e.currentTarget as HTMLElement).style.transform = ''
      }}
    >
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span>{label}</span>
    </button>
  )
}
