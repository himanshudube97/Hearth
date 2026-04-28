'use client'

import React, { useRef, useState } from 'react'
import { useThemeStore } from '@/store/theme'
import {
  ScrapbookItem,
  TextItemData,
  StickerItemData,
  makeStickerItem,
  makeTextItem,
} from '@/lib/scrapbook'
import CanvasItemWrapper from './CanvasItemWrapper'
import CanvasToolbar from './CanvasToolbar'
import TextItem from './items/TextItem'
import StickerItem from './items/StickerItem'

export default function ScrapbookCanvas() {
  const { theme } = useThemeStore()
  const [items, setItems] = useState<ScrapbookItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  function updateItem(updated: ScrapbookItem) {
    setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)))
  }

  function deleteItem(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  function addText() {
    const item = makeTextItem('a small good thing', items)
    setItems((prev) => [...prev, item])
    setSelectedId(item.id)
  }

  function addSticker(stickerId: string) {
    const item = makeStickerItem(stickerId, items)
    setItems((prev) => [...prev, item])
    setSelectedId(item.id)
  }

  // Today's date label, rendered as a built-in canvas decoration (not an item)
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-start"
      style={{
        background: theme.bg.gradient,
        paddingTop: 80,
        paddingBottom: 40,
      }}
    >
      {/* Top label */}
      <div
        className="mb-4 flex items-center gap-3"
        style={{
          color: theme.text.secondary,
          fontFamily: 'var(--font-caveat), cursive',
          fontSize: 22,
          letterSpacing: 0.3,
        }}
      >
        <span>scrapbook</span>
        <span style={{ opacity: 0.5 }}>·</span>
        <span style={{ opacity: 0.75 }}>{today.toLowerCase()}</span>
      </div>

      {/* Toolbar */}
      <div className="mb-5 z-30">
        <CanvasToolbar onAddText={addText} onAddSticker={addSticker} />
      </div>

      {/* Canvas page */}
      <div className="w-full flex justify-center px-6 pb-10">
        <div
          ref={canvasRef}
          onClick={() => setSelectedId(null)}
          className="relative"
          style={{
            width: '100%',
            maxWidth: 720,
            aspectRatio: '4 / 5',
            background: PAPER_COLOR,
            backgroundImage: PAPER_TEXTURE,
            borderRadius: 4,
            boxShadow:
              '0 14px 40px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(255,255,255,0.4)',
            overflow: 'hidden',
            cursor: selectedId ? 'default' : 'auto',
          }}
        >
          {/* dashed inner border (decorative) */}
          <div
            className="absolute pointer-events-none"
            style={{
              inset: 18,
              border: '1.5px dashed rgba(58, 52, 41, 0.32)',
              borderRadius: 2,
            }}
          />

          {/* corner washi tape decorations */}
          <CornerTape position="tl" color="#cdb38a" />
          <CornerTape position="tr" color="#a8b8c8" />

          {/* ghost hint when empty */}
          {items.length === 0 && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
              style={{
                color: 'rgba(58, 52, 41, 0.45)',
                fontFamily: 'var(--font-caveat), cursive',
                fontSize: 22,
                gap: 6,
                textAlign: 'center',
                padding: 40,
              }}
            >
              <div style={{ fontSize: 28 }}>your blank page</div>
              <div style={{ fontSize: 18, opacity: 0.7 }}>
                add text, stickers — drag, tilt, overlap.
                <br />
                nothing has to be tidy.
              </div>
            </div>
          )}

          {/* items */}
          {items.map((item) => (
            <CanvasItemWrapper
              key={item.id}
              item={item}
              allItems={items}
              canvasRef={canvasRef}
              selected={selectedId === item.id}
              onSelect={() => setSelectedId(item.id)}
              onUpdate={updateItem}
              onDelete={() => deleteItem(item.id)}
            >
              {item.type === 'text' && (
                <TextItem
                  item={item as TextItemData}
                  selected={selectedId === item.id}
                  onChange={updateItem}
                />
              )}
              {item.type === 'sticker' && <StickerItem item={item as StickerItemData} />}
            </CanvasItemWrapper>
          ))}
        </div>
      </div>
    </div>
  )
}

const PAPER_COLOR = '#f3ead2'
const PAPER_TEXTURE =
  // subtle paper grain — radial speckles
  `radial-gradient(circle at 20% 30%, rgba(120, 90, 50, 0.04) 0%, transparent 40%),
   radial-gradient(circle at 80% 70%, rgba(120, 90, 50, 0.05) 0%, transparent 50%),
   radial-gradient(circle at 60% 20%, rgba(120, 90, 50, 0.03) 0%, transparent 45%)`

function CornerTape({ position, color }: { position: 'tl' | 'tr'; color: string }) {
  const isLeft = position === 'tl'
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        top: -8,
        left: isLeft ? 28 : 'auto',
        right: isLeft ? 'auto' : 28,
        width: 78,
        height: 22,
        background: color,
        opacity: 0.78,
        transform: `rotate(${isLeft ? -8 : 8}deg)`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
      }}
    />
  )
}
