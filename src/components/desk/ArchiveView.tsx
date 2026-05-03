'use client'

import React, { memo, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import { useE2EE } from '@/hooks/useE2EE'
import type { JournalEntry } from '@/store/journal'

interface ArchivedEntry {
  id: string
  text: string
  textPreview?: string
  createdAt: string
  isArchived: boolean
}

interface ArchiveViewProps {
  isOpen: boolean
  onClose: () => void
  onRestore?: () => void
}

const ArchiveView = memo(function ArchiveView({
  isOpen,
  onClose,
  onRestore,
}: ArchiveViewProps) {
  const { theme } = useThemeStore()
  const [entries, setEntries] = useState<ArchivedEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const { decryptEntriesFromServer, isE2EEReady } = useE2EE()

  const fetchArchivedEntries = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/entries?includeArchived=true&limit=100')
      if (res.ok) {
        const data = await res.json()
        const raw = (data.entries || []) as ArchivedEntry[]
        // Decrypt E2EE entries client-side; non-e2ee passes through unchanged.
        const decrypted = (await decryptEntriesFromServer(
          raw as unknown as JournalEntry[]
        )) as unknown as ArchivedEntry[]
        const archived = decrypted.filter((e) => e.isArchived)
        setEntries(archived)
      }
    } catch (error) {
      console.error('Failed to fetch archived entries:', error)
    } finally {
      setLoading(false)
    }
  }, [decryptEntriesFromServer])

  useEffect(() => {
    if (isOpen) {
      fetchArchivedEntries()
    }
  }, [isOpen, isE2EEReady, fetchArchivedEntries])

  const handleRestore = useCallback(async (entryId: string) => {
    setActionInProgress(entryId)
    try {
      const res = await fetch(`/api/entries/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: false }),
      })

      if (res.ok) {
        setEntries(prev => prev.filter(e => e.id !== entryId))
        onRestore?.()
      } else {
        const data = await res.json()
        alert(`Failed to restore: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to restore entry:', error)
      alert('Failed to restore entry')
    } finally {
      setActionInProgress(null)
    }
  }, [onRestore])

  const handlePermanentDelete = useCallback(async (entryId: string) => {
    setActionInProgress(entryId)
    try {
      const res = await fetch(`/api/entries/${entryId}?force=true`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setEntries(prev => prev.filter(e => e.id !== entryId))
        setConfirmDelete(null)
      } else {
        const data = await res.json()
        alert(`Failed to delete: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to delete entry:', error)
      alert('Failed to delete entry')
    } finally {
      setActionInProgress(null)
    }
  }, [])

  const getPreviewText = (entry: ArchivedEntry) => {
    if (entry.textPreview && entry.textPreview !== '[Encrypted]') {
      return entry.textPreview
    }
    // Strip HTML from text
    const text = entry.text
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim()
    return text.length > 100 ? text.slice(0, 100) + '...' : text
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.7)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-2xl max-h-[80vh] rounded-xl overflow-hidden flex flex-col"
          style={{
            background: theme.glass.bg,
            backdropFilter: `blur(${theme.glass.blur})`,
            border: `1px solid ${theme.glass.border}`,
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between p-4 border-b flex-shrink-0"
            style={{ borderColor: theme.glass.border }}
          >
            <h2 className="text-lg font-medium" style={{ color: theme.text.primary }}>
              Archived Entries
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
              style={{ color: theme.text.muted }}
            >
              X
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-8 h-8 border-2 rounded-full"
                  style={{
                    borderColor: theme.text.muted,
                    borderTopColor: 'transparent',
                  }}
                />
              </div>
            ) : entries.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-12 text-center"
                style={{ color: theme.text.muted }}
              >
                <div className="text-4xl mb-4 opacity-50">:)</div>
                <p>No archived entries</p>
                <p className="text-sm mt-1 opacity-70">
                  Deleted entries will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {entries.map(entry => (
                  <motion.div
                    key={entry.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="rounded-lg p-4"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${theme.glass.border}`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Date */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs" style={{ color: theme.text.muted }}>
                            {new Date(entry.createdAt).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>

                        {/* Preview text */}
                        <p
                          className="text-sm line-clamp-2"
                          style={{ color: theme.text.secondary }}
                        >
                          {getPreviewText(entry)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {confirmDelete === entry.id ? (
                          <>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="px-3 py-1.5 rounded text-xs"
                              style={{
                                background: 'rgba(255,255,255,0.1)',
                                color: theme.text.secondary,
                              }}
                              disabled={actionInProgress === entry.id}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handlePermanentDelete(entry.id)}
                              className="px-3 py-1.5 rounded text-xs"
                              style={{
                                background: 'rgba(220,38,38,0.2)',
                                color: '#ef4444',
                              }}
                              disabled={actionInProgress === entry.id}
                            >
                              {actionInProgress === entry.id ? '...' : 'Delete Forever'}
                            </button>
                          </>
                        ) : (
                          <>
                            <motion.button
                              onClick={() => handleRestore(entry.id)}
                              className="px-3 py-1.5 rounded text-xs"
                              style={{
                                background: 'rgba(34,197,94,0.2)',
                                color: '#22c55e',
                              }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              disabled={actionInProgress === entry.id}
                            >
                              {actionInProgress === entry.id ? '...' : 'Restore'}
                            </motion.button>
                            <motion.button
                              onClick={() => setConfirmDelete(entry.id)}
                              className="px-3 py-1.5 rounded text-xs"
                              style={{
                                background: 'rgba(220,38,38,0.1)',
                                color: '#ef4444',
                              }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              disabled={actionInProgress === entry.id}
                            >
                              Delete
                            </motion.button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className="p-4 border-t flex-shrink-0"
            style={{ borderColor: theme.glass.border }}
          >
            <p className="text-xs text-center" style={{ color: theme.text.muted }}>
              Archived entries are hidden from your journal. Restore to bring them back, or delete forever to remove permanently.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
})

export default ArchiveView
