'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getGreeting, getRandomWhisper, getRandomPrompt } from '@/lib/themes'
import { useThemeStore } from '@/store/theme'
import { useJournalStore, JournalEntry, StrokeData } from '@/store/journal'
import { useProfileStore } from '@/store/profile'
import { useEntries } from '@/hooks/useEntries'
import Editor from '@/components/Editor'
import MoodPicker from '@/components/MoodPicker'
import DoodleCanvas from '@/components/DoodleCanvas'
import EntryCard from '@/components/EntryCard'
import SongEmbed, { isMusicUrl } from '@/components/SongEmbed'
import BirthdayBanner from '@/components/BirthdayBanner'
import LetterArrivedBanner from '@/components/LetterArrivedBanner'

export default function WritePage() {
  const [whisper, setWhisper] = useState('')
  const [prompt, setPrompt] = useState('')
  const [showDoodle, setShowDoodle] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null)

  const { theme } = useThemeStore()
  const { profile, fetchProfile } = useProfileStore()
  const {
    currentMood,
    currentText,
    currentSong,
    setCurrentMood,
    setCurrentText,
    setCurrentSong,
    currentDoodleStrokes,
    addDoodleStroke,
    clearDoodleStrokes,
    resetCurrentEntry,
  } = useJournalStore()

  // Fetch only today's entries using the optimized hook
  const { entries: todayEntries, refresh: refreshTodayEntries } = useEntries({
    today: true,
    limit: 20,
  })

  useEffect(() => {
    setWhisper(getRandomWhisper())
    setPrompt(getRandomPrompt())
    fetchProfile()

    // Check if we're coming from timeline with an entry to edit
    const editingId = sessionStorage.getItem('editingEntryId')
    const editingCreatedAt = sessionStorage.getItem('editingEntryCreatedAt')
    if (editingId && editingCreatedAt) {
      setEditingEntry({
        id: editingId,
        createdAt: editingCreatedAt,
        text: currentText,
        mood: currentMood,
        song: currentSong,
        tags: [],
        doodles: [],
        updatedAt: editingCreatedAt,
      })
      sessionStorage.removeItem('editingEntryId')
      sessionStorage.removeItem('editingEntryCreatedAt')
    }
  }, [])

  const refreshPrompt = () => {
    setPrompt(getRandomPrompt())
  }

  const handleSaveEntry = async () => {
    if (!currentText.trim() || currentText === '<p></p>') return

    setSaving(true)
    try {
      const isEditing = editingEntry !== null
      const url = isEditing ? `/api/entries/${editingEntry.id}` : '/api/entries'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: currentText,
          mood: currentMood,
          song: currentSong || null,
          doodles: currentDoodleStrokes.length > 0
            ? [{ strokes: currentDoodleStrokes, positionInEntry: 0 }]
            : [],
        }),
      })

      const data = await res.json()
      console.log('Save response:', res.status, data)

      if (res.ok) {
        resetCurrentEntry()
        setEditingEntry(null)
        refreshTodayEntries()
        setWhisper(getRandomWhisper())
      } else {
        console.error('Save failed:', data)
        alert(`Failed to save: ${data.details || data.error}`)
      }
    } catch (error) {
      console.error('Failed to save entry:', error)
      alert(`Error: ${error}`)
    } finally {
      setSaving(false)
    }
  }

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry)
    setCurrentText(entry.text)
    setCurrentMood(entry.mood)
    setCurrentSong(entry.song || '')
    // Load doodles if present
    clearDoodleStrokes()
    if (entry.doodles && entry.doodles.length > 0) {
      entry.doodles[0]?.strokes.forEach(stroke => addDoodleStroke(stroke))
    }
    // Scroll to top to show the editor
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    setEditingEntry(null)
    resetCurrentEntry()
  }

  const handleDoodleSave = (strokes: StrokeData[]) => {
    strokes.forEach(stroke => addDoodleStroke(stroke))
    setShowDoodle(false)
  }

  // Use state for greeting to avoid hydration mismatch (time differs server vs client)
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    setGreeting(getGreeting())
  }, [])

  // Build personalized greeting with nickname
  const nickname = profile.nickname
  const personalizedGreeting = nickname
    ? `${greeting}, ${nickname}`
    : greeting

  // Check if today is the user's birthday
  const isBirthday = (() => {
    if (!profile.dateOfBirth) return false
    const today = new Date()
    const [, month, day] = profile.dateOfBirth.split('-').map(Number)
    return today.getMonth() + 1 === month && today.getDate() === day
  })()

  const hasContent = currentText.trim() && currentText !== '<p></p>'

  return (
    <div className="max-w-2xl mx-auto">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="text-center mb-6"
      >
        <h1
          className="text-2xl font-light tracking-wide"
          style={{ color: theme.text.primary }}
        >
          {personalizedGreeting}
        </h1>
      </motion.div>

      {/* Birthday Banner */}
      {isBirthday && <BirthdayBanner nickname={nickname} />}

      {/* Letter Arrived Banner */}
      <LetterArrivedBanner nickname={nickname} />

      {/* Whisper */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="text-center text-sm italic mb-8"
        style={{ color: theme.text.muted }}
      >
        "{whisper}"
      </motion.p>

      {/* Edit Mode Banner */}
      {editingEntry && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 rounded-xl flex items-center justify-between"
          style={{
            background: `${theme.accent.warm}20`,
            border: `1px solid ${theme.accent.warm}40`,
          }}
        >
          <span className="text-sm" style={{ color: theme.text.primary }}>
            Editing entry from {new Date(editingEntry.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </span>
          <button
            onClick={handleCancelEdit}
            className="text-sm px-3 py-1 rounded-full"
            style={{ color: theme.accent.warm }}
          >
            Cancel
          </button>
        </motion.div>
      )}

      {/* Mood Picker */}
      <div className="flex justify-center mb-6">
        <MoodPicker />
      </div>

      {/* Prompt */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <p className="text-sm italic" style={{ color: theme.text.secondary }}>
          {prompt}
        </p>
        <button
          onClick={refreshPrompt}
          className="text-sm opacity-50 hover:opacity-100 transition-opacity"
          style={{ color: theme.accent.primary }}
        >
          ↻
        </button>
      </div>

      {/* Editor */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <Editor prompt={prompt} />
      </motion.div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            onClick={() => setShowDoodle(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: theme.glass.bg,
              border: `1px solid ${theme.glass.border}`,
              color: currentDoodleStrokes.length > 0 ? theme.accent.warm : theme.text.muted,
            }}
            title="Add doodle"
          >
            ✎
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: theme.glass.bg,
              border: `1px solid ${theme.glass.border}`,
              color: currentSong ? theme.accent.warm : theme.text.muted,
            }}
            title="Add song"
          >
            ♫
          </motion.button>
        </div>

        <input
          type="text"
          placeholder="paste a song link or song name..."
          value={currentSong}
          onChange={(e) => setCurrentSong(e.target.value)}
          className="flex-1 mx-4 px-4 py-2 rounded-full text-sm bg-transparent outline-none"
          style={{
            border: `1px solid ${theme.glass.border}`,
            color: theme.text.primary,
          }}
        />

        <AnimatePresence>
          {hasContent && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              onClick={handleSaveEntry}
              disabled={saving}
              className="px-6 py-2 rounded-full text-sm font-medium"
              style={{
                background: theme.accent.primary,
                color: theme.bg.primary,
                opacity: saving ? 0.5 : 1,
              }}
            >
              {saving ? 'Saving...' : editingEntry ? 'Update Entry' : 'Save Entry'}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Doodle Preview */}
      {currentDoodleStrokes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="mt-4 p-4 rounded-xl"
          style={{ background: theme.glass.bg }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: theme.text.muted }}>
              Doodle attached
            </span>
            <button
              onClick={clearDoodleStrokes}
              className="text-sm"
              style={{ color: theme.accent.primary }}
            >
              Remove
            </button>
          </div>
        </motion.div>
      )}

      {/* Song Preview - shows embed for URLs */}
      {currentSong && isMusicUrl(currentSong) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="mt-4"
        >
          <SongEmbed url={currentSong} compact />
        </motion.div>
      )}

      {/* Today's Entries */}
      {todayEntries.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12"
        >
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg mb-4"
            style={{ color: theme.text.secondary }}
          >
            earlier today
          </motion.h2>
          <div className="space-y-4">
            {todayEntries.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.8,
                  delay: 0.8 + index * 0.1,
                  ease: [0.22, 1, 0.36, 1]
                }}
              >
                <EntryCard entry={entry} onEdit={handleEditEntry} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Doodle Modal */}
      <AnimatePresence>
        {showDoodle && (
          <DoodleCanvas
            onSave={handleDoodleSave}
            onClose={() => setShowDoodle(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
