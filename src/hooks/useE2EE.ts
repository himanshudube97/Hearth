import { useCallback } from 'react'
import { useE2EEStore } from '@/store/e2ee'
import { encryptDraft, decryptEntry, type EncryptableDraft } from '@/lib/e2ee/draft-encryptor'
import type { JournalEntry } from '@/store/journal'

export function useE2EE() {
  const { isEnabled, isUnlocked, masterKey } = useE2EEStore()
  const isE2EEReady = isEnabled && isUnlocked && masterKey !== null

  const encryptEntryData = useCallback(
    async (draft: EncryptableDraft): Promise<Record<string, unknown>> => {
      if (!isE2EEReady || !masterKey) {
        return { ...draft, encryptionType: 'server' }
      }
      try {
        const encrypted = await encryptDraft(draft, masterKey)
        return encrypted as unknown as Record<string, unknown>
      } catch (error) {
        console.error('E2EE encryption failed:', error)
        return { ...draft, encryptionType: 'server' }
      }
    },
    [isE2EEReady, masterKey]
  )

  const decryptEntryFromServer = useCallback(
    async (entry: JournalEntry): Promise<JournalEntry> => {
      if (entry.encryptionType !== 'e2ee') return entry
      if (!isE2EEReady || !masterKey) {
        return {
          ...entry,
          text: '<p><em>[Encrypted — unlock to view]</em></p>',
          textPreview: '[Encrypted]',
        }
      }
      try {
        const decrypted = await decryptEntry(entry as unknown as Parameters<typeof decryptEntry>[0], masterKey)
        return { ...entry, ...decrypted } as JournalEntry
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
