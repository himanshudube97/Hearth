# Polaroid Photos & Realistic Page-Flip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the diary's photo slots as polaroid cards (cream paper, washi tape, slight rotation, handwritten date caption), and replace the flat 180° hinge-flip page-turn with a realistic paper-curl turn driven by `react-pageflip`. Desktop only for the page-flip; polaroids ship on mobile too via the shared component.

**Architecture:** Polaroid restyle is a self-contained visual edit inside `PhotoSlot.tsx` — no behavior changes. The page-flip integration replaces the inner book grid in `BookSpread.tsx` with `<HTMLFlipBook>` (dynamically imported, SSR off), feeds two children per entry (LeftPage + RightPage), syncs `useDeskStore.currentSpread` from the library's `onFlip` event, and rewires the existing `‹` / `›` edge clickers to call `flipPrev()` / `flipNext()`. The legacy `PageTurn.tsx` and the `useDeskStore` page-turn state are deleted. Browser back/forward gestures are suppressed on the diary container only.

**Tech Stack:** Next.js 16 / React 19 / Framer Motion v12 / Zustand / TipTap / **react-pageflip 2.0.3 (new)**

**Spec:** `docs/superpowers/specs/2026-04-27-polaroid-and-page-flip-design.md`

---

## File Structure

| File | Operation | Purpose |
|---|---|---|
| `src/components/desk/PhotoSlot.tsx` | Modify | Polaroid card visuals (cream paper, washi tape, dashed inner well, date caption) |
| `package.json` / lockfile | Modify | Add `react-pageflip@^2.0.3` |
| `src/components/desk/BookSpread.tsx` | Modify | Replace inner book grid with `<HTMLFlipBook>`, render every entry's LeftPage+RightPage as children, wire `‹` / `›`, suppress browser back/forward |
| `src/store/desk.ts` | Modify | Remove `isPageTurning`, `turnDirection`, `turnPage`, `finishPageTurn` |
| `src/components/desk/LeftPage.tsx` | Modify *if library demands* | Wrap in `React.forwardRef` shim |
| `src/components/desk/RightPage.tsx` | Modify *if library demands* | Wrap in `React.forwardRef` shim |
| `src/components/desk/PageTurn.tsx` | Delete | Replaced entirely by the library |

No tests are added — the project has no automated test framework (only ESLint per `CLAUDE.md`). Verification is manual + lint + build at every commit boundary.

---

## Verification Environment

The project runs in Docker. Use these commands at every checkpoint:

- **Restart container after code changes:** `docker compose restart app`
- **Tail logs:** `docker compose logs -f app`
- **Lint:** `docker compose exec app npm run lint`
- **Build:** `docker compose exec app npm run build`
- **Install package:** `docker compose exec app npm install <pkg>` (the container has its own `node_modules` volume)

The dev URL is **http://localhost:3111**.

---

## Task 1: Polaroid restyle of PhotoSlot (empty state)

**Files:**
- Modify: `src/components/desk/PhotoSlot.tsx`

- [ ] **Step 1: Locate the empty-state JSX in `PhotoSlot.tsx`**

The empty-state markup is the final `return (...)` block at lines 211–281 (the one that renders when `!photo && !disabled`). It currently renders a dashed-border tile with Upload/Click buttons.

- [ ] **Step 2: Replace the empty-state JSX block**

Replace lines 211–281 with the following polaroid markup:

```tsx
  return (
    <motion.div
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={{
        transform: `rotate(${defaultRotation}deg)`,
        transformOrigin: 'center center',
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Polaroid card (cream paper) */}
      <div
        className="relative"
        style={{
          background: '#f5efdc',
          padding: '8px 8px 22px',
          boxShadow: '0 6px 14px rgba(0,0,0,0.35)',
        }}
      >
        {/* Washi-tape strip at the top */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '-8px',
            left: '50%',
            transform: 'translateX(-50%) rotate(-2deg)',
            width: '50px',
            height: '14px',
            background: 'rgba(220, 200, 140, 0.55)',
            border: '1px solid rgba(220, 200, 140, 0.25)',
            pointerEvents: 'none',
          }}
        />

        {/* Inner photo well (empty state) */}
        <div
          className="w-full flex flex-col items-center justify-center"
          style={{
            aspectRatio: '4/5',
            background: 'rgba(40,60,45,0.4)',
            border: `1px dashed ${
              isHovering ? 'rgba(60,40,20,0.55)' : 'rgba(60,40,20,0.3)'
            }`,
          }}
        >
          {isProcessing ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="text-lg"
              style={{ color: 'rgba(60,40,20,0.5)' }}
            >
              ...
            </motion.div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 w-3/4">
              <motion.button
                onClick={handleUploadClick}
                className="w-full py-1.5 rounded text-[11px] cursor-pointer"
                style={{
                  fontFamily: "'Caveat', cursive",
                  color: 'rgba(60,40,20,0.65)',
                  background: 'rgba(255,250,235,0.6)',
                  border: '1px solid rgba(60,40,20,0.15)',
                }}
                whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,250,235,0.85)' }}
                whileTap={{ scale: 0.97 }}
              >
                Upload
              </motion.button>
              {onCameraCapture && (
                <motion.button
                  onClick={handleCameraClick}
                  className="w-full py-1.5 rounded text-[11px] cursor-pointer"
                  style={{
                    fontFamily: "'Caveat', cursive",
                    color: 'rgba(60,40,20,0.65)',
                    background: 'rgba(255,250,235,0.6)',
                    border: '1px solid rgba(60,40,20,0.15)',
                  }}
                  whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,250,235,0.85)' }}
                  whileTap={{ scale: 0.97 }}
                >
                  Click
                </motion.button>
              )}
            </div>
          )}
        </div>

        {/* Date caption strip below photo well */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            bottom: '4px',
            left: '8px',
            right: '8px',
            display: 'flex',
            justifyContent: 'flex-end',
            fontFamily: "'Caveat', cursive",
            fontSize: '11px',
            color: 'rgba(60,40,20,0.5)',
          }}
        >
          ~
        </div>
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 3: Lint and build**

Run: `docker compose exec app npm run lint && docker compose exec app npm run build`
Expected: both pass with no new warnings related to `PhotoSlot.tsx`.

- [ ] **Step 4: Manual verification**

Run: `docker compose restart app && docker compose logs -f app` (Ctrl-C to stop tailing once the app shows ready). Open http://localhost:3111/write.

Verify on a fresh entry:
- Two empty polaroid cards visible on the right page
- Cream/off-white paper background with soft drop shadow
- Slight rotation: slot 1 tilts left, slot 2 tilts right
- Washi-tape strip at the top of each card
- Inner photo well has a dashed border and the Upload / Click buttons centered inside
- Hovering subtly darkens the dashed border

- [ ] **Step 5: Commit**

```bash
git add src/components/desk/PhotoSlot.tsx
git commit -m "$(cat <<'EOF'
Restyle empty PhotoSlot as a polaroid card

Cream paper, washi-tape strip, dashed inner well, soft drop shadow.
Buttons restyled to match the cream palette; behaviour unchanged.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Polaroid restyle of PhotoSlot (filled state) + date caption

**Files:**
- Modify: `src/components/desk/PhotoSlot.tsx`

- [ ] **Step 1: Add a `dateCaption` prop**

In the `PhotoSlotProps` interface (lines 7–18), add an optional `dateCaption` field:

```tsx
interface PhotoSlotProps {
  photo?: {
    url: string
    rotation: number
  } | null
  position: 1 | 2
  spread: number
  onPhotoAdd?: (file: File) => void
  onCameraCapture?: () => void
  disabled?: boolean
  className?: string
  dateCaption?: string  // e.g. "apr 27"
}
```

In the component signature (lines 94–102), accept the prop:

```tsx
const PhotoSlot = memo(function PhotoSlot({
  photo,
  position,
  spread: _spread,
  onPhotoAdd,
  onCameraCapture,
  disabled = false,
  className = '',
  dateCaption = '~',
}: PhotoSlotProps) {
```

- [ ] **Step 2: Replace the filled-state JSX block**

Replace the `if (photo)` block (lines 158–192) with:

```tsx
  // If photo exists, show the polaroid
  if (photo) {
    return (
      <motion.div
        className={`relative ${className}`}
        style={{
          transform: `rotate(${photo.rotation || defaultRotation}deg)`,
          transformOrigin: 'center center',
        }}
        initial={{ opacity: 0, scale: 0.8, rotate: 0 }}
        animate={{ opacity: 1, scale: 1, rotate: photo.rotation || defaultRotation }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <div
          className="relative"
          style={{
            background: '#f5efdc',
            padding: '8px 8px 22px',
            boxShadow: '0 6px 14px rgba(0,0,0,0.35)',
          }}
        >
          {/* Washi-tape strip */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: '-8px',
              left: '50%',
              transform: 'translateX(-50%) rotate(-2deg)',
              width: '50px',
              height: '14px',
              background: 'rgba(220, 200, 140, 0.55)',
              border: '1px solid rgba(220, 200, 140, 0.25)',
              pointerEvents: 'none',
            }}
          />

          {/* Photo */}
          <div
            className="w-full overflow-hidden"
            style={{ aspectRatio: '4/5' }}
          >
            <img
              src={photo.url}
              alt="Journal photo"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Date caption */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              bottom: '4px',
              left: '8px',
              right: '8px',
              display: 'flex',
              justifyContent: 'flex-end',
              fontFamily: "'Caveat', cursive",
              fontSize: '11px',
              color: 'rgba(60,40,20,0.6)',
            }}
          >
            {dateCaption}
          </div>
        </div>
      </motion.div>
    )
  }
```

- [ ] **Step 3: Pass `dateCaption` from `RightPage` and `MobileJournalEntry`**

In `src/components/desk/PhotoBlock.tsx`, add the `dateCaption` prop and forward it to both `<PhotoSlot>` calls. Modify the interface:

```tsx
interface PhotoBlockProps {
  photos: Photo[]
  onPhotoAdd?: (position: 1 | 2, dataUrl: string) => void
  disabled?: boolean
  className?: string
  dateCaption?: string
}
```

In the component params (around line 22), accept the new prop and pass it to both `<PhotoSlot>` instances (lines ~73 and ~86):

```tsx
<PhotoSlot
  photo={photo1}
  position={1}
  spread={1}
  onPhotoAdd={handlePhotoAdd(1)}
  onCameraCapture={handleCameraOpen(1)}
  disabled={disabled || !!photo1}
  className="w-28"
  dateCaption={dateCaption}
/>
```

(Same for `<PhotoSlot photo={photo2} ... />`.)

- [ ] **Step 4: Compute and pass `dateCaption` from `RightPage.tsx`**

In `src/components/desk/RightPage.tsx`, find the `<PhotoBlock ... />` usages (lines 317 and 441 per `grep`). For each one, add a computed `dateCaption` derived from the entry's `createdAt` (or today's date for a new entry). Add this near the top of the render:

```tsx
const captionDate = entry?.createdAt ? new Date(entry.createdAt) : new Date()
const dateCaption = captionDate
  .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  .toLowerCase()
```

Then pass `dateCaption={dateCaption}` to each `<PhotoBlock>`.

- [ ] **Step 5: Same for `MobileJournalEntry.tsx`**

In `src/components/desk/MobileJournalEntry.tsx`, locate the two `<PhotoBlock>` calls (lines 266 and 499 per `grep`). Add the same `dateCaption` computation and pass it through.

- [ ] **Step 6: Lint and build**

```bash
docker compose exec app npm run lint && docker compose exec app npm run build
```
Expected: both pass.

- [ ] **Step 7: Manual verification**

Restart and open the app. Verify:
- Empty polaroids show `~` as the date caption (placeholder)
- Filled polaroids (existing entries with photos) show the entry date in lowercase short form (e.g. `apr 27`)
- Adding a new photo shows today's date as the caption
- Mobile (narrow viewport) shows the same polaroid look

- [ ] **Step 8: Commit**

```bash
git add src/components/desk/PhotoSlot.tsx src/components/desk/PhotoBlock.tsx src/components/desk/RightPage.tsx src/components/desk/MobileJournalEntry.tsx
git commit -m "$(cat <<'EOF'
Restyle filled polaroid + plumb date caption through

Filled polaroid now uses the cream-paper card with washi tape and a
date caption (e.g. "apr 27") derived from the entry's createdAt.
Empty slots show "~" as placeholder. PhotoBlock forwards a new
dateCaption prop; RightPage and MobileJournalEntry compute it.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

**Polaroid work is now complete. Tasks 3–10 implement the page-flip.**

---

## Task 3: Install `react-pageflip`

**Files:**
- Modify: `package.json`, lockfile

- [ ] **Step 1: Install the package inside the container**

```bash
docker compose exec app npm install react-pageflip@^2.0.3
```

Expected output: `added 1 package, audited N packages in Xs`. No errors.

- [ ] **Step 2: Confirm it's recorded in `package.json`**

```bash
grep -E '"react-pageflip"' package.json
```

Expected: a single line like `"react-pageflip": "^2.0.3",`.

- [ ] **Step 3: Confirm the build still passes (no implicit usages yet)**

```bash
docker compose exec app npm run build
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "$(cat <<'EOF'
Add react-pageflip dependency

Library will replace the manual 180° hinge-flip animation with a
realistic paper-curl page-turn driven by drag and click.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Trim `useDeskStore` of page-turn state

**Files:**
- Modify: `src/store/desk.ts`

This task is done before the BookSpread refactor so consumers can be migrated without dangling references. After this commit, anything that still imports the removed fields will fail to compile — that's intentional and gets fixed in Task 5.

- [ ] **Step 1: Replace the entire store file**

Replace `src/store/desk.ts` with:

```tsx
import { create } from 'zustand'

interface DeskStore {
  currentSpread: number
  totalSpreads: number
  goToSpread: (spread: number) => void
  setTotalSpreads: (total: number) => void
}

export const useDeskStore = create<DeskStore>()((set) => ({
  currentSpread: 0,
  totalSpreads: 1,
  goToSpread: (spread) => set({ currentSpread: spread }),
  setTotalSpreads: (total) => set({ totalSpreads: total }),
}))
```

- [ ] **Step 2: Build to surface every consumer of the removed fields**

```bash
docker compose exec app npm run build
```

Expected: TypeScript will fail with errors in `BookSpread.tsx` referencing `turnPage`, `isPageTurning`, `turnDirection`, `finishPageTurn`. **Do not fix them yet** — Task 5 does the BookSpread refactor and resolves all of them at once.

- [ ] **Step 3: Commit (a deliberately broken intermediate)**

```bash
git add src/store/desk.ts
git commit -m "$(cat <<'EOF'
Strip page-turn state from useDeskStore

The library will own flip state going forward. BookSpread will be
migrated in the next commit; build is intentionally broken until
that lands.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Refactor `BookSpread.tsx` to use `<HTMLFlipBook>`

**Files:**
- Modify: `src/components/desk/BookSpread.tsx`

This is the largest task. It replaces the inner book grid (lines 273–354) with the library wrapper, removes the `<PageTurn>` overlay (lines ~422–430) and its handler (lines 138–140), rewires the `‹` / `›` clickers, renders one LeftPage + one RightPage per entry plus a final new-entry pair, and adds the diary-container browser-back/forward suppression.

- [ ] **Step 1: Update imports**

At the top of `BookSpread.tsx`, replace:

```tsx
import LeftPage from './LeftPage'
import RightPage from './RightPage'
import PageTurn from './PageTurn'
```

with:

```tsx
import dynamic from 'next/dynamic'
import LeftPage from './LeftPage'
import RightPage from './RightPage'

const HTMLFlipBook = dynamic(() => import('react-pageflip'), { ssr: false })
```

Also remove the `AnimatePresence` import if it's no longer used after Step 4 (the linter will tell you).

- [ ] **Step 2: Update the destructuring of `useDeskStore`**

Replace lines 77–86 (the `useDeskStore` destructure) with:

```tsx
  const {
    currentSpread: globalCurrentSpread,
    totalSpreads,
    setTotalSpreads,
    goToSpread,
  } = useDeskStore()
```

(All four removed fields — `turnPage`, `isPageTurning`, `turnDirection`, `finishPageTurn` — are gone. So is `handlePageTurnComplete` once we delete it in step 4.)

- [ ] **Step 3: Add a ref for the flipbook, a flip handler, and a sync effect**

Just under the destructure above, add:

```tsx
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const flipBookRef = useRef<any>(null)

  const handleFlip = useCallback((e: { data: number }) => {
    // Library renders 2 children per entry. Convert page index to spread index.
    goToSpread(Math.floor(e.data / 2))
  }, [goToSpread])

  // Push external goToSpread() calls (e.g. from EntrySelector clicking
  // a specific entry) back into the library so its visible page matches
  // our store. Use turnToPage (no animation) for programmatic jumps.
  useEffect(() => {
    const pageFlip = flipBookRef.current?.pageFlip?.()
    if (!pageFlip) return
    const targetPage = globalCurrentSpread * 2
    if (pageFlip.getCurrentPageIndex?.() !== targetPage) {
      pageFlip.turnToPage?.(targetPage)
    }
  }, [globalCurrentSpread])
```

- [ ] **Step 4: Remove the page-turn handler and edge-clicker `isPageTurning` checks**

Delete the `handlePageTurnComplete` callback at lines 138–140. Replace `handlePrevPage` and `handleNextPage` (lines 142–152) with library-driven equivalents:

```tsx
  const handlePrevPage = useCallback(() => {
    flipBookRef.current?.pageFlip()?.flipPrev()
  }, [])

  const handleNextPage = useCallback(() => {
    flipBookRef.current?.pageFlip()?.flipNext()
  }, [])
```

- [ ] **Step 5: Replace the inner book grid (lines ~273–354) with `<HTMLFlipBook>`**

Find the `{/* Book container */}` motion.div at lines 273–284 and the children that follow it (Ribbon, Whisper+ornaments, Date header, Left page, Center binding, Right page) up to and including the closing `</PageWrapper>` for the right page (around line 354).

Replace **just the inside of the book container** (everything between the outer `<motion.div>` and its closing tag, up through the right `</PageWrapper>`) with the new HTMLFlipBook layout:

```tsx
        {/* Ribbon bookmark */}
        <RibbonBookmark color={colors.ribbon} />

        {/* Whisper + ornaments */}
        <div className="absolute -bottom-12 left-0 right-0 flex items-center justify-center gap-4 pointer-events-none z-10">
          <ThemeOrnament themeName={themeName} color={colors.ribbon} size={28} flip />
          <WhisperFooter color={colors.prompt} />
          <ThemeOrnament themeName={themeName} color={colors.ribbon} size={28} />
        </div>

        {/* Date header */}
        <div
          className="absolute -top-1 left-1/2 -translate-x-1/2 z-20 px-6 py-1.5 rounded-b-lg"
          style={{
            background: colors.pageBg,
            backdropFilter: `blur(${colors.pageBlur})`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: `1px solid ${colors.pageBorder}`,
          }}
        >
          <span className="text-sm font-serif" style={{ color: colors.date }}>
            {spreadDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>

        {/* Flipbook (library handles spread layout, drag, and animation) */}
        <HTMLFlipBook
          ref={flipBookRef}
          width={650}
          height={820}
          size="fixed"
          minWidth={420}
          maxWidth={680}
          minHeight={520}
          maxHeight={840}
          drawShadow={true}
          maxShadowOpacity={0.5}
          flippingTime={650}
          useMouseEvents={true}
          mobileScrollSupport={false}
          showCover={false}
          startPage={globalCurrentSpread * 2}
          onFlip={handleFlip}
          className=""
          style={{}}
          startZIndex={0}
          autoSize={false}
          clickEventForward={true}
          usePortrait={false}
          swipeDistance={30}
          showPageCorners={true}
          disableFlipByClick={false}
        >
          {/* Render every entry as Left + Right page children, in reverse-chronological order
              to match existing currentSpread semantics (spread 0 = newest) */}
          {[...entries].reverse().flatMap((entry) => {
            const captionDate = new Date(entry.createdAt)
            return [
              <PageWrapper key={`${entry.id}-L`} side="left" colors={colors}>
                <LeftPage
                  entry={entry}
                  isNewEntry={false}
                  text=""
                  onTextChange={() => {}}
                  onPageFull={() => {}}
                  onNavigateRight={() => {}}
                  focusTrigger={0}
                />
              </PageWrapper>,
              <PageWrapper key={`${entry.id}-R`} side="right" colors={colors}>
                <RightPage
                  entry={entry}
                  isNewEntry={false}
                  photos={entry.photos || []}
                  onPhotoAdd={() => {}}
                  onSaveComplete={() => {}}
                  leftPageText=""
                  text=""
                  onTextChange={() => {}}
                  focusTrigger={0}
                  onNavigateLeft={() => {}}
                />
              </PageWrapper>,
            ]
          })}

          {/* New-entry spread (always last) */}
          <PageWrapper key="new-L" side="left" colors={colors}>
            <LeftPage
              entry={null}
              isNewEntry={true}
              text={leftPageText}
              onTextChange={setLeftPageText}
              onPageFull={handleLeftPageFull}
              onNavigateRight={handleNavigateRight}
              focusTrigger={leftTextareaFocusTrigger}
            />
          </PageWrapper>
          <PageWrapper key="new-R" side="right" colors={colors}>
            <RightPage
              entry={null}
              isNewEntry={true}
              photos={pendingPhotos}
              onPhotoAdd={handlePhotoAdd}
              onSaveComplete={handleSaveComplete}
              leftPageText={leftPageText}
              text={rightPageText}
              onTextChange={setRightPageText}
              focusTrigger={rightTextareaFocusTrigger}
              onNavigateLeft={handleNavigateLeft}
            />
          </PageWrapper>
        </HTMLFlipBook>
```

Note: `currentEntry`, `currentPhotos`, and `isNewEntrySpread` derivations elsewhere in the file may now be stale or unused; remove any that are no longer referenced after this refactor. The `Date header` still uses `spreadDate` which depends on `currentEntry`; keep `currentEntry` and `spreadDate` derivations intact since they still drive the floating date pill above the book.

- [ ] **Step 6: Remove the `<PageTurn>` overlay block**

Delete the `<AnimatePresence>` block at lines ~422–430 entirely:

```tsx
        {/* Page turn animation overlay */}
        <AnimatePresence>
          {isPageTurning && turnDirection && (
            <PageTurn
              direction={turnDirection}
              onComplete={handlePageTurnComplete}
            />
          )}
        </AnimatePresence>
```

- [ ] **Step 7: Wrap the diary in a back/forward-suppressing container**

Find the outermost `<div className="relative" style={{ perspective: ... }}>` (line 234). Replace with:

```tsx
    <div
      ref={diaryRootRef}
      className="relative"
      onWheel={(e) => {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
          e.preventDefault()
        }
      }}
      style={{
        perspective: '2500px',
        perspectiveOrigin: 'center center',
        overscrollBehaviorX: 'contain',
      }}
    >
```

Add the ref declaration in the component body (right after the existing useState declarations near the top):

```tsx
  const diaryRootRef = useRef<HTMLDivElement>(null)
```

- [ ] **Step 8: Lint**

```bash
docker compose exec app npm run lint
```

Expected: passes. If TypeScript reports `LeftPage`/`RightPage` as needing `forwardRef`, see Task 6.

- [ ] **Step 9: Build**

```bash
docker compose exec app npm run build
```

Expected: build succeeds. If it fails with a `forwardRef` complaint from `react-pageflip`, jump to Task 6, then resume.

- [ ] **Step 10: Manual verification**

Restart the app: `docker compose restart app`. Open http://localhost:3111/write.

Verify:
- The diary opens to the new-entry spread (last spread)
- Drag the right page from its outer corner: the page lifts, bends in a curve, follows the cursor, and snaps when released past the midpoint
- Drag the left page from its outer corner backward — works symmetrically
- Click `‹` and `›`: the same curl animation plays automatically
- Two-finger horizontal trackpad swipe over the diary triggers a flip and does **not** trigger browser back/forward
- Vertical scroll on the page (outside the diary) still works
- Existing entries are reachable by flipping backward; their text/photos render

If anything is broken, do not commit yet. Re-read the spec and the relevant lines.

**Edge-clicker / drag-corner overlap (likely surfaces here):** the existing `‹` / `›` edge clickers are 56px wide (`w-14`) on each side. Drag-flip from the page corner uses the same area. If clicking still works but dragging from the very edge does not, narrow the edge clicker to `w-8` (32px) and confirm both work. If that doesn't help, add `style={{ pointerEvents: 'none' }}` to the inner motion.div arrow indicator and rely on the outer container's onClick for the click path.

- [ ] **Step 11: Commit**

```bash
git add src/components/desk/BookSpread.tsx
git commit -m "$(cat <<'EOF'
Replace hinge-flip with react-pageflip paper curl

BookSpread now feeds every entry's LeftPage + RightPage as children
of <HTMLFlipBook> in landscape mode. Drag-from-corner produces a
realistic paper-curl turn; the existing ‹ / › edge clickers call
flipPrev() / flipNext() programmatically. onFlip syncs the store's
currentSpread.

Browser back/forward gestures are suppressed on the diary container
only via overscroll-behavior-x: contain plus a horizontal-wheel
preventDefault.

The legacy <PageTurn> overlay is removed.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: `forwardRef` shim for LeftPage / RightPage (only if Task 5 demanded it)

**Run this task only if Task 5's build complained that `react-pageflip` requires children to accept a ref.**

**Files:**
- Modify: `src/components/desk/LeftPage.tsx`
- Modify: `src/components/desk/RightPage.tsx`

- [ ] **Step 1: Wrap `LeftPage` in `forwardRef`**

In `src/components/desk/LeftPage.tsx`, find the default export (typically `export default function LeftPage(props) { ... }` or similar). Replace with:

```tsx
const LeftPage = React.forwardRef<HTMLDivElement, LeftPageProps>(function LeftPage(props, ref) {
  // existing body — wrap the outermost return element with ref={ref}
})

export default LeftPage
```

The component's outermost JSX element gets `ref={ref}`. If the outermost is currently a fragment or non-div, wrap it in a `<div ref={ref}>` so the library has somewhere to attach.

- [ ] **Step 2: Same for `RightPage`**

Apply the identical pattern to `src/components/desk/RightPage.tsx`.

- [ ] **Step 3: Lint and build**

```bash
docker compose exec app npm run lint && docker compose exec app npm run build
```
Expected: both pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/desk/LeftPage.tsx src/components/desk/RightPage.tsx
git commit -m "$(cat <<'EOF'
forwardRef LeftPage/RightPage for react-pageflip

The library attaches refs to its child pages. Wrap LeftPage and
RightPage in React.forwardRef so the ref reaches a DOM node.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Delete `PageTurn.tsx`

**Files:**
- Delete: `src/components/desk/PageTurn.tsx`

- [ ] **Step 1: Confirm there are no remaining imports**

```bash
grep -rn "from './PageTurn'\|from \"./PageTurn\"\|from '@/components/desk/PageTurn'" src/
```

Expected: no matches. (Task 5 removed the only consumer.)

- [ ] **Step 2: Delete the file**

```bash
rm src/components/desk/PageTurn.tsx
```

- [ ] **Step 3: Lint and build**

```bash
docker compose exec app npm run lint && docker compose exec app npm run build
```
Expected: both pass.

- [ ] **Step 4: Commit**

```bash
git add -A src/components/desk/PageTurn.tsx
git commit -m "$(cat <<'EOF'
Remove legacy PageTurn component

react-pageflip now owns the flip animation entirely.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Verify TipTap editor still works inside flipping pages

This is a manual test pass with no commit unless a fix is required.

- [ ] **Step 1: Open `/write` on a new entry**

http://localhost:3111/write — restart the app first if needed.

- [ ] **Step 2: Click into the left-page text area and type**

Verify:
- Click reaches the editor (no page-flip starts)
- Cursor appears, text types as expected
- Type past the line cap — overflow moves to the right page (existing behavior)

- [ ] **Step 3: Paste a Spotify URL into the song input**

Verify:
- Click reaches the input
- Paste works, song embed renders

- [ ] **Step 4: Click an empty polaroid**

Verify:
- File picker opens
- After selecting an image, the photo renders inside the polaroid (caption + tape + frame still visible)

- [ ] **Step 5: Draw on the doodle canvas**

Verify:
- Stroke draws normally; no page-flip triggered

- [ ] **Step 6: Save the entry**

Click "Save Entry". Verify:
- Save success overlay shows
- After ~2s, the new entry is part of the book (flip back from the new-entry spread to find it as the most recent past entry)

- [ ] **Step 7: If any of the above caused an unintended page-flip — apply the click-bubbling fix**

Edit `src/components/desk/BookSpread.tsx` and wrap the `<HTMLFlipBook>` config to bump `swipeDistance` to a higher value (e.g. `60`). If that's not enough, wrap the inner page contents in a `<div onPointerDown={(e) => e.stopPropagation()}>` selectively around the editor area only.

If a fix was required, commit it:

```bash
git add src/components/desk/BookSpread.tsx
git commit -m "$(cat <<'EOF'
Tune react-pageflip to avoid editor click conflicts

Bumped swipeDistance / scoped stopPropagation on the editor area
so mid-page clicks reach TipTap and don't accidentally start a fold.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

(If no fix was required, no commit.)

---

## Task 9: Verify all 11 themes still tint the diary correctly

- [ ] **Step 1: Cycle through every theme**

In the running app, use the existing theme switcher to cycle through all 11 themes. For each:
- Diary tints to the theme's `glass.bg` color
- Ruled lines, ribbon, ornaments use the theme's accents
- Page-flip drag still works (no theme breaks the gesture)

- [ ] **Step 2: If any theme is unreadable on the curl back-side**

If the back of a flipping page (the underside revealed mid-flip) is unreadable on a particular theme, raise it as a follow-up — do **not** patch in this PR. Add a short note in the PR description so it isn't forgotten.

(No commit at this step.)

---

## Task 10: Final verification + cleanup

- [ ] **Step 1: Save flow end-to-end**

- Open `/write` on the new-entry spread
- Add a song link
- Type some text
- Add a photo (polaroid renders with today's date as caption)
- Save
- Flip backward to confirm the new entry is now the most recent past entry, with the polaroid + caption visible

- [ ] **Step 2: Append-only rules**

- Flip to a past entry that has empty slots (no photo, or empty doodle area)
- Verify empty slots are still interactive and fillable
- Verify filled slots are not editable (existing behavior)

- [ ] **Step 3: Mobile unaffected**

Open the app at a phone-width viewport (DevTools mobile emulation, or a real phone). Verify:
- `MobileJournalEntry` renders (NOT `<HTMLFlipBook>`)
- Existing horizontal pager between sub-pages still works
- Polaroids render with the new look

- [ ] **Step 4: Run final lint and build**

```bash
docker compose exec app npm run lint && docker compose exec app npm run build
```

Expected: both pass cleanly.

- [ ] **Step 5: Final commit if any tiny fix was needed**

If steps 1–3 surfaced a small bug fixed inline, commit it. Otherwise no commit.

---

## Known Risks (recap from the spec)

1. **TipTap editor click conflicts with library pointer handling** — addressed by Task 8 with a `swipeDistance` knob and an optional `stopPropagation` wrapper.
2. **SSR / hydration mismatch** — addressed by `next/dynamic` import with `ssr: false` (Task 5).
3. **Many editor instances mounted at once** — `/api/entries?limit=50` caps the book at 50 spreads = 100 pages. If performance is sluggish, a follow-up PR can mark non-current spreads' editors with `editable={false}` (TipTap's read-only mode is much lighter).
4. **`forwardRef` requirement** — covered by the contingent Task 6.
5. **Library page dimensions vs. our existing layout** — handled with `size: "fixed"` + min/max props in Task 5; tune values if visual regressions appear.
