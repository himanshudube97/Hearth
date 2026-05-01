'use client'

import { useEffect, useState } from 'react'
import EnvelopeFront from './EnvelopeFront'
import LetterInside from './LetterInside'
import { useAutosaveEntry } from '@/hooks/useAutosaveEntry'
import { useProfileStore } from '@/store/profile'
import {
  type LetterRecipient,
  type UnlockChoice,
  DEFAULT_UNLOCK,
  resolveUnlockDate,
  mapRecipientToSchema,
} from '../letterTypes'

interface Props {
  open: boolean
  onClose: () => void
  /** Called after a successful seal so the parent can refetch /sent or update UI. */
  onSealed: () => void
}

export default function ComposeModal({ open, onClose, onSealed }: Props) {
  const { profile, fetchProfile } = useProfileStore()
  const autosave = useAutosaveEntry()

  const [flipped, setFlipped] = useState(false)
  const [recipient, setRecipient] = useState<LetterRecipient>('future_me')
  const [closeName, setCloseName] = useState('')
  const [unlock, setUnlock] = useState<UnlockChoice>(DEFAULT_UNLOCK)
  const [body, setBody] = useState('')
  const [createdAt] = useState<Date>(() => new Date())
  const [sealing, setSealing] = useState(false)

  useEffect(() => { fetchProfile() }, [fetchProfile])

  const mapping = mapRecipientToSchema(recipient, closeName, null)  // email omitted in v2 modal
  const unlockDate = resolveUnlockDate(unlock, createdAt)

  // Autosave on any field change (only fires once draft has content).
  useEffect(() => {
    if (!open) return
    autosave.trigger({
      text: body,
      mood: 2,
      song: null,
      photos: [],
      doodles: [],
      entryType: mapping.entryType,
      recipientEmail: mapping.recipientEmail,
      recipientName: mapping.recipientName,
      unlockDate: unlockDate ? unlockDate.toISOString() : null,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, body, mapping.entryType, mapping.recipientName, mapping.recipientEmail, unlockDate])

  // Reset when opened so a fresh modal session starts clean.
  useEffect(() => {
    if (open) {
      setFlipped(false)
      setBody('')
      setRecipient('future_me')
      setCloseName('')
      setUnlock(DEFAULT_UNLOCK)
      autosave.reset(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const canSeal =
    body.replace(/<[^>]*>/g, '').trim().length > 0 &&
    unlockDate !== null &&
    (recipient === 'future_me' || closeName.trim().length > 0)

  async function handleSeal() {
    if (!canSeal || sealing) return
    setSealing(true)
    try {
      await autosave.flush()
      const id = autosave.entryId
      if (!id) return
      const res = await fetch(`/api/entries/${id}/seal`, { method: 'POST' })
      if (res.ok) {
        // Brief visual moment before closing
        await new Promise(r => setTimeout(r, 700))
        onSealed()
        onClose()
      }
    } finally {
      setSealing(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="compose-overlay open"
      onClick={e => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <button className="close-x" onClick={onClose} aria-label="close">×</button>

      <div className={`compose-card${flipped ? ' flipped' : ''}${sealing ? ' sealing' : ''}`}>
        <EnvelopeFront
          recipient={recipient}
          onRecipientChange={setRecipient}
          recipientName={recipient === 'future_me' ? 'future me' : closeName}
          onRecipientNameChange={setCloseName}
          unlock={unlock}
          onUnlockChange={setUnlock}
          onTurnOver={() => setFlipped(true)}
        />
        <LetterInside
          recipient={recipient}
          recipientName={recipient === 'future_me' ? 'future me' : (closeName || '…')}
          signatureName={profile?.nickname ?? 'me'}
          body={body}
          onBodyChange={setBody}
          onBack={() => setFlipped(false)}
          onSeal={handleSeal}
          canSeal={canSeal && !sealing}
          sealing={sealing}
          createdAt={createdAt}
        />
      </div>

      <style jsx>{`
        /* ── overlay ── */
        .compose-overlay {
          position: fixed;
          inset: 0;
          z-index: 300;
          display: none;
          align-items: center;
          justify-content: center;
          background: radial-gradient(
            ellipse at center,
            rgba(40, 25, 14, 0.50) 0%,
            rgba(10, 6, 3, 0.88) 90%
          );
          backdrop-filter: blur(12px) saturate(130%);
          -webkit-backdrop-filter: blur(12px) saturate(130%);
          perspective: 1400px;
        }
        .compose-overlay.open {
          display: flex;
        }

        /* ── close button ── */
        .close-x {
          position: fixed;
          top: 18px;
          right: 22px;
          z-index: 310;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1px solid rgba(255, 240, 210, 0.30);
          background: rgba(0, 0, 0, 0.38);
          color: rgba(255, 240, 210, 0.85);
          font-size: 20px;
          line-height: 1;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s, color 0.2s;
        }
        .close-x:hover {
          background: rgba(0, 0, 0, 0.55);
          color: #fff;
        }

        /* ── 3-D flip card ── */
        .compose-card {
          position: relative;
          width: min(520px, 92vw);
          height: min(680px, 88vh);
          transform-style: preserve-3d;
          transition: transform 0.85s cubic-bezier(0.45, 0.05, 0.15, 1),
                      opacity  0.5s ease;
        }
        .compose-card.flipped {
          transform: rotateY(180deg);
        }
        .compose-card.sealing {
          transform: scale(0.92) rotateX(30deg);
          opacity: 0.6;
        }

        /* ── shared face styles ── */
        :global(.face) {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border-radius: 6px;
          padding: 36px 40px 32px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* ── FRONT: envelope face ── */
        :global(.face.front) {
          background:
            repeating-linear-gradient(
              transparent, transparent 27px,
              rgba(120, 90, 50, 0.12) 27px, rgba(120, 90, 50, 0.12) 28px
            ),
            linear-gradient(160deg, var(--paper-1, #fff6f2) 0%, var(--paper-2, #fbe6dd) 100%);
          box-shadow:
            0 24px 60px rgba(0, 0, 0, 0.55),
            0 4px 10px rgba(0, 0, 0, 0.30),
            inset 0 1px 0 rgba(255, 255, 255, 0.55);
          border: 1px solid rgba(80, 55, 40, 0.18);
        }

        /* envelope-flap decoration on the front */
        :global(.face.front::before) {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 44%;
          background: linear-gradient(
            180deg,
            color-mix(in oklab, var(--paper-2, #fbe6dd) 70%, transparent) 0%,
            transparent 100%
          );
          clip-path: polygon(0 0, 50% 100%, 100% 0);
          pointer-events: none;
          opacity: 0.55;
        }

        /* ── BACK: lined letter paper ── */
        :global(.face.back) {
          background:
            repeating-linear-gradient(
              transparent, transparent 27px,
              rgba(120, 90, 50, 0.15) 27px, rgba(120, 90, 50, 0.15) 28px
            ),
            linear-gradient(160deg, var(--paper-1, #fff6f2) 0%, var(--paper-2, #fbe6dd) 100%);
          box-shadow:
            0 24px 60px rgba(0, 0, 0, 0.55),
            0 4px 10px rgba(0, 0, 0, 0.30),
            inset 0 1px 0 rgba(255, 255, 255, 0.55);
          border: 1px solid rgba(80, 55, 40, 0.18);
          transform: rotateY(180deg);
        }

        /* ── stamp (top-right of front face) ── */
        :global(.face.front .stamp-large) {
          position: absolute;
          top: 24px;
          right: 32px;
          width: 72px;
          height: 88px;
          border: 2px dashed var(--accent-primary, #9a4555);
          border-radius: 3px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 10px;
          letter-spacing: 1.8px;
          text-transform: lowercase;
          color: var(--accent-primary, #9a4555);
          line-height: 1.4;
          padding: 6px;
        }
        :global(.face.front .stamp-large strong) {
          display: block;
          font-size: 20px;
          font-weight: 400;
          margin-bottom: 3px;
        }

        /* ── label (section heading) ── */
        :global(.face.front .label) {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-style: italic;
          font-size: 12px;
          letter-spacing: 2px;
          text-transform: lowercase;
          color: var(--text-muted, #9a7078);
          margin-bottom: 10px;
        }

        /* ── "Dear ___," line ── */
        :global(.face.front .to-line) {
          font-family: 'Caveat', cursive;
          font-size: 26px;
          color: var(--text-primary, #3a2025);
          margin: 14px 0 0;
          line-height: 1.3;
        }
        :global(.face.front .to-line input) {
          background: transparent;
          border: none;
          border-bottom: 1.5px dotted var(--text-muted, #9a7078);
          outline: none;
          font-family: 'Caveat', cursive;
          font-size: 26px;
          color: var(--text-primary, #3a2025);
          width: 160px;
          padding-bottom: 1px;
        }

        /* ── unlock pills ── */
        :global(.face.front .options) {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
        }
        :global(.pill) {
          padding: 6px 14px 7px;
          border-radius: 999px;
          border: 1.5px solid var(--accent-primary, #9a4555);
          background: transparent;
          color: var(--accent-primary, #9a4555);
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 13px;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }
        :global(.pill:hover) {
          background: color-mix(in oklab, var(--accent-primary, #9a4555) 10%, transparent);
        }
        :global(.pill.active) {
          background: var(--accent-primary, #9a4555);
          color: #fff;
        }

        /* ── footer row ── */
        :global(.face.front .footer) {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: auto;
          padding-top: 20px;
        }
        :global(.face.front .hint) {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-style: italic;
          font-size: 12px;
          letter-spacing: 1px;
          color: var(--text-muted, #9a7078);
        }

        /* ── shared button styles ── */
        :global(.btn-ghost) {
          padding: 8px 18px 9px;
          border-radius: 999px;
          border: 1.5px solid var(--accent-primary, #9a4555);
          background: transparent;
          color: var(--accent-primary, #9a4555);
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 14px;
          letter-spacing: 0.4px;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }
        :global(.btn-ghost:hover) {
          background: color-mix(in oklab, var(--accent-primary, #9a4555) 10%, transparent);
        }
        :global(.btn-primary) {
          padding: 8px 22px 10px;
          border-radius: 999px;
          border: none;
          background: var(--accent-primary, #9a4555);
          color: #fff;
          font-family: 'Caveat', cursive;
          font-size: 18px;
          letter-spacing: 0.4px;
          cursor: pointer;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.22);
          transition: filter 0.2s, transform 0.2s;
        }
        :global(.btn-primary:hover:not(:disabled)) {
          filter: brightness(1.07);
          transform: translateY(-1px);
        }
        :global(.btn-primary:disabled) {
          opacity: 0.45;
          cursor: not-allowed;
        }

        /* ── BACK face layout ── */
        :global(.face.back .topline) {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-style: italic;
          font-size: 12px;
          letter-spacing: 1.5px;
          color: var(--text-muted, #9a7078);
          margin-bottom: 16px;
        }
        :global(.face.back .salutation) {
          font-family: 'Caveat', cursive;
          font-size: 26px;
          color: var(--text-primary, #3a2025);
          margin-bottom: 12px;
          line-height: 1.3;
        }
        :global(.face.back .body) {
          flex: 1;
          font-family: 'Caveat', cursive;
          font-size: 20px;
          line-height: 28px;
          color: var(--text-primary, #3a2025);
          overflow-y: auto;
          outline: none;
        }
        :global(.face.back .body.is-editor-empty:first-child::before) {
          content: attr(data-placeholder);
          float: left;
          color: var(--text-muted, #9a7078);
          pointer-events: none;
          height: 0;
        }
        :global(.face.back .signature) {
          font-family: 'Caveat', cursive;
          font-size: 20px;
          color: var(--text-primary, #3a2025);
          margin-top: 20px;
          padding-top: 12px;
        }
        :global(.face.back .actions) {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: auto;
          padding-top: 18px;
        }

        /* ── recipient toggle ── */
        :global(.recipient-toggle) {
          display: flex;
          gap: 4px;
          background: rgba(0, 0, 0, 0.07);
          padding: 4px;
          border-radius: 999px;
          width: fit-content;
          margin-bottom: 4px;
        }
        :global(.recipient-toggle button) {
          padding: 5px 16px 6px;
          border-radius: 999px;
          border: none;
          background: transparent;
          color: var(--text-secondary, #6a4048);
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 13px;
          letter-spacing: 0.4px;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }
        :global(.recipient-toggle button.active) {
          background: var(--accent-primary, #9a4555);
          color: #fff;
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.18);
        }
      `}</style>
    </div>
  )
}
