'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useThemeStore } from '@/store/theme'
import {
  ScrapbookItem,
  TextItemData,
  StickerItemData,
  PhotoItemData,
  SongItemData,
  DoodleItemData,
  DoodleStroke,
  makeStickerItem,
  makeTextItem,
  makePhotoItem,
  makeSongItem,
  makeDoodleItem,
  paperForTheme,
} from '@/lib/scrapbook'
import CanvasItemWrapper from './CanvasItemWrapper'
import CanvasToolbar from './CanvasToolbar'
import TextItem from './items/TextItem'
import StickerItem from './items/StickerItem'
import PhotoItem from './items/PhotoItem'
import SongItem from './items/SongItem'
import DoodleItem from './items/DoodleItem'
import DoodleCanvas from '@/components/DoodleCanvas'
import type { StrokeData } from '@/store/journal'

export default function ScrapbookCanvas() {
  const { theme, themeName } = useThemeStore()
  const [items, setItems] = useState<ScrapbookItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [doodleEditingId, setDoodleEditingId] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Pressing Esc exits edit mode (still selected) — feels expected from
  // any text editor, and avoids users feeling trapped in a note.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && editingId) {
        setEditingId(null)
        // also blur whatever element has focus
        ;(document.activeElement as HTMLElement | null)?.blur?.()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editingId])

  function updateItem(updated: ScrapbookItem) {
    setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)))
  }

  function deleteItem(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id))
    if (selectedId === id) setSelectedId(null)
    if (editingId === id) setEditingId(null)
  }

  function selectItem(id: string) {
    setSelectedId(id)
  }

  function requestEdit(id: string) {
    setEditingId(id)
  }

  function deselectAll() {
    setSelectedId(null)
    setEditingId(null)
  }

  function addText() {
    const item = makeTextItem('a small good thing', items)
    setItems((prev) => [...prev, item])
    setSelectedId(item.id)
    setEditingId(item.id)
  }

  function addSticker(stickerId: string) {
    const item = makeStickerItem(stickerId, items)
    setItems((prev) => [...prev, item])
    setSelectedId(item.id)
  }

  function addPhoto(dataUrl: string) {
    const item = makePhotoItem(dataUrl, items)
    setItems((prev) => [...prev, item])
    setSelectedId(item.id)
  }

  function addSong(url: string) {
    const item = makeSongItem(url, items)
    setItems((prev) => [...prev, item])
    setSelectedId(item.id)
    setEditingId(item.id)
  }

  function addDoodle() {
    const item = makeDoodleItem(items)
    setItems((prev) => [...prev, item])
    setSelectedId(item.id)
    setDoodleEditingId(item.id)
  }

  const editingDoodle = doodleEditingId
    ? (items.find((it) => it.id === doodleEditingId) as DoodleItemData | undefined)
    : undefined

  function saveDoodle(strokes: StrokeData[]) {
    if (!editingDoodle) {
      setDoodleEditingId(null)
      return
    }
    updateItem({ ...editingDoodle, strokes: strokes as DoodleStroke[] })
    setDoodleEditingId(null)
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const paper = paperForTheme(themeName)
  const tapeLeft = withAlpha(theme.accent.warm, 0.78)
  const tapeRight = withAlpha(theme.accent.secondary, 0.78)

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-start"
      style={{
        background: theme.bg.gradient,
        paddingTop: 80,
        paddingBottom: 40,
      }}
    >
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

      <div className="mb-5 z-30">
        <CanvasToolbar
          onAddText={addText}
          onAddSticker={addSticker}
          onAddPhoto={addPhoto}
          onAddSong={addSong}
          onAddDoodle={addDoodle}
        />
      </div>

      <div className="w-full flex justify-center px-6 pb-10">
        <div
          ref={canvasRef}
          onClick={deselectAll}
          className="relative"
          style={{
            width: '100%',
            maxWidth: 720,
            aspectRatio: '4 / 5',
            background: paper.base,
            backgroundImage: `radial-gradient(circle at 20% 30%, ${paper.grain} 0%, transparent 40%),
              radial-gradient(circle at 80% 70%, ${paper.grain} 0%, transparent 50%),
              radial-gradient(circle at 60% 20%, ${paper.grain} 0%, transparent 45%)`,
            borderRadius: 4,
            boxShadow:
              '0 14px 40px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(255,255,255,0.4)',
            overflow: 'hidden',
            cursor: selectedId ? 'default' : 'auto',
          }}
        >
          <div
            className="absolute pointer-events-none"
            style={{
              inset: 18,
              border: `1.5px dashed ${withAlpha(theme.accent.warm, 0.32)}`,
              borderRadius: 2,
            }}
          />

          <CornerTape position="tl" color={tapeLeft} />
          <CornerTape position="tr" color={tapeRight} />

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
                add anything — drag, tilt, overlap.
                <br />
                nothing has to be tidy.
              </div>
            </div>
          )}

          {items.map((item) => {
            const isItemSelected = selectedId === item.id
            const isItemEditing = editingId === item.id
            return (
              <CanvasItemWrapper
                key={item.id}
                item={item}
                allItems={items}
                canvasRef={canvasRef}
                selected={isItemSelected}
                isEditing={isItemEditing}
                onSelect={() => selectItem(item.id)}
                onRequestEdit={() => requestEdit(item.id)}
                onUpdate={updateItem}
                onDelete={() => deleteItem(item.id)}
              >
                {item.type === 'text' && (
                  <TextItem
                    item={item as TextItemData}
                    selected={isItemSelected}
                    isEditing={isItemEditing}
                    onChange={updateItem}
                  />
                )}
                {item.type === 'sticker' && <StickerItem item={item as StickerItemData} />}
                {item.type === 'photo' && (
                  <PhotoItem
                    item={item as PhotoItemData}
                    isEditing={isItemEditing}
                    onChange={updateItem}
                  />
                )}
                {item.type === 'song' && (
                  <SongItem
                    item={item as SongItemData}
                    isEditing={isItemEditing}
                    onChange={updateItem}
                  />
                )}
                {item.type === 'doodle' && (
                  <DoodleItem
                    item={item as DoodleItemData}
                    selected={isItemSelected}
                    onRequestEdit={() => setDoodleEditingId(item.id)}
                  />
                )}
              </CanvasItemWrapper>
            )
          })}
        </div>
      </div>

      {editingDoodle && (
        <DoodleCanvas
          initialStrokes={editingDoodle.strokes as StrokeData[]}
          onSave={saveDoodle}
          onClose={() => setDoodleEditingId(null)}
        />
      )}
    </div>
  )
}

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

function withAlpha(color: string, alpha: number): string {
  const hex = color.trim()
  if (hex.startsWith('#')) {
    const h = hex.slice(1)
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
    const r = parseInt(full.slice(0, 2), 16)
    const g = parseInt(full.slice(2, 4), 16)
    const b = parseInt(full.slice(4, 6), 16)
    if (![r, g, b].some(isNaN)) {
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
  }
  if (color.startsWith('rgba')) return color.replace(/[\d.]+\)$/, `${alpha})`)
  if (color.startsWith('rgb')) return color.replace('rgb', 'rgba').replace(')', `, ${alpha})`)
  return color
}
