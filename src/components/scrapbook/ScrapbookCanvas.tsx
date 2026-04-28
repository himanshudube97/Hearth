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
  ClipItemData,
  MoodItemData,
  StampItemData,
  DateItemData,
  makeStickerItem,
  makeTextItem,
  makePhotoItem,
  makeSongItem,
  makeDoodleItem,
  makeClipItem,
  makeMoodItem,
  makeStampItem,
  ClipVariant,
} from '@/lib/scrapbook'
import CanvasItemWrapper from './CanvasItemWrapper'
import CanvasToolbar from './CanvasToolbar'
import TextItem from './items/TextItem'
import StickerItem from './items/StickerItem'
import PhotoItem from './items/PhotoItem'
import SongItem from './items/SongItem'
import DoodleItem from './items/DoodleItem'
import CameraModal from './CameraModal'
import ClipItem from './items/ClipItem'
import MoodItem from './items/MoodItem'
import StampItem from './items/StampItem'
import DateItem from './items/DateItem'
import PageSurface from './PageSurface'
import { useAutosaveScrapbook } from '@/hooks/useAutosaveScrapbook'

const PHOTO_MAX_BYTES = 5 * 1024 * 1024
const PHOTO_MAX_WIDTH = 1600

async function compressPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()
    reader.onload = (e) => { img.src = e.target?.result as string }
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas context unavailable'))

      let width = img.width
      let height = img.height
      if (width > PHOTO_MAX_WIDTH) {
        height = Math.round((height * PHOTO_MAX_WIDTH) / width)
        width = PHOTO_MAX_WIDTH
      }
      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)

      let quality = 0.85
      let dataUrl = canvas.toDataURL('image/jpeg', quality)
      while (dataUrl.length > PHOTO_MAX_BYTES * 1.37 && quality > 0.3) {
        quality -= 0.1
        dataUrl = canvas.toDataURL('image/jpeg', quality)
      }
      resolve(dataUrl)
    }
    img.onerror = () => reject(new Error('Image load failed'))
    reader.onerror = () => reject(new Error('File read failed'))
    reader.readAsDataURL(file)
  })
}

interface Props {
  boardId: string
  initialItems: ScrapbookItem[]
}

export default function ScrapbookCanvas({ boardId, initialItems }: Props) {
  const { theme } = useThemeStore()
  const [items, setItems] = useState<ScrapbookItem[]>(initialItems)
  const { status: saveStatus, trigger: triggerSave, flush: flushSave } = useAutosaveScrapbook({ boardId })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [cameraTargetId, setCameraTargetId] = useState<string | null>(null)
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => {
    triggerSave(items)
  }, [items, triggerSave])

  useEffect(() => {
    const onBeforeUnload = () => { flushSave() }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [flushSave])

  function updateItem(updated: ScrapbookItem) {
    setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)))
  }

  function deleteItem(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id))
    if (selectedId === id) setSelectedId(null)
    if (editingId === id) setEditingId(null)
    if (cameraTargetId === id) setCameraTargetId(null)
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

  function addPhoto() {
    // Drop a placeholder polaroid; user fills it via the on-canvas
    // "click" / "upload" buttons.
    const item = makePhotoItem(null, items)
    setItems((prev) => [...prev, item])
    setSelectedId(item.id)
  }

  function fillPhoto(id: string, src: string) {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id && it.type === 'photo' ? { ...it, src } : it,
      ),
    )
  }

  function requestCameraFor(id: string) {
    setCameraTargetId(id)
  }

  function requestUploadFor(id: string) {
    setUploadTargetId(id)
    fileInputRef.current?.click()
  }

  async function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const targetId = uploadTargetId
    e.target.value = ''
    if (!file || !targetId) return
    try {
      const dataUrl = await compressPhoto(file)
      fillPhoto(targetId, dataUrl)
    } catch (err) {
      console.error('Failed to compress photo:', err)
    }
    setUploadTargetId(null)
  }

  function onCameraCapture(dataUrl: string) {
    if (cameraTargetId) fillPhoto(cameraTargetId, dataUrl)
    setCameraTargetId(null)
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
    // Drop straight into edit mode so the user can start drawing immediately —
    // toolbar appears below and pointer events draw on the doodle surface.
    setEditingId(item.id)
  }

  function addClip(variant: ClipVariant) {
    const defaults: Record<ClipVariant, string[]> = {
      'index-card': ['a small note'],
      'ticket-stub': ['L TRAIN · 04·28·26', 'Bedford → 1st'],
      'receipt': ['café', '$ 4.50'],
    }
    const item = makeClipItem(variant, defaults[variant], items)
    setItems((prev) => [...prev, item])
    setSelectedId(item.id)
    setEditingId(item.id)
  }

  function addMood() {
    const item = makeMoodItem(2, items)
    setItems((prev) => [...prev, item])
    setSelectedId(item.id)
  }

  function addStamp() {
    const { themeName } = useThemeStore.getState()
    const today = new Date()
    const dateStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
    const item = makeStampItem(`apr · ${today.getDate()}`, themeName, dateStr, items)
    setItems((prev) => [...prev, item])
    setSelectedId(item.id)
    setEditingId(item.id)
  }

  function resetBoard() {
    setItems([])
    setSelectedId(null)
    setEditingId(null)
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const tapeLeft = withAlpha(theme.accent.warm, 0.78)
  const tapeRight = withAlpha(theme.accent.secondary, 0.78)

  return (
    <div className="w-full flex flex-col items-center">
      {/* This page sits inside LayoutContent's <main> which already supplies
          the global theme background (via <Background />), pt-20 padding,
          and min-h-screen. We must NOT add another full-viewport background
          layer here or the page will look "doubled up" and scroll past
          the viewport. */}

      <div
        className="mb-3 flex items-center gap-3"
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

      <div className="mb-4 z-30">
        <CanvasToolbar
          onAddText={addText}
          onAddSticker={addSticker}
          onAddPhoto={addPhoto}
          onAddSong={addSong}
          onAddDoodle={addDoodle}
          onAddClip={addClip}
          onAddMood={addMood}
          onAddStamp={addStamp}
          onReset={resetBoard}
        />
      </div>

      <div
        style={{
          fontSize: 12,
          color: 'rgba(58, 52, 41, 0.55)',
          fontFamily: 'var(--font-caveat), cursive',
          marginTop: 4,
          minHeight: 16,
        }}
      >
        {saveStatus === 'saving' && 'saving…'}
        {saveStatus === 'saved' && 'saved'}
        {saveStatus === 'error' && 'save error — retrying'}
      </div>

      <div className="w-full flex justify-center">
        <div
          ref={canvasRef}
          onClick={deselectAll}
          className="relative"
          style={{
            width: 'min(720px, calc((100vh - 220px) * 0.8))',
            aspectRatio: '4 / 5',
            cursor: selectedId ? 'default' : 'auto',
          }}
        >
          <PageSurface>
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
                    onRequestCamera={() => requestCameraFor(item.id)}
                    onRequestUpload={() => requestUploadFor(item.id)}
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
                    isEditing={isItemEditing}
                    onChange={updateItem}
                  />
                )}
                {item.type === 'clip' && (
                  <ClipItem
                    item={item as ClipItemData}
                    isEditing={isItemEditing}
                    onChange={updateItem}
                  />
                )}
                {item.type === 'mood' && (
                  <MoodItem item={item as MoodItemData} onChange={updateItem} />
                )}
                {item.type === 'stamp' && (
                  <StampItem
                    item={item as StampItemData}
                    isEditing={isItemEditing}
                    onChange={updateItem}
                  />
                )}
                {item.type === 'date' && (
                  <DateItem
                    item={item as DateItemData}
                    isEditing={isItemEditing}
                    onChange={updateItem}
                  />
                )}
              </CanvasItemWrapper>
            )
          })}
          </PageSurface>
        </div>
      </div>

      {cameraTargetId && (
        <CameraModal
          onCapture={onCameraCapture}
          onClose={() => setCameraTargetId(null)}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFilePicked}
        style={{ display: 'none' }}
      />
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
