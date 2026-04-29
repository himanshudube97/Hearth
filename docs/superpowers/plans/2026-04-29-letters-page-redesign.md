# Letters Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the postcard-metaphor letters page with a lined-paper letter-writing flow plus a scrapbook-style sealed-letters list, per `docs/superpowers/specs/2026-04-29-letters-page-redesign-design.md`.

**Architecture:** Two surfaces under the existing `/letters` route. Surface 1 is the new default — a scrapbook-style grid of sealed letters with a "Write a letter" CTA. Surface 2 is the redesigned write view — a two-column layout (recipient sidebar + lined-paper letter) that reuses existing `useAutosaveEntry`, TipTap editor, `SongEmbed`, and `DoodlePreview`. No schema or API changes.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4, Framer Motion v12, TipTap v3, Zustand. Existing `useAutosaveEntry` hook handles draft persistence and seal flip.

**Verification model:** No unit-test runner is configured. Each task verifies with `npm run lint`, `npm run build`, and a documented manual browser check (run via `docker compose up -d` and visit `http://localhost:3111/letters`).

---

## File Structure

**New files (`src/components/letters/`):**
- `SealedLetterTile.tsx` — single sealed letter tile (closed/sealed visual, hover tooltip)
- `SealedLetterList.tsx` — grid of tiles, empty state, "Write a letter" CTA
- `RecipientSidebar.tsx` — left column of write view: DEAR… tiles, date chips, someday picker, helper text
- `LetterPaper.tsx` — right column: lined paper, salutation, editor, signature, fold & seal row
- `TuckedIn.tsx` — strip below signature for photos / doodle / song
- `LetterWriteView.tsx` — assembles sidebar + paper into the two-column layout, owns the write-view state
- `letterTypes.ts` — shared types (`LetterRecipient`, `UnlockChoice`) + date helpers

**Modified files:**
- `src/app/letters/page.tsx` — top-level routing between list and write surfaces; mounts new components; retires inline `Postcard*` usage

**Retired (kept in repo until last task confirms no other consumers):**
- `src/components/postcard/Postcard.tsx`
- `src/components/postcard/PostcardFront.tsx`
- `src/components/postcard/PostcardBack.tsx`
- `src/components/FloatingEnvelope.tsx` (if only used in `/letters`)

**Untouched:**
- `src/hooks/useAutosaveEntry.ts`
- `src/components/SongEmbed.tsx`, `DoodlePreview.tsx`
- `src/components/LetterReveal.tsx`, `LetterArrivedBanner.tsx` (downstream unlock/read flow)
- All `src/app/api/letters/**` routes

---

## Task 1: Shared types and date helpers

**Files:**
- Create: `src/components/letters/letterTypes.ts`

- [ ] **Step 1: Create `letterTypes.ts` with the shared model**

```ts
// src/components/letters/letterTypes.ts
import { addMonths, addYears } from 'date-fns'

export type LetterRecipient = 'future_me' | 'someone_close'

export type UnlockChoice =
  | { kind: '1_month' }
  | { kind: '6_months' }
  | { kind: '1_year' }
  | { kind: 'someday'; date: Date | null } // null = picker not yet chosen

export const DEFAULT_UNLOCK: UnlockChoice = { kind: '1_year' }

/**
 * Resolve an UnlockChoice into a concrete unlock Date relative to `from`.
 * Returns null only when kind=someday and date is not yet picked
 * (UI must block seal in that case).
 */
export function resolveUnlockDate(choice: UnlockChoice, from: Date = new Date()): Date | null {
  switch (choice.kind) {
    case '1_month':  return addMonths(from, 1)
    case '6_months': return addMonths(from, 6)
    case '1_year':   return addYears(from, 1)
    case 'someday':  return choice.date
  }
}

/**
 * Map the new UI recipient onto the existing schema fields.
 * - future_me  -> entryType=letter, recipient=self, no email, recipientName="future me"
 * - someone_close (no email) -> entryType=unsent_letter, no recipient/email, recipientName=user-typed
 * - someone_close (with email) -> entryType=letter, recipient=friend, recipientEmail set
 */
export interface RecipientSchemaMapping {
  entryType: 'letter' | 'unsent_letter'
  recipient: 'self' | 'friend' | null   // null for unsent
  recipientName: string                  // "future me" or user-typed name
  recipientEmail: string | null
}

export function mapRecipientToSchema(
  recipient: LetterRecipient,
  closeName: string,
  closeEmail: string | null,
): RecipientSchemaMapping {
  if (recipient === 'future_me') {
    return {
      entryType: 'letter',
      recipient: 'self',
      recipientName: 'future me',
      recipientEmail: null,
    }
  }
  // someone_close
  if (closeEmail && closeEmail.trim().length > 0) {
    return {
      entryType: 'letter',
      recipient: 'friend',
      recipientName: closeName.trim() || 'someone close',
      recipientEmail: closeEmail.trim(),
    }
  }
  return {
    entryType: 'unsent_letter',
    recipient: null,
    recipientName: closeName.trim() || 'someone close',
    recipientEmail: null,
  }
}
```

- [ ] **Step 2: Lint**

Run: `docker compose exec app npm run lint`
Expected: no new lint errors.

- [ ] **Step 3: Build**

Run: `docker compose exec app npm run build`
Expected: build succeeds (no type errors).

- [ ] **Step 4: Commit**

```bash
git add src/components/letters/letterTypes.ts
git commit -m "feat(letters): add shared types and unlock-date helpers"
```

---

## Task 2: SealedLetterTile component

**Files:**
- Create: `src/components/letters/SealedLetterTile.tsx`

- [ ] **Step 1: Create the tile component**

The tile shows recipient name, sealed date, and unlock date. It is **not** clickable to open contents — sealed means sealed. Hover may show a tooltip with the same metadata; nothing more. Visual treatment: folded-letter card with a subtle wax-seal dot.

```tsx
// src/components/letters/SealedLetterTile.tsx
'use client'

import { motion } from 'framer-motion'
import { format } from 'date-fns'

interface SealedLetterTileProps {
  recipientName: string             // e.g. "future me", "Mom"
  sealedAt: Date
  unlockDate: Date | null           // null = "someday" with no date picked (rare)
}

export default function SealedLetterTile({ recipientName, sealedAt, unlockDate }: SealedLetterTileProps) {
  const opensLabel = unlockDate ? `opens ${format(unlockDate, 'MMM d, yyyy')}` : 'opens someday'
  const sealedLabel = `sealed ${format(sealedAt, 'MMM d, yyyy')}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="
        relative aspect-[5/3] w-full rounded-md
        bg-[var(--color-paper, #f4ead0)]
        shadow-[0_2px_8px_rgba(70,50,30,0.15)]
        border border-[rgba(80,60,40,0.18)]
        cursor-default select-none
      "
      title={`${sealedLabel} · ${opensLabel}`}
    >
      {/* fold line — purely decorative */}
      <div className="absolute inset-x-0 top-1/2 h-px bg-[rgba(80,60,40,0.12)]" />

      {/* wax seal dot */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-[var(--color-accent, #c8742c)] shadow-[0_1px_2px_rgba(0,0,0,0.2)]" />

      <div className="absolute inset-0 flex flex-col justify-between p-4 font-[var(--font-caveat),Caveat,cursive]">
        <div className="text-xs uppercase tracking-wider opacity-60">a sealed letter</div>
        <div className="text-2xl leading-tight">to {recipientName}</div>
        <div className="text-xs opacity-70 flex justify-between">
          <span>{sealedLabel}</span>
          <span>{opensLabel}</span>
        </div>
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 2: Lint and build**

Run: `docker compose exec app npm run lint && docker compose exec app npm run build`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/letters/SealedLetterTile.tsx
git commit -m "feat(letters): add sealed letter tile component"
```

---

## Task 3: SealedLetterList component

**Files:**
- Create: `src/components/letters/SealedLetterList.tsx`

The list fetches sealed letters from the existing `/api/letters/mine` endpoint, renders them via `SealedLetterTile`, and shows a primary `✎ Write a letter` CTA at the top. Empty state shows the same CTA with a calm message.

- [ ] **Step 1: Inspect the existing `mine` endpoint shape**

Run: `grep -n "isSealed\|sealedAt\|recipientName\|unlockDate\|createdAt" src/app/api/letters/mine/route.ts`
Use the response shape to type the fetch. (If the route does not yet return `recipientName` or a sealed-only filter, do not modify the route — instead filter client-side by `isSealed=true` and use `recipientName` directly if available, else fall back to `recipientEmail` or "someone close".)

- [ ] **Step 2: Create the list component**

```tsx
// src/components/letters/SealedLetterList.tsx
'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import SealedLetterTile from './SealedLetterTile'

interface MyLetter {
  id: string
  createdAt: string
  unlockDate: string | null
  isSealed: boolean
  recipientName: string | null
  recipientEmail: string | null
}

interface Props {
  onWriteClick: () => void
}

export default function SealedLetterList({ onWriteClick }: Props) {
  const [letters, setLetters] = useState<MyLetter[] | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/letters/mine')
      .then(r => r.json())
      .then((data: MyLetter[]) => {
        if (!cancelled) setLetters(data.filter(l => l.isSealed))
      })
      .catch(() => { if (!cancelled) setLetters([]) })
    return () => { cancelled = true }
  }, [])

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="font-[var(--font-caveat),Caveat,cursive] text-3xl">my letters</h1>
        <button
          onClick={onWriteClick}
          className="rounded-full bg-[var(--color-accent,#c8742c)] px-5 py-2 text-sm text-white shadow-md hover:brightness-105"
        >
          ✎ Write a letter
        </button>
      </header>

      {letters === null ? (
        <p className="text-sm opacity-60">loading…</p>
      ) : letters.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-16 text-center"
        >
          <p className="font-[var(--font-caveat),Caveat,cursive] text-2xl opacity-80">
            no sealed letters yet.
          </p>
          <p className="mt-2 text-sm opacity-60">
            write one to your future self, or to someone close.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {letters.map(l => (
            <SealedLetterTile
              key={l.id}
              recipientName={l.recipientName ?? 'someone close'}
              sealedAt={new Date(l.createdAt)}
              unlockDate={l.unlockDate ? new Date(l.unlockDate) : null}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Lint and build**

Run: `docker compose exec app npm run lint && docker compose exec app npm run build`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/components/letters/SealedLetterList.tsx
git commit -m "feat(letters): add sealed-letters list with empty state and write CTA"
```

---

## Task 4: Switch `/letters` to land on the sealed list (write view stub)

**Files:**
- Modify: `src/app/letters/page.tsx`

The existing page is 1008 lines and mounts `Postcard*` directly. We will not delete it yet — we will gate the existing surface behind a stub state so we can iterate on the new write view incrementally. The new default is the sealed list.

- [ ] **Step 1: Replace the page export with a thin router**

Read the current top of `src/app/letters/page.tsx` to confirm the existing export name and any wrapping providers, then replace the body so the default surface is `SealedLetterList`. Keep all existing `Postcard*` imports and helper functions intact for now — they will still mount inside the temporary write surface.

```tsx
// src/app/letters/page.tsx — top-level structure
'use client'

import { useState } from 'react'
import SealedLetterList from '@/components/letters/SealedLetterList'
// ...existing imports retained...

type Surface = 'list' | 'write'

export default function LettersPage() {
  const [surface, setSurface] = useState<Surface>('list')
  // ...existing hooks and state retained, used only when surface === 'write'

  if (surface === 'list') {
    return <SealedLetterList onWriteClick={() => setSurface('write')} />
  }

  // Temporary: render the existing postcard write UI, with a back button.
  return (
    <div>
      <button onClick={() => setSurface('list')} className="m-4 text-sm underline">
        ← back to letters
      </button>
      {/* existing Postcard write JSX, untouched */}
    </div>
  )
}
```

The exact mechanical edit: keep every existing line that today rendered the `'write'` branch of `viewMode`, wrap it inside the `surface === 'write'` block, and prepend the `← back to letters` button. Drop the existing `'archive'` branch entirely (the new `SealedLetterList` replaces it).

- [ ] **Step 2: Lint and build**

Run: `docker compose exec app npm run lint && docker compose exec app npm run build`
Expected: clean.

- [ ] **Step 3: Manual smoke test**

```bash
docker compose up -d && docker compose logs -f app
```

Visit `http://localhost:3111/letters`:
- Page lands on the sealed list (or empty state if no letters).
- "✎ Write a letter" button reveals the existing postcard UI.
- "← back to letters" returns to the list.

- [ ] **Step 4: Commit**

```bash
git add src/app/letters/page.tsx
git commit -m "feat(letters): land on sealed list by default; gate old write UI behind toggle"
```

---

## Task 5: RecipientSidebar component

**Files:**
- Create: `src/components/letters/RecipientSidebar.tsx`

Left column of the new write view. Two recipient tiles, the helper card, and the four date chips.

- [ ] **Step 1: Create the component**

```tsx
// src/components/letters/RecipientSidebar.tsx
'use client'

import { useState } from 'react'
import { LetterRecipient, UnlockChoice } from './letterTypes'

interface Props {
  recipient: LetterRecipient
  onRecipientChange: (r: LetterRecipient) => void
  unlock: UnlockChoice
  onUnlockChange: (u: UnlockChoice) => void
}

const TILES: Array<{
  key: LetterRecipient
  title: string
  subtitle: string
  glyph: string  // simple emoji/icon for now
}> = [
  { key: 'future_me',     title: 'future me',     subtitle: 'a year from now', glyph: '✦' },
  { key: 'someone_close', title: 'someone close', subtitle: 'you name them',   glyph: '✿' },
]

export default function RecipientSidebar({ recipient, onRecipientChange, unlock, onUnlockChange }: Props) {
  const [showPicker, setShowPicker] = useState(unlock.kind === 'someday')

  return (
    <aside className="w-72 shrink-0 px-6 py-8">
      <div className="mb-3 text-xs uppercase tracking-[0.2em] opacity-60">dear …</div>
      <div className="flex flex-col gap-3">
        {TILES.map(t => {
          const selected = recipient === t.key
          return (
            <button
              key={t.key}
              onClick={() => onRecipientChange(t.key)}
              className={`
                flex items-center gap-3 rounded-lg border p-3 text-left transition
                ${selected
                  ? 'border-[var(--color-accent,#c8742c)] bg-[rgba(200,116,44,0.12)]'
                  : 'border-[rgba(80,60,40,0.18)] hover:bg-[rgba(80,60,40,0.05)]'}
              `}
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[rgba(80,60,40,0.08)] text-base">
                {t.glyph}
              </span>
              <span className="font-[var(--font-caveat),Caveat,cursive]">
                <span className="block text-lg leading-none">{t.title}</span>
                <span className="block text-xs opacity-70">{t.subtitle}</span>
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-6 rounded-lg border border-dashed border-[rgba(80,60,40,0.25)] p-3 text-xs leading-relaxed italic opacity-75">
        Letters can be opened on a date, or left to be found by chance.
        <div className="mt-1">↳ choose when below</div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {(['1_month','6_months','1_year','someday'] as const).map(k => {
          const label = k === '1_month' ? '1 month' : k === '6_months' ? '6 months' : k === '1_year' ? '1 year' : 'someday'
          const selected = unlock.kind === k
          return (
            <button
              key={k}
              onClick={() => {
                if (k === 'someday') {
                  setShowPicker(true)
                  onUnlockChange({ kind: 'someday', date: unlock.kind === 'someday' ? unlock.date : null })
                } else {
                  setShowPicker(false)
                  onUnlockChange({ kind: k })
                }
              }}
              className={`
                rounded-md border px-3 py-1.5 text-xs transition
                ${selected
                  ? 'border-[var(--color-accent,#c8742c)] bg-[rgba(200,116,44,0.12)]'
                  : 'border-[rgba(80,60,40,0.2)] hover:bg-[rgba(80,60,40,0.05)]'}
              `}
            >
              {label}
            </button>
          )
        })}
      </div>

      {showPicker && unlock.kind === 'someday' && (
        <div className="mt-3">
          <label className="block text-xs opacity-70 mb-1">pick a date</label>
          <input
            type="date"
            min={new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10)}
            value={unlock.date ? unlock.date.toISOString().slice(0, 10) : ''}
            onChange={e => onUnlockChange({ kind: 'someday', date: e.target.value ? new Date(e.target.value) : null })}
            className="rounded-md border border-[rgba(80,60,40,0.25)] bg-transparent px-2 py-1 text-sm"
          />
        </div>
      )}
    </aside>
  )
}
```

The minimum-1-week constraint matches the existing letter delivery rule (per `CLAUDE.md`).

- [ ] **Step 2: Lint and build**

Run: `docker compose exec app npm run lint && docker compose exec app npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/components/letters/RecipientSidebar.tsx
git commit -m "feat(letters): add recipient sidebar with date chips and someday picker"
```

---

## Task 6: TuckedIn component

**Files:**
- Create: `src/components/letters/TuckedIn.tsx`

Renders photos / doodle / song as small "tucked in" pieces. Photos appear as polaroids with slight tilt; doodle as a folded sketch; song as a chip. Inputs are passed in — this is presentational.

- [ ] **Step 1: Create the component**

```tsx
// src/components/letters/TuckedIn.tsx
'use client'

import Image from 'next/image'
import SongEmbed from '@/components/SongEmbed'
import DoodlePreview from '@/components/DoodlePreview'
import { StrokeData } from '@/store/journal'

interface Props {
  photos?: string[]      // image URLs
  doodle?: StrokeData[]  // existing stroke shape
  songUrl?: string | null
}

export default function TuckedIn({ photos = [], doodle, songUrl }: Props) {
  const hasAnything = photos.length > 0 || (doodle && doodle.length > 0) || !!songUrl
  if (!hasAnything) return null

  return (
    <div className="mt-6 border-t border-dashed border-[rgba(80,60,40,0.2)] pt-4">
      <div className="mb-3 text-center text-xs uppercase tracking-[0.2em] opacity-50">— tucked in —</div>
      <div className="flex flex-wrap items-end justify-center gap-4">
        {photos.slice(0, 3).map((src, i) => (
          <div
            key={i}
            className="relative bg-white p-2 pb-6 shadow-md"
            style={{
              transform: `rotate(${i % 2 === 0 ? -2 : 2}deg)`,
              width: 140,
              height: 160,
            }}
          >
            {/* washi tape strip */}
            <div className="absolute -top-2 left-1/2 h-4 w-12 -translate-x-1/2 rotate-3 bg-[rgba(200,180,120,0.65)]" />
            <div className="relative h-full w-full overflow-hidden bg-gray-200">
              <Image src={src} alt="tucked-in photo" fill className="object-cover" sizes="140px" />
            </div>
          </div>
        ))}

        {doodle && doodle.length > 0 && (
          <div
            className="bg-[var(--color-paper,#f4ead0)] p-3 shadow-sm border border-[rgba(80,60,40,0.15)]"
            style={{ transform: 'rotate(-1.5deg)', width: 140, height: 140 }}
          >
            <DoodlePreview strokes={doodle} />
          </div>
        )}

        {songUrl && (
          <div
            className="rounded-md bg-[rgba(80,60,40,0.06)] px-3 py-2 shadow-sm"
            style={{ transform: 'rotate(1deg)' }}
          >
            <SongEmbed url={songUrl} />
          </div>
        )}
      </div>
    </div>
  )
}
```

(If `DoodlePreview` does not accept a `strokes` prop with this shape, inspect its current signature and adapt the call. The component already exists; the goal is to mount it in this strip, not redesign it.)

- [ ] **Step 2: Lint and build**

Run: `docker compose exec app npm run lint && docker compose exec app npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/components/letters/TuckedIn.tsx
git commit -m "feat(letters): add tucked-in attachments strip"
```

---

## Task 7: LetterPaper component

**Files:**
- Create: `src/components/letters/LetterPaper.tsx`

The right column. Lined paper background, top-right date/HEARTH stamp, "A LETTER" small-caps title, salutation (`Dear future me,` fixed OR `Dear ___,` with input), TipTap editor styled to fit lined paper, signature row (`yours, [name]`), tucked-in strip, then footer with `— the end —`, `← back`, `fold & seal ✦`.

- [ ] **Step 1: Confirm TipTap editor wrapper exists or use existing pattern**

Run: `grep -ln "useEditor\|EditorContent" src/components/Editor.tsx src/components/postcard/*.tsx`
Expected: existing TipTap usage you can mirror. Reuse the same StarterKit + Placeholder extensions config that the postcard editor uses today.

- [ ] **Step 2: Create the component**

```tsx
// src/components/letters/LetterPaper.tsx
'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { LetterRecipient } from './letterTypes'
import TuckedIn from './TuckedIn'
import { StrokeData } from '@/store/journal'

interface Props {
  recipient: LetterRecipient
  closeName: string
  onCloseNameChange: (s: string) => void
  closeEmail: string
  onCloseEmailChange: (s: string) => void
  bodyHtml: string
  onBodyChange: (html: string) => void
  signatureName: string
  photos?: string[]
  doodle?: StrokeData[]
  songUrl?: string | null
  onBack: () => void
  onSeal: () => void
  canSeal: boolean
  createdAt: Date
}

export default function LetterPaper(props: Props) {
  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder: 'i wanted to tell you something…' })],
    content: props.bodyHtml,
    onUpdate: ({ editor }) => props.onBodyChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none font-[var(--font-caveat),Caveat,cursive] text-xl leading-[2.2rem]',
      },
    },
  })

  const [showEmail, setShowEmail] = useState(props.closeEmail.length > 0)

  return (
    <div
      className="
        relative mx-auto w-full max-w-3xl rounded-md bg-[var(--color-paper,#f4ead0)] p-10
        shadow-[0_4px_24px_rgba(70,50,30,0.18)]
      "
      style={{
        backgroundImage:
          'repeating-linear-gradient(transparent, transparent 2.1rem, rgba(80,60,40,0.18) 2.1rem, rgba(80,60,40,0.18) calc(2.1rem + 1px))',
      }}
    >
      {/* top-right stamp */}
      <div className="absolute right-6 top-6 text-right text-xs italic opacity-70">
        <div>{format(props.createdAt, "EEEE, MMM d · 'evening'")}</div>
        <div className="mt-1 inline-block border border-dashed border-[var(--color-accent,#c8742c)] px-2 py-1 text-[10px] uppercase tracking-[0.25em] text-[var(--color-accent,#c8742c)]">
          hearth
        </div>
      </div>

      <div className="mb-6 text-xs uppercase tracking-[0.3em] text-[var(--color-accent,#c8742c)]">a letter</div>

      {/* Salutation */}
      <div className="mb-4 font-[var(--font-caveat),Caveat,cursive] text-3xl">
        {props.recipient === 'future_me' ? (
          <>Dear <span className="underline decoration-dotted">future me</span>,</>
        ) : (
          <>
            Dear{' '}
            <input
              value={props.closeName}
              onChange={e => props.onCloseNameChange(e.target.value)}
              placeholder="…"
              className="border-b border-dotted border-[rgba(80,60,40,0.5)] bg-transparent text-3xl outline-none"
              size={Math.max(props.closeName.length, 6)}
            />
            ,
          </>
        )}
      </div>

      {/* Body */}
      <EditorContent editor={editor} />

      {/* Signature */}
      <div className="mt-8 font-[var(--font-caveat),Caveat,cursive] text-2xl">
        yours, <span className="underline decoration-dotted">{props.signatureName}</span>
      </div>

      {/* Optional email for someone_close */}
      {props.recipient === 'someone_close' && (
        <div className="mt-4 text-xs">
          {!showEmail ? (
            <button onClick={() => setShowEmail(true)} className="opacity-70 underline">
              + send to their email on the unlock date
            </button>
          ) : (
            <input
              type="email"
              value={props.closeEmail}
              onChange={e => props.onCloseEmailChange(e.target.value)}
              placeholder="email@example.com"
              className="rounded border border-[rgba(80,60,40,0.25)] bg-transparent px-2 py-1"
            />
          )}
        </div>
      )}

      {/* Tucked-in strip */}
      <TuckedIn photos={props.photos} doodle={props.doodle} songUrl={props.songUrl} />

      {/* Footer */}
      <div className="mt-10 flex items-center justify-between text-xs">
        <div className="opacity-60 italic">— the end —</div>
        <div className="flex gap-2">
          <button
            onClick={props.onBack}
            className="rounded-full border border-[rgba(80,60,40,0.25)] px-4 py-2 hover:bg-[rgba(80,60,40,0.06)]"
          >
            ← back
          </button>
          <button
            onClick={props.onSeal}
            disabled={!props.canSeal}
            className="
              rounded-full bg-[var(--color-accent,#c8742c)] px-4 py-2 text-white shadow
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            fold &amp; seal ✦
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Lint and build**

Run: `docker compose exec app npm run lint && docker compose exec app npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/components/letters/LetterPaper.tsx
git commit -m "feat(letters): add lined-paper letter view with editor and signature"
```

---

## Task 8: LetterWriteView — assemble write surface and wire autosave

**Files:**
- Create: `src/components/letters/LetterWriteView.tsx`

This is where the existing autosave + seal mechanic gets wired in. The component owns recipient/unlock/body/closeName/closeEmail/photos/doodle/song state, derives the schema mapping via `mapRecipientToSchema`, and persists via `useAutosaveEntry`.

- [ ] **Step 1: Read the autosave hook signature**

Run: `sed -n '1,80p' src/hooks/useAutosaveEntry.ts`
Confirm the exact `Draft` shape and the seal method (look for a function/method that flips `isSealed=true`). This determines the exact field names passed in Step 2.

- [ ] **Step 2: Create the component**

```tsx
// src/components/letters/LetterWriteView.tsx
'use client'

import { useState } from 'react'
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
  onSealed: () => void   // called after successful seal — caller routes back to list
}

export default function LetterWriteView({ onBack, onSealed }: Props) {
  const { profile } = useProfileStore()
  const autosave = useAutosaveEntry()

  const [recipient, setRecipient] = useState<LetterRecipient>('future_me')
  const [unlock, setUnlock] = useState<UnlockChoice>(DEFAULT_UNLOCK)
  const [closeName, setCloseName] = useState('')
  const [closeEmail, setCloseEmail] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [createdAt] = useState<Date>(() => new Date())

  // Derive schema mapping on every relevant change; pass into autosave draft.
  const mapping = mapRecipientToSchema(recipient, closeName, closeEmail || null)

  // Autosave wiring: any change to body / mapping / unlock dispatches a debounced save.
  // Exact hook API may differ — adapt the property names to what the hook expects,
  // referenced from Step 1's read of useAutosaveEntry.ts.
  // The hook is responsible for: debouncing, POST on first change, PUT on subsequent.
  // We pass the current draft state every render; the hook decides when to flush.

  // Pseudocode shape (replace with real hook call after confirming signature):
  //   autosave.update({
  //     entryType: mapping.entryType,
  //     text: bodyHtml,
  //     recipientName: mapping.recipientName,
  //     recipientEmail: mapping.recipientEmail,
  //     unlockDate: resolveUnlockDate(unlock, createdAt),
  //     isSealed: false,
  //   })

  const unlockDate = resolveUnlockDate(unlock, createdAt)

  const canSeal =
    bodyHtml.replace(/<[^>]*>/g, '').trim().length > 0 &&
    unlockDate !== null &&
    (recipient === 'future_me' || closeName.trim().length > 0)

  async function handleSeal() {
    if (!canSeal) return
    // Flush any pending autosave, then call the hook's seal action.
    // Adapt to the actual hook API confirmed in Step 1:
    //   await autosave.flush()
    //   await autosave.seal({ unlockDate })
    onSealed()
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
          signatureName={profile?.name ?? 'me'}
          onBack={onBack}
          onSeal={handleSeal}
          canSeal={canSeal}
          createdAt={createdAt}
        />
      </div>
    </div>
  )
}
```

**Implementation note for the engineer:** the existing postcard `LettersPage` has working autosave + seal logic embedded in it. Before writing the `autosave.update(...)` and `autosave.seal(...)` calls above, read the existing `src/app/letters/page.tsx` (the still-present postcard branch) to see the exact API and replicate it. Do not invent a new hook surface — match what's already used.

- [ ] **Step 3: Lint and build**

Run: `docker compose exec app npm run lint && docker compose exec app npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/components/letters/LetterWriteView.tsx
git commit -m "feat(letters): assemble write view with sidebar, paper, and autosave wiring"
```

---

## Task 9: Wire LetterWriteView into `/letters/page.tsx`

**Files:**
- Modify: `src/app/letters/page.tsx`

Replace the temporary stub from Task 4 with the new `LetterWriteView`. The old `Postcard*` UI is now fully off-route.

- [ ] **Step 1: Replace the page body**

```tsx
// src/app/letters/page.tsx
'use client'

import { useState } from 'react'
import SealedLetterList from '@/components/letters/SealedLetterList'
import LetterWriteView from '@/components/letters/LetterWriteView'

type Surface = 'list' | 'write'

export default function LettersPage() {
  const [surface, setSurface] = useState<Surface>('list')
  const [refreshKey, setRefreshKey] = useState(0)  // bump after seal to refetch list

  if (surface === 'list') {
    return (
      <SealedLetterList
        key={refreshKey}
        onWriteClick={() => setSurface('write')}
      />
    )
  }

  return (
    <LetterWriteView
      onBack={() => setSurface('list')}
      onSealed={() => {
        setRefreshKey(k => k + 1)
        setSurface('list')
      }}
    />
  )
}
```

All previous imports of `Postcard*`, `FloatingEnvelope`, `html2canvas-pro`, `addWeeks`, `InkWriteText`, etc. are removed from this file. They remain in their source files (cleanup happens in Task 11).

- [ ] **Step 2: Lint and build**

Run: `docker compose exec app npm run lint && docker compose exec app npm run build`
Expected: clean. Any unused-import lint errors should be from this file alone — fix in place.

- [ ] **Step 3: Manual smoke test**

Visit `http://localhost:3111/letters`:
- Lands on sealed list (or empty state).
- "✎ Write a letter" → new lined-paper write view.
- Recipient toggle (future me / someone close) flips salutation correctly.
- Date chips (1mo / 6mo / 1yr) and "someday" picker all selectable.
- Typing in the body persists across navigation away and back (autosave).
- "fold & seal" with a non-empty body and a chosen date returns to the list with the new letter visible.
- "← back" returns to list without sealing.

- [ ] **Step 4: Commit**

```bash
git add src/app/letters/page.tsx
git commit -m "feat(letters): replace postcard write UI with lined-paper write view"
```

---

## Task 10: Sealing animation polish

**Files:**
- Modify: `src/components/letters/LetterWriteView.tsx`
- Modify: `src/components/letters/LetterPaper.tsx`

Add a brief Framer Motion sealing animation between "fold & seal" click and the list-route transition.

- [ ] **Step 1: Add a sealing state to `LetterWriteView`**

```tsx
const [sealing, setSealing] = useState(false)

async function handleSeal() {
  if (!canSeal) return
  setSealing(true)
  // ...autosave.flush + autosave.seal as before
  await new Promise(r => setTimeout(r, 900))   // hold the animation a beat
  onSealed()
}
```

Pass `sealing` into `LetterPaper` as a prop.

- [ ] **Step 2: Animate `LetterPaper` on `sealing`**

Wrap the paper's outer `div` in `motion.div`:

```tsx
<motion.div
  animate={sealing ? { scale: 0.92, rotateX: 30, opacity: 0.6 } : { scale: 1, rotateX: 0, opacity: 1 }}
  transition={{ duration: 0.7, ease: [0.32, 0.72, 0.24, 1] }}
  style={{ transformPerspective: 1200 }}
>
  ...existing paper content...
</motion.div>
```

The wax-seal dot can also `scale: 1.4` with `boxShadow` swell during the same window for an extra beat.

- [ ] **Step 3: Lint, build, and visually verify**

Run: `docker compose exec app npm run lint && docker compose exec app npm run build`
Visit the page and seal a test letter — animation should feel like a fold + stamp, then route to list.

- [ ] **Step 4: Commit**

```bash
git add src/components/letters/LetterWriteView.tsx src/components/letters/LetterPaper.tsx
git commit -m "polish(letters): add sealing fold animation before routing to list"
```

---

## Task 11: Retire unused postcard components

**Files:**
- Delete (conditional): `src/components/postcard/Postcard.tsx`, `PostcardFront.tsx`, `PostcardBack.tsx`
- Delete (conditional): `src/components/FloatingEnvelope.tsx`

- [ ] **Step 1: Confirm no other consumers**

Run for each candidate:
```
grep -rn "Postcard\b\|PostcardFront\|PostcardBack\|FloatingEnvelope" src --include='*.ts' --include='*.tsx'
```
Expected: zero matches outside of the candidate files themselves.

- [ ] **Step 2: Delete unused files**

For each candidate with zero external matches:
```bash
rm <file>
```
If a file is still referenced anywhere, leave it.

- [ ] **Step 3: Lint and build**

Run: `docker compose exec app npm run lint && docker compose exec app npm run build`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(letters): remove unused postcard components"
```

---

## Self-review

**Spec coverage:**
- ✅ Surface 1 (sealed list, scrapbook-style, recipient + dates, hover tooltip, write CTA, empty state) → Tasks 2, 3
- ✅ Default landing on `/letters` is the sealed list → Tasks 4, 9
- ✅ Surface 2 two-column layout (sidebar + lined paper) → Tasks 5, 7, 8
- ✅ Two recipients (future me fixed salutation, someone close inline name) → Tasks 5, 7
- ✅ Date chips (1mo / 6mo / 1yr) + someday custom date picker → Task 5
- ✅ Auto-filled signature from profile → Task 7 (via `signatureName`), Task 8 (passes `profile?.name`)
- ✅ Tucked-in attachments (photos / doodle / song) below signature, above fold & seal → Task 6, integrated in Task 7
- ✅ Drafts autosave; seal flips draft → sealed → Task 8
- ✅ Recipient → schema mapping (someone_close + email = letter; without email = unsent_letter) → Task 1 (`mapRecipientToSchema`), used in Task 8
- ✅ No server / schema changes → confirmed across all tasks
- ✅ Sealing animation as polish → Task 10
- ✅ Retire postcard components → Task 11
- ✅ Out-of-scope items (stranger, past-me, reading-before-unlock, on-shelf appearance) → not present in any task

**Placeholder scan:** The two intentional "look up the actual API before coding" instructions are in Task 7 Step 1 (TipTap config) and Task 8 Step 1 (autosave hook signature). These are not placeholders — they are explicit reads against existing code so the new components mirror the working hook surface that's already in `src/app/letters/page.tsx` (still mounted via the postcard branch through Task 8). Removing those reads would force the engineer to invent a hook API; keeping them is the correct guidance.

**Type consistency:** `LetterRecipient`, `UnlockChoice`, `mapRecipientToSchema`, and `resolveUnlockDate` are defined in Task 1 and used with matching names in Tasks 5, 7, 8. `RecipientSidebar` props match the consumer call in `LetterWriteView`. `LetterPaper` props match its consumer in `LetterWriteView`. `SealedLetterTile` props match the call in `SealedLetterList`.
