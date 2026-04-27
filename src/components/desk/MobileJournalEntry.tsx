// src/components/desk/MobileJournalEntry.tsx
'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import { useJournalStore, StrokeData } from '@/store/journal'
import { JOURNAL, getMobileWritingLinesPerPage, getMobileCharsPerPage } from '@/lib/journal-constants'
import { htmlToPlainText } from '@/lib/text-utils'
import { getRandomPrompt } from '@/lib/themes'
import { getGlassDiaryColors } from '@/lib/glassDiaryColors'
import SongEmbed from '@/components/SongEmbed'
import PhotoBlock from './PhotoBlock'
import CompactDoodleCanvas from './CompactDoodleCanvas'
import EntrySelector from './EntrySelector'

interface Photo {
  id?: string
  url: string
  rotation: number
  position: 1 | 2
}

interface Entry {
  id: string
  text: string
  mood: number
  song?: string | null
  photos?: Photo[]
  doodles?: Array<{ strokes: StrokeData[] }>
  createdAt: string
}

interface MobileJournalEntryProps {
  onClose: () => void
}

/**
 * Split a string into N pages of `charsPerPage` characters, breaking on the
 * last whitespace before the boundary when possible (so words don't split).
 * Returns at minimum one (possibly empty) page.
 */
function paginate(text: string, charsPerPage: number): string[] {
  if (text.length === 0) return ['']
  const pages: string[] = []
  let i = 0
  while (i < text.length) {
    let end = Math.min(i + charsPerPage, text.length)
    if (end < text.length) {
      const slice = text.slice(i, end)
      const lastBreak = Math.max(
        slice.lastIndexOf('\n'),
        slice.lastIndexOf(' '),
      )
      if (lastBreak > charsPerPage * 0.5) {
        end = i + lastBreak + 1
      }
    }
    pages.push(text.slice(i, end))
    i = end
  }
  return pages.length === 0 ? [''] : pages
}

export default function MobileJournalEntry({ onClose }: MobileJournalEntryProps) {
  const { theme } = useThemeStore()
  const colors = useMemo(() => getGlassDiaryColors(theme), [theme])
  const {
    currentSong,
    setCurrentSong,
    currentMood,
    currentDoodleStrokes,
    setDoodleStrokes,
    resetCurrentEntry,
  } = useJournalStore()

  const [viewportHeight, setViewportHeight] = useState<number>(
    typeof window !== 'undefined' ? window.innerHeight : 720
  )
  useEffect(() => {
    const onResize = () => setViewportHeight(window.innerHeight)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const linesPerPage = getMobileWritingLinesPerPage(viewportHeight)
  const charsPerPage = getMobileCharsPerPage(linesPerPage)

  const [entries, setEntries] = useState<Entry[]>([])
  const [todayEntries, setTodayEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null)
  const [pages, setPages] = useState<string[]>([''])
  const [activePage, setActivePage] = useState(0)
  const [songInput, setSongInput] = useState(currentSong || '')
  const [pendingPhotos, setPendingPhotos] = useState<Photo[]>([])
  const [saving, setSaving] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const [prompt, setPrompt] = useState('')

  const photosDoodleIndex = pages.length // last "page" (synthetic)
  const totalPages = pages.length + 1

  useEffect(() => { setPrompt(getRandomPrompt()) }, [])

  // Fetch entries
  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/entries?limit=50')
      if (res.ok) {
        const data = await res.json()
        const fetched = data.entries || []
        setEntries(fetched)
        const today = new Date(); today.setHours(0, 0, 0, 0)
        const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999)
        setTodayEntries(fetched.filter((e: Entry) => {
          const d = new Date(e.createdAt)
          return d >= today && d <= todayEnd
        }))
      }
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { fetchEntries() }, [fetchEntries])

  const currentEntry = currentEntryId
    ? entries.find(e => e.id === currentEntryId) || null
    : null
  const isNewEntry = currentEntryId === null

  // Pagination — when a page's text exceeds capacity, split overflow onto next.
  const handlePageTextChange = useCallback((index: number, value: string) => {
    setPages(prev => {
      const next = [...prev]
      // Combine all text from this page onward, then re-paginate from `index`.
      const tail = [value, ...next.slice(index + 1)].join('')
      const repaginated = paginate(tail, charsPerPage)
      return [...next.slice(0, index), ...repaginated]
    })
  }, [charsPerPage])

  // Char count = sum of all page texts
  const charCount = pages.reduce((sum, p) => sum + p.length, 0)

  const handleSongChange = useCallback((value: string) => {
    setSongInput(value)
    setCurrentSong(value)
  }, [setCurrentSong])

  const handlePhotoAdd = useCallback((position: 1 | 2, dataUrl: string) => {
    const rotation = position === 1
      ? -8 + Math.floor(Math.random() * 6)
      : 5 + Math.floor(Math.random() * 6)
    setPendingPhotos(prev => [
      ...prev.filter(p => p.position !== position),
      { url: dataUrl, position, rotation },
    ])
  }, [])

  const handleStrokesChange = useCallback((strokes: StrokeData[]) => {
    setDoodleStrokes(strokes)
  }, [setDoodleStrokes])

  const handleSave = useCallback(async () => {
    const fullText = pages.join('').trim()
    if (!fullText) return
    setSaving(true)
    try {
      const html = '<p>' + fullText.replace(/\n/g, '</p><p>') + '</p>'
      const photos = pendingPhotos.map(p => ({
        url: p.url, position: p.position, rotation: p.rotation, spread: 1,
      }))
      const doodles = currentDoodleStrokes.length > 0
        ? [{ strokes: currentDoodleStrokes }]
        : []

      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: html,
          mood: currentMood,
          song: songInput && /https?:\/\//.test(songInput) ? songInput : null,
          photos,
          doodles,
        }),
      })

      if (res.ok) {
        setPages([''])
        setActivePage(0)
        setSongInput('')
        setPendingPhotos([])
        resetCurrentEntry()
        setPrompt(getRandomPrompt())
        setShowSaved(true)
        fetchEntries()
        setTimeout(() => setShowSaved(false), 2000)
      } else {
        const data = await res.json()
        alert(`Failed to save: ${data.error || 'Unknown error'}`)
      }
    } finally {
      setSaving(false)
    }
  }, [pages, songInput, pendingPhotos, currentMood, currentDoodleStrokes, resetCurrentEntry, fetchEntries])

  const handleEntrySelect = useCallback((entryId: string | null) => {
    setCurrentEntryId(entryId)
    setPages([''])
    setActivePage(0)
    setPendingPhotos([])
  }, [])

  // Swipe between pages
  const handleSwipeEnd = useCallback((_: unknown, info: PanInfo) => {
    if (info.offset.x < -60 && activePage < totalPages - 1) {
      setActivePage(p => p + 1)
    } else if (info.offset.x > 60 && activePage > 0) {
      setActivePage(p => p - 1)
    }
  }, [activePage, totalPages])

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: theme.bg.primary }}>
        <span style={{ color: colors.prompt }}>Loading...</span>
      </div>
    )
  }

  // Viewing existing entry — read-only stack (kept simple; does not paginate)
  if (!isNewEntry && currentEntry) {
    const plainText = htmlToPlainText(currentEntry.text)
    const entryPhotos = currentEntry.photos || []
    const captionDate = currentEntry?.createdAt ? new Date(currentEntry.createdAt) : new Date()
    const dateCaption = captionDate
      .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      .toLowerCase()
    return (
      <div className="fixed inset-0 overflow-y-auto z-40" style={{ background: theme.bg.primary }}>
        <div className="max-w-lg mx-auto px-4 py-6 pb-20">
          <div className="flex items-center justify-between mb-4">
            <button onClick={onClose} className="text-sm px-3 py-1.5 rounded-full"
              style={{ background: colors.buttonBg, color: colors.bodyText, border: `1px solid ${colors.buttonBorder}` }}>
              Close
            </button>
            <span className="text-sm" style={{ color: colors.date }}>
              {new Date(currentEntry.createdAt).toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric',
              })}
            </span>
          </div>
          {todayEntries.length > 0 && (
            <div className="flex justify-center mb-4">
              <EntrySelector entries={todayEntries} currentEntryId={currentEntryId}
                onEntrySelect={handleEntrySelect} onNewEntry={() => setCurrentEntryId(null)} />
            </div>
          )}
          {currentEntry.song && (
            <div className="mb-4"><SongEmbed url={currentEntry.song} compact audioOnly /></div>
          )}
          <div className="whitespace-pre-wrap mb-4" style={{
            color: colors.bodyText, fontFamily: 'var(--font-caveat), Georgia, serif',
            fontSize: '20px', lineHeight: '32px',
          }}>
            {plainText || <span style={{ color: colors.prompt, fontStyle: 'italic' }}>No text</span>}
          </div>
          {entryPhotos.length > 0 && <div className="mb-4"><PhotoBlock photos={entryPhotos} disabled dateCaption={dateCaption} /></div>}
        </div>
      </div>
    )
  }

  // New entry — paginated authoring
  return (
    <div className="fixed inset-0 z-40 flex flex-col" style={{ background: theme.bg.primary }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ minHeight: 56 }}>
        <button onClick={onClose} className="text-xs px-3 py-1.5 rounded-full"
          style={{ background: colors.buttonBg, color: colors.bodyText, border: `1px solid ${colors.buttonBorder}`, fontFamily: 'Georgia, serif' }}>
          Close
        </button>
        <span className="text-xs italic" style={{ color: colors.date, fontFamily: 'Georgia, serif' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
      </div>

      {/* Pager */}
      <motion.div
        className="flex-1 overflow-hidden px-3"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        onDragEnd={handleSwipeEnd}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activePage}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="h-full"
          >
            {activePage < photosDoodleIndex ? (
              <WritingPage
                colors={colors}
                isFirstPage={activePage === 0}
                pageText={pages[activePage]}
                onPageTextChange={(value) => handlePageTextChange(activePage, value)}
                linesPerPage={linesPerPage}
                prompt={prompt}
                charCount={charCount}
                songInput={songInput}
                onSongChange={handleSongChange}
                onSongClear={() => setSongInput('')}
              />
            ) : (
              <PhotosDoodlePage
                colors={colors}
                photos={pendingPhotos}
                onPhotoAdd={handlePhotoAdd}
                doodleStrokes={currentDoodleStrokes}
                onStrokesChange={handleStrokesChange}
                canSave={pages.join('').trim().length > 0}
                saving={saving}
                onSave={handleSave}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Pagination dots */}
      <div className="flex items-center justify-center gap-2 py-4" style={{ minHeight: 56 }}>
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => setActivePage(i)}
            className="rounded-full transition-all"
            style={{
              width: i === activePage ? 8 : 6,
              height: i === activePage ? 8 : 6,
              background: i === activePage ? colors.date : colors.prompt,
              opacity: i === activePage ? 1 : 0.4,
            }}
            aria-label={`Go to page ${i + 1} of ${totalPages}`}
          />
        ))}
      </div>

      {/* Saved overlay */}
      <AnimatePresence>
        {showSaved && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ background: 'rgba(0,0,0,0.3)' }}>
            <motion.div className="flex flex-col items-center gap-2"
              initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl text-white"
                style={{ background: colors.saveButton }}>
                ✓
              </div>
              <span className="text-lg font-serif" style={{ color: colors.bodyText }}>Saved</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ----------------------------------------------------------------------------

function WritingPage({
  colors, isFirstPage, pageText, onPageTextChange, linesPerPage,
  prompt, charCount, songInput, onSongChange, onSongClear,
}: {
  colors: ReturnType<typeof getGlassDiaryColors>
  isFirstPage: boolean
  pageText: string
  onPageTextChange: (value: string) => void
  linesPerPage: number
  prompt: string
  charCount: number
  songInput: string
  onSongChange: (value: string) => void
  onSongClear: () => void
}) {
  return (
    <div
      className="h-full p-4 rounded-2xl flex flex-col"
      style={{
        background: colors.pageBg,
        backdropFilter: `blur(${colors.pageBlur})`,
        WebkitBackdropFilter: `blur(${colors.pageBlur})`,
        border: `1px solid ${colors.pageBorder}`,
        boxShadow: '0 8px 28px rgba(0,0,0,0.3)',
      }}
    >
      {isFirstPage && (
        <div className="mb-3" style={{ minHeight: 88 }}>
          <div className="text-[10px] uppercase tracking-[0.18em] mb-2 font-medium"
            style={{ color: colors.sectionLabel }}>
            Add a Song
          </div>
          {songInput && /https?:\/\//.test(songInput) ? (
            <div className="relative">
              <SongEmbed url={songInput} compact audioOnly />
              <button onClick={onSongClear}
                className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs"
                style={{ background: colors.buttonBg, color: colors.prompt }}>
                ×
              </button>
            </div>
          ) : (
            <input
              type="text"
              value={songInput}
              onChange={e => onSongChange(e.target.value)}
              placeholder="Paste Spotify, YouTube, or SoundCloud..."
              className="w-full px-3 py-2 rounded-lg text-sm bg-transparent outline-none"
              style={{
                border: `1px solid ${colors.pageBorder}`,
                color: colors.bodyText,
                background: 'rgba(255,255,255,0.03)',
              }}
            />
          )}
        </div>
      )}

      <div className="text-[10px] uppercase tracking-[0.18em] mb-1 font-medium"
        style={{ color: colors.sectionLabel }}>
        Write your thoughts
      </div>
      {isFirstPage && (
        <div className="text-xs italic mb-2" style={{ color: colors.prompt, fontFamily: 'Georgia, serif' }}>
          {prompt}
        </div>
      )}

      <textarea
        value={pageText}
        onChange={e => onPageTextChange(e.target.value)}
        placeholder={isFirstPage ? "What's on your mind today..." : ''}
        rows={linesPerPage}
        maxLength={JOURNAL.MAX_CHARS}
        className="flex-1 w-full resize-none outline-none rounded-lg p-3"
        style={{
          color: colors.bodyText,
          fontFamily: 'var(--font-caveat), Georgia, serif',
          fontSize: `${JOURNAL.FONT_SIZE}px`,
          lineHeight: `${JOURNAL.LINE_HEIGHT}px`,
          caretColor: colors.saveButton,
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${colors.pageBorder}`,
          backgroundImage: `repeating-linear-gradient(transparent, transparent ${JOURNAL.LINE_HEIGHT - 1}px, ${colors.ruledLine} ${JOURNAL.LINE_HEIGHT - 1}px, ${colors.ruledLine} ${JOURNAL.LINE_HEIGHT}px)`,
          backgroundPosition: '0 12px',
        }}
      />

      <div className="text-right text-[10px] mt-2"
        style={{ color: charCount > JOURNAL.MAX_CHARS * 0.9 ? colors.saveButton : colors.prompt }}>
        {charCount} / {JOURNAL.MAX_CHARS}
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------------

function PhotosDoodlePage({
  colors, photos, onPhotoAdd, doodleStrokes, onStrokesChange, canSave, saving, onSave,
}: {
  colors: ReturnType<typeof getGlassDiaryColors>
  photos: Photo[]
  onPhotoAdd: (position: 1 | 2, dataUrl: string) => void
  doodleStrokes: StrokeData[]
  onStrokesChange: (strokes: StrokeData[]) => void
  canSave: boolean
  saving: boolean
  onSave: () => void
}) {
  const captionDate = new Date()
  const dateCaption = captionDate
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    .toLowerCase()
  return (
    <div
      className="h-full p-4 rounded-2xl flex flex-col gap-3 overflow-y-auto"
      style={{
        background: colors.pageBg,
        backdropFilter: `blur(${colors.pageBlur})`,
        WebkitBackdropFilter: `blur(${colors.pageBlur})`,
        border: `1px solid ${colors.pageBorder}`,
        boxShadow: '0 8px 28px rgba(0,0,0,0.3)',
      }}
    >
      <div>
        <div className="text-[10px] uppercase tracking-[0.18em] mb-2 font-medium"
          style={{ color: colors.sectionLabel }}>
          Photos
        </div>
        <PhotoBlock photos={photos} onPhotoAdd={onPhotoAdd} dateCaption={dateCaption} />
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-[0.18em] mb-2 font-medium"
          style={{ color: colors.sectionLabel }}>
          Draw
        </div>
        <div style={{ height: 160 }}>
          <CompactDoodleCanvas
            strokes={doodleStrokes}
            onStrokesChange={onStrokesChange}
            doodleColors={[colors.bodyText, colors.saveButton, colors.ribbon, colors.prompt]}
            canvasBackground={colors.doodleBg}
            canvasBorder={colors.doodleBorder}
            textColor={colors.bodyText}
            mutedColor={colors.prompt}
          />
        </div>
      </div>

      {canSave && (
        <button
          onClick={onSave}
          disabled={saving}
          className="w-full py-3 rounded-full text-sm font-medium mt-auto"
          style={{
            background: colors.saveButton,
            color: 'white',
            opacity: saving ? 0.6 : 1,
            boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
          }}
        >
          {saving ? 'Saving...' : 'Save Entry'}
        </button>
      )}
    </div>
  )
}
