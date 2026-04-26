# Glass Diary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the six-theme diary system with a single glass-skinned diary at `/write`. Preserve all diary mechanics (page-turn, ribbon, char limits). Add mobile auto-pagination so writing flows across pages without internal scrolling.

**Architecture:** The "glass" diary theme is reduced to a derived view of the active page theme (`theme.glass.*` + `theme.accent.warm` from `src/lib/themes.ts`). All other diary themes and the diary theme store are deleted. `BookSpread` becomes the only writing surface, rendered from `/write`. Mobile uses an array of controlled textareas, one per writing page, with photo+doodle on a fixed final page.

**Tech Stack:** Next.js 16 App Router, React 19, Zustand, Framer Motion, TipTap (desktop only), plain textarea + custom pagination logic (mobile).

**Reference spec:** `docs/superpowers/specs/2026-04-26-glass-diary-design.md`

**Verification model:** This project has no unit/E2E test framework. Per `CLAUDE.md`, UI is verified by running `docker compose up -d`, opening the app in a browser at `http://localhost:3111/write`, and visually confirming the change. Each task that touches UI ends with a "manual verification" step listing what to look for.

---

## File Map

**Modified:**
- `src/lib/themes.ts` — no structural change; exports unchanged. Used as the new color source.
- `src/lib/diaryThemes.ts` — collapsed to a single `glassTheme` whose values are *derived* from a `Theme` argument. Other themes deleted. May ultimately be deleted once `BookSpread` no longer reads it (see Phase 8).
- `src/lib/journal-constants.ts` — add mobile per-page line capacity helper.
- `src/store/desk.ts` — strip `isBookOpen`/`openBook`/`closeBook`/`activeElement`/`isDrawerOpen`/`isWindowActive` (anything tied to the desk-scene metaphor). Keep `currentSpread`/`totalSpreads`/`turnPage`/`finishPageTurn`/`goToSpread`/`setTotalSpreads`.
- `src/components/desk/BookSpread.tsx` — drop all `currentDiaryTheme === 'glass'` branches (always glass), drop `useDiaryStore` import, remove "Close Book" button, source colors from page theme.
- `src/components/desk/LeftPage.tsx`, `RightPage.tsx`, `EntrySelector.tsx`, `SpreadNavigation.tsx`, `PhotoSlot.tsx`, `PageTurn.tsx` — drop `useDiaryStore`, simplify to glass-only branches.
- `src/components/desk/MobileJournalEntry.tsx` — fully rewritten as a paginated horizontal pager.
- `src/components/desk/DeskScene.tsx` — remove `DiaryThemeSelector` rendering.
- `src/components/LayoutContent.tsx` — remove `isDeskPage` branch (after `/desk` redirect lands).
- `src/app/write/page.tsx` — replace single-page editor with `DeskScene` (which renders the glass diary on desktop, the paginated mobile diary on mobile).
- `src/middleware.ts` — no change (auth flow already lands on whatever page the user requested; default landing after login is the user-initiated nav).

**Deleted:**
- `src/store/diary.ts`
- `src/components/desk/DiaryThemeSelector.tsx`
- `src/components/desk/DeskBook.tsx` (closed-cover state goes; `BookSpread` rendered directly)
- `src/components/desk/decorations/CoverEmblems.tsx` (only used by `DeskBook`)
- `src/components/desk/decorations/Watermarks.tsx`, `PageCorners.tsx`, `interactive/FloatingParticles.tsx`, `interactive/WaxSeal.tsx` — all driven by per-theme records that no longer exist. Verify by grep before delete.
- `src/app/desk/page.tsx` (replaced by 301 redirect, then deleted)
- `src/components/desk/DeskWindow.tsx`, `DeskCandle.tsx`, `DeskDrawer.tsx` — desk-scene furniture irrelevant to the writing-only experience. Verify by grep before delete.

**Out of scope (do NOT touch):**
- Letters / postcard UI (separate spec later)
- Timeline, calendar, constellation pages
- Background.tsx (the animated theme background — kept as-is)
- Editor.tsx (TipTap setup — desktop reuses it unchanged)

---

## Phase 1 — Branch & preparation

### Task 1: Create archive branch from current main

**Files:** none touched on disk; this is a git operation.

- [ ] **Step 1: Confirm current state is clean and on main**

```bash
git status
git branch --show-current
```

Expected: `working tree clean` and `main`.

- [ ] **Step 2: Create archive branch and push**

```bash
git checkout -b archive/legacy-diary
git push -u origin archive/legacy-diary
git checkout main
```

Expected: branch `archive/legacy-diary` exists on origin and points at the current `main` head. `main` is now checked out again.

- [ ] **Step 3: Verify**

```bash
git log -1 --format="%H %s" archive/legacy-diary
git log -1 --format="%H %s" main
```

Expected: both print the same commit hash and message.

---

## Phase 2 — Glass theme as the only diary theme

### Task 2: Add glass-diary color helper

**Files:**
- Create: `src/lib/glassDiaryColors.ts`

- [ ] **Step 1: Write the helper**

```typescript
// src/lib/glassDiaryColors.ts
import { Theme } from './themes'

/**
 * Color set for the glass diary, derived from the active page theme.
 * Every visual on the diary's pages, spine, ribbon, and accents reads from here.
 */
export interface GlassDiaryColors {
  pageBg: string
  pageBlur: string
  pageBorder: string
  ruledLine: string
  sectionLabel: string
  prompt: string
  date: string
  bodyText: string
  photoBorder: string
  doodleBorder: string
  doodleBg: string
  spineGradient: string
  ribbon: string
  saveButton: string
  buttonBg: string
  buttonBorder: string
}

const warm = (theme: Theme, alpha: number): string => {
  // Convert hex `theme.accent.warm` to rgba with the given alpha.
  // Accepts #RGB, #RRGGBB. Falls back to passing the original color through.
  const hex = theme.accent.warm.trim()
  if (!hex.startsWith('#')) return hex
  const cleaned = hex.length === 4
    ? '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3]
    : hex
  const r = parseInt(cleaned.slice(1, 3), 16)
  const g = parseInt(cleaned.slice(3, 5), 16)
  const b = parseInt(cleaned.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function getGlassDiaryColors(theme: Theme): GlassDiaryColors {
  return {
    pageBg: theme.glass.bg,
    pageBlur: theme.glass.blur,
    pageBorder: warm(theme, 0.18),
    ruledLine: warm(theme, 0.15),
    sectionLabel: warm(theme, 0.7),
    prompt: warm(theme, 0.6),
    date: warm(theme, 0.85),
    bodyText: theme.text.primary,
    photoBorder: warm(theme, 0.3),
    doodleBorder: warm(theme, 0.2),
    doodleBg: 'rgba(255, 255, 255, 0.03)',
    spineGradient: `linear-gradient(180deg, ${warm(theme, 0.12)}, ${warm(theme, 0.05)}, ${warm(theme, 0.12)})`,
    ribbon: theme.accent.primary,
    saveButton: theme.accent.warm,
    buttonBg: 'rgba(255, 255, 255, 0.06)',
    buttonBorder: warm(theme, 0.2),
  }
}
```

- [ ] **Step 2: Sanity-check the helper compiles**

```bash
docker compose exec app npx tsc --noEmit
```

Expected: no new TypeScript errors related to `glassDiaryColors.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/glassDiaryColors.ts
git commit -m "Add glassDiaryColors helper for theme-derived diary palette"
```

### Task 3: Reduce diaryThemes.ts to glass-only

**Files:**
- Modify: `src/lib/diaryThemes.ts`

- [ ] **Step 1: Replace the entire file content**

```typescript
// src/lib/diaryThemes.ts
//
// Previously held six diary themes. The glass diary is now the only theme,
// and its colors are derived from the active page theme via getGlassDiaryColors.
// This file remains as a thin compatibility shim so existing imports stay
// working during the migration; it will be deleted in Phase 8 once no
// callers remain.

export type DiaryThemeName = 'glass'

export interface DiaryTheme {
  id: DiaryThemeName
  name: string
}

export const glassTheme: DiaryTheme = {
  id: 'glass',
  name: 'Glass',
}

export const diaryThemes: Record<DiaryThemeName, DiaryTheme> = {
  glass: glassTheme,
}

export const diaryThemeList = [glassTheme]
```

- [ ] **Step 2: Type-check**

```bash
docker compose exec app npx tsc --noEmit
```

Expected: errors will appear in components that read fields like `pages.background`, `cover.background`, `interactive.ribbon`, etc. **Leave them; they're fixed in Phase 3 and Phase 4.** Confirm only `BookSpread.tsx`, `LeftPage.tsx`, `RightPage.tsx`, `EntrySelector.tsx`, `SpreadNavigation.tsx`, `PhotoSlot.tsx`, `PageTurn.tsx`, `MobileJournalEntry.tsx`, `DeskBook.tsx`, `DiaryThemeSelector.tsx` and the decoration files are surfacing errors. Note these for the next phase.

- [ ] **Step 3: Commit**

```bash
git add src/lib/diaryThemes.ts
git commit -m "Collapse diaryThemes to glass-only stub (other themes removed)"
```

---

## Phase 3 — BookSpread: glass-only rendering

### Task 4: Strip "Close Book" button

**Files:**
- Modify: `src/components/desk/BookSpread.tsx` (lines ~36-38, ~181, ~354-371)

- [ ] **Step 1: Remove the `onClose` prop from the interface and usage**

In `src/components/desk/BookSpread.tsx`, replace the `BookSpreadProps` interface and the function signature:

```typescript
// before:
interface BookSpreadProps {
  onClose: () => void
}

export default function BookSpread({ onClose }: BookSpreadProps) {

// after:
export default function BookSpread() {
```

- [ ] **Step 2: Delete the Close Book button JSX**

In `src/components/desk/BookSpread.tsx`, delete the entire `<motion.button onClick={onClose} ...>Close Book</motion.button>` block (currently around lines 354-371).

- [ ] **Step 3: Type-check**

```bash
docker compose exec app npx tsc --noEmit
```

Expected: a new error in `DeskBook.tsx` because it passes `onClose={closeBook}`. That's expected — we'll fix it when we delete `DeskBook.tsx` in Phase 5.

- [ ] **Step 4: Commit**

```bash
git add src/components/desk/BookSpread.tsx
git commit -m "Remove Close Book button from BookSpread"
```

### Task 5: Replace BookSpread's glass branches with the helper

**Files:**
- Modify: `src/components/desk/BookSpread.tsx`

- [ ] **Step 1: Replace the imports block**

Find the existing imports at the top of `src/components/desk/BookSpread.tsx`. Replace the lines that currently import `useDiaryStore`, `diaryThemes`, `DiaryTheme` with:

```typescript
import { getGlassDiaryColors, GlassDiaryColors } from '@/lib/glassDiaryColors'
```

Keep all other imports unchanged.

- [ ] **Step 2: Delete the `getDarkerShade` and `getLinePattern` helpers**

These compute paper-theme-specific gradients. Delete the two functions entirely (currently around lines 41-75).

- [ ] **Step 3: Replace `PageWrapper`**

Replace the entire `PageWrapper` component (currently lines 77-179) with this glass-only version:

```typescript
const PageWrapper = memo(function PageWrapper({
  children,
  side,
  colors,
}: {
  children: React.ReactNode
  side: 'left' | 'right'
  colors: GlassDiaryColors
}) {
  const isLeft = side === 'left'

  return (
    <div
      className="relative flex-1 overflow-hidden"
      style={{
        background: colors.pageBg,
        backdropFilter: `blur(${colors.pageBlur})`,
        WebkitBackdropFilter: `blur(${colors.pageBlur})`,
        border: `1px solid ${colors.pageBorder}`,
        borderRadius: isLeft ? '6px 0 0 6px' : '0 6px 6px 0',
        boxShadow: isLeft
          ? 'inset -4px 0 12px rgba(255,255,255,0.05), -6px 6px 20px rgba(0,0,0,0.25)'
          : 'inset 4px 0 12px rgba(255,255,255,0.05), 6px 6px 20px rgba(0,0,0,0.25)',
        willChange: 'transform',
      }}
    >
      {/* Faint warm ruled lines */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '70px',
          left: isLeft ? '50px' : '20px',
          right: isLeft ? '20px' : '50px',
          bottom: '40px',
          backgroundImage: `repeating-linear-gradient(
            180deg,
            transparent 0px,
            transparent 31px,
            ${colors.ruledLine} 31px,
            ${colors.ruledLine} 32px
          )`,
        }}
      />

      <div
        className="relative h-full overflow-hidden z-10"
        style={{
          padding: isLeft ? '20px 20px 20px 50px' : '20px 50px 20px 20px',
        }}
      >
        {children}
      </div>
    </div>
  )
})
```

- [ ] **Step 4: Replace the `BookSpread` body's color logic**

In the `BookSpread` function body (currently around lines 181-209), replace:

```typescript
const { currentDiaryTheme } = useDiaryStore()
const diaryTheme = diaryThemes[currentDiaryTheme]
// ...
const paperColor = diaryTheme.pages.background
const paperColorDark = getDarkerShade(paperColor)
```

with:

```typescript
const colors = getGlassDiaryColors(theme)
```

Then everywhere in the JSX that previously read `currentDiaryTheme === 'glass' ? X : Y`, take the glass branch (`X`) and drop the `Y`. Specifically:

- Date header background → `colors.pageBg`, blur → `colors.pageBlur`, border → `colors.pageBorder`, text color → `colors.date`
- `<PageWrapper>` props → pass `colors={colors}` (the new prop signature from Step 3)
- Center binding background → `colors.spineGradient`
- Remove the `currentDiaryTheme !== 'glass' && [...Array(10)].map(...)` block (the brown spine dots are paper-only)
- Left edge / right edge arrow color → `theme.text.muted`
- Stack-of-pages hints background → `'repeating-linear-gradient(180deg, rgba(255,255,255,0.3) 0px, rgba(255,255,255,0.3) 2px, rgba(255,255,255,0.15) 2px, rgba(255,255,255,0.15) 4px)'`
- Save success overlay → unchanged (already uses `theme.accent.warm`)

- [ ] **Step 5: Update the ribbon**

In `BookSpread.tsx`, replace:

```tsx
{diaryTheme.interactive.ribbon.enabled && (
  <RibbonBookmark color={diaryTheme.interactive.ribbon.color} />
)}
```

with:

```tsx
<RibbonBookmark color={colors.ribbon} />
```

- [ ] **Step 6: Type-check & visual verify**

```bash
docker compose exec app npx tsc --noEmit
docker compose restart app
```

Open `http://localhost:3111/desk` (still the existing route at this point). Expected:
- Book opens to the spread (existing flow)
- Pages are dark translucent green-tinted glass on Rivendell theme
- Faint warm/gold ruled lines
- Ribbon is visible
- No "Close Book" button
- Page-turn arrows still visible on left/right
- Spread date renders in a glass pill above the spine

If any TypeScript error remains in `BookSpread.tsx`, fix it inline before committing.

- [ ] **Step 7: Commit**

```bash
git add src/components/desk/BookSpread.tsx
git commit -m "Render BookSpread in glass-only mode using getGlassDiaryColors"
```

---

## Phase 4 — Strip useDiaryStore from remaining components

### Task 6: Update LeftPage

**Files:**
- Modify: `src/components/desk/LeftPage.tsx`

- [ ] **Step 1: Open `LeftPage.tsx`** and delete the import + hook usage.

Replace the line `import { useDiaryStore } from '@/store/diary'` with nothing (remove it).

Replace `const { currentDiaryTheme } = useDiaryStore()` with nothing.

For every `currentDiaryTheme === 'glass' ? X : Y` ternary in the file, take the `X` branch (glass).

For every `diaryTheme.X` reference, swap to the equivalent from `getGlassDiaryColors(theme)`. Add the import:

```typescript
import { getGlassDiaryColors } from '@/lib/glassDiaryColors'
```

In the component body:

```typescript
const colors = getGlassDiaryColors(theme)
```

(`theme` is already available from `useThemeStore`; check the file to confirm.)

- [ ] **Step 2: Type-check**

```bash
docker compose exec app npx tsc --noEmit
```

Expected: no errors in `LeftPage.tsx`.

- [ ] **Step 3: Visual check**

```bash
docker compose restart app
```

Open `/desk`. The left page should still render correctly: SONG label, song embed slot, "WRITE YOUR THOUGHTS" label, ruled-line writing area, all in glass tint.

- [ ] **Step 4: Commit**

```bash
git add src/components/desk/LeftPage.tsx
git commit -m "Drop useDiaryStore from LeftPage"
```

### Task 7: Update RightPage

**Files:**
- Modify: `src/components/desk/RightPage.tsx`

- [ ] **Step 1: Apply the same transformation as Task 6** to `RightPage.tsx`.

Remove `useDiaryStore` import + hook call. Replace ternaries with the glass branch. Use `getGlassDiaryColors(theme)` for any `diaryTheme.*` reference.

- [ ] **Step 2: Type-check, visual check, commit**

```bash
docker compose exec app npx tsc --noEmit
docker compose restart app
```

Open `/desk`. Right page should show: photo slots with warm dashed borders, prompt text, ruled writing area, doodle canvas with warm border, Save button.

```bash
git add src/components/desk/RightPage.tsx
git commit -m "Drop useDiaryStore from RightPage"
```

### Task 8: Update remaining diary-store consumers

**Files:**
- Modify: `src/components/desk/EntrySelector.tsx`
- Modify: `src/components/desk/SpreadNavigation.tsx`
- Modify: `src/components/desk/PhotoSlot.tsx`
- Modify: `src/components/desk/PageTurn.tsx`

- [ ] **Step 1: For each of the four files**, apply the same transformation: delete the `useDiaryStore` import and `currentDiaryTheme` usage; collapse `currentDiaryTheme === 'glass' ? X : Y` to `X`; if any `diaryTheme.*` references remain, source the equivalent from `getGlassDiaryColors(theme)`.

- [ ] **Step 2: After all four are done, type-check**

```bash
docker compose exec app npx tsc --noEmit
```

Expected: the only remaining errors should be in `MobileJournalEntry.tsx`, `DeskBook.tsx`, `DiaryThemeSelector.tsx`, and any decoration files. We address those in Phases 5–7.

- [ ] **Step 3: Visual check**

```bash
docker compose restart app
```

Open `/desk`. Spread should still render. Click between entries (if any exist) — page-turn animation should work.

- [ ] **Step 4: Commit**

```bash
git add src/components/desk/EntrySelector.tsx src/components/desk/SpreadNavigation.tsx src/components/desk/PhotoSlot.tsx src/components/desk/PageTurn.tsx
git commit -m "Drop useDiaryStore from remaining desk components"
```

---

## Phase 5 — Delete DiaryThemeSelector, DeskBook closed state, decorations

### Task 9: Delete DiaryThemeSelector and stop rendering it

**Files:**
- Modify: `src/components/desk/DeskScene.tsx`
- Delete: `src/components/desk/DiaryThemeSelector.tsx`

- [ ] **Step 1: Remove the rendering call**

In `src/components/desk/DeskScene.tsx`, find the line `<DiaryThemeSelector />` (currently inside the `<>` fragment for non-mobile, around line 156) and delete it. Also delete the import line at the top: `import { DiaryThemeSelector } from './DiaryThemeSelector'`.

- [ ] **Step 2: Delete the file**

```bash
git rm src/components/desk/DiaryThemeSelector.tsx
```

- [ ] **Step 3: Type-check & visual check**

```bash
docker compose exec app npx tsc --noEmit
docker compose restart app
```

Open `/desk`. The 📖 button at the bottom-left should be gone.

- [ ] **Step 4: Commit**

```bash
git add src/components/desk/DeskScene.tsx
git commit -m "Remove DiaryThemeSelector"
```

### Task 10: Replace DeskBook with direct BookSpread render

**Files:**
- Modify: `src/components/desk/DeskScene.tsx`
- Delete: `src/components/desk/DeskBook.tsx`

- [ ] **Step 1: Read `DeskScene.tsx`** to find the `<DeskBook />` usage.

It is currently rendered inside `<motion.div className="absolute z-30" ...>` around line 123. Replace `<DeskBook />` with `<BookSpread />`.

Also update imports: remove `import DeskBook from './DeskBook'` and add `import BookSpread from './BookSpread'`.

- [ ] **Step 2: Delete DeskBook**

```bash
git rm src/components/desk/DeskBook.tsx
```

- [ ] **Step 3: Type-check & visual check**

```bash
docker compose exec app npx tsc --noEmit
docker compose restart app
```

Open `/desk`. The book should now appear immediately as the open spread — no closed-cover state, no click-to-open.

- [ ] **Step 4: Commit**

```bash
git add src/components/desk/DeskScene.tsx
git commit -m "Render BookSpread directly; drop closed-cover DeskBook"
```

### Task 11: Simplify useDeskStore

**Files:**
- Modify: `src/store/desk.ts`

- [ ] **Step 1: Replace the file content**

```typescript
// src/store/desk.ts
import { create } from 'zustand'

interface DeskStore {
  currentSpread: number
  totalSpreads: number
  isPageTurning: boolean
  turnDirection: 'forward' | 'backward' | null
  turnPage: (direction: 'forward' | 'backward') => void
  finishPageTurn: () => void
  goToSpread: (spread: number) => void
  setTotalSpreads: (total: number) => void
}

export const useDeskStore = create<DeskStore>()((set, get) => ({
  currentSpread: 0,
  totalSpreads: 1,
  isPageTurning: false,
  turnDirection: null,

  turnPage: (direction) => {
    const { currentSpread, totalSpreads, isPageTurning } = get()
    if (isPageTurning) return
    if (direction === 'backward' && currentSpread <= 0) return
    if (direction === 'forward' && currentSpread >= totalSpreads) return
    set({ isPageTurning: true, turnDirection: direction })
  },

  finishPageTurn: () => set((state) => ({
    isPageTurning: false,
    turnDirection: null,
    currentSpread: state.turnDirection === 'forward'
      ? Math.min(state.currentSpread + 1, state.totalSpreads)
      : Math.max(0, state.currentSpread - 1),
  })),

  goToSpread: (spread) => set({ currentSpread: spread }),
  setTotalSpreads: (total) => set({ totalSpreads: total }),
}))
```

This drops `isBookOpen`, `openBook`, `closeBook`, `activeElement`, `isDrawerOpen`, `isWindowActive`, `setActiveElement`, `toggleDrawer`, `setWindowActive`, `openAtLatestSpread`, and the `persist` wrapper (no state worth persisting now).

- [ ] **Step 2: Type-check**

```bash
docker compose exec app npx tsc --noEmit
```

Expected: errors in any remaining file that uses `setActiveElement`, `toggleDrawer`, `setWindowActive`, etc. Identify each and decide:
- If the file is `DeskWindow.tsx`, `DeskCandle.tsx`, `DeskDrawer.tsx` — those will be deleted in Task 13.
- If anywhere else, the call site needs to drop the call.

- [ ] **Step 3: Commit**

```bash
git add src/store/desk.ts
git commit -m "Simplify useDeskStore: drop closed-cover and desk-furniture state"
```

### Task 12: Delete diary store

**Files:**
- Delete: `src/store/diary.ts`

- [ ] **Step 1: Verify no references remain**

```bash
grep -rn "useDiaryStore\|@/store/diary" /Users/himanshut4d/Documents/Personal_projects/feel_good/hearth/src/
```

Expected: zero matches. If any remain, fix them by following the Task 6 pattern before deleting.

- [ ] **Step 2: Delete the store**

```bash
git rm src/store/diary.ts
```

- [ ] **Step 3: Type-check & commit**

```bash
docker compose exec app npx tsc --noEmit
git commit -m "Delete useDiaryStore (only one diary theme remains)"
```

### Task 13: Delete desk-scene furniture and unused decorations

**Files:**
- Delete: `src/components/desk/DeskWindow.tsx`, `DeskCandle.tsx`, `DeskDrawer.tsx`
- Delete: `src/components/desk/decorations/CoverEmblems.tsx`, `Watermarks.tsx`, `PageCorners.tsx`
- Delete: `src/components/desk/interactive/FloatingParticles.tsx`, `WaxSeal.tsx`
- Modify: `src/components/desk/DeskScene.tsx` (remove imports and JSX for the above if any remain)
- Modify: `src/components/desk/index.ts` (drop exports if any)

- [ ] **Step 1: For each candidate file, verify it's actually unused**

```bash
for f in DeskWindow DeskCandle DeskDrawer; do
  echo "=== $f ==="
  grep -rn "$f" /Users/himanshut4d/Documents/Personal_projects/feel_good/hearth/src/ | grep -v "src/components/desk/$f.tsx"
done

for f in CoverEmblems Watermarks PageCorners FloatingParticles WaxSeal; do
  echo "=== $f ==="
  grep -rn "$f" /Users/himanshut4d/Documents/Personal_projects/feel_good/hearth/src/ | grep -v "src/components/desk/decorations/$f.tsx" | grep -v "src/components/desk/interactive/$f.tsx"
done
```

For each file with zero remaining references (besides its own definition), delete it. For any file still referenced, leave it in place.

- [ ] **Step 2: Delete unused files**

```bash
# Run only the lines whose grep above came up empty
git rm src/components/desk/DeskWindow.tsx
git rm src/components/desk/DeskCandle.tsx
git rm src/components/desk/DeskDrawer.tsx
git rm src/components/desk/decorations/CoverEmblems.tsx
git rm src/components/desk/decorations/Watermarks.tsx
git rm src/components/desk/decorations/PageCorners.tsx
git rm src/components/desk/interactive/FloatingParticles.tsx
git rm src/components/desk/interactive/WaxSeal.tsx
```

- [ ] **Step 3: Update index.ts if it re-exports removed components**

```bash
cat /Users/himanshut4d/Documents/Personal_projects/feel_good/hearth/src/components/desk/index.ts
```

Edit to remove any export lines for deleted files.

- [ ] **Step 4: Type-check, visual check, commit**

```bash
docker compose exec app npx tsc --noEmit
docker compose restart app
```

Open `/desk`. The book should still render. The desk furniture (window, candle, drawer) is gone.

```bash
git add src/components/desk/
git commit -m "Remove desk-scene furniture and unused per-theme decorations"
```

---

## Phase 6 — Wire /write to render the diary

### Task 14: Replace /write with the diary

**Files:**
- Modify: `src/app/write/page.tsx`

- [ ] **Step 1: Replace the entire file content**

```tsx
'use client'

import { DeskScene } from '@/components/desk'

export default function WritePage() {
  return <DeskScene />
}
```

- [ ] **Step 2: Update LayoutContent to treat /write the same as /desk used to be**

In `src/components/LayoutContent.tsx`, change line 23 from:

```typescript
const isDeskPage = pathname === '/desk'
```

to:

```typescript
const isWritingPage = pathname === '/desk' || pathname === '/write'
```

And line 41 from:

```typescript
if (isLandingPage || isPricingPage || isDeskPage) {
```

to:

```typescript
if (isLandingPage || isPricingPage || isWritingPage) {
```

(`/write` becomes the no-chrome page that handles its own layout, like `/desk` did.)

- [ ] **Step 3: Type-check & visual check**

```bash
docker compose exec app npx tsc --noEmit
docker compose restart app
```

Open `http://localhost:3111/write`. Expected: glass diary spread renders with no top-nav chrome.

- [ ] **Step 4: Commit**

```bash
git add src/app/write/page.tsx src/components/LayoutContent.tsx
git commit -m "Render glass diary at /write"
```

### Task 15: Redirect /desk to /write, then delete

**Files:**
- Modify: `src/app/desk/page.tsx` (replaced by redirect)

- [ ] **Step 1: Replace /desk with a redirect**

```tsx
// src/app/desk/page.tsx
import { redirect } from 'next/navigation'

export default function DeskPage() {
  redirect('/write')
}
```

- [ ] **Step 2: Visual check**

```bash
docker compose restart app
```

Open `http://localhost:3111/desk`. Expected: browser url updates to `/write` and the diary renders.

- [ ] **Step 3: Delete the /desk route entirely**

```bash
git rm -r src/app/desk
```

(One-shot deletion is fine for an internal-only project. There are no external bookmarks to preserve.)

- [ ] **Step 4: Update LayoutContent — drop /desk**

In `src/components/LayoutContent.tsx`, line 23, simplify back to:

```typescript
const isWritingPage = pathname === '/write'
```

- [ ] **Step 5: Type-check, visual check, commit**

```bash
docker compose exec app npx tsc --noEmit
docker compose restart app
```

Open `/write` and confirm it works. Open `/desk` — should 404.

```bash
git add src/components/LayoutContent.tsx
git commit -m "Delete /desk route (consolidated into /write)"
```

### Task 16: Update Navigation to point to /write only

**Files:**
- Modify: `src/components/Navigation.tsx`

- [ ] **Step 1: Open `Navigation.tsx`** and confirm the nav already points to `/write` (per the earlier grep, line 12 reads `{ href: '/write', label: 'Write', icon: '✎' }`). If anything points to `/desk`, change it to `/write`.

- [ ] **Step 2: Visual check**

```bash
docker compose restart app
```

Open the app, click the "Write" tab in the nav. Expected: routes to `/write` and shows the glass diary.

- [ ] **Step 3: Commit (only if a change was made)**

```bash
git add src/components/Navigation.tsx
git commit -m "Point Navigation Write tab to /write"
```

---

## Phase 7 — Mobile auto-pagination

### Task 17: Add mobile per-page line capacity helper

**Files:**
- Modify: `src/lib/journal-constants.ts`

- [ ] **Step 1: Append two helpers at the bottom of the file**

```typescript
/**
 * Mobile pagination — number of writing lines that fit in a single phone page,
 * computed from viewport height.
 *
 * Layout reserved per page:
 *   - 56px header row (date / close)
 *   - 88px song section (only on page 0; ignored here so all writing pages
 *     have the same capacity — page 0 just starts further down)
 *   - 32px label "WRITE YOUR THOUGHTS"
 *   - 56px pagination dots row
 *   - 32px bottom safe area
 */
export function getMobileWritingLinesPerPage(viewportHeight: number): number {
  const reserved = 56 + 88 + 32 + 56 + 32
  const writingHeight = Math.max(0, viewportHeight - reserved)
  return Math.max(4, Math.floor(writingHeight / JOURNAL.LINE_HEIGHT))
}

/**
 * Estimate how many text characters fit on a mobile writing page given a
 * line capacity. Used as the boundary for splitting overflow.
 */
export function getMobileCharsPerPage(linesPerPage: number): number {
  return linesPerPage * JOURNAL.CHARS_PER_LINE
}
```

- [ ] **Step 2: Type-check & commit**

```bash
docker compose exec app npx tsc --noEmit
git add src/lib/journal-constants.ts
git commit -m "Add mobile per-page line capacity helpers"
```

### Task 18: Build the paginated mobile diary

**Files:**
- Modify (full rewrite): `src/components/desk/MobileJournalEntry.tsx`

- [ ] **Step 1: Replace the file content with a paginated implementation**

```tsx
// src/components/desk/MobileJournalEntry.tsx
'use client'

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import { useJournalStore, StrokeData } from '@/store/journal'
import { JOURNAL, getMobileWritingLinesPerPage, getMobileCharsPerPage } from '@/lib/journal-constants'
import { htmlToPlainText } from '@/lib/text-utils'
import { getRandomPrompt } from '@/lib/themes'
import { getGlassDiaryColors } from '@/lib/glassDiaryColors'
import SongEmbed from '@/components/SongEmbed'
import PhotoBlock from './PhotoBlock'
import CompactDoodleCanvas from './CompactDoodleCanvas'
import EntrySelector from './EntrySelector'

interface Photo {
  id?: string
  url: string
  rotation: number
  position: 1 | 2
}

interface Entry {
  id: string
  text: string
  mood: number
  song?: string | null
  photos?: Photo[]
  doodles?: Array<{ strokes: StrokeData[] }>
  createdAt: string
}

interface MobileJournalEntryProps {
  onClose: () => void
}

/**
 * Split a string into N pages of `charsPerPage` characters, breaking on the
 * last whitespace before the boundary when possible (so words don't split).
 * Returns at minimum one (possibly empty) page.
 */
function paginate(text: string, charsPerPage: number): string[] {
  if (text.length === 0) return ['']
  const pages: string[] = []
  let i = 0
  while (i < text.length) {
    let end = Math.min(i + charsPerPage, text.length)
    if (end < text.length) {
      const slice = text.slice(i, end)
      const lastBreak = Math.max(
        slice.lastIndexOf('\n'),
        slice.lastIndexOf(' '),
      )
      if (lastBreak > charsPerPage * 0.5) {
        end = i + lastBreak + 1
      }
    }
    pages.push(text.slice(i, end))
    i = end
  }
  return pages.length === 0 ? [''] : pages
}

export default function MobileJournalEntry({ onClose }: MobileJournalEntryProps) {
  const { theme } = useThemeStore()
  const colors = useMemo(() => getGlassDiaryColors(theme), [theme])
  const {
    currentSong,
    setCurrentSong,
    currentMood,
    currentDoodleStrokes,
    setDoodleStrokes,
    resetCurrentEntry,
  } = useJournalStore()

  const [viewportHeight, setViewportHeight] = useState<number>(
    typeof window !== 'undefined' ? window.innerHeight : 720
  )
  useEffect(() => {
    const onResize = () => setViewportHeight(window.innerHeight)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const linesPerPage = getMobileWritingLinesPerPage(viewportHeight)
  const charsPerPage = getMobileCharsPerPage(linesPerPage)

  const [entries, setEntries] = useState<Entry[]>([])
  const [todayEntries, setTodayEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null)
  const [pages, setPages] = useState<string[]>([''])
  const [activePage, setActivePage] = useState(0)
  const [songInput, setSongInput] = useState(currentSong || '')
  const [pendingPhotos, setPendingPhotos] = useState<Photo[]>([])
  const [saving, setSaving] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const [prompt, setPrompt] = useState('')

  const photosDoodleIndex = pages.length // last "page" (synthetic)
  const totalPages = pages.length + 1

  useEffect(() => { setPrompt(getRandomPrompt()) }, [])

  // Fetch entries
  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/entries?limit=50')
      if (res.ok) {
        const data = await res.json()
        const fetched = data.entries || []
        setEntries(fetched)
        const today = new Date(); today.setHours(0, 0, 0, 0)
        const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999)
        setTodayEntries(fetched.filter((e: Entry) => {
          const d = new Date(e.createdAt)
          return d >= today && d <= todayEnd
        }))
      }
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { fetchEntries() }, [fetchEntries])

  const currentEntry = currentEntryId
    ? entries.find(e => e.id === currentEntryId) || null
    : null
  const isNewEntry = currentEntryId === null

  // Pagination — when a page's text exceeds capacity, split overflow onto next.
  const handlePageTextChange = useCallback((index: number, value: string) => {
    setPages(prev => {
      const next = [...prev]
      // Combine all text from this page onward, then re-paginate from `index`.
      const tail = [value, ...next.slice(index + 1)].join('')
      const repaginated = paginate(tail, charsPerPage)
      return [...next.slice(0, index), ...repaginated]
    })
  }, [charsPerPage])

  // Char count = sum of all page texts
  const charCount = pages.reduce((sum, p) => sum + p.length, 0)

  const handleSongChange = useCallback((value: string) => {
    setSongInput(value)
    setCurrentSong(value)
  }, [setCurrentSong])

  const handlePhotoAdd = useCallback((position: 1 | 2, dataUrl: string) => {
    const rotation = position === 1
      ? -8 + Math.floor(Math.random() * 6)
      : 5 + Math.floor(Math.random() * 6)
    setPendingPhotos(prev => [
      ...prev.filter(p => p.position !== position),
      { url: dataUrl, position, rotation },
    ])
  }, [])

  const handleStrokesChange = useCallback((strokes: StrokeData[]) => {
    setDoodleStrokes(strokes)
  }, [setDoodleStrokes])

  const handleSave = useCallback(async () => {
    const fullText = pages.join('').trim()
    if (!fullText) return
    setSaving(true)
    try {
      const html = '<p>' + fullText.replace(/\n/g, '</p><p>') + '</p>'
      const photos = pendingPhotos.map(p => ({
        url: p.url, position: p.position, rotation: p.rotation, spread: 1,
      }))
      const doodles = currentDoodleStrokes.length > 0
        ? [{ strokes: currentDoodleStrokes }]
        : []

      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: html,
          mood: currentMood,
          song: songInput && /https?:\/\//.test(songInput) ? songInput : null,
          photos,
          doodles,
        }),
      })

      if (res.ok) {
        setPages([''])
        setActivePage(0)
        setSongInput('')
        setPendingPhotos([])
        resetCurrentEntry()
        setPrompt(getRandomPrompt())
        setShowSaved(true)
        fetchEntries()
        setTimeout(() => setShowSaved(false), 2000)
      } else {
        const data = await res.json()
        alert(`Failed to save: ${data.error || 'Unknown error'}`)
      }
    } finally {
      setSaving(false)
    }
  }, [pages, songInput, pendingPhotos, currentMood, currentDoodleStrokes, resetCurrentEntry, fetchEntries])

  const handleEntrySelect = useCallback((entryId: string | null) => {
    setCurrentEntryId(entryId)
    setPages([''])
    setActivePage(0)
    setPendingPhotos([])
  }, [])

  // Swipe between pages
  const handleSwipeEnd = useCallback((_: unknown, info: PanInfo) => {
    if (info.offset.x < -60 && activePage < totalPages - 1) {
      setActivePage(p => p + 1)
    } else if (info.offset.x > 60 && activePage > 0) {
      setActivePage(p => p - 1)
    }
  }, [activePage, totalPages])

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: theme.bg.primary }}>
        <span style={{ color: colors.prompt }}>Loading...</span>
      </div>
    )
  }

  // Viewing existing entry — read-only stack (kept simple; does not paginate)
  if (!isNewEntry && currentEntry) {
    const plainText = htmlToPlainText(currentEntry.text)
    const entryPhotos = currentEntry.photos || []
    return (
      <div className="fixed inset-0 overflow-y-auto z-40" style={{ background: theme.bg.primary }}>
        <div className="max-w-lg mx-auto px-4 py-6 pb-20">
          <div className="flex items-center justify-between mb-4">
            <button onClick={onClose} className="text-sm px-3 py-1.5 rounded-full"
              style={{ background: colors.buttonBg, color: colors.bodyText, border: `1px solid ${colors.buttonBorder}` }}>
              Close
            </button>
            <span className="text-sm" style={{ color: colors.date }}>
              {new Date(currentEntry.createdAt).toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric',
              })}
            </span>
          </div>
          {todayEntries.length > 0 && (
            <div className="flex justify-center mb-4">
              <EntrySelector entries={todayEntries} currentEntryId={currentEntryId}
                onEntrySelect={handleEntrySelect} onNewEntry={() => setCurrentEntryId(null)} />
            </div>
          )}
          {currentEntry.song && (
            <div className="mb-4"><SongEmbed url={currentEntry.song} compact audioOnly /></div>
          )}
          <div className="whitespace-pre-wrap mb-4" style={{
            color: colors.bodyText, fontFamily: 'var(--font-caveat), Georgia, serif',
            fontSize: '20px', lineHeight: '32px',
          }}>
            {plainText || <span style={{ color: colors.prompt, fontStyle: 'italic' }}>No text</span>}
          </div>
          {entryPhotos.length > 0 && <div className="mb-4"><PhotoBlock photos={entryPhotos} disabled /></div>}
        </div>
      </div>
    )
  }

  // New entry — paginated authoring
  return (
    <div className="fixed inset-0 z-40 flex flex-col" style={{ background: theme.bg.primary }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ minHeight: 56 }}>
        <button onClick={onClose} className="text-xs px-3 py-1.5 rounded-full"
          style={{ background: colors.buttonBg, color: colors.bodyText, border: `1px solid ${colors.buttonBorder}`, fontFamily: 'Georgia, serif' }}>
          Close
        </button>
        <span className="text-xs italic" style={{ color: colors.date, fontFamily: 'Georgia, serif' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
      </div>

      {/* Pager */}
      <motion.div
        className="flex-1 overflow-hidden px-3"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        onDragEnd={handleSwipeEnd}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activePage}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="h-full"
          >
            {activePage < photosDoodleIndex ? (
              <WritingPage
                colors={colors}
                isFirstPage={activePage === 0}
                pageText={pages[activePage]}
                onPageTextChange={(value) => handlePageTextChange(activePage, value)}
                linesPerPage={linesPerPage}
                prompt={prompt}
                charCount={charCount}
                songInput={songInput}
                onSongChange={handleSongChange}
                onSongClear={() => setSongInput('')}
              />
            ) : (
              <PhotosDoodlePage
                colors={colors}
                photos={pendingPhotos}
                onPhotoAdd={handlePhotoAdd}
                doodleStrokes={currentDoodleStrokes}
                onStrokesChange={handleStrokesChange}
                canSave={pages.join('').trim().length > 0}
                saving={saving}
                onSave={handleSave}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Pagination dots */}
      <div className="flex items-center justify-center gap-2 py-4" style={{ minHeight: 56 }}>
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => setActivePage(i)}
            className="rounded-full transition-all"
            style={{
              width: i === activePage ? 8 : 6,
              height: i === activePage ? 8 : 6,
              background: i === activePage ? colors.date : colors.prompt,
              opacity: i === activePage ? 1 : 0.4,
            }}
            aria-label={`Go to page ${i + 1} of ${totalPages}`}
          />
        ))}
      </div>

      {/* Saved overlay */}
      <AnimatePresence>
        {showSaved && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ background: 'rgba(0,0,0,0.3)' }}>
            <motion.div className="flex flex-col items-center gap-2"
              initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl text-white"
                style={{ background: colors.saveButton }}>
                ✓
              </div>
              <span className="text-lg font-serif" style={{ color: colors.bodyText }}>Saved</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ----------------------------------------------------------------------------

function WritingPage({
  colors, isFirstPage, pageText, onPageTextChange, linesPerPage,
  prompt, charCount, songInput, onSongChange, onSongClear,
}: {
  colors: ReturnType<typeof getGlassDiaryColors>
  isFirstPage: boolean
  pageText: string
  onPageTextChange: (value: string) => void
  linesPerPage: number
  prompt: string
  charCount: number
  songInput: string
  onSongChange: (value: string) => void
  onSongClear: () => void
}) {
  return (
    <div
      className="h-full p-4 rounded-2xl flex flex-col"
      style={{
        background: colors.pageBg,
        backdropFilter: `blur(${colors.pageBlur})`,
        WebkitBackdropFilter: `blur(${colors.pageBlur})`,
        border: `1px solid ${colors.pageBorder}`,
        boxShadow: '0 8px 28px rgba(0,0,0,0.3)',
      }}
    >
      {isFirstPage && (
        <div className="mb-3" style={{ minHeight: 88 }}>
          <div className="text-[10px] uppercase tracking-[0.18em] mb-2 font-medium"
            style={{ color: colors.sectionLabel }}>
            Add a Song
          </div>
          {songInput && /https?:\/\//.test(songInput) ? (
            <div className="relative">
              <SongEmbed url={songInput} compact audioOnly />
              <button onClick={onSongClear}
                className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs"
                style={{ background: colors.buttonBg, color: colors.prompt }}>
                ×
              </button>
            </div>
          ) : (
            <input
              type="text"
              value={songInput}
              onChange={e => onSongChange(e.target.value)}
              placeholder="Paste Spotify, YouTube, or SoundCloud..."
              className="w-full px-3 py-2 rounded-lg text-sm bg-transparent outline-none"
              style={{
                border: `1px solid ${colors.pageBorder}`,
                color: colors.bodyText,
                background: 'rgba(255,255,255,0.03)',
              }}
            />
          )}
        </div>
      )}

      <div className="text-[10px] uppercase tracking-[0.18em] mb-1 font-medium"
        style={{ color: colors.sectionLabel }}>
        Write your thoughts
      </div>
      {isFirstPage && (
        <div className="text-xs italic mb-2" style={{ color: colors.prompt, fontFamily: 'Georgia, serif' }}>
          {prompt}
        </div>
      )}

      <textarea
        value={pageText}
        onChange={e => onPageTextChange(e.target.value)}
        placeholder={isFirstPage ? "What's on your mind today..." : ''}
        rows={linesPerPage}
        maxLength={JOURNAL.MAX_CHARS}
        className="flex-1 w-full resize-none outline-none rounded-lg p-3"
        style={{
          color: colors.bodyText,
          fontFamily: 'var(--font-caveat), Georgia, serif',
          fontSize: `${JOURNAL.FONT_SIZE}px`,
          lineHeight: `${JOURNAL.LINE_HEIGHT}px`,
          caretColor: colors.saveButton,
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${colors.pageBorder}`,
          backgroundImage: `repeating-linear-gradient(transparent, transparent ${JOURNAL.LINE_HEIGHT - 1}px, ${colors.ruledLine} ${JOURNAL.LINE_HEIGHT - 1}px, ${colors.ruledLine} ${JOURNAL.LINE_HEIGHT}px)`,
          backgroundPosition: '0 12px',
        }}
      />

      <div className="text-right text-[10px] mt-2"
        style={{ color: charCount > JOURNAL.MAX_CHARS * 0.9 ? colors.saveButton : colors.prompt }}>
        {charCount} / {JOURNAL.MAX_CHARS}
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------------

function PhotosDoodlePage({
  colors, photos, onPhotoAdd, doodleStrokes, onStrokesChange, canSave, saving, onSave,
}: {
  colors: ReturnType<typeof getGlassDiaryColors>
  photos: Photo[]
  onPhotoAdd: (position: 1 | 2, dataUrl: string) => void
  doodleStrokes: StrokeData[]
  onStrokesChange: (strokes: StrokeData[]) => void
  canSave: boolean
  saving: boolean
  onSave: () => void
}) {
  return (
    <div
      className="h-full p-4 rounded-2xl flex flex-col gap-3 overflow-y-auto"
      style={{
        background: colors.pageBg,
        backdropFilter: `blur(${colors.pageBlur})`,
        WebkitBackdropFilter: `blur(${colors.pageBlur})`,
        border: `1px solid ${colors.pageBorder}`,
        boxShadow: '0 8px 28px rgba(0,0,0,0.3)',
      }}
    >
      <div>
        <div className="text-[10px] uppercase tracking-[0.18em] mb-2 font-medium"
          style={{ color: colors.sectionLabel }}>
          Photos
        </div>
        <PhotoBlock photos={photos} onPhotoAdd={onPhotoAdd} />
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-[0.18em] mb-2 font-medium"
          style={{ color: colors.sectionLabel }}>
          Draw
        </div>
        <div style={{ height: 160 }}>
          <CompactDoodleCanvas
            strokes={doodleStrokes}
            onStrokesChange={onStrokesChange}
            doodleColors={[colors.bodyText, colors.saveButton, colors.ribbon, colors.prompt]}
            canvasBackground={colors.doodleBg}
            canvasBorder={colors.doodleBorder}
            textColor={colors.bodyText}
            mutedColor={colors.prompt}
          />
        </div>
      </div>

      {canSave && (
        <button
          onClick={onSave}
          disabled={saving}
          className="w-full py-3 rounded-full text-sm font-medium mt-auto"
          style={{
            background: colors.saveButton,
            color: 'white',
            opacity: saving ? 0.6 : 1,
            boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
          }}
        >
          {saving ? 'Saving...' : 'Save Entry'}
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
docker compose exec app npx tsc --noEmit
```

Expected: zero TypeScript errors.

- [ ] **Step 3: Visual check on a phone-sized viewport**

```bash
docker compose restart app
```

Open `http://localhost:3111/write` in Chrome DevTools with mobile device emulation (iPhone 14 Pro is a fine default). Verify:
- Page 1 shows: SONG section, "WRITE YOUR THOUGHTS" label, prompt, textarea with ruled lines, char counter, pagination dots
- Type beyond the textarea capacity — text overflows onto a new page automatically (page 2 appears)
- Swipe left/right between pages
- Tap dots to jump
- Last page shows: PHOTOS section, DRAW section, Save Entry button
- Save Entry persists; reload shows the entry in the timeline route

Edge cases to manually exercise:
- Type to fill page 1, hit Enter several times, then keep typing — verify overflow lands on page 2 cleanly
- Delete backward at the start of page 2 — caret should not get stuck (text re-paginates; if page 2 empties, swipe back to page 1 still works)
- Paste a 1000-char block into page 1 — verify it spreads across pages without losing chars
- Verify char counter is the *total* across all pages, not just the active page

If any of these fail, fix the `paginate()` or `handlePageTextChange` logic before continuing.

- [ ] **Step 4: Commit**

```bash
git add src/components/desk/MobileJournalEntry.tsx
git commit -m "Replace mobile journal entry with paginated glass diary"
```

---

## Phase 8 — Final cleanup, theme verification, polish

### Task 19: Verify glass diary on every page theme

**Files:** none modified — pure verification.

- [ ] **Step 1: For each of the 11 page themes, open `/write` and visually verify**

Open `http://localhost:3111/write`. Use the existing `ThemeSwitcher` component (visible in the bottom-right corner) to cycle through all 11 themes:

`rivendell`, `hobbiton`, `winterSunset`, `cherryBlossom`, `northernLights`, `mistyMountains`, `gentleRain`, `cosmos`, `candlelight`, `oceanTwilight`, `quietSnow`.

For each, verify:
- Background animation (particles) is visible behind the diary pages
- Page tint adapts to the theme (green on Rivendell, purple on Cosmos, pink on Cherry Blossom, etc.)
- Body text remains legible (high contrast against the page tint)
- Ruled lines are visible but subtle
- Ribbon color matches the theme's primary accent
- Save button color matches the theme's warm accent

If any theme has a contrast issue (text too dim, ruled lines invisible), tweak the alpha values in `src/lib/glassDiaryColors.ts` and re-verify all 11 themes.

- [ ] **Step 2: Verify on mobile viewport**

In Chrome DevTools mobile emulation, repeat Step 1 across all 11 themes. Same verification list.

- [ ] **Step 3: Commit any tweaks made**

```bash
git add src/lib/glassDiaryColors.ts
git commit -m "Tune glass diary alphas for cross-theme legibility"
```

(Skip if no tweaks were needed.)

### Task 20: Final dead-code sweep

**Files:** various — driven by grep results.

- [ ] **Step 1: Confirm zero references to removed identifiers**

```bash
grep -rn "useDiaryStore\|currentDiaryTheme\|isBookOpen\|openBook\|closeBook\|DiaryThemeSelector\|DeskBook" /Users/himanshut4d/Documents/Personal_projects/feel_good/hearth/src/
```

Expected: zero matches. If any remain, fix them.

- [ ] **Step 2: Confirm `diaryThemes.ts` has no remaining consumers that need its full API**

```bash
grep -rn "from '@/lib/diaryThemes'\|diaryThemes\[" /Users/himanshut4d/Documents/Personal_projects/feel_good/hearth/src/
```

Expected: only imports of `DiaryThemeName` (a type alias) and possibly the empty list. If any consumer reads `pages.background`, `cover.*`, etc., fix it (those fields no longer exist on the new shim).

- [ ] **Step 3: Run lint**

```bash
docker compose exec app npm run lint
```

Expected: pass cleanly. Fix any new warnings.

- [ ] **Step 4: Run a production build**

```bash
docker compose exec app npm run build
```

Expected: build succeeds with zero errors. Address any that appear.

- [ ] **Step 5: Commit any cleanup**

```bash
git add -A
git commit -m "Final cleanup: remove dead diary-theme references"
```

(Skip if nothing to commit.)

### Task 21: End-to-end smoke test

**Files:** none.

- [ ] **Step 1: Full smoke walkthrough**

Restart the stack:

```bash
docker compose restart app
```

Walk through the following end-to-end:

1. Visit `/login`, log in.
2. Land on `/write` (or navigate via the Write tab). Confirm glass diary opens directly to today's spread.
3. Desktop: write something on the left page, fill it past the line limit — confirm overflow flows to right page (existing behavior preserved).
4. Add a song link, two photos, draw a doodle. Save.
5. Confirm "Entry Saved" overlay appears.
6. Refresh the page — confirm the saved entry is reachable via the page-turn arrows.
7. Switch the page theme via the theme switcher — confirm the diary tint updates instantly.
8. In Chrome DevTools mobile emulation, open `/write`, type a long entry that spans 2+ pages, swipe through them, add a photo on the last page, save.
9. Visit `/desk` — confirm it now 404s (the route was deleted in Task 15) or redirects.
10. Visit `/timeline`, `/calendar`, `/letters` — confirm they still load (out of scope but sanity).

If anything fails, file the specific bug and fix in a follow-up commit before declaring done.

- [ ] **Step 2: Commit** (if any fixes were needed)

```bash
git add -A
git commit -m "Fix smoke-test issues from glass diary launch"
```

(Skip if smoke test passed cleanly.)

- [ ] **Step 3: Push**

```bash
git push origin main
```

(Optional — only if you're ready to publish. The user can hold off.)

---

## Risks & known limitations

- **Glass alpha tuning across 11 themes** — if any theme has very dark `theme.glass.bg` (e.g. `cosmos` at 0.7 alpha), the body text may compete with the tint. Task 19 includes a manual verification pass; expect to spend ~20 min adjusting alphas.
- **Pagination edge cases on mobile** — pasting huge text, IME composition (Japanese / Chinese keyboards), and very fast typing can race the re-pagination logic. The implementation in Task 18 chooses correctness over speed: every keystroke recomputes the tail. This is fine at the 1200-char ceiling but worth watching.
- **`/desk` external links** — there are no known external bookmarks, but if a returning user has cached `/desk`, they get a 404 after Task 15. Acceptable for an internal/early-stage app.
- **Page-turn animation on mobile** — the existing desktop `PageTurn` component animates a 3D paper curl. The new mobile pager uses a simple horizontal slide instead. This is intentional (paper-curl on a phone looks awkward).

---

## Definition of done

All checkboxes above are checked. `npm run lint` and `npm run build` pass. `/write` renders the glass diary on desktop and mobile across all 11 page themes. `/desk` is gone. Six diary themes and the diary theme selector are gone. The user can write, paginate (mobile), save, and reload an entry end-to-end.
