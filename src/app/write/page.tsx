'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getGreeting, getRandomWhisper, getRandomPrompt } from '@/lib/themes'
import { useThemeStore } from '@/store/theme'
import { useJournalStore, JournalEntry, StrokeData } from '@/store/journal'
import { useProfileStore } from '@/store/profile'
import { useE2EE } from '@/hooks/useE2EE'
import Editor from '@/components/Editor'
import DoodleCanvas from '@/components/DoodleCanvas'
import DoodlePreview from '@/components/DoodlePreview'
import CollagePhoto from '@/components/CollagePhoto'
import SongEmbed, { isMusicUrl } from '@/components/SongEmbed'
import BirthdayBanner from '@/components/BirthdayBanner'
import LetterArrivedBanner from '@/components/LetterArrivedBanner'

const DOODLE_DRAFT_KEY = 'hearth_doodle_draft'

export default function WritePage() {
  const [whisper, setWhisper] = useState('')
  const [prompt, setPrompt] = useState('')
  const [showDoodle, setShowDoodle] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null)
  const [hasDoodleDraft, setHasDoodleDraft] = useState(false)
  const [photoTopRight, setPhotoTopRight] = useState<string | null>(null)
  const [photoBottomLeft, setPhotoBottomLeft] = useState<string | null>(null)

  const { theme } = useThemeStore()
  const { profile, fetchProfile } = useProfileStore()
  const {
    currentMood,
    currentText,
    currentSong,
    setCurrentSong,
    currentDoodleStrokes,
    setDoodleStrokes,
    resetCurrentEntry,
  } = useJournalStore()

  // E2EE hook for encrypting entries
  const { encryptEntryData, isE2EEReady } = useE2EE()

  // Check for doodle draft
  const checkDoodleDraft = useCallback(() => {
    try {
      const draft = localStorage.getItem(DOODLE_DRAFT_KEY)
      setHasDoodleDraft(draft !== null && JSON.parse(draft)?.length > 0)
    } catch {
      setHasDoodleDraft(false)
    }
  }, [])

  useEffect(() => {
    setWhisper(getRandomWhisper())
    setPrompt(getRandomPrompt())
    fetchProfile()
    checkDoodleDraft()

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

      // Prepare entry data
      const entryData = {
        text: currentText,
        mood: currentMood,
        song: currentSong || null,
        doodles: currentDoodleStrokes.length > 0
          ? [{ strokes: currentDoodleStrokes, positionInEntry: 0 }]
          : [],
      }

      // Encrypt if E2EE is ready and this is a new entry
      const finalData = !isEditing
        ? await encryptEntryData(entryData)
        : entryData

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData),
      })

      const data = await res.json()
      console.log('Save response:', res.status, data)

      if (res.ok) {
        resetCurrentEntry()
        setEditingEntry(null)
        setPhotoTopRight(null)
        setPhotoBottomLeft(null)
        // Clear doodle draft
        try {
          localStorage.removeItem(DOODLE_DRAFT_KEY)
          setHasDoodleDraft(false)
        } catch (e) {
          console.error('Failed to clear doodle draft:', e)
        }
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

  const handleCancelEdit = () => {
    setEditingEntry(null)
    resetCurrentEntry()
  }

  const handleDoodleSave = (strokes: StrokeData[]) => {
    setDoodleStrokes(strokes)
    setShowDoodle(false)
    setHasDoodleDraft(false)
  }

  const handleDoodleClose = () => {
    setShowDoodle(false)
    checkDoodleDraft()
  }

  // Use state for greeting to avoid hydration mismatch
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    setGreeting(getGreeting())
  }, [])

  const nickname = profile.nickname
  const personalizedGreeting = nickname
    ? `${greeting}, ${nickname}`
    : greeting

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
          🌿 {personalizedGreeting} 🌸
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
        🍃 &ldquo;{whisper}&rdquo; 🌺
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

      {/* Editor with Photo Collage */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative mt-5"
        style={{ overflow: 'visible' }}
      >
        <Editor prompt={prompt} />

        {/* Collage Photos */}
        <CollagePhoto
          position="top-right"
          photo={photoTopRight}
          onPhotoChange={setPhotoTopRight}
        />
        <CollagePhoto
          position="bottom-left"
          photo={photoBottomLeft}
          onPhotoChange={setPhotoBottomLeft}
        />
      </motion.div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex gap-2">
          {currentDoodleStrokes.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-full overflow-hidden cursor-pointer"
              style={{ border: `2px solid ${theme.accent.warm}` }}
              onClick={() => setShowDoodle(true)}
              title="Edit doodle"
            >
              <DoodlePreview strokes={currentDoodleStrokes} size={40} />
            </motion.div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              onClick={() => setShowDoodle(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center relative"
              style={{
                background: theme.glass.bg,
                border: `1px solid ${theme.glass.border}`,
                color: hasDoodleDraft ? theme.accent.warm : theme.text.muted,
              }}
              title={hasDoodleDraft ? "Continue doodle draft" : "Add doodle"}
            >
              ✎
              {hasDoodleDraft && (
                <span
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                  style={{ background: theme.accent.warm }}
                />
              )}
            </motion.button>
          )}

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
              className="px-6 py-2 rounded-full text-sm font-medium flex items-center gap-2"
              style={{
                background: theme.accent.primary,
                color: theme.bg.primary,
                opacity: saving ? 0.5 : 1,
              }}
            >
              {isE2EEReady && !editingEntry && (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              )}
              {saving ? 'Saving...' : editingEntry ? 'Update Entry' : 'Save Entry'}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

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

      {/* Doodle Modal */}
      <AnimatePresence>
        {showDoodle && (
          <DoodleCanvas
            onSave={handleDoodleSave}
            onClose={handleDoodleClose}
            initialStrokes={currentDoodleStrokes.length > 0 ? currentDoodleStrokes : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
