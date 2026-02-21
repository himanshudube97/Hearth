# Postcard Letters UI — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a `/new-letters` route with a flippable postcard UI for writing letters to self or friends.

**Architecture:** A new route page manages all state (letter type, flip side, form data). Three postcard components handle the visual: `Postcard.tsx` (3D flip container), `PostcardFront.tsx` (writing surface with TipTap), `PostcardBack.tsx` (photos + address form). Reuses all existing backend — same API, encryption, delivery, and animation.

**Tech Stack:** Next.js App Router, TipTap editor, Framer Motion, CSS 3D transforms, Zustand (theme store)

**Design doc:** `docs/plans/2026-02-21-postcard-letters-design.md`

---

## Reference Files

These files contain the patterns to extract from:

| File | What to reference |
|------|-------------------|
| `src/app/letters/page.tsx` | State management, send handler, FloatingEnvelope, unlock date options, form fields, themeStamps |
| `src/components/Editor.tsx` | TipTap editor setup (StarterKit + Placeholder) |
| `src/components/CollagePhoto.tsx` | Photo upload, compression, processImage() |
| `src/components/DoodleCanvas.tsx` | Doodle drawing interface, StrokeData type |
| `src/components/DoodlePreview.tsx` | Doodle stroke rendering |
| `src/components/SongEmbed.tsx` | Song URL input + embed |
| `src/store/theme.ts` | useThemeStore() — `{ theme, themeName }` |
| `src/store/profile.ts` | useProfileStore() — `{ profile }` with nickname |
| `src/hooks/useE2EE.ts` | encryptEntryData() for encryption before save |
| `src/lib/themes.ts` | Theme type definition, all 11 themes |

---

## Task 1: Postcard Flip Container

**Create:** `src/components/postcard/Postcard.tsx`

This is the 3D flip container. Pure layout — no business logic.

**Step 1: Create the component**

```tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface PostcardProps {
  front: React.ReactNode
  back: React.ReactNode
  isFlipped: boolean
  onFlip: () => void
}

export default function Postcard({ front, back, isFlipped, onFlip }: PostcardProps) {
  return (
    <div className="relative w-full max-w-[720px] mx-auto" style={{ perspective: '1200px' }}>
      <motion.div
        className="relative w-full"
        style={{
          transformStyle: 'preserve-3d',
          aspectRatio: '16 / 10',
        }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Front face */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {front}
        </div>

        {/* Back face */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {back}
        </div>
      </motion.div>

      {/* Flip button */}
      <motion.button
        onClick={onFlip}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="absolute -bottom-5 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 rounded-full text-sm font-medium shadow-lg"
        style={{
          background: '#f5f0e6',
          color: '#8B6914',
          border: '1px solid #d4c5a0',
        }}
      >
        {isFlipped ? '← Write' : 'Details →'}
      </motion.button>
    </div>
  )
}
```

**Step 2: Verify it renders**

Build test: `docker compose exec app npx next build` (or just restart and check visually later in Task 4).

**Step 3: Commit**

```bash
git add src/components/postcard/Postcard.tsx
git commit -m "feat: add Postcard 3D flip container component"
```

---

## Task 2: Postcard Front (Writing Surface)

**Create:** `src/components/postcard/PostcardFront.tsx`

The front side: vintage postcard writing surface with TipTap editor.

**Step 1: Create the component**

Key visual elements:
- Paper background (`#f5f0e6`)
- Air mail stripe along top (repeating red/blue diagonal stripes)
- "POST CARD" header text centered
- Vertical divider line at ~55% from left
- Left side: TipTap editor with Caveat font and faint ruled lines
- Right side: Decorative — theme stamp box (top-right), postmark circle

```tsx
'use client'

import { useThemeStore } from '@/store/theme'
import { ThemeName } from '@/lib/themes'
import Editor from '@/components/Editor'

// Copy themeStamps from letters/page.tsx (lines 22-34)
const themeStamps: Record<string, { icon: string; color: string }> = {
  rivendell: { icon: '🍃', color: '#5E8B5A' },
  hobbiton: { icon: '🌻', color: '#60B060' },
  winterSunset: { icon: '❄️', color: '#E8945A' },
  cherryBlossom: { icon: '🌸', color: '#D4839A' },
  northernLights: { icon: '✨', color: '#64B5C6' },
  mistyMountains: { icon: '⛰️', color: '#7B8FA8' },
  gentleRain: { icon: '🌧️', color: '#6A9EC0' },
  cosmos: { icon: '🌟', color: '#9B7EC8' },
  candlelight: { icon: '🕯️', color: '#D4A574' },
  oceanTwilight: { icon: '🌊', color: '#5A9EA0' },
  quietSnow: { icon: '❄️', color: '#8BA8C4' },
}

interface PostcardFrontProps {
  letterText: string
  onTextChange: (html: string) => void
  recipientType: 'self' | 'friend'
}

export default function PostcardFront({ letterText, onTextChange, recipientType }: PostcardFrontProps) {
  const { themeName } = useThemeStore()
  const stamp = themeStamps[themeName] || themeStamps.rivendell

  return (
    <div
      className="w-full h-full relative flex flex-col"
      style={{
        background: '#f5f0e6',
        fontFamily: "'Caveat', cursive",
      }}
    >
      {/* Air mail stripe */}
      <div
        className="h-3 w-full"
        style={{
          background: 'repeating-linear-gradient(135deg, #c62828 0px, #c62828 8px, #fff 8px, #fff 12px, #1565c0 12px, #1565c0 20px, #fff 20px, #fff 24px)',
        }}
      />

      {/* POST CARD header */}
      <div className="text-center py-2">
        <span
          className="text-lg tracking-[0.3em] font-semibold"
          style={{ color: '#8B6914', fontFamily: "'Georgia', serif" }}
        >
          POST CARD
        </span>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex relative px-4 pb-4">
        {/* Left: Writing area */}
        <div className="flex-1 pr-4 relative" style={{ flexBasis: '55%' }}>
          {/* Ruled lines background */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #d4c5a0 31px, #d4c5a0 32px)',
              backgroundPosition: '0 0',
              opacity: 0.5,
            }}
          />

          {/* TipTap editor — styled to look handwritten */}
          <div className="relative z-10 h-full">
            <Editor
              currentText={letterText}
              setCurrentText={onTextChange}
              prompt={
                recipientType === 'self'
                  ? 'Dear future me...'
                  : 'Dear friend...'
              }
              customStyles={{
                fontFamily: "'Caveat', cursive",
                fontSize: '1.2rem',
                color: '#3d2c1a',
                lineHeight: '32px',
                background: 'transparent',
              }}
            />
          </div>
        </div>

        {/* Vertical divider */}
        <div
          className="w-px self-stretch"
          style={{ background: '#c4a265' }}
        />

        {/* Right: Decorative */}
        <div className="pl-4" style={{ flexBasis: '45%' }}>
          {/* Stamp */}
          <div
            className="float-right w-20 h-24 border-2 flex flex-col items-center justify-center"
            style={{
              borderColor: stamp.color,
              borderStyle: 'dashed',
            }}
          >
            <span className="text-2xl">{stamp.icon}</span>
            <span
              className="text-[10px] mt-1 tracking-wider"
              style={{ color: stamp.color, fontFamily: "'Georgia', serif" }}
            >
              HEARTH
            </span>
          </div>

          {/* Postmark circle */}
          <div
            className="mt-16 ml-2 w-16 h-16 rounded-full border flex items-center justify-center"
            style={{
              borderColor: '#c4a26580',
              transform: 'rotate(-15deg)',
            }}
          >
            <span
              className="text-[9px] text-center leading-tight"
              style={{ color: '#c4a265', fontFamily: "'Georgia', serif" }}
            >
              AIR<br />MAIL
            </span>
          </div>
        </div>
      </div>

      {/* Paper texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{
          background: 'url("data:image/svg+xml,...") repeat',
          opacity: 0.03,
          mixBlendMode: 'multiply',
        }}
      />
    </div>
  )
}
```

**Important notes for implementation:**
- The `Editor` component needs to accept a `customStyles` prop. Check `src/components/Editor.tsx` — if it doesn't support custom styles, add a simple pass-through of `style` to the editor wrapper div. Keep it minimal.
- Import the Caveat font in `src/app/layout.tsx` via `next/font/google` if not already loaded. Check first — the existing postcard reading view already uses Caveat so it may be there.

**Step 2: Commit**

```bash
git add src/components/postcard/PostcardFront.tsx
git commit -m "feat: add PostcardFront writing surface component"
```

---

## Task 3: Postcard Back (Photos + Address)

**Create:** `src/components/postcard/PostcardBack.tsx`

The flip side: left half has photos + doodle, right half has address form fields.

**Step 1: Create the component**

```tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, addWeeks, addMonths, addYears, addDays } from 'date-fns'
import { useThemeStore } from '@/store/theme'
import CollagePhoto from '@/components/CollagePhoto'
import DoodleCanvas from '@/components/DoodleCanvas'
import DoodlePreview from '@/components/DoodlePreview'
import SongEmbed, { isMusicUrl } from '@/components/SongEmbed'
import DatePicker from '@/components/DatePicker'
import { StrokeData } from '@/store/journal'

// Same unlock options as letters/page.tsx
const unlockOptions = [
  { label: '1 week', getValue: () => addWeeks(new Date(), 1) },
  { label: '2 weeks', getValue: () => addWeeks(new Date(), 2) },
  { label: '1 month', getValue: () => addMonths(new Date(), 1) },
  { label: '3 months', getValue: () => addMonths(new Date(), 3) },
  { label: '6 months', getValue: () => addMonths(new Date(), 6) },
  { label: '1 year', getValue: () => addYears(new Date(), 1) },
]

interface PostcardBackProps {
  recipientType: 'self' | 'friend'
  // Photos
  photoTopRight: string | null
  photoBottomLeft: string | null
  onPhotoTopRight: (url: string | null) => void
  onPhotoBottomLeft: (url: string | null) => void
  // Doodle
  doodleStrokes: StrokeData[]
  onDoodleChange: (strokes: StrokeData[]) => void
  // Song
  songLink: string
  onSongChange: (url: string) => void
  // Address fields
  friendName: string
  onFriendNameChange: (v: string) => void
  friendEmail: string
  onFriendEmailChange: (v: string) => void
  senderName: string
  onSenderNameChange: (v: string) => void
  location: string
  onLocationChange: (v: string) => void
  // Date
  unlockDate: Date
  onUnlockDateChange: (d: Date) => void
}

export default function PostcardBack(props: PostcardBackProps) {
  const { theme } = useThemeStore()
  const [showDoodle, setShowDoodle] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)

  // Input style helper (vintage look)
  const inputStyle = {
    background: 'transparent',
    borderBottom: '1px solid #c4a265',
    color: '#3d2c1a',
    fontFamily: "'Caveat', cursive",
    fontSize: '1.1rem',
  }

  return (
    <div
      className="w-full h-full relative flex"
      style={{ background: '#f5f0e6' }}
    >
      {/* Left: Photos + Doodle + Song */}
      <div className="flex-1 p-4 flex flex-col gap-3" style={{ flexBasis: '45%' }}>
        {/* Photo slots */}
        <div className="flex gap-3 flex-1">
          <div className="flex-1 relative">
            <CollagePhoto
              photoUrl={props.photoTopRight}
              onPhotoChange={props.onPhotoTopRight}
              position={1}
              rotation={5}
              label="Add photo"
            />
          </div>
          <div className="flex-1 relative">
            <CollagePhoto
              photoUrl={props.photoBottomLeft}
              onPhotoChange={props.onPhotoBottomLeft}
              position={2}
              rotation={-5}
              label="Add photo"
            />
          </div>
        </div>

        {/* Doodle + Song row */}
        <div className="flex gap-2 items-center">
          {props.doodleStrokes.length > 0 ? (
            <button onClick={() => setShowDoodle(true)} className="relative group">
              <DoodlePreview strokes={props.doodleStrokes} size={40} />
            </button>
          ) : (
            <button
              onClick={() => setShowDoodle(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center text-base"
              style={{ background: 'rgba(139,105,20,0.1)', color: '#8B6914' }}
              title="Add doodle"
            >
              ✎
            </button>
          )}

          <div className="flex-1">
            <input
              type="text"
              value={props.songLink}
              onChange={(e) => props.onSongChange(e.target.value)}
              placeholder="Paste a song link..."
              className="w-full px-2 py-1 rounded text-sm outline-none"
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* Vertical divider */}
      <div className="w-px self-stretch" style={{ background: '#c4a265' }} />

      {/* Right: Address form */}
      <div className="flex-1 p-4 flex flex-col gap-3" style={{ flexBasis: '55%' }}>
        {/* To field */}
        <div>
          <label className="text-xs tracking-wider" style={{ color: '#8B6914', fontFamily: "'Georgia', serif" }}>
            TO
          </label>
          {props.recipientType === 'self' ? (
            <p className="mt-1" style={{ ...inputStyle, borderBottom: 'none', opacity: 0.6 }}>
              Future Me
            </p>
          ) : (
            <>
              <input
                type="text"
                value={props.friendName}
                onChange={(e) => props.onFriendNameChange(e.target.value)}
                placeholder="Friend's name"
                className="w-full mt-1 px-1 py-0.5 outline-none"
                style={inputStyle}
              />
              <input
                type="email"
                value={props.friendEmail}
                onChange={(e) => props.onFriendEmailChange(e.target.value)}
                placeholder="friend@email.com"
                className="w-full mt-2 px-1 py-0.5 outline-none"
                style={inputStyle}
              />
            </>
          )}
        </div>

        {/* From field */}
        <div>
          <label className="text-xs tracking-wider" style={{ color: '#8B6914', fontFamily: "'Georgia', serif" }}>
            FROM
          </label>
          <input
            type="text"
            value={props.senderName}
            onChange={(e) => props.onSenderNameChange(e.target.value)}
            placeholder="Your name (optional)"
            className="w-full mt-1 px-1 py-0.5 outline-none"
            style={inputStyle}
          />
        </div>

        {/* Location */}
        <div>
          <label className="text-xs tracking-wider" style={{ color: '#8B6914', fontFamily: "'Georgia', serif" }}>
            WRITING FROM
          </label>
          <input
            type="text"
            value={props.location}
            onChange={(e) => props.onLocationChange(e.target.value)}
            placeholder="e.g., Himachal Pradesh"
            className="w-full mt-1 px-1 py-0.5 outline-none"
            style={inputStyle}
          />
        </div>

        {/* Unlock date — compact version */}
        <div>
          <label className="text-xs tracking-wider" style={{ color: '#8B6914', fontFamily: "'Georgia', serif" }}>
            ARRIVES ON
          </label>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {unlockOptions.map((opt) => {
              const d = opt.getValue()
              const selected = format(props.unlockDate, 'yyyy-MM-dd') === format(d, 'yyyy-MM-dd')
              return (
                <button
                  key={opt.label}
                  onClick={() => props.onUnlockDateChange(d)}
                  className="px-2 py-0.5 rounded-full text-xs"
                  style={{
                    background: selected ? '#8B691430' : 'transparent',
                    border: `1px solid ${selected ? '#8B6914' : '#c4a265'}`,
                    color: '#3d2c1a',
                    fontFamily: "'Georgia', serif",
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
            <button
              onClick={() => setShowDatePicker(true)}
              className="px-2 py-0.5 rounded-full text-xs"
              style={{
                border: '1px solid #c4a265',
                color: '#3d2c1a',
                fontFamily: "'Georgia', serif",
              }}
            >
              Custom
            </button>
          </div>
          <p className="mt-1.5 text-xs" style={{ color: '#8B6914' }}>
            {format(props.unlockDate, 'MMMM d, yyyy')}
          </p>
        </div>

        {/* Decorative stamp bottom-right */}
        <div className="mt-auto flex justify-end">
          <div
            className="w-14 h-16 border flex flex-col items-center justify-center"
            style={{ borderColor: '#c4a26580', borderStyle: 'dashed' }}
          >
            <span className="text-xs" style={{ color: '#c4a265', fontFamily: "'Georgia', serif" }}>
              HEARTH
            </span>
            <span className="text-[9px]" style={{ color: '#c4a265' }}>est. 2024</span>
          </div>
        </div>
      </div>

      {/* DatePicker modal */}
      <DatePicker
        value=""
        onChange={(dateStr: string) => {
          if (dateStr) {
            props.onUnlockDateChange(new Date(dateStr))
            setShowDatePicker(false)
          }
        }}
        minDate={
          props.recipientType === 'friend'
            ? format(addDays(new Date(), 7), 'yyyy-MM-dd')
            : format(addDays(new Date(), 1), 'yyyy-MM-dd')
        }
        mode="modal"
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
      />

      {/* Doodle canvas modal */}
      <AnimatePresence>
        {showDoodle && (
          <DoodleCanvas
            onSave={(strokes) => { props.onDoodleChange(strokes); setShowDoodle(false) }}
            onClose={() => setShowDoodle(false)}
            initialStrokes={props.doodleStrokes}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
```

**Important notes:**
- The `CollagePhoto` component may need prop adjustments. Check its actual interface — it may use `photoUrl`/`onPhotoChange` or different prop names. Adapt accordingly.
- The DatePicker `minDate` follows existing logic: 1 day minimum for self, 7 days for friends.

**Step 2: Commit**

```bash
git add src/components/postcard/PostcardBack.tsx
git commit -m "feat: add PostcardBack component with photos and address form"
```

---

## Task 4: Route Page (Wiring Everything Together)

**Create:** `src/app/new-letters/page.tsx`

This is the main page that composes everything: state, letter type toggle, Postcard component, send button, and envelope animation.

**Step 1: Create the route page**

Extract the state management and send handler pattern from `src/app/letters/page.tsx` (lines 614-823). The page layout is:

```
┌──────────────────────────────────────┐
│   Letter Type Toggle (self/friend)   │
│                                      │
│   ┌──────────────────────────────┐   │
│   │                              │   │
│   │       Postcard (flip)        │   │
│   │                              │   │
│   └──────────────────────────────┘   │
│           [← Write / Details →]      │
│                                      │
│          [  Send Letter  ]           │
└──────────────────────────────────────┘
```

Key parts to implement:

1. **State** — Copy from letters/page.tsx:
   - `recipientType` ('self' | 'friend')
   - `letterText`, `isFlipped`
   - `friendName`, `friendEmail`, `senderName`, `location`
   - `unlockDate` (default: 1 week from now)
   - `photoTopRight`, `photoBottomLeft`
   - `doodleStrokes`, `songLink`
   - `saving`, `showAnimation`, `successData`

2. **Letter type toggle** — Two buttons above the card:
   - "To Future Self" (envelope icon)
   - "To a Friend" (airplane icon)
   - Styled with vintage colors (#f5f0e6 bg, #8B6914 text, #c4a265 borders)

3. **Send handler** — Extracted from letters/page.tsx `handleSendLetter`:
   - Validate: text required, friend fields required if friend letter
   - Build entry payload with `entryType: 'letter'`
   - Encrypt with `useE2EE` hook
   - POST to `/api/entries`
   - On success: trigger FloatingEnvelope animation

4. **FloatingEnvelope** — Import from letters/page.tsx. It's defined inline in that file (lines 250-535), so either:
   - Extract it into `src/components/FloatingEnvelope.tsx` first (preferred), OR
   - Copy it into this page (fallback if extraction is too complex)

5. **Background** — Use the app's existing Background component for theme particles behind the postcard.

**Step 2: Verify the full flow**

```bash
docker compose restart app
```

Open `http://localhost:3111/new-letters` and verify:
- Letter type toggle works
- Front side shows editor with handwriting font
- Flip animation works
- Back side shows photo slots + address form
- Send creates a letter entry (check DB with Prisma Studio)

**Step 3: Commit**

```bash
git add src/app/new-letters/page.tsx
git commit -m "feat: add /new-letters route with postcard UI"
```

---

## Task 5: Editor customStyles Support

**Modify:** `src/components/Editor.tsx`

The PostcardFront needs to pass custom styles (Caveat font, ink color, transparent bg) to the TipTap editor. Check if Editor.tsx already supports a `customStyles` or `className` prop.

**Step 1: Read Editor.tsx and check its props interface**

If it doesn't support custom styling, add a `customStyles?: React.CSSProperties` prop:
- Apply it to the editor wrapper div
- The TipTap `editorProps.attributes.style` can also be set

Keep the change minimal — just pass through the styles.

**Step 2: Commit**

```bash
git add src/components/Editor.tsx
git commit -m "feat: add customStyles prop to Editor component"
```

---

## Task 6: Extract FloatingEnvelope Component

**Create:** `src/components/FloatingEnvelope.tsx`
**Modify:** `src/app/letters/page.tsx` (import from new location)

The FloatingEnvelope animation (lines 250-535 in letters/page.tsx) is defined inline. Extract it so both `/letters` and `/new-letters` can use it.

**Step 1: Copy the FloatingEnvelope function component into a new file**

Keep the exact same code. It takes `{ onComplete: () => void }` as props.

**Step 2: Update letters/page.tsx to import from the new file**

Replace the inline definition with:
```tsx
import FloatingEnvelope from '@/components/FloatingEnvelope'
```

Delete the inline FloatingEnvelope code from letters/page.tsx.

**Step 3: Verify letters page still works**

```bash
docker compose restart app
```

Test: Send a letter from the existing `/letters` page. Envelope animation should still play.

**Step 4: Commit**

```bash
git add src/components/FloatingEnvelope.tsx src/app/letters/page.tsx
git commit -m "refactor: extract FloatingEnvelope into shared component"
```

---

## Task 7: Caveat Font Setup

**Modify:** `src/app/layout.tsx`

Check if Caveat is already imported via `next/font/google`. The existing postcard reading view uses it — search for 'Caveat' in the codebase.

**Step 1: Search for existing Caveat import**

```bash
docker compose exec app grep -r "Caveat" src/
```

If it's loaded via a `<link>` tag or CSS import, it may already be available. If it's using `next/font/google`, ensure the CSS variable is set. If it's not loaded at all:

```tsx
import { Caveat } from 'next/font/google'

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-caveat',
})
```

Add `caveat.variable` to the `<body>` className.

Then in PostcardFront, use `font-family: var(--font-caveat), cursive`.

**Step 2: Commit only if changes were needed**

```bash
git add src/app/layout.tsx
git commit -m "feat: add Caveat handwriting font"
```

---

## Task 8: Responsive Polish

**Modify:** `src/components/postcard/Postcard.tsx`, `PostcardFront.tsx`, `PostcardBack.tsx`

**Step 1: Test on mobile viewport (375px)**

Open DevTools → mobile view. Check:
- Card doesn't overflow
- Writing area has enough height
- Back side form fields are usable
- Flip button is tappable

**Step 2: Fix issues found**

Common fixes needed:
- Postcard.tsx: Change `max-w-[720px]` to responsive (`max-w-full sm:max-w-[720px]`)
- PostcardFront: On mobile, reduce right decorative section or stack vertically
- PostcardBack: On mobile, stack left (photos) and right (address) vertically instead of side-by-side. Use `flex-col sm:flex-row`.
- Aspect ratio: On mobile, use taller ratio (`aspect-ratio: 3/4` on mobile vs `16/10` on desktop)

**Step 3: Commit**

```bash
git add src/components/postcard/
git commit -m "fix: responsive layout for postcard on mobile"
```

---

## Task 9: Visual Polish & Edge Cases

**Modify:** Various postcard components

**Step 1: Handle edge cases**

- Empty state: Show subtle prompt text when no letter written yet
- Validation feedback: Highlight missing required fields (friend name, email) with red underline on the back side when user tries to send
- Song embed preview: If songLink is a valid music URL, show a small SongEmbed preview on the back side
- Success state: After send + animation, show "Letter sent!" with option to write another (reset all state)

**Step 2: Add subtle animations**

- Paper shadow on the card (box-shadow with warm tones)
- Slight paper texture via CSS noise pattern
- Gentle hover lift on the card (`translateY(-2px)`)
- Writing prompt text that fades when user starts typing (handled by TipTap Placeholder)

**Step 3: Commit**

```bash
git add src/components/postcard/ src/app/new-letters/
git commit -m "polish: visual refinements and edge case handling for postcard UI"
```

---

## Task 10: Navigation Link

**Modify:** Wherever the app's navigation lives (sidebar, header, or letters page)

**Step 1: Find navigation component**

Search for where `/letters` link exists and add a `/new-letters` link nearby. Could be in a sidebar, header nav, or the letters page itself.

**Step 2: Add link**

Simple text link: "Try the new Postcard" or a small banner on the `/letters` page pointing to `/new-letters`.

**Step 3: Commit**

```bash
git add <navigation-file>
git commit -m "feat: add navigation link to postcard letters"
```

---

## Execution Order Summary

| Task | What | Dependencies |
|------|------|-------------|
| 6 | Extract FloatingEnvelope | None (do first — unblocks Task 4) |
| 7 | Caveat font setup | None |
| 5 | Editor customStyles | None |
| 1 | Postcard flip container | None |
| 2 | PostcardFront (writing) | Task 5 (Editor), Task 7 (font) |
| 3 | PostcardBack (photos+address) | None |
| 4 | Route page (wire up) | Tasks 1, 2, 3, 6 |
| 8 | Responsive polish | Task 4 |
| 9 | Visual polish | Task 4 |
| 10 | Navigation link | Task 4 |

**Recommended execution order:** 6 → 7 → 5 → 1 → 2 → 3 → 4 → 8 → 9 → 10

Tasks 6, 7, 5 can run in parallel (independent).
Tasks 1, 2, 3 can run in parallel after their deps.
Tasks 8, 9, 10 are sequential after Task 4.
