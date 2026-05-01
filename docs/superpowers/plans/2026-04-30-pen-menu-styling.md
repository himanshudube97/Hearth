# Per-entry Diary Styling (Pen Menu) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-entry pen-nib menu on the diary spread that lets the user pick a font, an ink color, and an optional effect (Sparkle / Wet Ink). Choices persist with the entry, render on later views, and respect the existing calendar-day lock.

**Architecture:** Five fonts loaded via `next/font/google`. Style stored as plain JSON on `JournalEntry.style`. Pen menu lives in `LeftPage` and writes to the desk store; the existing autosave hook persists it. Effects mount as overlays above each textarea; locked entries hide the pen icon and disable the Wet Ink overlay.

**Tech Stack:** Next.js 16 App Router, Prisma, Zustand, `next/font/google`, plain CSS animations. No new runtime deps.

**Spec:** `docs/superpowers/specs/2026-04-30-pen-menu-styling-design.md`

---

## Project Reality Notes

- **Docker:** all `npm`, `tsc`, `prisma` commands run via `docker compose exec app …`. The plan assumes `docker compose up -d` is already running.
- **No unit test framework** is set up in this repo (`package.json` has no `test` script and no jest/vitest dep). Verification uses TypeScript (`tsc --noEmit`), ESLint (`npm run lint`), and manual smoke tests in the running app at `http://localhost:3111`. Adding a test framework is out of scope.
- **Migrations:** additive only. We add a nullable column with no backfill; existing entries render unchanged.
- **Existing Caveat font** is already wired via `next/font/google` in `src/app/layout.tsx` exposing `--font-caveat`. New fonts follow the same pattern.

---

## File Structure

**New files:**
- `src/lib/entry-style.ts` — types, palette, font/color/effect keys, `resolveFontFamily()`, `resolveInkColor()`, `parseStyle()`.
- `src/components/desk/PenMenu.tsx` — the popover (font swatches, color dots, effect chips).
- `src/components/desk/effects/SparkleTrail.tsx` — caret-trail particles.
- `src/components/desk/effects/SaveShimmer.tsx` — one-shot post-save sweep.
- `src/components/desk/effects/WetInkGlow.tsx` — caret-following glow.

**Modified files:**
- `prisma/schema.prisma` — add `style Json?` to `JournalEntry`.
- `src/lib/entry-lock.ts` — extend `LockedDiffInput` + `validateAppendOnlyDiff` with `oldStyle/newStyle`.
- `src/app/api/entries/route.ts` — accept/return `style` on POST + GET list.
- `src/app/api/entries/[id]/route.ts` — accept/return `style` on PUT/GET.
- `src/hooks/useAutosaveEntry.ts` — include `style` in `AutosaveDraft` and the request body.
- `src/store/desk.ts` — add `entryStyleDraft` + setter.
- `src/components/desk/BookSpread.tsx` — initialize `entryStyleDraft` from active entry's `style`; thread it into the autosave draft.
- `src/components/desk/LeftPage.tsx` — pen-nib icon, mount `PenMenu`, apply style to the textarea + view div, mount effect overlays.
- `src/components/desk/RightPage.tsx` — apply style to the textarea + view div, mount effect overlays.
- `src/lib/textarea-caret.ts` — export `getCaretCoordinates(textarea, position)` (top + left + height) so effects can position overlays.
- `src/app/layout.tsx` — load 4 new Google fonts.

---

## Decisions Locked In

- 5 font keys: `caveat` (default), `patrick-hand`, `shadows-into-light`, `indie-flower`, `homemade-apple`. All `latin` subset only.
- 7 ink choices: `null` ("Default" — resolves to theme body text), plus 6 named keys: `charcoal #2A2A2A`, `sepia #6B4423`, `indigo #283593`, `forest #2E5D3A`, `plum #5E3A5C`, `dusty-rose #A85462`.
- 3 effect choices: `none` (stored as missing/undefined), `sparkle`, `wet-ink`.
- `style` is plain JSON, **not encrypted** — it's non-sensitive metadata.
- Pen icon hidden on locked entries; Wet Ink overlay does not mount on locked entries; Sparkle overlay is functionally inert on locked entries (no typing → no trail, no save → no shimmer).

---

## Task 1: Entry style types and resolvers

**Files:**
- Create: `src/lib/entry-style.ts`

**Steps:**

- [ ] **Step 1: Create the file with types, palette, and resolvers.**

```ts
// src/lib/entry-style.ts
//
// Per-entry styling: font / ink color / effect. Stored on JournalEntry.style
// as plain JSON. All three sub-fields are optional; missing field = default.
//
// Palette vetting checklist (run by eye when adding a new ink color):
//   - Readable on the cream/parchment glass-diary backgrounds (light themes).
//   - Readable on the moonlit / midnight glass-diary backgrounds (dark themes).
//   - Visually distinct from the other 6 named colors.

export type FontKey =
  | 'caveat'
  | 'patrick-hand'
  | 'shadows-into-light'
  | 'indie-flower'
  | 'homemade-apple'

export type ColorKey =
  | 'charcoal'
  | 'sepia'
  | 'indigo'
  | 'forest'
  | 'plum'
  | 'dusty-rose'

export type EffectKey = 'sparkle' | 'wet-ink'

export interface EntryStyle {
  font?: FontKey
  // null = "Default" (resolves to theme body text dynamically).
  // undefined = field not set (treated as null).
  color?: ColorKey | null
  effect?: EffectKey
}

export const DEFAULT_FONT: FontKey = 'caveat'

export const FONT_KEYS: readonly FontKey[] = [
  'caveat',
  'patrick-hand',
  'shadows-into-light',
  'indie-flower',
  'homemade-apple',
] as const

export const COLOR_KEYS: readonly ColorKey[] = [
  'charcoal',
  'sepia',
  'indigo',
  'forest',
  'plum',
  'dusty-rose',
] as const

export const EFFECT_KEYS: readonly EffectKey[] = ['sparkle', 'wet-ink'] as const

export const FONT_DEFS: Record<FontKey, { label: string; cssFamily: string }> = {
  'caveat':              { label: 'Caveat',             cssFamily: `var(--font-caveat), Georgia, serif` },
  'patrick-hand':        { label: 'Patrick Hand',       cssFamily: `var(--font-patrick-hand), Georgia, serif` },
  'shadows-into-light':  { label: 'Shadows Into Light', cssFamily: `var(--font-shadows), Georgia, serif` },
  'indie-flower':        { label: 'Indie Flower',       cssFamily: `var(--font-indie), Georgia, serif` },
  'homemade-apple':      { label: 'Homemade Apple',     cssFamily: `var(--font-homemade), Georgia, serif` },
}

export const COLOR_DEFS: Record<ColorKey, { label: string; hex: string }> = {
  'charcoal':   { label: 'Charcoal',   hex: '#2A2A2A' },
  'sepia':      { label: 'Sepia',      hex: '#6B4423' },
  'indigo':     { label: 'Indigo',     hex: '#283593' },
  'forest':     { label: 'Forest',     hex: '#2E5D3A' },
  'plum':       { label: 'Plum',       hex: '#5E3A5C' },
  'dusty-rose': { label: 'Dusty Rose', hex: '#A85462' },
}

export const EFFECT_DEFS: Record<EffectKey, { label: string }> = {
  'sparkle':  { label: 'Sparkle' },
  'wet-ink':  { label: 'Wet Ink' },
}

export function resolveFontFamily(font: FontKey | undefined): string {
  return FONT_DEFS[font ?? DEFAULT_FONT].cssFamily
}

export function resolveInkColor(
  color: ColorKey | null | undefined,
  themeBodyText: string,
): string {
  if (color == null) return themeBodyText
  return COLOR_DEFS[color].hex
}

// Sanitize a style payload coming from the wire / DB. Drops unknown keys so
// stale data from a prior schema version doesn't crash rendering.
export function parseStyle(raw: unknown): EntryStyle {
  if (!raw || typeof raw !== 'object') return {}
  const r = raw as Record<string, unknown>
  const out: EntryStyle = {}
  if (typeof r.font === 'string' && (FONT_KEYS as readonly string[]).includes(r.font)) {
    out.font = r.font as FontKey
  }
  if (r.color === null) {
    out.color = null
  } else if (typeof r.color === 'string' && (COLOR_KEYS as readonly string[]).includes(r.color)) {
    out.color = r.color as ColorKey
  }
  if (typeof r.effect === 'string' && (EFFECT_KEYS as readonly string[]).includes(r.effect)) {
    out.effect = r.effect as EffectKey
  }
  return out
}
```

- [ ] **Step 2: Verify it typechecks.**

Run: `docker compose exec app npx tsc --noEmit`
Expected: clean (no new errors).

- [ ] **Step 3: Commit.**

```bash
git add src/lib/entry-style.ts
git commit -m "feat(diary): entry style types and resolvers"
```

---

## Task 2: Database column for entry.style

**Files:**
- Modify: `prisma/schema.prisma` (`JournalEntry` model)

**Steps:**

- [ ] **Step 1: Add the column.**

Locate the `JournalEntry` block. After the existing `tags String[] @default([])` line (or anywhere within the model, before `userId`), add:

```prisma
  // Per-entry display style (font / ink color / effect). Plain JSON, non-sensitive.
  // null = all defaults (Caveat / theme text / no effect).
  style       Json?
```

- [ ] **Step 2: Push the schema (no migration file — dev workflow per CLAUDE.md).**

Run: `docker compose exec app npx prisma db push`
Expected: "Your database is now in sync with your Prisma schema." No data loss warning.

- [ ] **Step 3: Regenerate the Prisma client.**

Run: `docker compose exec app npx prisma generate`
Expected: client regenerated.

- [ ] **Step 4: Restart the app to pick up the new client.**

Run: `docker compose restart app`

- [ ] **Step 5: Confirm typecheck still passes.**

Run: `docker compose exec app npx tsc --noEmit`
Expected: clean.

- [ ] **Step 6: Commit.**

```bash
git add prisma/schema.prisma
git commit -m "feat(diary): add JournalEntry.style column"
```

---

## Task 3: Server-side accept, return, and lock-validate `style`

**Files:**
- Modify: `src/lib/entry-lock.ts`
- Modify: `src/app/api/entries/route.ts`
- Modify: `src/app/api/entries/[id]/route.ts`

**Steps:**

- [ ] **Step 1: Extend the lock helper to treat style as locked content.**

In `src/lib/entry-lock.ts`, add to `LockedDiffInput`:

```ts
  oldStyle: unknown            // existing JournalEntry.style as stored (Prisma Json)
  newStyle?: unknown           // candidate replacement
```

In `validateAppendOnlyDiff`, after the existing `newMood` check and before the `newSong` check, add:

```ts
  if (input.newStyle !== undefined) {
    const oldJson = JSON.stringify(input.oldStyle ?? null)
    const newJson = JSON.stringify(input.newStyle ?? null)
    if (oldJson !== newJson) {
      return { ok: false, reason: 'Entry style is locked after the day of writing' }
    }
  }
```

(The deep-equality via `JSON.stringify` is fine here: `style` is a small flat object with primitive values only, key order is consistent because we control the writers.)

- [ ] **Step 2: Update the POST endpoint to accept `style`.**

In `src/app/api/entries/route.ts`, in the `POST` handler:

Add to the destructure of `body` (around line 168):

```ts
      // New: per-entry style
      style,
```

Add an import at the top:

```ts
import { parseStyle } from '@/lib/entry-style'
```

In the `prisma.journalEntry.create` `data` object (around line 222), add:

```ts
        style: style !== undefined ? parseStyle(style) : null,
```

In the GET list handler's `transformedEntries` map (around line 120), include `style`:

```ts
      return {
        ...decrypted,
        // …existing fields…
        style: parseStyle(entry.style),
      }
```

- [ ] **Step 3: Update the PUT endpoint to accept `style` and lock-validate it.**

In `src/app/api/entries/[id]/route.ts`:

Add the import at the top:

```ts
import { parseStyle } from '@/lib/entry-style'
```

Extend the `prisma.journalEntry.findUnique` `select` (around line 84) to include `style`:

```ts
        style: true,
```

Extend the `body` destructure (around line 109) with:

```ts
      style,
```

In the existing locked branch's `validateAppendOnlyDiff` call (around line 135), add the two new fields:

```ts
      validateAppendOnlyDiff({
        oldText: decryptedExisting.text,
        newText: text,
        appendText,
        oldSong: existing.song,
        newSong: song,
        oldStyle: existing.style,
        newStyle: style,
        oldPhotos: existing.photos,
        // …rest unchanged…
      })
```

After the existing `if (mood !== undefined) updateData.mood = mood` line, add:

```ts
    if (style !== undefined) {
      updateData.style = parseStyle(style)
    }
```

In the GET handler, the response already spreads `...decryptedEntry` which includes `style` from Prisma. But to keep wire shape consistent with POST/list, normalize via `parseStyle`:

```ts
    return NextResponse.json({
      ...decryptedEntry,
      // …existing fields…
      style: parseStyle(entry.style),
    })
```

- [ ] **Step 4: Typecheck and lint.**

```bash
docker compose exec app npx tsc --noEmit
docker compose exec app npm run lint
```

Expected: clean.

- [ ] **Step 5: Manual smoke check via curl (or skip if you're confident — this re-tests in Task 8).**

With the app running:

```bash
# Get a session cookie / use the existing dev token. Quick path: log in via UI, then:
curl -s http://localhost:3111/api/entries -b "<cookie>" | jq '.entries[0].style'
```

Expected: `null` for entries that predate this change.

- [ ] **Step 6: Commit.**

```bash
git add src/lib/entry-lock.ts src/app/api/entries/route.ts src/app/api/entries/[id]/route.ts
git commit -m "feat(diary): persist and lock-validate entry.style"
```

---

## Task 4: Desk store + autosave hook plumb-through

**Files:**
- Modify: `src/store/desk.ts`
- Modify: `src/hooks/useAutosaveEntry.ts`

**Steps:**

- [ ] **Step 1: Add `entryStyleDraft` to the desk store.**

In `src/store/desk.ts`, replace the file's body so it reads:

```ts
import { create } from 'zustand'
import type { EntryStyle } from '@/lib/entry-style'

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface DeskStore {
  currentSpread: number
  totalSpreads: number
  leftPageDraft: string
  rightPageDraft: string
  // Per-entry style draft. Lives here for the same reason text drafts do:
  // changing it must not re-render BookSpread, which would tear down the
  // flipbook DOM and steal textarea focus.
  entryStyleDraft: EntryStyle
  autosaveStatus: AutosaveStatus
  goToSpread: (spread: number) => void
  setTotalSpreads: (total: number) => void
  setLeftPageDraft: (updater: string | ((prev: string) => string)) => void
  setRightPageDraft: (updater: string | ((prev: string) => string)) => void
  setDrafts: (left: string, right: string) => void
  setEntryStyleDraft: (next: EntryStyle) => void
  clearDrafts: () => void
  setAutosaveStatus: (status: AutosaveStatus) => void
}

export const useDeskStore = create<DeskStore>()((set) => ({
  currentSpread: 0,
  totalSpreads: 1,
  leftPageDraft: '',
  rightPageDraft: '',
  entryStyleDraft: {},
  autosaveStatus: 'idle',
  goToSpread: (spread) => set({ currentSpread: spread }),
  setTotalSpreads: (total) => set({ totalSpreads: total }),
  setLeftPageDraft: (updater) => set((state) => ({
    leftPageDraft: typeof updater === 'function' ? updater(state.leftPageDraft) : updater,
  })),
  setRightPageDraft: (updater) => set((state) => ({
    rightPageDraft: typeof updater === 'function' ? updater(state.rightPageDraft) : updater,
  })),
  setDrafts: (left, right) => set({ leftPageDraft: left, rightPageDraft: right }),
  setEntryStyleDraft: (next) => set({ entryStyleDraft: next }),
  clearDrafts: () => set({ leftPageDraft: '', rightPageDraft: '', entryStyleDraft: {} }),
  setAutosaveStatus: (status) => set({ autosaveStatus: status }),
}))
```

- [ ] **Step 2: Add `style` to the autosave draft.**

In `src/hooks/useAutosaveEntry.ts`:

Add the import at the top:

```ts
import type { EntryStyle } from '@/lib/entry-style'
```

Extend the `AutosaveDraft` interface (around line 11) with:

```ts
  // Per-entry display style. Always present in the draft (possibly empty {}),
  // sent to the server only when non-empty so existing letter saves don't
  // pick up an empty `style: {}` over the wire.
  style?: EntryStyle
```

In the `body` JSON.stringify call (around line 83), after the `doodles: draft.doodles,` line and before the letter spreads, add:

```ts
      ...(draft.style && Object.keys(draft.style).length > 0 ? { style: draft.style } : {}),
```

- [ ] **Step 3: Typecheck.**

```bash
docker compose exec app npx tsc --noEmit
```

Expected: clean. (BookSpread will pass `style` later in Task 8; at this point the field is just allowed-but-not-required.)

- [ ] **Step 4: Commit.**

```bash
git add src/store/desk.ts src/hooks/useAutosaveEntry.ts
git commit -m "feat(diary): plumb entry style through desk store + autosave"
```

---

## Task 5: Caret coordinates utility

**Files:**
- Modify: `src/lib/textarea-caret.ts`

**Steps:**

- [ ] **Step 1: Export the existing internal helper as a public function.**

In `src/lib/textarea-caret.ts`, change the existing internal `getCaretCoordinates` function so it is exported, and add an at-current-caret convenience wrapper:

Replace this:

```ts
function getCaretCoordinates(
  textarea: HTMLTextAreaElement,
  position: number,
): { top: number; left: number; height: number } {
```

with this:

```ts
export function getCaretCoordinates(
  textarea: HTMLTextAreaElement,
  position: number,
): { top: number; left: number; height: number } {
```

Then add at the end of the file:

```ts
// Caret coordinates at the current selectionStart, in textarea-local pixels
// (relative to the textarea's content-box origin). Effect overlays use this
// to position particles / glow at the pen tip.
export function getCaretLocalCoords(
  textarea: HTMLTextAreaElement,
): { top: number; left: number; height: number } {
  return getCaretCoordinates(textarea, textarea.selectionStart)
}
```

- [ ] **Step 2: Typecheck.**

```bash
docker compose exec app npx tsc --noEmit
```

Expected: clean. The existing internal callers (`isCaretOnFirstVisualRow`, etc.) still resolve to the same function — exporting doesn't change their behavior.

- [ ] **Step 3: Commit.**

```bash
git add src/lib/textarea-caret.ts
git commit -m "feat(diary): expose getCaretCoordinates + getCaretLocalCoords"
```

---

## Task 6: Load four new Google fonts

**Files:**
- Modify: `src/app/layout.tsx`

**Steps:**

- [ ] **Step 1: Import + initialize the four fonts.**

At the top of `src/app/layout.tsx`, change the `next/font/google` import to include the four new families:

```tsx
import {
  EB_Garamond,
  Caveat,
  Patrick_Hand,
  Shadows_Into_Light,
  Indie_Flower,
  Homemade_Apple,
} from "next/font/google";
```

After the existing `caveat` declaration (around line 14-17), add:

```tsx
const patrickHand = Patrick_Hand({
  variable: "--font-patrick-hand",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  preload: false,
});

const shadowsIntoLight = Shadows_Into_Light({
  variable: "--font-shadows",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  preload: false,
});

const indieFlower = Indie_Flower({
  variable: "--font-indie",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  preload: false,
});

const homemadeApple = Homemade_Apple({
  variable: "--font-homemade",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  preload: false,
});
```

- [ ] **Step 2: Add the variables to the body className.**

Change the `<body>` line (around line 66) to:

```tsx
      <body
        className={`${ebGaramond.variable} ${caveat.variable} ${patrickHand.variable} ${shadowsIntoLight.variable} ${indieFlower.variable} ${homemadeApple.variable} antialiased font-serif`}
      >
```

- [ ] **Step 3: Typecheck and restart.**

```bash
docker compose exec app npx tsc --noEmit
docker compose restart app
```

Expected: clean typecheck, app restarts cleanly.

- [ ] **Step 4: Manually verify the CSS variables exist.**

Open `http://localhost:3111` in the browser. In DevTools → Elements → `<body>` → Computed → search for `--font-`. You should see all six (`--font-serif`, `--font-caveat`, `--font-patrick-hand`, `--font-shadows`, `--font-indie`, `--font-homemade`) listed.

The actual font files won't fetch yet (preload: false) — they'll load lazily once a styled element references them.

- [ ] **Step 5: Commit.**

```bash
git add src/app/layout.tsx
git commit -m "feat(diary): load Patrick Hand, Shadows Into Light, Indie Flower, Homemade Apple"
```

---

## Task 7: PenMenu component

**Files:**
- Create: `src/components/desk/PenMenu.tsx`

**Steps:**

- [ ] **Step 1: Create the component.**

```tsx
// src/components/desk/PenMenu.tsx
'use client'

import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  type EntryStyle,
  type FontKey,
  type ColorKey,
  type EffectKey,
  FONT_KEYS,
  COLOR_KEYS,
  EFFECT_KEYS,
  FONT_DEFS,
  COLOR_DEFS,
  EFFECT_DEFS,
  resolveFontFamily,
  resolveInkColor,
} from '@/lib/entry-style'

interface PenMenuProps {
  value: EntryStyle
  onChange: (next: EntryStyle) => void
  onClose: () => void
  themeBodyText: string
  panelBg: string
  panelBorder: string
  labelColor: string
}

export default function PenMenu({
  value,
  onChange,
  onClose,
  themeBodyText,
  panelBg,
  panelBorder,
  labelColor,
}: PenMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click + Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const onDown = (e: MouseEvent) => {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) onClose()
    }
    window.addEventListener('keydown', onKey)
    // mousedown so that clicking a textarea elsewhere on the page closes the menu.
    window.addEventListener('mousedown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onDown)
    }
  }, [onClose])

  const setFont = (font: FontKey) => onChange({ ...value, font })
  const setColor = (color: ColorKey | null) => onChange({ ...value, color })
  const setEffect = (effect: EffectKey | undefined) => {
    const next: EntryStyle = { ...value }
    if (effect) next.effect = effect
    else delete next.effect
    onChange(next)
  }

  const currentFont = value.font ?? 'caveat'
  const currentColorHex = resolveInkColor(value.color, themeBodyText)

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -4, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className="absolute z-50 rounded-xl shadow-lg"
      style={{
        top: '24px',
        right: '0px',
        width: '280px',
        background: panelBg,
        border: `1px solid ${panelBorder}`,
        padding: '14px 14px 12px',
      }}
      role="dialog"
      aria-label="Pen settings"
    >
      {/* Font row */}
      <div
        className="text-[10px] uppercase tracking-[0.15em] mb-2 font-medium"
        style={{ color: labelColor }}
      >
        Font
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {FONT_KEYS.map((key) => {
          const selected = key === currentFont
          return (
            <button
              key={key}
              onClick={() => setFont(key)}
              className="px-2 py-1 rounded-md transition-opacity"
              style={{
                fontFamily: resolveFontFamily(key),
                fontSize: '20px',
                lineHeight: 1,
                color: currentColorHex,
                background: selected ? `${currentColorHex}18` : 'transparent',
                border: `1px solid ${selected ? currentColorHex : panelBorder}`,
                opacity: selected ? 1 : 0.85,
              }}
              title={FONT_DEFS[key].label}
              aria-pressed={selected}
            >
              aA
            </button>
          )
        })}
      </div>

      {/* Color row */}
      <div
        className="text-[10px] uppercase tracking-[0.15em] mb-2 font-medium"
        style={{ color: labelColor }}
      >
        Ink
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {/* Default swatch (null) — rendered as a ring of theme body color. */}
        <button
          onClick={() => setColor(null)}
          className="rounded-full transition-all"
          style={{
            width: '22px',
            height: '22px',
            background: 'transparent',
            border: `2px solid ${themeBodyText}`,
            boxShadow: value.color == null ? `0 0 0 2px ${themeBodyText}33` : 'none',
          }}
          title="Default"
          aria-pressed={value.color == null}
        />
        {COLOR_KEYS.map((key) => {
          const def = COLOR_DEFS[key]
          const selected = value.color === key
          return (
            <button
              key={key}
              onClick={() => setColor(key)}
              className="rounded-full transition-all"
              style={{
                width: '22px',
                height: '22px',
                background: def.hex,
                border: `2px solid ${selected ? def.hex : 'transparent'}`,
                boxShadow: selected ? `0 0 0 2px ${def.hex}33` : 'none',
              }}
              title={def.label}
              aria-pressed={selected}
            />
          )
        })}
      </div>

      {/* Effect row */}
      <div
        className="text-[10px] uppercase tracking-[0.15em] mb-2 font-medium"
        style={{ color: labelColor }}
      >
        Effect
      </div>
      <div className="flex gap-2">
        <EffectChip
          label="None"
          selected={!value.effect}
          onClick={() => setEffect(undefined)}
          accent={currentColorHex}
          panelBorder={panelBorder}
        />
        {EFFECT_KEYS.map((key) => (
          <EffectChip
            key={key}
            label={EFFECT_DEFS[key].label}
            selected={value.effect === key}
            onClick={() => setEffect(key)}
            accent={currentColorHex}
            panelBorder={panelBorder}
          />
        ))}
      </div>
    </motion.div>
  )
}

function EffectChip({
  label,
  selected,
  onClick,
  accent,
  panelBorder,
}: {
  label: string
  selected: boolean
  onClick: () => void
  accent: string
  panelBorder: string
}) {
  return (
    <button
      onClick={onClick}
      className="text-xs px-3 py-1 rounded-full transition-all"
      style={{
        background: selected ? `${accent}18` : 'transparent',
        border: `1px solid ${selected ? accent : panelBorder}`,
        color: accent,
        opacity: selected ? 1 : 0.85,
      }}
      aria-pressed={selected}
    >
      {label}
    </button>
  )
}
```

- [ ] **Step 2: Typecheck and lint.**

```bash
docker compose exec app npx tsc --noEmit
docker compose exec app npm run lint
```

Expected: clean.

- [ ] **Step 3: Commit.**

```bash
git add src/components/desk/PenMenu.tsx
git commit -m "feat(diary): pen menu popover (font / ink / effect)"
```

---

## Task 8: Wire pen icon, apply style on both pages, BookSpread integration

**Files:**
- Modify: `src/components/desk/LeftPage.tsx`
- Modify: `src/components/desk/RightPage.tsx`
- Modify: `src/components/desk/BookSpread.tsx`

**Steps:**

- [ ] **Step 1: BookSpread — load `entry.style` on entry change and pass it into the autosave draft.**

In `src/components/desk/BookSpread.tsx`:

Add to the existing `Entry` interface (the local one used inside this file):

```ts
  style?: import('@/lib/entry-style').EntryStyle | null
```

Where the active entry is loaded into drafts (search for `setLeftPageDraft` / `setRightPageDraft` initialization in the entry-load effect), also seed the style draft. Concretely, in the same effect that calls `setDrafts(left, right)` for a loaded entry, add:

```tsx
import { parseStyle } from '@/lib/entry-style'
// …
const setEntryStyleDraft = useDeskStore((s) => s.setEntryStyleDraft)
// Inside the load effect, alongside setDrafts(left, right):
setEntryStyleDraft(parseStyle(entry?.style ?? null))
```

(`clearDrafts` already resets `entryStyleDraft` to `{}` per Task 4 — used when the user clicks "New Entry".)

In the autosave draft assembly (the `useAutosaveEntry` `trigger` call site), add `style` to the draft:

```ts
const entryStyleDraft = useDeskStore((s) => s.entryStyleDraft)
// …
trigger({
  text: /* …existing… */,
  mood: /* …existing… */,
  song: /* …existing… */,
  photos: /* …existing… */,
  doodles: /* …existing… */,
  style: entryStyleDraft,
})
```

- [ ] **Step 2: LeftPage — pen icon trigger, mount `PenMenu`, apply style.**

In `src/components/desk/LeftPage.tsx`:

Add the imports:

```tsx
import { AnimatePresence } from 'framer-motion'
import PenMenu from './PenMenu'
import { resolveFontFamily, resolveInkColor, parseStyle, type EntryStyle } from '@/lib/entry-style'
import { isEntryLocked } from '@/lib/entry-lock-client'
```

Read the style draft + setter from the desk store, alongside the existing draft reads:

```tsx
const entryStyleDraft = useDeskStore((s) => s.entryStyleDraft)
const setEntryStyleDraft = useDeskStore((s) => s.setEntryStyleDraft)
```

Compute the active style — for the new-entry spread, use the draft; for an existing entry, use `entry.style`. Add right after `colors`:

```tsx
const activeStyle: EntryStyle = isNewEntry
  ? entryStyleDraft
  : parseStyle((entry as unknown as { style?: unknown })?.style ?? null)
const fontFamily = resolveFontFamily(activeStyle.font)
const inkColor = resolveInkColor(activeStyle.color, colors.bodyText)
const lockedForEntry = !isNewEntry && entry
  ? isEntryLocked(entry.createdAt, { entryType: 'normal' })
  : false
```

Replace the existing styling on **both** the new-entry `<textarea>` (around line 279-289) and the read-only viewing `<div>` (around line 354-365):

- Replace `fontFamily: 'var(--font-caveat), Georgia, serif'` with `fontFamily,` (the local variable defined above).
- Replace `color: textColor` (in the textarea) with `color: inkColor`.
- In the read-only view div, the existing line is `color: plainText ? textColor : mutedColor` — change it to `color: plainText ? inkColor : mutedColor` so the empty-state placeholder still uses `mutedColor`.
- Replace `caretColor: accentColor` with `caretColor: inkColor` on the textarea.

Add a pen-nib icon + popover at the top-right of the writing area. Inside the new-entry "Writing Area" `<div className="flex-1 min-h-0 flex flex-col">` block, change it to a `relative` wrapper and add the pen icon next to the existing label. Concretely:

```tsx
        {/* Writing Area */}
        <div className="flex-1 min-h-0 flex flex-col relative">
          <div
            className="text-[10px] uppercase tracking-[0.15em] mb-1 font-medium flex-shrink-0"
            style={{ color: mutedColor }}
          >
            Write your thoughts
          </div>

          {/* Pen-nib icon — only on entries the user can still style. The
              new-entry spread always qualifies; viewing branches gate this
              themselves (the v1 viewing branch below doesn't render this
              block). The lockedForEntry check is belt-and-suspenders for
              future cases where existing entries are also editable. */}
          {!lockedForEntry && (
            <>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="absolute right-0 top-0 w-6 h-6 flex items-center justify-center rounded-md transition-opacity"
                style={{
                  color: accentColor,
                  opacity: menuOpen ? 1 : 0.65,
                }}
                title="Pen settings"
                aria-label="Pen settings"
                aria-expanded={menuOpen}
              >
                <PenNibIcon />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <PenMenu
                    value={entryStyleDraft}
                    onChange={setEntryStyleDraft}
                    onClose={() => setMenuOpen(false)}
                    themeBodyText={colors.bodyText}
                    panelBg={colors.doodleBg}
                    panelBorder={colors.doodleBorder}
                    labelColor={mutedColor}
                  />
                )}
              </AnimatePresence>
            </>
          )}

          {/* Textarea + effect overlays share a relative sub-wrapper so the
              overlays' coordinate origin matches the textarea's border-box.
              This keeps particle / glow positions aligned with the caret. */}
          <div className="flex-1 min-h-0 relative">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="What's on your mind today..."
              className="absolute inset-0 w-full h-full resize-none outline-none"
              style={{
                color: inkColor,
                fontFamily,
                fontSize: '20px',
                lineHeight: `${LINE_HEIGHT}px`,
                caretColor: inkColor,
                backgroundColor: 'transparent',
                backgroundImage: linePattern,
                backgroundAttachment: 'local',
                overflow: 'hidden',
              }}
            />
            {/* Effect overlays for Tasks 9, 10, 11 mount here. */}
          </div>
        </div>
```

Add at the top of the component body (alongside the other `useState` calls):

```tsx
const [menuOpen, setMenuOpen] = useState(false)
```

Add the icon helper at the bottom of the file (just above `LeftPage.displayName`):

```tsx
function PenNibIcon() {
  // 16px pen nib outline. Stroke uses currentColor so the icon picks up
  // the button's color (theme accent).
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M11.5 1.5L14.5 4.5L6 13H3V10L11.5 1.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M9.5 3.5L12.5 6.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  )
}
```

For the **existing-entry view path** (the lower `motion.div` around line 301), keep the existing layout. No pen icon is added there in v1 — only the read-only `<div>` styling needs to change so the saved style renders (already handled by the `color` / `fontFamily` substitution at the top of this step).

- [ ] **Step 3: RightPage — apply the same `fontFamily` / `inkColor` to its textarea + view div.**

In `src/components/desk/RightPage.tsx`:

Add imports:

```tsx
import { resolveFontFamily, resolveInkColor, parseStyle, type EntryStyle } from '@/lib/entry-style'
```

Inside the component body, after `colors`, add (subscribing — RightPage must re-render when the user picks a new font/color so it applies live):

```tsx
const entryStyleDraft = useDeskStore((s) => s.entryStyleDraft)
const activeStyle: EntryStyle = isNewEntry
  ? entryStyleDraft
  : parseStyle((entry as unknown as { style?: unknown })?.style ?? null)
const fontFamily = resolveFontFamily(activeStyle.font)
const inkColor = resolveInkColor(activeStyle.color, colors.bodyText)
```

In the new-entry `<textarea>` (around line 329-347), replace `color: textColor` with `color: inkColor`, replace `fontFamily: 'var(--font-caveat), Georgia, serif'` with `fontFamily,`, and replace `caretColor: accentColor` with `caretColor: inkColor`.

Also wrap the `<textarea>` in a `relative` sub-div to give effect overlays a clean coord system (same pattern as LeftPage):

```tsx
<div className="flex-1 min-h-0 relative">
  <textarea
    ref={textareaRef}
    value={text}
    onChange={handleTextChange}
    onKeyDown={handleKeyDown}
    placeholder="Begin writing..."
    className="absolute inset-0 w-full h-full resize-none outline-none"
    style={{
      color: inkColor,
      fontFamily,
      fontSize: '20px',
      lineHeight: `${LINE_HEIGHT}px`,
      caretColor: inkColor,
      backgroundColor: 'transparent',
      backgroundImage: linePattern,
      backgroundAttachment: 'local',
      overflow: 'hidden',
    }}
  />
  {/* Effect overlays for Tasks 9, 10, 11 mount here. */}
</div>
```

In the existing-entry view `<div>` (around line 432-446), replace `color: plainText ? textColor : mutedColor` with `color: plainText ? inkColor : mutedColor`, and replace the hardcoded `fontFamily: 'var(--font-caveat), Georgia, serif'` with `fontFamily`.

- [ ] **Step 4: Typecheck, lint, restart.**

```bash
docker compose exec app npx tsc --noEmit
docker compose exec app npm run lint
docker compose restart app
```

Expected: clean.

- [ ] **Step 5: Manual smoke test.**

- Open `http://localhost:3111` and start a new entry.
- Click the pen icon — menu opens.
- Pick **Patrick Hand** — both pages' text re-renders in Patrick Hand. (First click triggers a brief font fetch — acceptable.)
- Pick **Sepia** — caret + body text recolor.
- Pick **Sparkle** then **None** — radio behavior works.
- Click outside the menu / press Escape — menu closes.
- Type a few characters; wait 1.5s — autosave fires (status footer shows "saving…" → "saved").
- Reload the page → entry reopens with the saved font + color.
- Open DevTools → Network → confirm `PUT /api/entries/<id>` body contains `"style": { "font": "patrick-hand", "color": "sepia" }`.

- [ ] **Step 6: Commit.**

```bash
git add src/components/desk/LeftPage.tsx src/components/desk/RightPage.tsx src/components/desk/BookSpread.tsx
git commit -m "feat(diary): pen menu wired to writing surface + autosave"
```

---

## Task 9: SparkleTrail effect

**Files:**
- Create: `src/components/desk/effects/SparkleTrail.tsx`
- Modify: `src/components/desk/LeftPage.tsx`
- Modify: `src/components/desk/RightPage.tsx`

**Steps:**

- [ ] **Step 1: Create the overlay component.**

```tsx
// src/components/desk/effects/SparkleTrail.tsx
'use client'

import React, { useEffect, useRef, useState } from 'react'
import { getCaretLocalCoords } from '@/lib/textarea-caret'

interface Particle {
  id: number
  x: number       // textarea-local px
  y: number
  born: number    // timestamp
}

const PARTICLE_TTL = 600
const MAX_PARTICLES = 12
const SCATTER = 4

interface SparkleTrailProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  inkColor: string
  enabled: boolean
}

export default function SparkleTrail({ textareaRef, inkColor, enabled }: SparkleTrailProps) {
  const [particles, setParticles] = useState<Particle[]>([])
  const idRef = useRef(0)

  useEffect(() => {
    if (!enabled) return
    const ta = textareaRef.current
    if (!ta) return

    const onInput = () => {
      try {
        const { left, top, height } = getCaretLocalCoords(ta)
        const x = left + (Math.random() - 0.5) * SCATTER * 2
        const y = top + height * 0.6 + (Math.random() - 0.5) * SCATTER
        const id = ++idRef.current
        setParticles((prev) => {
          const next = prev.length >= MAX_PARTICLES ? prev.slice(-MAX_PARTICLES + 1) : prev
          return [...next, { id, x, y, born: performance.now() }]
        })
      } catch {
        // measureAt can throw if the textarea is detaching — ignore.
      }
    }
    ta.addEventListener('input', onInput)
    return () => ta.removeEventListener('input', onInput)
  }, [textareaRef, enabled])

  // Sweep dead particles every 200ms.
  useEffect(() => {
    if (!enabled) return
    const t = setInterval(() => {
      const cutoff = performance.now() - PARTICLE_TTL
      setParticles((prev) => prev.filter((p) => p.born > cutoff))
    }, 200)
    return () => clearInterval(t)
  }, [enabled])

  if (!enabled) return null

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ overflow: 'hidden' }}
      aria-hidden
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className="hearth-sparkle"
          style={{
            left: `${p.x}px`,
            top: `${p.y}px`,
            background: inkColor,
            boxShadow: `0 0 6px ${inkColor}`,
          }}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Add the particle keyframes once, in `src/app/globals.css`.**

Append:

```css
.hearth-sparkle {
  position: absolute;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  pointer-events: none;
  animation: hearth-sparkle-fade 600ms ease-out forwards;
  will-change: transform, opacity;
}

@keyframes hearth-sparkle-fade {
  0%   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -50%) translateY(-8px) scale(0.4); }
}
```

- [ ] **Step 3: Mount on LeftPage and RightPage above the textarea (effect = sparkle).**

In `src/components/desk/LeftPage.tsx`:

Add the import:

```tsx
import SparkleTrail from './effects/SparkleTrail'
```

In the new-entry writing area JSX, mount the overlay inside the **inner relative sub-wrapper** (the one that wraps the textarea, added in Task 8 Step 2 — marked with the comment `{/* Effect overlays for Tasks 9, 10, 11 mount here. */}`). Replace that comment with:

```tsx
<SparkleTrail
  textareaRef={textareaRef}
  inkColor={inkColor}
  enabled={activeStyle.effect === 'sparkle' && isNewEntry}
/>
```

In `src/components/desk/RightPage.tsx`, do the same — locate the equivalent sub-wrapper added in Task 8 Step 3 and replace its `{/* Effect overlays … */}` comment with the same `<SparkleTrail …/>` element.

- [ ] **Step 4: Typecheck, lint, restart, smoke test.**

```bash
docker compose exec app npx tsc --noEmit
docker compose exec app npm run lint
docker compose restart app
```

Manual: open the diary, pick **Sparkle** in the pen menu, type — verify dots appear at the caret on each keystroke and fade up. Switch to **None** — sparkles stop. Switch back to **Sparkle** — sparkles resume. Switch fonts — sparkles still appear at the new caret position (different glyph widths).

- [ ] **Step 5: Commit.**

```bash
git add src/components/desk/effects/SparkleTrail.tsx src/app/globals.css src/components/desk/LeftPage.tsx src/components/desk/RightPage.tsx
git commit -m "feat(diary): sparkle trail overlay on textarea typing"
```

---

## Task 10: SaveShimmer effect

**Files:**
- Create: `src/components/desk/effects/SaveShimmer.tsx`
- Modify: `src/components/desk/LeftPage.tsx`
- Modify: `src/components/desk/RightPage.tsx`
- Modify: `src/app/globals.css`

**Steps:**

- [ ] **Step 1: Create the component.**

```tsx
// src/components/desk/effects/SaveShimmer.tsx
'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useDeskStore } from '@/store/desk'

interface SaveShimmerProps {
  enabled: boolean
}

export default function SaveShimmer({ enabled }: SaveShimmerProps) {
  const status = useDeskStore((s) => s.autosaveStatus)
  const [pulseId, setPulseId] = useState(0)
  const prevStatus = useRef(status)

  useEffect(() => {
    if (enabled && prevStatus.current === 'saving' && status === 'saved') {
      setPulseId((n) => n + 1)
    }
    prevStatus.current = status
  }, [status, enabled])

  if (!enabled) return null

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {pulseId > 0 && <span key={pulseId} className="hearth-shimmer" />}
    </div>
  )
}
```

- [ ] **Step 2: Add the keyframes to `src/app/globals.css`.**

Append:

```css
.hearth-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    100deg,
    transparent 0%,
    rgba(255, 255, 255, 0) 35%,
    rgba(255, 255, 255, 0.18) 50%,
    rgba(255, 255, 255, 0) 65%,
    transparent 100%
  );
  transform: translateX(-100%);
  animation: hearth-shimmer-sweep 700ms ease-out forwards;
  pointer-events: none;
}

@keyframes hearth-shimmer-sweep {
  to { transform: translateX(100%); }
}
```

- [ ] **Step 3: Mount on LeftPage and RightPage (writing area, sparkle-only).**

In both `LeftPage.tsx` and `RightPage.tsx`, inside the inner relative sub-wrapper (the same one that holds `SparkleTrail`), add right after the `SparkleTrail` element:

```tsx
<SaveShimmer enabled={activeStyle.effect === 'sparkle' && isNewEntry} />
```

Add the import in both files:

```tsx
import SaveShimmer from './effects/SaveShimmer'
```

- [ ] **Step 4: Typecheck, lint, restart, smoke test.**

```bash
docker compose exec app npx tsc --noEmit
docker compose exec app npm run lint
docker compose restart app
```

Manual: with **Sparkle** selected, type a few characters and stop. Wait 1.5s for the autosave debounce. When the status footer transitions to "saved," a soft light gradient sweeps left-to-right across both writing areas in ~700ms.

- [ ] **Step 5: Commit.**

```bash
git add src/components/desk/effects/SaveShimmer.tsx src/app/globals.css src/components/desk/LeftPage.tsx src/components/desk/RightPage.tsx
git commit -m "feat(diary): save shimmer on autosave saved transition"
```

---

## Task 11: WetInkGlow effect

**Files:**
- Create: `src/components/desk/effects/WetInkGlow.tsx`
- Modify: `src/components/desk/LeftPage.tsx`
- Modify: `src/components/desk/RightPage.tsx`

**Steps:**

- [ ] **Step 1: Create the overlay.**

```tsx
// src/components/desk/effects/WetInkGlow.tsx
'use client'

import React, { useEffect, useRef, useState } from 'react'
import { getCaretLocalCoords } from '@/lib/textarea-caret'

const DRY_TIMEOUT = 1200
const PULSE_DECAY = 250

interface WetInkGlowProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  inkColor: string
  enabled: boolean
}

export default function WetInkGlow({ textareaRef, inkColor, enabled }: WetInkGlowProps) {
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null)
  const [pulse, setPulse] = useState(0)             // 0 = dry, 1 = fresh keystroke
  const [active, setActive] = useState(false)        // false after DRY_TIMEOUT idle
  const dryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!enabled) return
    const ta = textareaRef.current
    if (!ta) return

    const tick = () => {
      try {
        const { left, top, height } = getCaretLocalCoords(ta)
        setCoords({ x: left, y: top + height * 0.5 })
      } catch {
        /* detaching — ignore */
      }
    }

    const onInput = () => {
      tick()
      setActive(true)
      setPulse(1)
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current)
      pulseTimerRef.current = setTimeout(() => setPulse(0), PULSE_DECAY)
      if (dryTimerRef.current) clearTimeout(dryTimerRef.current)
      dryTimerRef.current = setTimeout(() => setActive(false), DRY_TIMEOUT)
    }
    const onMove = () => tick()  // caret moved via arrow keys / click

    ta.addEventListener('input', onInput)
    ta.addEventListener('keyup', onMove)
    ta.addEventListener('click', onMove)
    tick()
    return () => {
      ta.removeEventListener('input', onInput)
      ta.removeEventListener('keyup', onMove)
      ta.removeEventListener('click', onMove)
      if (dryTimerRef.current) clearTimeout(dryTimerRef.current)
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current)
    }
  }, [textareaRef, enabled])

  if (!enabled || !coords) return null

  const baseOpacity = 0.35
  const pulseBoost = 0.20
  const opacity = active ? baseOpacity + pulse * pulseBoost : 0

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      <span
        style={{
          position: 'absolute',
          left: `${coords.x}px`,
          top: `${coords.y}px`,
          width: '24px',
          height: '24px',
          marginLeft: '-12px',
          marginTop: '-12px',
          borderRadius: '50%',
          background: inkColor,
          filter: 'blur(4px)',
          opacity,
          transition: 'opacity 200ms ease-out',
        }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Mount on LeftPage and RightPage with locked-entry gating.**

In both `LeftPage.tsx` and `RightPage.tsx`, inside the inner relative sub-wrapper (after `SparkleTrail` and `SaveShimmer`), add:

```tsx
<WetInkGlow
  textareaRef={textareaRef}
  inkColor={inkColor}
  enabled={activeStyle.effect === 'wet-ink' && isNewEntry}
/>
```

Add the import in both files:

```tsx
import WetInkGlow from './effects/WetInkGlow'
```

(The `isNewEntry` gate plus the existing rule that pen menu is hidden on locked entries together enforce: wet ink never mounts on a locked-entry view. Belt-and-suspenders matches the spec's "Effect on locked entries" decision.)

- [ ] **Step 3: Typecheck, lint, restart, smoke test.**

```bash
docker compose exec app npx tsc --noEmit
docker compose exec app npm run lint
docker compose restart app
```

Manual:
- Pick **Wet Ink** in the pen menu, start typing — a soft ink-colored glow follows the caret.
- Stop typing, wait ~1.2s — the glow fades.
- Resume typing — the glow comes back.
- Click elsewhere in the textarea — the glow re-anchors to the new caret position.
- Pick **None** — glow disappears immediately.

- [ ] **Step 4: Commit.**

```bash
git add src/components/desk/effects/WetInkGlow.tsx src/components/desk/LeftPage.tsx src/components/desk/RightPage.tsx
git commit -m "feat(diary): wet ink caret glow with idle dry-out"
```

---

## Task 12: End-to-end smoke verification

**Files:** none — pure verification.

This task is a mini-checklist before declaring the feature done. Run through each item in the browser at `http://localhost:3111`. Fix any failures with a focused commit before moving on.

- [ ] **Each font renders** — open the pen menu, click each of the 5 font swatches in turn, confirm both pages re-render. Caveat appears instantly; the other four show a brief font swap from Georgia to the loaded font on first render.

- [ ] **Each ink color works** — click each of the 7 ink swatches (Default + 6 named), confirm caret + body text both change. Default tracks the active theme (try switching themes via the theme switcher: a Default-ink entry retints; a named-ink entry does not).

- [ ] **Sparkle effect** — type, see particles trail. Stop typing for 1.5s, autosave fires, see the shimmer sweep across both pages.

- [ ] **Wet ink effect** — type, see glow follow caret. Stop typing 1.2s, glow fades. Click elsewhere in textarea, glow re-positions.

- [ ] **Effect "None"** — no overlays, no shimmer.

- [ ] **Persistence** — pick a non-default style, type, wait for "saved", reload the page → entry reopens with the same style.

- [ ] **Network payload** — DevTools → Network → first POST `/api/entries` after entering style: body contains `style: { font: …, color: …, effect: … }`. Subsequent PUTs do too.

- [ ] **Lock enforcement (manual or scripted)** — temporarily change the system date forward by one day (or run a SQL `UPDATE journal_entries SET "createdAt" = NOW() - INTERVAL '2 days' WHERE id = '<id>'`), reload. Confirm:
  - Pen icon is hidden on the now-locked entry.
  - The saved style still renders on the locked view.
  - WetInkGlow does not mount.
  - A direct `PUT /api/entries/<id>` from curl with a new `style` returns 403 with reason "Entry style is locked after the day of writing".

- [ ] **Cross-spine navigation still works** — type a long entry that spans both pages, use ArrowDown / ArrowUp to cross the spine, confirm caret moves correctly with each font.

- [ ] **Page-overflow split still works** — with **Homemade Apple** (widest font), keep typing past the page break. The overflow word still moves to the right page; no infinite loop, no broken split.

- [ ] **Entries created before this feature** — open one. `style = null`, renders with all defaults (Caveat / theme text / no effect) exactly as before this PR. No empty pen menu. No regressions.

- [ ] **No lint or typecheck regressions:**

```bash
docker compose exec app npx tsc --noEmit
docker compose exec app npm run lint
docker compose exec app npm run build
```

Expected: all clean.

- [ ] **Final commit** — if any fixes were needed, they should each have been their own commit. Otherwise no commit for this task.

---

## Self-Review Notes

**Spec coverage** (each spec section → task that implements it):

- §1 Data model → Tasks 1, 2
- §2 Server persistence + lock → Task 3
- §3 Client state flow → Task 4 (store + autosave) and Task 8 (BookSpread integration)
- §4 Pen menu UI → Task 7 (component) + Task 8 (mount in LeftPage)
- §5 Apply style to writing surface → Task 8
- §6a Sparkle (trail + shimmer) → Tasks 9, 10
- §6b Wet ink → Task 11
- §6 Locked-entry behavior → Task 8 (pen icon gated by `lockedForEntry`) + Task 11 (`isNewEntry` gate on WetInkGlow) + verified in Task 12
- §7 Font loading → Task 6
- §8 Component & file inventory → covered across all tasks
- §9 Default ink dynamic → Task 1 (`resolveInkColor` reads `themeBodyText` arg) + Task 12 verification
- §10 Char count / page break unchanged → Task 12 verification
- §11 No telemetry → no task needed

**Ambiguity / drift checks:**
- All `EntryStyle` consumers go through `resolveFontFamily` / `resolveInkColor` / `parseStyle` — single source of truth.
- `getCaretLocalCoords` defined in Task 5 is used by SparkleTrail (Task 9) and WetInkGlow (Task 11) — name matches across tasks.
- `inkColor` and `fontFamily` are computed identically in LeftPage and RightPage (Task 8) — kept consistent by deriving from `activeStyle` via the same resolvers.
- Pen icon hidden on locked entries: enforced via `!lockedForEntry` gate (Task 8). Effect mounts gated by `isNewEntry` (Tasks 9-11) — both gates point at the same condition in practice for the v1 scope.

**No placeholders / TODOs:** verified — every step has either concrete code or a concrete command with expected output.

---

## Out of scope (parked)

Carried over from the spec for clarity:

- Inline / per-word styling (would require TipTap migration).
- Hindi transliteration + Devanagari fonts.
- Lists / checkboxes / numbered lists.
- Mobile diary surface (`MobileJournalEntry.tsx`).
- A user-level "favorite pen" preference.
- Additional effects (candlelight, drift, feather quill).
