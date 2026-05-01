# Pen menu — per-entry diary styling

**Date:** 2026-04-30
**Scope:** New-entry and existing-entry diary spread (`BookSpread` / `LeftPage` / `RightPage`).
**Surface:** Desktop diary writing surface.

## Problem

The diary today renders every entry with the same hand-picked combination: Caveat font, the active theme's body-text color, no visual effects beyond static rendering. There is no way for the user to make an individual entry look different — no choice of font, no choice of ink color, no playful per-entry flourishes. The user wants per-entry expression: pick a font, pick an ink color, optionally enable a sparkle or wet-ink effect, and have those choices live with that entry forever.

The constraints:

- Stay with `<textarea>` for writing. Migrating to a rich text editor would force rebuilding overflow split (`LeftPage.handleTextChange`), autosave (`useAutosaveEntry`), and entry lock (`src/lib/entry-lock.ts`). Out of scope.
- Per-entry styling is durable — saved with the entry, rendered on later views, but only editable while the entry itself is editable (same calendar day per the existing entry-lock rules).

## Goals

1. A small pen-nib icon on the left page opens a popover with three controls: **Font**, **Ink** (color), **Effect**.
2. Choices apply to the entry's text on **both** pages (left + right) immediately and persist via the existing autosave path.
3. Five fonts: `Caveat` (default), `Patrick Hand`, `Shadows Into Light`, `Indie Flower`, `Homemade Apple`. All Google Fonts.
4. Seven ink colors: **Default** (theme text, dynamic), Charcoal, Sepia, Indigo, Forest, Plum, Dusty Rose.
5. Three effects: **None**, **Sparkle**, **Wet Ink**. Mutually exclusive.
6. Locked (past-day) entries render with their saved style. The pen menu is hidden — style is read-only.
7. No regression to existing autosave, page-overflow, cross-spine navigation, or entry-lock behavior.

## Non-goals

- Inline / per-word styling within an entry (would require rich text editor migration).
- Hindi transliteration (deferred).
- Lists / checkboxes / numbered lists (deferred).
- Mobile diary surface (`MobileJournalEntry.tsx`) — separate follow-up.
- Per-user default style preference. Default is always Caveat / theme-text / None.

## Design

### 1. Data model

A single optional JSON column on `JournalEntry`:

```prisma
style Json?  // { font?: FontKey; color?: ColorKey | null; effect?: EffectKey }
```

- Additive migration. No backfill — existing entries have `style = null` and render exactly as today.
- All three sub-fields are optional. Missing field = default for that field.
- Persisted shape is intentionally *keys*, not concrete values — so changing the swatch list, swapping a font, or rebalancing effects later doesn't require rewriting saved entries.

`src/lib/entry-style.ts` (new):

```ts
export type FontKey = 'caveat' | 'patrick-hand' | 'shadows-into-light' | 'indie-flower' | 'homemade-apple'
export type ColorKey = 'charcoal' | 'sepia' | 'indigo' | 'forest' | 'plum' | 'dusty-rose'  // 'default' = stored as null
export type EffectKey = 'sparkle' | 'wet-ink'  // 'none' = stored as missing/undefined

export interface EntryStyle {
  font?: FontKey
  color?: ColorKey | null
  effect?: EffectKey
}

export const DEFAULT_FONT: FontKey = 'caveat'

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

export function resolveFontFamily(key: FontKey | undefined): string  // CSS font-family string
export function resolveInkColor(key: ColorKey | null | undefined, themeTextColor: string): string
```

The `resolve*` helpers centralize "what does this key render as right now" so LeftPage, RightPage, the pen menu, and the effect overlays all agree without duplicating mapping logic.

### 2. Server: persistence and lock enforcement

- `src/app/api/entries/route.ts` (POST) — accept optional `style: EntryStyle` on create. Validate keys against the allowed enums; reject unknown keys with 400.
- `src/app/api/entries/[id]/route.ts` (PUT) — accept `style` updates. Treat `style` as **content** for lock purposes: if the entry is past its calendar day, reject style edits with 403, mirroring how text edits are rejected today.
- GET endpoints — return `style` alongside other fields.
- `src/lib/entry-lock.ts` — `validateAppendOnlyDiff` already controls what fields a locked entry can change. Extend it so style is in the "frozen content" set: changing style on a locked entry is rejected; leaving it unchanged is permitted (so PUTs that only modify empty slots don't accidentally trip on style).

### 3. Client: state flow

`src/store/desk.ts` — add a `entryStyleDraft` field next to the existing draft fields:

```ts
entryStyleDraft: EntryStyle
setEntryStyleDraft: (next: EntryStyle) => void
```

Lives in the desk store for the same reason text drafts do: changing it must not re-render `BookSpread` (which would tear down the flipbook DOM and steal textarea focus). The pen menu reads/writes the draft; the writing textareas + effect overlays read it.

`src/hooks/useAutosaveEntry.ts` — extend `AutosaveDraft` with an optional `style: EntryStyle`. Include it in the POST/PUT body when present, omitting it when `undefined` so existing letter saves don't pick up an empty `style: {}`. The 1500ms debounce already in place handles all-at-once style changes naturally.

`BookSpread` (the diary container) — passes `entryStyleDraft` into the autosave draft on every keystroke / style change, exactly as it does for text and song today.

When opening an existing entry, `BookSpread` initializes `entryStyleDraft` from the loaded entry's `style` field; `clearDrafts` resets it to `{}`.

### 4. UI: the pen menu

**Trigger.** A small pen-nib icon (~20×20) sits at the top-right of the left page's writing area — rendered inside the same flex column as the "Write your thoughts" label, absolutely positioned to the row's top-right so it doesn't displace the textarea. Hidden on locked entries (read-only days). Static SVG, accent-warm color, hover bumps opacity. Lives in `LeftPage` (not `BookSpread`) so opening the popover does not re-render the flipbook.

**Popover.** Anchored under the icon, offset so it doesn't cover the writing area. ~280px wide.

```
┌─ Pen ───────────────────────┐
│ Font                        │
│   ⌐aA¬  ⌐aA¬  ⌐aA¬          │   ← swatch buttons rendered in the actual font
│   ⌐aA¬  ⌐aA¬                │      (each is a sample of the user's last typed
│                             │       word, falling back to "aA")
│ Ink                         │
│   ◯ ● ● ● ● ● ●            │   ← Default swatch first (ring), then 6 dots
│                             │
│ Effect                      │
│   [None] [Sparkle] [Wet]    │
└─────────────────────────────┘
```

- Selecting a font/color/effect updates the desk store immediately. The textareas re-render with the new style; the autosave debounce starts.
- Outside-click and Escape close the popover. Selection is *not* canceled — choices commit on click.
- The popover lives in a portal so it can escape page-flip transforms cleanly.

`src/components/desk/PenMenu.tsx` (new):

```tsx
<PenMenu
  value={entryStyleDraft}
  onChange={setEntryStyleDraft}
  onClose={...}
  themeTextColor={...}
/>
```

### 5. Applying the style to the writing surface

`LeftPage.tsx` and `RightPage.tsx` both read `entryStyleDraft` from the desk store. The textarea and the read-only-view div both compute:

- `fontFamily` from `resolveFontFamily(style.font)` (falls back to `var(--font-caveat), Georgia, serif`).
- `color` from `resolveInkColor(style.color, colors.bodyText)`.
- `caretColor` = the same resolved ink color (so the caret matches the chosen pen).

For viewing existing entries, the same resolution runs against `entry.style` instead of the draft.

Page-overflow split (`LeftPage.handleTextChange`) is unaffected: the binary search measures the live textarea, which already reflects the active font. Different fonts → different overflow points → still correct.

### 6. Effects — implementation

#### 6a. Sparkle (cursor trail + save shimmer)

`src/components/desk/effects/SparkleTrail.tsx`:

- Rendered as an absolutely-positioned overlay above each textarea. `pointer-events: none`.
- Listens to the page's `input` events (capture-phase on a parent element so the textarea isn't intercepted).
- On each input, computes the current caret screen position via the existing caret-mirror pattern (extend `src/lib/textarea-caret.ts` if needed; `getCaretLeftOffset` already exists, add `getCaretTopOffset` if not present).
- Spawns 1 particle per keystroke at caret position with a small random scatter (±4px). Particle = a 2px dot, ink-color, `box-shadow` glow. CSS animation: scale 1 → 0.4, opacity 1 → 0, `transform: translateY(-6px)` over ~600ms, then unmount.
- Cap concurrent particles at 12; oldest gets removed on overflow. Cheap to render.

`src/components/desk/effects/SaveShimmer.tsx`:

- Subscribes to `useDeskStore((s) => s.autosaveStatus)`.
- When status transitions `'saving' → 'saved'`, renders a one-shot 700ms CSS sweep: a wide, low-opacity, soft-light gradient that translates from -100% to 200% across the writing area. Fires on both pages of the spread simultaneously.
- Tied to the entry's effect being `sparkle` — silent for `none` and `wet-ink`.

#### 6b. Wet ink — pragmatic version

`src/components/desk/effects/WetInkGlow.tsx`:

- A blurred, ink-colored disk (~12px radius, opacity ~0.35, `filter: blur(4px)`) tracks the live caret position.
- `transform: translate(x, y)` updates on every `input`/`keyup` using the caret-mirror coords.
- Each keystroke briefly bumps opacity (0.35 → 0.55) and decays back over ~250ms (the "fresh ink" pulse).
- After 1200ms of typing inactivity, the disk fades to opacity 0 (ink "drying").
- On the next keystroke, fades back in.

This avoids per-glyph tracking (impractical with non-monospace Caveat etc.) but reads as "wet pen tip" rather than "every letter glowing." Honest trade-off documented here.

**Locked-entry behavior:**

- Saved style is rendered on locked entries.
- Sparkle: trail does not run (no typing happens), but the **save shimmer** also does not fire (no save). Functionally inert on locked entries — no special-case code needed.
- Wet ink: explicitly disabled on locked entries (the disk doesn't mount). Wet ink signals "this is being written right now" — meaningless after lock.

A small helper `shouldRenderEffect(effect, isLocked)` keeps this branching in one place.

### 7. Font loading

`next/font/google` is already used for Caveat (`var(--font-caveat)`). The four new fonts are declared in the same place, each exposing a CSS variable (`--font-patrick-hand`, `--font-shadows`, `--font-indie`, `--font-homemade`).

Loading strategy:

- **Caveat** keeps `preload: true` (it's the default and is on screen instantly on every diary visit).
- The other four are declared with `display: 'swap'` and `preload: false`. The CSS for each is *always* emitted — `next/font/google` injects the `@font-face` rule and the variable definition regardless of `preload`. The actual woff2 file fetches when the browser first paints an element that resolves to that family.
- Two trigger paths for those fetches:
  1. **Pen menu opens** — swatches render in their respective fonts → all four fetch in parallel (~120KB total).
  2. **Existing entry loads with a non-Caveat saved style** — the textarea/view renders that font → the one needed file fetches. Brief swap from fallback (Georgia) to the real font, expected and acceptable.
- Net effect: a fresh diary visit on a Caveat entry pays zero extra bytes; the cost is paid the first time the user actually wants a non-default font.

Subsetting: `latin` only. (No Hindi → no Devanagari subsets.)

### 8. Component & file inventory

New:

```
src/lib/entry-style.ts
src/components/desk/PenMenu.tsx
src/components/desk/effects/SparkleTrail.tsx
src/components/desk/effects/WetInkGlow.tsx
src/components/desk/effects/SaveShimmer.tsx
```

Modified:

```
prisma/schema.prisma                       — JournalEntry.style Json?
src/app/api/entries/route.ts               — accept/return style on POST
src/app/api/entries/[id]/route.ts          — accept/return style on PUT/GET
src/lib/entry-lock.ts                      — treat style as locked content
src/hooks/useAutosaveEntry.ts              — include style in payload
src/store/desk.ts                          — entryStyleDraft + setter
src/components/desk/BookSpread.tsx         — wire draft + load entry.style
src/components/desk/LeftPage.tsx           — pen icon, apply style, mount overlays
src/components/desk/RightPage.tsx          — apply style, mount overlays
src/lib/textarea-caret.ts                  — add getCaretTopOffset if missing
src/app/layout.tsx (or fonts file)         — declare the four new Google fonts
```

### 9. Defaults & the "Default" ink color

The seven ink swatches include **Default** as the first option, which stores `color: null` (or omits the field entirely). At render time this resolves to the active theme's body-text color via `getGlassDiaryColors(theme).bodyText`. So a "Default ink" entry written today will follow theme changes later — if the user switches from Sakura to Moonlit, the entry's text re-tints with Moonlit's body color. Felt right: "Default" reads as "follow the diary" rather than "snapshot of one moment."

Named colors (Charcoal etc.) are stored as keys and resolve to fixed hex values that don't depend on theme. Each hex is hand-picked to remain readable across all 10 themes.

### 10. Char count / page break

Char counts ignore style. Page-break logic is DOM-measurement-based (`textarea.scrollHeight`) so a switch to a wider font naturally re-splits text. No special handling needed; the user might see a word jump pages on a font change, which is correct behavior.

### 11. Telemetry / analytics

Out of scope. Nothing logged.

## Edge cases

- **Switch font mid-entry, text re-flows past the page break.** Existing overflow logic handles this on the next keystroke. If the user makes no further keystrokes, the visible text and the saved text agree (the textarea re-renders both halves; the right page draft is not retroactively rebalanced). Acceptable: the user can press space and re-trigger the split if they want clean re-flow.
- **Pen menu open while autosave saves.** Independent. The save shimmer (if effect = sparkle) plays through the popover — popover is non-blocking visually.
- **Sparkle/wet-ink particle leak across page flip.** Effects unmount with the page; no stale DOM. Verify by checking BookSpread teardown on flip.
- **Locked entry from before this feature exists.** `style = null` → renders with all defaults (Caveat / theme text / no effect) exactly as before. No backfill, no migration drama.
- **Effect = sparkle, autosave fails.** No save → no shimmer. User sees "couldn't save" in the existing status footer. Not a sparkle bug.
- **User picks an ink color whose hex matches the page background on some theme.** The six named hex values were picked to read as "ink colors" and vetted by eye across all 10 themes for legibility (not against a strict WCAG contrast threshold — diary text is decorative, and the user-driven choice is the point). Document the vetting checklist in `entry-style.ts` as a comment so any future palette additions go through the same eyeball pass.

## Testing plan

- Create entry, pick each font in turn, confirm textarea + read-only view both re-render.
- Pick each ink color, confirm caret + text both change.
- Pick Sparkle, type, confirm trail particles appear at caret. Trigger autosave (wait 1.5s after typing) and confirm shimmer.
- Pick Wet Ink, type, confirm disk follows caret and decays after 1.2s of stillness.
- Switch theme → "Default" ink color tracks theme; named colors do not.
- Reload entry, confirm style persists.
- Wait until entry is locked (next calendar day, or temporarily mock `isEntryLocked`); confirm pen icon is hidden, saved style still renders, wet ink does not mount, server rejects style mutations.
- Cross-spine cursor navigation: still works with each font (does not regress on Patrick Hand, etc.).
- Page-overflow split: still works with each font; trying a wide font on a long entry re-splits at the right place.
- Network failure during autosave with style change → status goes to error, retried once per existing logic.

## Trade-offs taken

- **Single shared style for left + right of an entry.** Simpler model, matches the "one entry, one mood" feel. If we later want different fonts per page, the data model permits adding `leftStyle` / `rightStyle` keys without breaking the current shape.
- **No inline emphasis.** Bigger architectural lift. Revisit if the user later asks for highlights / per-word color.
- **Wet ink as caret-glow rather than per-glyph glow.** Honest pragmatic call given textarea constraints. Reads close enough to the intent.
- **Lazy-load four of five fonts.** Saves ~120KB on every diary visit at the cost of ~200ms on first pen-menu open. Right call for a feature most entries won't actively use.
- **"Default" ink is dynamic, not a snapshot.** Ties default ink to the theme's life. Named inks are static. Consistent mental model.

## Out of scope (future)

- Inline rich text (bolds, italics, per-word color).
- Mobile diary surface integration.
- A user-level "favorite pen" preference.
- More effects (candlelight, drift, feather quill — all proposed during brainstorming, parked).
- Hindi transliteration + Devanagari fonts.
