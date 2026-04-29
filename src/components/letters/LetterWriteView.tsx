'use client'

import { useState, useEffect } from 'react'
import { useProfileStore } from '@/store/profile'
import { useAutosaveEntry } from '@/hooks/useAutosaveEntry'
import RecipientSidebar from './RecipientSidebar'
import LetterPaper from './LetterPaper'
import {
  LetterRecipient,
  UnlockChoice,
  DEFAULT_UNLOCK,
  resolveUnlockDate,
  mapRecipientToSchema,
} from './letterTypes'

interface Props {
  onBack: () => void
  onSealed: () => void
}

export default function LetterWriteView({ onBack, onSealed }: Props) {
  const { profile, fetchProfile } = useProfileStore()
  const autosave = useAutosaveEntry()

  const [recipient, setRecipient] = useState<LetterRecipient>('future_me')
  const [unlock, setUnlock] = useState<UnlockChoice>(DEFAULT_UNLOCK)
  const [closeName, setCloseName] = useState('')
  const [closeEmail, setCloseEmail] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [createdAt] = useState<Date>(() => new Date())

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  // Derived schema mapping
  const mapping = mapRecipientToSchema(recipient, closeName, closeEmail || null)
  const unlockDate = resolveUnlockDate(unlock, createdAt)

  // Push the current state through autosave whenever any letter field changes.
  // The hook debounces to 1500ms internally, so rapid typing fires one save.
  // Empty drafts (no text/song/photos/doodles) skip the network call.
  useEffect(() => {
    autosave.trigger({
      text: bodyHtml,
      mood: 2,
      song: null,
      photos: [],
      doodles: [],
      entryType: mapping.entryType,
      recipientEmail: mapping.recipientEmail,
      recipientName: mapping.recipientName,
      // senderName not captured in this view yet
      unlockDate: unlockDate ? unlockDate.toISOString() : null,
    })
    // autosave.trigger is stable (useCallback []), safe to omit from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bodyHtml, mapping.entryType, mapping.recipientName, mapping.recipientEmail, unlockDate])

  const canSeal =
    bodyHtml.replace(/<[^>]*>/g, '').trim().length > 0 &&
    unlockDate !== null &&
    (recipient === 'future_me' || closeName.trim().length > 0)

  const [sealing, setSealing] = useState(false)

  async function handleSeal() {
    if (!canSeal || sealing) return
    setSealing(true)
    try {
      // Make sure the latest edits are persisted before sealing — otherwise
      // the seal could land on a stale draft.
      await autosave.flush()
      const entryId = autosave.entryId
      if (!entryId) return
      const res = await fetch(`/api/entries/${entryId}/seal`, { method: 'POST' })
      if (res.ok) {
        onSealed()
      }
    } finally {
      setSealing(false)
    }
  }

  return (
    <div className="flex w-full">
      <RecipientSidebar
        recipient={recipient}
        onRecipientChange={setRecipient}
        unlock={unlock}
        onUnlockChange={setUnlock}
      />
      <div className="flex-1 px-6 py-8">
        <LetterPaper
          recipient={recipient}
          closeName={closeName}
          onCloseNameChange={setCloseName}
          closeEmail={closeEmail}
          onCloseEmailChange={setCloseEmail}
          bodyHtml={bodyHtml}
          onBodyChange={setBodyHtml}
          signatureName={profile?.nickname ?? 'me'}
          photos={[]}
          doodle={undefined}
          songUrl={null}
          onBack={onBack}
          onSeal={handleSeal}
          canSeal={canSeal && !sealing}
          createdAt={createdAt}
        />
      </div>
    </div>
  )
}
