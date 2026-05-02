# Sent Letters Jar Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current `/letters` (sent tab) lined-album view with the jar + hanging-tag view from the working demo at `/letters/sent-demo`, wired to real `/api/letters/sent` data, with empty-state, responsive layout, reduced-motion support, and basic accessibility per the design at `docs/plans/2026-05-02-sent-letters-jar-redesign-design.md`.

**Architecture:** Promote `JarShelfDemo` to a reusable `JarSentView` component that takes `stamps`, `launchYear`, `launchMonth` as props. Replace `SentView`'s body to fetch real stamps and render `JarSentView`. Keep existing `Stamp` + `ReceiptModal` for fanout interactions. Delete the obsolete `YearTabs` once the jar is shipped. Calendar bounds and mode logic live inside `JarSentView`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, styled-jsx, inline SVG. Project runs in Docker — restarts via `docker compose restart app`, type-checks via `docker compose exec -T app npx tsc --noEmit`.

**Design reference:** `docs/plans/2026-05-02-sent-letters-jar-redesign-design.md`. Working demo: `/letters/sent-demo` — visual contract for jar shape, hanging tag, fanout, prompts, fonts, palette.

---

## File structure

### Files to create

```
src/components/letters/sent/
└── JarSentView.tsx                  # promoted from JarShelfDemo, props-driven, wired to real data
```

### Files to modify

```
src/components/letters/sent/
├── SentView.tsx                     # body replaced — fetch + render <JarSentView />
├── Stamp.tsx                        # add reduced-motion guard for stamp tilt (optional, see Task 5)
└── (JarSentView.tsx — see above)

src/app/letters/sent-demo/page.tsx   # update to render JarSentView with mock stamps (still useful for offline preview)
```

### Files to delete

```
src/components/letters/sent/
├── JarShelfDemo.tsx                 # replaced by JarSentView (see Task 1)
├── YearTabs.tsx                     # superseded by hanging tag (see Task 7)
└── StampGrid.tsx                    # only one caller (SentView grid mode), no longer needed (see Task 7)
```

`src/components/letters/sent/lettersData.ts` provides `groupSentByYear` — keep it for now in case other surfaces use it; delete only if no consumers remain after Task 7.

---

## Task 1: Extract `JarSentView` from `JarShelfDemo`

**Files:**
- Create: `src/components/letters/sent/JarSentView.tsx`
- Modify: `src/app/letters/sent-demo/page.tsx`
- Delete (after verify): `src/components/letters/sent/JarShelfDemo.tsx`

The demo holds inline mock data and hard-coded `LAUNCH_YEAR`/`LAUNCH_MONTH`. Pull these out as props so the same component drives both the demo and the live view.

- [ ] **Step 1: Create `JarSentView.tsx` as a copy of `JarShelfDemo.tsx`**

```bash
cp src/components/letters/sent/JarShelfDemo.tsx src/components/letters/sent/JarSentView.tsx
```

- [ ] **Step 2: Replace the component signature and remove the inline `MOCK` array**

Top of `JarSentView.tsx`. Replace:

```tsx
const MOCK: SentStamp[] = [
  { id: '1', recipientName: 'future me', sealedAt: '2026-05-01T10:00:00Z', /* ... */ },
  // ... 9 more entries
]

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

type Mode = 'monthly' | 'yearly'

// Calendar bounds: Hearth launched in 2026; never navigate past today.
const LAUNCH_YEAR = 2026
const LAUNCH_MONTH = 0 // January
```

With:

```tsx
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

type Mode = 'monthly' | 'yearly'

interface JarSentViewProps {
  stamps: SentStamp[]
  /** First valid (year, month) — defaults to (2026, 0) i.e. Jan 2026 (Hearth launch). */
  launchYear?: number
  launchMonth?: number
}
```

- [ ] **Step 3: Update component signature and bound helpers to read from props**

Replace `export default function JarShelfDemo()` with:

```tsx
export default function JarSentView({
  stamps,
  launchYear = 2026,
  launchMonth = 0,
}: JarSentViewProps) {
```

Remove `const [stamps] = useState<SentStamp[]>(MOCK)` (the prop replaces it).

Replace the three module-level bound helpers (`canGoPrev`, `canGoNext`, `clampToBounds`) with closures that read `launchYear`/`launchMonth`:

```tsx
function todayYM() {
  const now = new Date()
  return { y: now.getFullYear(), m: now.getMonth() }
}

const canGoPrev = (mode: Mode, year: number, month: number): boolean => {
  if (mode === 'yearly') return year > launchYear
  return year > launchYear || (year === launchYear && month > launchMonth)
}
const canGoNext = (mode: Mode, year: number, month: number): boolean => {
  const t = todayYM()
  if (mode === 'yearly') return year < t.y
  return year < t.y || (year === t.y && month < t.m)
}
const clampToBounds = (year: number, month: number): { y: number; m: number } => {
  const t = todayYM()
  if (year > t.y || (year === t.y && month > t.m)) return { y: t.y, m: t.m }
  if (year < launchYear || (year === launchYear && month < launchMonth)) {
    return { y: launchYear, m: launchMonth }
  }
  return { y: year, m: month }
}
```

These now sit *inside* the component (closures over the props). Keep `todayYM()` as a module-level helper since it has no captured state.

- [ ] **Step 4: Initialize `year`/`month` defensively when stamps are empty or all out of bounds**

Replace:

```tsx
const mostRecent = useMemo(() => {
  if (!stamps.length) return { y: new Date().getFullYear(), m: new Date().getMonth() }
  const sorted = [...stamps].sort((a, b) => +new Date(b.sealedAt) - +new Date(a.sealedAt))
  const d = new Date(sorted[0].sealedAt)
  return { y: d.getFullYear(), m: d.getMonth() }
}, [stamps])

const [year, setYear] = useState(mostRecent.y)
const [month, setMonth] = useState(mostRecent.m)
```

With:

```tsx
const mostRecent = useMemo(() => {
  if (!stamps.length) {
    const t = todayYM()
    return clampToBounds(t.y, t.m)
  }
  const sorted = [...stamps].sort((a, b) => +new Date(b.sealedAt) - +new Date(a.sealedAt))
  const d = new Date(sorted[0].sealedAt)
  return clampToBounds(d.getFullYear(), d.getMonth())
}, [stamps]) // eslint-disable-line react-hooks/exhaustive-deps -- launchYear/launchMonth captured intentionally; bounds are stable per mount

const [year, setYear] = useState(mostRecent.y)
const [month, setMonth] = useState(mostRecent.m)
```

- [ ] **Step 5: Update the demo page to render `JarSentView` with mock data**

Replace the entire body of `src/app/letters/sent-demo/page.tsx` with:

```tsx
'use client'

import LettersTokens from '@/components/letters/LettersTokens'
import JarSentView from '@/components/letters/sent/JarSentView'
import type { SentStamp } from '@/components/letters/letterTypes'

const MOCK: SentStamp[] = [
  { id: '1', recipientName: 'future me', sealedAt: '2026-05-01T10:00:00Z', unlockDate: '2026-05-08T10:00:00Z', isDelivered: false, letterPeekedAt: null },
  { id: '2', recipientName: 'rito',      sealedAt: '2026-04-20T10:00:00Z', unlockDate: '2026-04-27T10:00:00Z', isDelivered: false, letterPeekedAt: null },
  { id: '3', recipientName: 'future me', sealedAt: '2026-04-12T10:00:00Z', unlockDate: '2026-04-19T10:00:00Z', isDelivered: true,  letterPeekedAt: null },
  { id: '4', recipientName: 'ANJU',      sealedAt: '2026-03-19T10:00:00Z', unlockDate: '2026-03-26T10:00:00Z', isDelivered: true,  letterPeekedAt: null },
  { id: '5', recipientName: 'future me', sealedAt: '2026-03-08T10:00:00Z', unlockDate: '2026-03-15T10:00:00Z', isDelivered: true,  letterPeekedAt: null },
  { id: '6', recipientName: 'future me', sealedAt: '2026-02-22T10:00:00Z', unlockDate: '2026-02-27T10:00:00Z', isDelivered: true,  letterPeekedAt: null },
  { id: '7', recipientName: 'mom',       sealedAt: '2026-02-14T10:00:00Z', unlockDate: '2026-02-21T10:00:00Z', isDelivered: true,  letterPeekedAt: null },
  { id: '8', recipientName: 'future me', sealedAt: '2026-02-05T10:00:00Z', unlockDate: '2026-02-12T10:00:00Z', isDelivered: true,  letterPeekedAt: null },
  { id: '9', recipientName: 'sam',       sealedAt: '2026-01-25T10:00:00Z', unlockDate: '2026-02-01T10:00:00Z', isDelivered: true,  letterPeekedAt: null },
  { id: '10', recipientName: 'future me',sealedAt: '2026-01-10T10:00:00Z', unlockDate: '2026-01-17T10:00:00Z', isDelivered: true,  letterPeekedAt: null },
]

export default function SentDemoPage() {
  return (
    <>
      <LettersTokens />
      <JarSentView stamps={MOCK} />
    </>
  )
}
```

- [ ] **Step 6: Type-check and verify the demo still works**

Run:
```bash
docker compose exec -T app npx tsc --noEmit --pretty
```
Expected: zero errors.

Open `http://localhost:3111/letters/sent-demo` in browser. Verify:
- Header reads "letters i've sent" + "tap the jar to see who you've written to" + subtitle
- Mode toggle visible
- Jar renders with cork lid, wax seal, twine, hanging tag
- Tag arrows navigate Jan–May 2026; both arrows disabled in yearly mode (only 2026)
- Tapping the jar fans out stamps with mixed shapes

- [ ] **Step 7: Delete `JarShelfDemo.tsx`**

```bash
rm src/components/letters/sent/JarShelfDemo.tsx
```

Re-type-check:
```bash
docker compose exec -T app npx tsc --noEmit --pretty
```
Expected: zero errors. (Demo page no longer imports JarShelfDemo.)

- [ ] **Step 8: Commit**

```bash
git add src/components/letters/sent/JarSentView.tsx \
        src/app/letters/sent-demo/page.tsx
git rm src/components/letters/sent/JarShelfDemo.tsx
git commit -m "refactor(letters/sent): extract JarSentView from JarShelfDemo

- Promote demo component to a props-driven reusable view
- Stamps, launchYear, launchMonth now props (defaults: Jan 2026)
- Demo route updated to pass mock stamps explicitly"
```

---

## Task 2: Wire `SentView` to the new jar view

**Files:**
- Modify: `src/components/letters/sent/SentView.tsx`

`SentView` currently renders the lined-album. After this task it renders `JarSentView` with the data it already fetches.

- [ ] **Step 1: Replace the body of `SentView.tsx`**

Replace the entire file contents with:

```tsx
'use client'

import { useEffect, useState } from 'react'
import JarSentView from './JarSentView'
import type { SentStamp } from '../letterTypes'

export default function SentView() {
  const [stamps, setStamps] = useState<SentStamp[]>([])

  useEffect(() => {
    fetch('/api/letters/sent')
      .then(r => r.json())
      .then(d => setStamps(d.stamps || []))
      .catch(() => {})
  }, [])

  return <JarSentView stamps={stamps} />
}
```

- [ ] **Step 2: Type-check**

Run:
```bash
docker compose exec -T app npx tsc --noEmit --pretty
```
Expected: zero errors.

- [ ] **Step 3: Verify the live page in browser**

Visit `http://localhost:3111/letters` → click `sent` tab. Expected:
- Header + jar + hanging tag visible (no more lined album)
- Real stamps from your account populate the jar
- Tag navigates real months
- Clicking the jar fans out real stamps; clicking a stamp opens the existing `ReceiptModal`

If the user has zero sent letters, the jar appears with `0 letters` on the tag and no envelopes inside — Task 3 handles the empty-state copy.

- [ ] **Step 4: Commit**

```bash
git add src/components/letters/sent/SentView.tsx
git commit -m "feat(letters/sent): replace lined album with jar view

Wire /api/letters/sent into JarSentView. The lined-album
implementation is gone; the jar is now the only sent surface."
```

---

## Task 3: Empty-state copy when the user has zero sent letters

**Files:**
- Modify: `src/components/letters/sent/JarSentView.tsx`

When `stamps.length === 0` we still want the jar to show, but the bottom legend currently reads `0 sealed · 0 delivered` with no context. Add a soft empty-state line above the legend.

- [ ] **Step 1: Add an empty-state node in the legend area**

Find the `Jar` component (inside `JarSentView.tsx`). Locate the `<div className="legend">` block and replace it with:

```tsx
{total === 0 ? (
  <div className="empty-state">
    you haven&rsquo;t sealed any letters yet — your jar is waiting
  </div>
) : (
  <div className="legend">
    <span className="dot sealed" /> {sealed} sealed
    <span className="sep">·</span>
    <span className="dot delivered" /> {delivered} delivered
  </div>
)}
```

Note: this conditional is on the *current selection's* total (`total === 0`). To distinguish "no letters in this month" from "no letters ever", we'd need the parent's full stamps count. Pass it down:

In `JarSentView`, change the `Jar` prop pass:

```tsx
<Jar
  sealed={sealed}
  delivered={delivered}
  total={total}
  totalEver={stamps.length}
  opened={opened}
  onToggle={() => setOpened(o => !o)}
/>
```

In the `JarProps` interface and `Jar` function, add:

```tsx
interface JarProps {
  sealed: number
  delivered: number
  total: number
  totalEver: number
  opened: boolean
  onToggle: () => void
}

function Jar({ sealed, delivered, total, totalEver, opened, onToggle }: JarProps) {
```

Update the conditional:

```tsx
{totalEver === 0 ? (
  <div className="empty-state">
    you haven&rsquo;t sealed any letters yet — your jar is waiting
  </div>
) : (
  <div className="legend">
    <span className="dot sealed" /> {sealed} sealed
    <span className="sep">·</span>
    <span className="dot delivered" /> {delivered} delivered
  </div>
)}
```

- [ ] **Step 2: Add CSS for the `.empty-state`**

Inside the `Jar` component's `<style jsx>` block, add (before the closing backtick):

```css
.empty-state {
  margin-top: 6px;
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 12.5px;
  color: var(--text-muted);
  letter-spacing: 0.3px;
  text-align: center;
  max-width: 280px;
}
```

- [ ] **Step 3: Type-check and verify**

Run:
```bash
docker compose exec -T app npx tsc --noEmit --pretty
```
Expected: zero errors.

In browser, log in as a fresh test user with zero sent letters (or temporarily pass `stamps={[]}` in the demo page). Verify the empty-state line appears under the jar instead of `0 sealed · 0 delivered`.

- [ ] **Step 4: Commit**

```bash
git add src/components/letters/sent/JarSentView.tsx
git commit -m "feat(letters/sent): add empty-state copy when jar has no letters"
```

---

## Task 4: Responsive layout for narrow viewports

**Files:**
- Modify: `src/components/letters/sent/JarSentView.tsx`

The jar block is fixed at `520×410`. Below ~640px viewport width the hanging tag escapes the screen. Add a media query that scales the jar down and swings the tag below the jar instead of beside it.

- [ ] **Step 1: Add media-query rules to the jar-stage / jar-block / hang positioning**

In `JarSentView.tsx`, locate the `<style jsx>` block at the bottom of the `JarSentView` component (the one defining `.jar-stage`, `.jar-block`, `.shelf`). Append the following inside that style block:

```css
@media (max-width: 640px) {
  .jar-block {
    width: 320px;
    height: 360px;
  }
  .jar-block :global(svg) {
    width: 240px;
    height: 290px;
  }
  /* On narrow screens the tag sits under the jar's right shoulder
     instead of dangling beside it. */
}
```

- [ ] **Step 2: Override `.hang` position inside the `HangingTag` component for narrow screens**

Locate the `<style jsx>` inside the `HangingTag` component and append (before the closing backtick):

```css
@media (max-width: 640px) {
  .hang {
    /* Smaller jar (240×290 inside a 320×360 block):
       jar left = (320-240)/2 = 40
       right neck x = 40 + 210*(240/280) = 40 + 180 = 220
       neck top y  = (360-290) + 58*(290/340) ≈ 70 + 49 = 119 */
    top: 119px;
    left: 220px;
  }
  .tag-wrap {
    top: 64px;
    left: 8px;
  }
  .tag {
    width: 150px;
  }
  .title {
    font-size: 17px;
  }
}
```

- [ ] **Step 3: Verify in browser at narrow viewport**

Open DevTools, set viewport to 360×800 (or use the responsive emulator), reload `/letters` (sent tab). Expected:
- Jar shrinks
- Hanging tag still attached, doesn't escape the right edge
- Stamp fanout grid wraps cleanly
- Header and toggle still readable

- [ ] **Step 4: Commit**

```bash
git add src/components/letters/sent/JarSentView.tsx
git commit -m "feat(letters/sent): responsive jar layout for narrow viewports

- Jar block scales down below 640px
- Hanging tag repositions to stay on-screen"
```

---

## Task 5: Reduced-motion support

**Files:**
- Modify: `src/components/letters/sent/JarSentView.tsx`

Fireflies use SVG `<animate>` and the lid uses CSS transitions. Users who set `prefers-reduced-motion: reduce` should see static content.

- [ ] **Step 1: Wrap firefly `<animate>` elements in a `prefers-reduced-motion` media-aware fragment**

The simplest path: render the `<animate>` elements only when motion is allowed. Add a `useReducedMotion` hook at the top of `JarSentView.tsx` (after imports):

```tsx
function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mql.matches)
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])
  return reduced
}
```

- [ ] **Step 2: Use the hook in the `Jar` component and conditionally render animations**

In `Jar`, near the top:

```tsx
const reducedMotion = useReducedMotion()
```

Find the `<g className="fireflies">` block and replace each `<circle>` with a conditional `<animate>` wrap:

```tsx
<g className="fireflies">
  <circle cx="92" cy="200" r="1.6" fill="rgba(255,210,140,0.85)">
    {!reducedMotion && (
      <animate attributeName="opacity" values="0.3;1;0.3" dur="3.4s" repeatCount="indefinite" />
    )}
  </circle>
  <circle cx="178" cy="170" r="1.3" fill="rgba(255,225,160,0.8)">
    {!reducedMotion && (
      <animate attributeName="opacity" values="1;0.3;1" dur="2.8s" repeatCount="indefinite" />
    )}
  </circle>
  <circle cx="155" cy="225" r="1.7" fill="rgba(255,210,140,0.85)">
    {!reducedMotion && (
      <animate attributeName="opacity" values="0.4;1;0.4" dur="4.1s" repeatCount="indefinite" />
    )}
  </circle>
  <circle cx="105" cy="255" r="1.2" fill="rgba(255,225,170,0.75)">
    {!reducedMotion && (
      <animate attributeName="opacity" values="0.5;1;0.5" dur="3.2s" repeatCount="indefinite" />
    )}
  </circle>
</g>
```

- [ ] **Step 3: Disable lid hover/transition under reduced motion**

In the `Jar` component's `<style jsx>` block, append:

```css
@media (prefers-reduced-motion: reduce) {
  .jar { transition: none; }
  .jar:hover { transform: translateX(-50%); }
  .jar :global(.lid) { transition: none; }
}
```

- [ ] **Step 4: Type-check and verify**

Run:
```bash
docker compose exec -T app npx tsc --noEmit --pretty
```
Expected: zero errors.

In browser DevTools, set `prefers-reduced-motion: reduce` (Rendering tab → Emulate CSS media feature). Reload `/letters` (sent tab). Verify:
- Fireflies are static (visible but not pulsing)
- Lid does not animate on hover/click
- Jar still opens functionally (lid lifts instantly)

- [ ] **Step 5: Commit**

```bash
git add src/components/letters/sent/JarSentView.tsx
git commit -m "feat(letters/sent): respect prefers-reduced-motion

- Firefly opacity animations skip when motion is reduced
- Lid hover/lift transitions disabled in same case"
```

---

## Task 6: Screen-reader summary

**Files:**
- Modify: `src/components/letters/sent/JarSentView.tsx`

Add an `aria-live` region that announces the current selection so screen-reader users get audible feedback when navigating with the tag arrows or toggling mode.

- [ ] **Step 1: Add the live region inside `JarSentView`**

In `JarSentView`, just before the `</section>` closing tag, add:

```tsx
<div
  role="status"
  aria-live="polite"
  style={{
    position: 'absolute',
    width: 1, height: 1,
    margin: -1, padding: 0,
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    whiteSpace: 'nowrap',
    border: 0,
  }}
>
  Showing {total} letter{total === 1 ? '' : 's'} from {tagLabel}
  {total > 0 && `: ${sealed} sealed, ${delivered} delivered`}
</div>
```

- [ ] **Step 2: Add `aria-label`s to the jar `<button>` and tag arrows**

The jar button already has `aria-label={opened ? 'Close jar' : 'Open jar'}` — verify it's there. The tag arrows already have `aria-label="previous"` / `aria-label="next"`. Improve them to include context:

In `HangingTag`, replace:

```tsx
<button className="nav prev" onClick={onPrev} disabled={!canPrev} aria-label="previous">‹</button>
```

with:

```tsx
<button
  className="nav prev"
  onClick={onPrev}
  disabled={!canPrev}
  aria-label={`Previous ${label}`}
>‹</button>
```

And similarly for the next button:

```tsx
<button
  className="nav next"
  onClick={onNext}
  disabled={!canNext}
  aria-label={`Next ${label}`}
>›</button>
```

- [ ] **Step 3: Verify with a screen reader**

Mac: enable VoiceOver (`Cmd+F5`). Navigate `/letters` sent tab with `Ctrl+Option+Right`. When focus reaches the tag arrows and you press them, VoiceOver should announce "Showing N letters from <Month Year>: X sealed, Y delivered".

If you don't have VoiceOver set up, manually inspect the DOM: the live region should update its text content when the cursor changes.

- [ ] **Step 4: Commit**

```bash
git add src/components/letters/sent/JarSentView.tsx
git commit -m "feat(letters/sent): screen-reader summary for current jar selection"
```

---

## Task 7: Delete obsolete code

**Files:**
- Delete: `src/components/letters/sent/YearTabs.tsx`
- Delete: `src/components/letters/sent/StampGrid.tsx`
- Modify: `src/components/letters/sent/lettersData.ts` (only if `groupSentByYear` is now unreferenced)

`YearTabs` and `StampGrid` were the lined-album view's components. Nothing else imports them after Task 2.

- [ ] **Step 1: Verify nothing imports `YearTabs` or `StampGrid`**

Run:
```bash
grep -r "YearTabs\|StampGrid" src/ --include="*.tsx" --include="*.ts"
```
Expected: only matches inside `YearTabs.tsx` and `StampGrid.tsx` themselves. If anything else matches, halt and investigate.

- [ ] **Step 2: Delete the files**

```bash
rm src/components/letters/sent/YearTabs.tsx
rm src/components/letters/sent/StampGrid.tsx
```

- [ ] **Step 3: Check `lettersData.ts` for orphan helpers**

```bash
grep -r "groupSentByYear" src/ --include="*.tsx" --include="*.ts"
```
If it's only referenced inside `lettersData.ts`, remove the export. If still used elsewhere (e.g., InboxView analogues), leave it.

- [ ] **Step 4: Type-check**

Run:
```bash
docker compose exec -T app npx tsc --noEmit --pretty
```
Expected: zero errors.

- [ ] **Step 5: Commit**

```bash
git rm src/components/letters/sent/YearTabs.tsx src/components/letters/sent/StampGrid.tsx
git add src/components/letters/sent/lettersData.ts  # only if modified
git commit -m "chore(letters/sent): remove obsolete YearTabs and StampGrid

Replaced by hanging tag selector and inline fanout grid."
```

---

## Task 8: Decide on the demo route

**Files:**
- Optional delete: `src/app/letters/sent-demo/page.tsx`

The `/letters/sent-demo` route was a working preview while the jar lived as a demo. Now that the jar is the live `/letters` (sent) view, the route is redundant but harmless — it's useful as an offline preview that doesn't depend on the user having seeded sent letters.

- [ ] **Step 1: Decision point — keep or remove?**

Two options:

**Option A — Keep as offline preview** (recommended):
Leave the route. Add a comment to the file explaining why it exists:

```tsx
'use client'

// Offline preview of the sent-letters jar view, populated with mock data.
// Useful for design review without seeding a test account. The live view
// at /letters (sent tab) renders the same component with real data.
import LettersTokens from '@/components/letters/LettersTokens'
import JarSentView from '@/components/letters/sent/JarSentView'
import type { SentStamp } from '@/components/letters/letterTypes'

const MOCK: SentStamp[] = [ /* ... */ ]

export default function SentDemoPage() {
  return (
    <>
      <LettersTokens />
      <JarSentView stamps={MOCK} />
    </>
  )
}
```

**Option B — Delete:**

```bash
rm -r src/app/letters/sent-demo
```

- [ ] **Step 2: Commit the decision**

If Option A:
```bash
git add src/app/letters/sent-demo/page.tsx
git commit -m "docs(letters/sent): annotate /sent-demo as the offline mock preview"
```

If Option B:
```bash
git rm -r src/app/letters/sent-demo
git commit -m "chore(letters): remove /letters/sent-demo route now that jar is live"
```

---

## Final verification

- [ ] **Run full type-check**

```bash
docker compose exec -T app npx tsc --noEmit --pretty
```
Expected: zero errors.

- [ ] **Run lint**

```bash
docker compose exec -T app npm run lint
```
Expected: zero errors. (Warnings about unrelated files OK; nothing in `src/components/letters/sent/`.)

- [ ] **Smoke-test in browser**

Visit `http://localhost:3111/letters` → click `sent` tab. Walk through:
- Jar renders, lid pops on click, stamps fan out above
- Tag arrows navigate Jan 2026 → today
- `monthly` ↔ `full year` toggle clamps cursor and resets the open state
- Both arrows disabled when at a bound (Jan 2026 prev / current month next / both in yearly today)
- Stamp shape variety visible (postage / circle / rect mix) when fanned out
- Click a stamp → existing `ReceiptModal` opens unchanged
- Empty test account: empty-state line shows under jar
- Narrow viewport: tag stays on screen, jar shrinks
- `prefers-reduced-motion`: fireflies static, lid does not animate

If all green, the redesign is shipped.

---

## Out of scope (intentionally NOT in this plan)

- Inbox view (`InboxView.tsx`) — untouched.
- Compose flow (`/letters/write`) — untouched.
- `ReceiptModal` design or behavior — unchanged; reused as-is.
- API / backend / schema — no changes; existing `/api/letters/sent` payload shape is sufficient.
- Per-user `LAUNCH_YEAR` derived from `User.createdAt` — defaulting to hard-coded 2026/Jan; revisit if/when needed.
- The global `Stamp.tsx` shape-variety change is already in place from the demo work and has been merged into the design — no further action needed in this plan.
