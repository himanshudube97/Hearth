import { useCallback } from 'react'
import { useE2EEStore } from '@/store/e2ee'
import { encryptEntry, decryptEntry } from '@/lib/e2ee/crypto'
import type { JournalEntry } from '@/store/journal'

interface CreateEntryData {
  text: string
  mood?: number
  song?: string | null
  tags?: string[]
  doodles?: Array<{ strokes: unknown; positionInEntry?: number }>
  entryType?: string
  unlockDate?: string
  isSealed?: boolean
  recipientEmail?: string | null
  recipientName?: string | null
  senderName?: string | null
  letterLocation?: string | null
  canvasData?: string
}

/**
 * Hook for E2EE operations on entries
 */
export function useE2EE() {
  const { isEnabled, isUnlocked, masterKey } = useE2EEStore()

  /**
   * Check if E2EE is ready for encryption/decryption
   */
  const isE2EEReady = isEnabled && isUnlocked && masterKey !== null

  /**
   * Encrypt entry data before sending to server
   */
  const encryptEntryData = useCallback(
    async (data: CreateEntryData): Promise<CreateEntryData & { encryptionType: string; e2eeIV?: string }> => {
      if (!isE2EEReady || !masterKey) {
        // Return data without E2EE if not ready
        return { ...data, encryptionType: 'server' }
      }

      try {
        // Encrypt the text
        const { ciphertext, iv } = await encryptEntry(data.text, masterKey)

        // Return encrypted data
        return {
          ...data,
          text: ciphertext,
          encryptionType: 'e2ee',
          e2eeIV: iv,
        }
      } catch (error) {
        console.error('E2EE encryption failed:', error)
        // Fall back to server encryption
        return { ...data, encryptionType: 'server' }
      }
    },
    [isE2EEReady, masterKey]
  )

  /**
   * Decrypt a single entry from server
   */
  const decryptEntryFromServer = useCallback(
    async (entry: JournalEntry): Promise<JournalEntry> => {
      // If not E2EE encrypted, return as-is
      if (entry.encryptionType !== 'e2ee' || !entry.e2eeIV) {
        return entry
      }

      // If E2EE not ready, return encrypted entry with placeholder
      if (!isE2EEReady || !masterKey) {
        return {
          ...entry,
          text: '<p><em>[Encrypted - Unlock to view]</em></p>',
          textPreview: '[Encrypted]',
        }
      }

      try {
        // Decrypt the text
        const decryptedText = await decryptEntry(entry.text, entry.e2eeIV, masterKey)

        return {
          ...entry,
          text: decryptedText,
          textPreview: createPreview(decryptedText),
        }
      } catch (error) {
        console.error('E2EE decryption failed for entry:', entry.id, error)
        return {
          ...entry,
          text: '<p><em>[Decryption failed]</em></p>',
          textPreview: '[Decryption failed]',
        }
      }
    },
    [isE2EEReady, masterKey]
  )

  /**
   * Decrypt multiple entries from server
   */
  const decryptEntriesFromServer = useCallback(
    async (entries: JournalEntry[]): Promise<JournalEntry[]> => {
      return Promise.all(entries.map(decryptEntryFromServer))
    },
    [decryptEntryFromServer]
  )

  return {
    isE2EEEnabled: isEnabled,
    isE2EEReady,
    encryptEntryData,
    decryptEntryFromServer,
    decryptEntriesFromServer,
  }
}

// Helper to create text preview
function createPreview(html: string, maxLength = 150): string {
  const text = html.replace(/<[^>]*>/g, '').trim()
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}
