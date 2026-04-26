// src/components/desk/MobileJournalEntry.tsx
'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import { diaryThemes } from '@/lib/diaryThemes'
import { useJournalStore, StrokeData } from '@/store/journal'
import { JOURNAL } from '@/lib/journal-constants'
import { htmlToPlainText } from '@/lib/text-utils'
import { getRandomPrompt } from '@/lib/themes'
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

export default function MobileJournalEntry({ onClose }: MobileJournalEntryProps) {
  const { theme } = useThemeStore()
  const diaryTheme = diaryThemes[currentDiaryTheme]
  const { currentSong, setCurrentSong, currentMood, currentDoodleStrokes, setDoodleStrokes, resetCurrentEntry } = useJournalStore()

  const isGlass = currentDiaryTheme === 'glass'
  const textColor = isGlass ? theme.text.primary : diaryTheme.pages.textColor
  const mutedColor = isGlass ? theme.text.muted : diaryTheme.pages.mutedColor
  const accentColor = theme.accent.warm
  const pageBg = isGlass ? theme.glass.bg : diaryTheme.pages.background

  const [entries, setEntries] = useState<Entry[]>([])
  const [todayEntries, setTodayEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [songInput, setSongInput] = useState(currentSong || '')
  const [pendingPhotos, setPendingPhotos] = useState<Photo[]>([])
  const [saving, setSaving] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const [prompt, setPrompt] = useState('')

  useEffect(() => { setPrompt(getRandomPrompt()) }, [])

  // Fetch entries
  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/entries?limit=50')
      if (res.ok) {
        const data = await res.json()
        const fetched = data.entries || []
        setEntries(fetched)

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayEnd = new Date()
        todayEnd.setHours(23, 59, 59, 999)
        setTodayEntries(fetched.filter((e: Entry) => {
          const d = new Date(e.createdAt)
          return d >= today && d <= todayEnd
        }))
      }
    } catch (err) {
      console.error('Failed to fetch entries:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  // Current entry (null = new entry)
  const currentEntry = currentEntryId
    ? entries.find(e => e.id === currentEntryId) || null
    : null
  const isNewEntry = currentEntryId === null

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    if (newText.length > JOURNAL.MAX_CHARS) return
    setText(newText)
  }, [])

  const handleSongChange = useCallback((value: string) => {
    setSongInput(value)
    setCurrentSong(value)
  }, [setCurrentSong])

  const handlePhotoAdd = useCallback((position: 1 | 2, dataUrl: string) => {
    const rotation = position === 1 ? -8 + Math.floor(Math.random() * 6) : 5 + Math.floor(Math.random() * 6)
    setPendingPhotos(prev => [...prev.filter(p => p.position !== position), { url: dataUrl, position, rotation }])
  }, [])

  const handleStrokesChange = useCallback((strokes: StrokeData[]) => {
    setDoodleStrokes(strokes)
  }, [setDoodleStrokes])

  const handleSave = useCallback(async () => {
    if (!text.trim()) return
    setSaving(true)
    try {
      const html = '<p>' + text.replace(/\n/g, '</p><p>') + '</p>'
      const photos = pendingPhotos.map(p => ({
        url: p.url, position: p.position, rotation: p.rotation, spread: 1,
      }))
      const doodles = currentDoodleStrokes.length > 0 ? [{ strokes: currentDoodleStrokes }] : []

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
        setText('')
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
    } catch (err) {
      console.error('Save failed:', err)
      alert('Failed to save entry')
    } finally {
      setSaving(false)
    }
  }, [text, songInput, pendingPhotos, currentMood, currentDoodleStrokes, resetCurrentEntry, fetchEntries])

  const handleEntrySelect = useCallback((entryId: string | null) => {
    setCurrentEntryId(entryId)
    setText('')
    setPendingPhotos([])
  }, [])

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: theme.bg.primary }}>
        <span style={{ color: mutedColor }}>Loading...</span>
      </div>
    )
  }

  // Viewing existing entry
  if (!isNewEntry && currentEntry) {
    const plainText = htmlToPlainText(currentEntry.text)
    const entryPhotos = currentEntry.photos || []

    return (
      <div className="fixed inset-0 overflow-y-auto z-40" style={{ background: theme.bg.primary }}>
        <div className="max-w-lg mx-auto px-4 py-6 pb-20">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={onClose} className="text-sm px-3 py-1.5 rounded-full"
              style={{ background: theme.glass.bg, color: textColor, border: `1px solid ${theme.glass.border}` }}>
              Close
            </button>
            <span className="text-sm" style={{ color: mutedColor }}>
              {new Date(currentEntry.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>

          {/* Entry selector */}
          {todayEntries.length > 0 && (
            <div className="flex justify-center mb-4">
              <EntrySelector entries={todayEntries} currentEntryId={currentEntryId}
                onEntrySelect={handleEntrySelect} onNewEntry={() => setCurrentEntryId(null)} />
            </div>
          )}

          {/* Song */}
          {currentEntry.song && (
            <div className="mb-4">
              <SongEmbed url={currentEntry.song} compact audioOnly />
            </div>
          )}

          {/* Text */}
          <div className="whitespace-pre-wrap mb-4" style={{
            color: textColor, fontFamily: 'var(--font-caveat), Georgia, serif',
            fontSize: '20px', lineHeight: '32px',
          }}>
            {plainText || <span style={{ color: mutedColor, fontStyle: 'italic' }}>No text</span>}
          </div>

          {/* Photos */}
          {entryPhotos.length > 0 && (
            <div className="mb-4">
              <PhotoBlock photos={entryPhotos} disabled />
            </div>
          )}
        </div>
      </div>
    )
  }

  // New entry form
  const charCount = text.length
  const currentPhotos = [...pendingPhotos]

  return (
    <div className="fixed inset-0 overflow-y-auto z-40" style={{ background: theme.bg.primary }}>
      <div className="max-w-lg mx-auto px-4 py-6 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={onClose} className="text-sm px-3 py-1.5 rounded-full"
            style={{ background: theme.glass.bg, color: textColor, border: `1px solid ${theme.glass.border}` }}>
            Close
          </button>
          <span className="text-sm" style={{ color: mutedColor }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>

        {/* Entry selector */}
        {todayEntries.length > 0 && (
          <div className="flex justify-center mb-4">
            <EntrySelector entries={todayEntries} currentEntryId={currentEntryId}
              onEntrySelect={handleEntrySelect} onNewEntry={() => setCurrentEntryId(null)} />
          </div>
        )}

        {/* Song input */}
        <div className="mb-4">
          <div className="text-[10px] uppercase tracking-[0.15em] mb-2 font-medium" style={{ color: mutedColor }}>
            Add a Song
          </div>
          {songInput && /https?:\/\//.test(songInput) ? (
            <div className="relative">
              <SongEmbed url={songInput} compact audioOnly />
              <button onClick={() => setSongInput('')}
                className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs"
                style={{ background: `${mutedColor}20`, color: mutedColor }}>
                x
              </button>
            </div>
          ) : (
            <input type="text" value={songInput} onChange={e => handleSongChange(e.target.value)}
              placeholder="Paste Spotify, YouTube, or SoundCloud link..."
              className="w-full px-3 py-2 rounded-lg text-sm bg-transparent outline-none"
              style={{ border: `1px solid ${isGlass ? 'rgba(255,255,255,0.2)' : diaryTheme.doodle.canvasBorder}`,
                color: textColor, background: isGlass ? 'rgba(255,255,255,0.1)' : diaryTheme.doodle.canvasBackground }} />
          )}
        </div>

        {/* Writing area */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[10px] uppercase tracking-[0.15em] font-medium" style={{ color: mutedColor }}>
              Write your thoughts
            </div>
            <div className="text-[10px]" style={{ color: charCount > JOURNAL.MAX_CHARS * 0.9 ? accentColor : mutedColor }}>
              {charCount} / {JOURNAL.MAX_CHARS}
            </div>
          </div>
          <div className="text-xs italic mb-2" style={{ color: mutedColor }}>
            {prompt}
          </div>
          <textarea
            value={text}
            onChange={handleTextChange}
            placeholder="What's on your mind today..."
            rows={10}
            className="w-full resize-none outline-none rounded-lg p-3"
            style={{
              color: textColor,
              fontFamily: 'var(--font-caveat), Georgia, serif',
              fontSize: '20px',
              lineHeight: '32px',
              caretColor: accentColor,
              background: isGlass ? 'rgba(255,255,255,0.05)' : `${pageBg}`,
              border: `1px solid ${isGlass ? 'rgba(255,255,255,0.1)' : diaryTheme.doodle.canvasBorder}`,
            }}
          />
        </div>

        {/* Photos */}
        <div className="mb-4">
          <div className="text-[10px] uppercase tracking-[0.15em] mb-2 font-medium" style={{ color: mutedColor }}>
            Add Photos
          </div>
          <PhotoBlock photos={currentPhotos} onPhotoAdd={handlePhotoAdd} />
        </div>

        {/* Doodle canvas */}
        <div className="mb-4">
          <div className="text-[10px] uppercase tracking-[0.15em] mb-2 font-medium" style={{ color: mutedColor }}>
            Draw
          </div>
          <div style={{ height: '140px' }}>
            <CompactDoodleCanvas
              strokes={currentDoodleStrokes}
              onStrokesChange={handleStrokesChange}
              doodleColors={isGlass ? [theme.text.primary, theme.accent.primary, theme.accent.warm, theme.text.muted] : diaryTheme.doodle.defaultColors}
              canvasBackground={isGlass ? 'rgba(255,255,255,0.1)' : diaryTheme.doodle.canvasBackground}
              canvasBorder={isGlass ? 'rgba(255,255,255,0.2)' : diaryTheme.doodle.canvasBorder}
              textColor={textColor}
              mutedColor={mutedColor}
            />
          </div>
        </div>

        {/* Save button */}
        <AnimatePresence mode="wait">
          {text.trim().length > 0 && (
            <motion.button
              key="save"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 rounded-full text-sm font-medium"
              style={{
                background: accentColor,
                color: 'white',
                opacity: saving ? 0.6 : 1,
                boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
              }}
              whileTap={{ scale: 0.98 }}
            >
              {saving ? 'Saving...' : 'Save Entry'}
            </motion.button>
          )}
        </AnimatePresence>

        {/* Saved overlay */}
        <AnimatePresence>
          {showSaved && (
            <motion.div className="fixed inset-0 z-50 flex items-center justify-center"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ background: 'rgba(0,0,0,0.3)' }}>
              <motion.div className="flex flex-col items-center gap-2"
                initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl text-white"
                  style={{ background: accentColor }}>
                  ✓
                </div>
                <span className="text-lg font-serif" style={{ color: theme.text.primary }}>Saved</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
