# Polaroid Photos & Realistic Page-Flip

**Status:** Design approved (2026-04-27)
**Owner:** Himanshu

## Goal

Two focused upgrades to the desktop glass diary at `/write`:

1. **Polaroid photos.** Replace the photo slots' empty rectangular placeholders with polaroid-style cards (cream paper, washi tape, slight rotation, handwritten date caption). The aim: even an empty photo slot should read as part of a personal scrapbook.
2. **Realistic page-flip.** Replace the current 180° hinge-flip animation with a paper-curl turn driven by [`react-pageflip`](https://github.com/Nodlik/react-pageflip) (a React wrapper for StPageFlip). The page should bend and track the cursor 1:1 during a drag, snap on release past the midpoint, and the existing `‹` / `›` buttons should trigger the same animation programmatically.

Out of scope (explicitly): all the other personality polish ideas in the brainstorm mockup — header band, "Dear diary" opener, song line restyling, doodle frame, wax seal, leaf accents, margin gutter. None of those are part of this spec.

## Why

The diary today reads as a form. Both changes target that gap with the smallest surface area possible:

- The photo slots are large, prominent, and currently render as empty grey upload boxes. Restyling them as polaroids changes the page's character without touching content rules or layout.
- The current page-turn (a 180° rotateY of half the spread) is functional but stiff — like a board on a hinge, not a page. Replacing it with a curl-style flip is the single biggest "this feels like a real diary" improvement available.

Both changes ship together because they're independent of each other and small enough to fit in one branch / one PR. Anything else from the personality mockup is deferred or dropped.

## Scope

### In scope

- Polaroid restyle of `PhotoSlot.tsx` (and any wrapping margins in `PhotoBlock.tsx`). Affects desktop **and** mobile, since both reuse the same component.
- `react-pageflip` integration on **desktop only** (inside `BookSpread.tsx`).
- Removal of `PageTurn.tsx` (replaced entirely by the library).
- Trim of `useDeskStore` page-turn state (`isPageTurning`, `turnDirection`, `finishPageTurn`, etc.) since the library owns flip state.
- Browser back/forward gesture suppression on the diary container only.
- Verification across all 11 themes and the new-entry spread.

### Out of scope

- Any other personality polish from the brainstorm mockup (header band, opener, song line, doodle frame, wax seal, leaves, gutter, page numbers).
- Mobile page-flip mechanic — `MobileJournalEntry.tsx` and its existing horizontal pager are untouched. Mobile gets the polaroid restyle for free (shared component) and nothing else.
- Home parallax / scroll-to-open work in `2026-04-27-home-parallax-design.md` — separate, unrelated, untouched.
- Animation timing curves / sound / haptics. Library defaults are accepted.

## A. Polaroid Photos

### Visual target

| Element | Today | New |
|---|---|---|
| Card background | Transparent / page-tinted | Cream paper (`#f5efdc` ~) |
| Border | Dashed warm/gold border | None — the cream card is the frame |
| Drop shadow | None / minimal | Soft `0 6px 14px rgba(0,0,0,0.35)` |
| Rotation | None | `-3deg` (slot 1), `+2deg` (slot 2). Static per-slot, not random per render |
| Frame area inside card | Same dashed warm/gold border | Inset photo well with a 1px dashed inner border, slightly recessed feel via inset shadow |
| Tape | None | Washi-tape strip at top center: ~50px × 14px, translucent warm/gold (`rgba(220,200,140,0.35)`), subtle border, slight rotation (`-2deg`) |
| Empty-state hint | Small text "Click to add photo" | Same text, in handwritten font (`'Caveat', cursive`), centred inside the photo well |
| Date caption | None | Small Caveat text at the bottom of the card showing the entry date (e.g. `apr 27`); shown for both empty AND filled states |
| Filled state | Photo fills slot | Photo fills the inner well; cream border + tape + caption still visible around it |

`PhotoBlock`'s existing horizontal overlap + vertical offset between slot 1 and slot 2 stays — that already gives the layered scrapbook feel. The change is inside each slot.

### Files

- `src/components/desk/PhotoSlot.tsx` — most of the visual change. Replace the current dashed-border tile with the polaroid card markup (paper background, tape, inner well, caption).
- `src/components/desk/PhotoBlock.tsx` — likely no change. Existing rotation/offset wrappers still work.

### Append-only behaviour preserved

`disabled={!!photo}` already prevents replacing an existing photo. That stays exactly as is. The polaroid restyle is visual only — no behaviour changes to upload, camera, position, or rotation.

### Theme compatibility

Polaroid card paper is a fixed cream colour across all themes (a real polaroid doesn't change colour with the room). Date caption ink is a fixed warm-brown for legibility on cream. The only theme-aware bits inside the slot are: nothing. The cream card visually contrasts with every theme's dark glass page, which is the desired effect.

## B. Realistic Page-Flip (desktop)

### Library

[`react-pageflip`](https://www.npmjs.com/package/react-pageflip) v2.0.3 — a React wrapper around StPageFlip. ~20 KB gzipped. MIT-licensed. Active. Live demo: https://nodlik.github.io/StPageFlip/

It provides:
- Real paper-curl bend during a flip (not a flat hinge)
- Drag-from-corner gesture; the page tracks the cursor 1:1
- Snap-on-release physics (past midpoint = flip, before = spring back)
- Dynamic shadow under the bending page
- `flipNext()` / `flipPrev()` ref methods for programmatic flips
- Landscape mode (two pages visible as a spread)
- Configurable: `flippingTime`, `drawShadow`, `maxShadowOpacity`, `swipeDistance`, `useMouseEvents`
- Events: `onFlip`, `onChangeState` (for sync with our state)

### Page-to-entry mapping

In landscape mode, `HTMLFlipBook` shows two child pages side-by-side as a spread. We'll feed it **two children per entry** — left content, then right content:

```
Library page index   Maps to
0                    Entry 0 — left page  (LeftPage component)
1                    Entry 0 — right page (RightPage component)
2                    Entry 1 — left page
3                    Entry 1 — right page
…
2N                   New-entry spread — left page
2N+1                 New-entry spread — right page
```

So our store's existing `currentSpread = Math.floor(libraryPageIndex / 2)`. This matches a real book's layout (page X on left, X+1 on right; turning a leaf advances the visible spread by one entry).

When the user drags the right page of entry N and releases past midpoint, the library advances to the next leaf — and in landscape mode that means the visible spread becomes entry N+1's two pages. Left-page drags work symmetrically backward. (Exact `flipNext`/`flipPrev` semantics in landscape mode are: one call = one leaf turned. Confirm during implementation by reading `getCurrentPageIndex()` after a drag and asserting it advanced by 2 in landscape.)

### Component shape

```tsx
// BookSpread.tsx (sketch)
'use client'

const HTMLFlipBook = dynamic(
  () => import('react-pageflip'),
  { ssr: false }
)

export default function BookSpread() {
  const bookRef = useRef<any>(null)
  const { goToSpread } = useDeskStore()

  const handleFlip = useCallback((e: { data: number }) => {
    goToSpread(Math.floor(e.data / 2))
  }, [goToSpread])

  return (
    <HTMLFlipBook
      ref={bookRef}
      width={500} height={640}            // values tuned to existing layout
      size="stretch"
      minWidth={420} maxWidth={680}
      minHeight={520} maxHeight={840}
      drawShadow={true}
      maxShadowOpacity={0.5}
      flippingTime={650}
      useMouseEvents={true}
      mobileScrollSupport={false}         // we render mobile differently anyway
      showCover={false}
      onFlip={handleFlip}
    >
      {entries.flatMap((entry) => [
        <LeftPage  key={`${entry.id}-L`} entry={entry} … />,
        <RightPage key={`${entry.id}-R`} entry={entry} … />,
      ])}
      <LeftPage  key="new-L" entry={null} isNewEntry={true} … />
      <RightPage key="new-R" entry={null} isNewEntry={true} … />
    </HTMLFlipBook>
  )
}
```

The `‹` / `›` edge clickers in `BookSpread` keep their position and behaviour, but their `onClick` becomes `bookRef.current.pageFlip().flipPrev()` / `.flipNext()`.

### Click vs. drag inside a page

StPageFlip uses pointer events on the outer flipbook container. By default it triggers a fold when the pointer goes near a page corner. Mid-page clicks fall through to children — which is what we need so the TipTap editor still receives focus, song input still receives keystrokes, photo slot still receives clicks, etc.

Defensive measures we'll take:
- Set `swipeDistance` high enough that small mouse movements inside the editor don't accidentally start a fold.
- If any conflict surfaces, wrap the editor in a container that calls `e.stopPropagation()` on `pointerdown` — the library only watches the flipbook root, so stopping bubbling there is sufficient.

This is the highest-risk integration point and gets a dedicated manual test pass.

### Browser back/forward suppression

Two-finger horizontal trackpad gestures in Chrome/Safari trigger history navigation. We suppress this on the diary container only:

```tsx
<div
  ref={diaryRef}
  style={{ overscrollBehaviorX: 'contain' }}
  onWheel={(e) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) e.preventDefault()
  }}
>
  <HTMLFlipBook … />
</div>
```

`overscroll-behavior-x: contain` blocks the default back/forward swipe at the CSS level; the `onWheel` handler is belt-and-braces for browsers that don't honour it. The diary container is the *only* element we attach this to — the rest of the page can scroll normally.

### State migration

`useDeskStore` currently exposes:
- `currentSpread`, `totalSpreads`, `goToSpread`, `setTotalSpreads` — **kept**. `currentSpread` is now updated from the library's `onFlip` event via `goToSpread(Math.floor(pageIndex / 2))`. Anything that reads `currentSpread` (e.g. existing entry-index logic, save flow) keeps working.
- `isPageTurning` — **removed**. Anywhere that gates UI on "is a turn in progress?" can either drop the check (the library handles queuing) or query `bookRef.current.pageFlip().getState() === 'flipping'`.
- `turnDirection` — **removed**. The library tracks direction internally.
- `turnPage(direction)` — **removed**. Callers switch to `bookRef.current.pageFlip().flipNext()` / `flipPrev()`.
- `finishPageTurn()` — **removed**. The library's `onFlip` event signals completion.

`PageTurn.tsx` is deleted entirely. Its imports in `BookSpread.tsx` and the `<AnimatePresence>` overlay block at lines ~422–430 are removed. The `handlePageTurnComplete` callback at lines ~138–140 is removed.

### What stays in `BookSpread`

- Outer book frame styling, glass tinting, ribbon, ruled lines, spine (these wrap *around* the flipbook, not inside it; pages flip within the inner container)
- Theme integration via `getGlassDiaryColors(theme)`
- New-entry spread logic
- Stack-of-pages hint decorations on the outer left/right edges
- Save success overlay
- `‹` / `›` edge clickers (with new onClick handlers)

### What changes in `LeftPage` / `RightPage`

Ideally, nothing. They become children of `HTMLFlipBook` and continue to receive their existing props. Two minor cautions:

- `forwardRef` may be needed: the StPageFlip docs show `React.forwardRef` patterns for advanced use. If the library complains about refs on functional components, wrap each page in a thin ref-forwarding shim.
- Each page must render as a single root element with deterministic dimensions — already true of `LeftPage` / `RightPage`.

## File touch list

**Add:**
- Dependency: `react-pageflip` (latest, 2.x)

**Edit:**
- `src/components/desk/PhotoSlot.tsx` — polaroid restyle (cream paper, tape, caption, inner well)
- `src/components/desk/BookSpread.tsx` — replace inner book grid with `<HTMLFlipBook>`; rewire `‹` / `›` onClick; add diary-container wheel/overscroll suppression; remove `<PageTurn>` overlay
- `src/store/desk.ts` — drop `isPageTurning`, `turnDirection`, `turnPage`, `finishPageTurn`; keep `currentEntryIndex` derived from flip events
- `src/components/desk/LeftPage.tsx` / `RightPage.tsx` — `forwardRef` shim if and only if the library demands it

**Delete:**
- `src/components/desk/PageTurn.tsx`

**Untouched:**
- `src/components/desk/MobileJournalEntry.tsx` — visual polaroid styling comes through automatically via shared `PhotoSlot`; no other changes
- `src/components/desk/PhotoBlock.tsx` — existing layout is fine
- All theme files
- All hooks except the one paragraph noted above

## Risks & Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| TipTap editor click conflicts with library pointer handling | Medium | Tune `swipeDistance` first; `e.stopPropagation()` on editor container as fallback. Dedicated manual test pass. |
| SSR / hydration mismatch with `HTMLFlipBook` | High (default) | `next/dynamic` import with `ssr: false`. Show a static spread skeleton during the brief client load. |
| Window resize during a flip causes layout glitches | Low | Library has `update()`; call it on `window.resize` if observed. |
| Editor re-renders mid-flip cause judder | Low | Editor content is stable during a flip; if not, memoise `LeftPage` / `RightPage` props. |
| Library pages require fixed dimensions; our pages stretch | Medium | Use `size: "stretch"` + `minWidth`/`maxWidth`/`minHeight`/`maxHeight` props. Cover the existing breakpoints with manual checks. |
| Append-only photo logic regression | Low | Polaroid restyle is purely visual; `disabled={!!photo}` semantics unchanged. Manual check at end. |
| Mobile inadvertently picks up the page-flip change | Low | We render the library only inside the desktop branch of `BookSpread`. `MobileJournalEntry` continues to be the mobile entry point. |

## Verification

No automated test framework — verification is manual plus typecheck + lint.

**Polaroid:**
- Open `/write` on a fresh entry. Both empty photo slots show as polaroids: cream card, tape strip, dashed inner well, "click to add" hint, date caption.
- Add a photo. The image fills the inner well; tape, caption, rotation still visible.
- Add a second photo. Two polaroids, slightly overlapping, different rotations (slot 1 left-tilted, slot 2 right-tilted).
- Open an existing entry with photos. Same look. Cannot replace the photos (append-only).
- Mobile: open `/write` on a phone-width viewport. Polaroids render the same in `MobileJournalEntry`.

**Page-flip (desktop):**
- Drag the right page from its outer corner. The page lifts, bends in a curve, follows the cursor. Release past midpoint → snaps to next entry. Release before midpoint → springs back.
- Drag the left page outer corner. Same, in reverse — snaps to previous entry.
- Click `‹` and `›` on the edge zones. Same animation plays automatically. No "jump" between click handler and library state.
- Trackpad two-finger horizontal swipe over the diary triggers a flip. Browser does **not** navigate back/forward.
- Vertical scroll on the page (outside the diary) still works.
- Cycle to the new-entry spread. Write something. Save. Verify the new entry now flips to as the latest entry.
- Cycle through all 11 themes. The diary spread tints correctly; flip animation works on each.
- TipTap editor: type, paste, IME composition, character-limit boundary — all work the same as today. No drag accidentally starts when typing.
- Song input: paste a Spotify link. Click to focus. Type. No drag.
- Photo upload: click an empty polaroid. File picker opens. No drag started.
- Doodle: draw on the canvas. No drag started; gestures stay local to the canvas.

**Mobile:**
- `MobileJournalEntry` page sequence still works (writing pages, photos/doodle on last page).
- Swipe gestures inside `MobileJournalEntry` unchanged.
- Polaroid restyle visible.

**Type / lint:**
- `npm run lint` passes
- `npm run build` succeeds
- No console errors during a flip

## Open questions deferred to the implementation plan

- Exact `flippingTime` / `maxShadowOpacity` / `swipeDistance` values. Pick reasonable defaults (650ms / 0.5 / 30) and tune by feel.
- Whether the new-entry spread needs a different visual treatment (e.g. a "blank" cover) when the user is at the very end. Default: render it identically to a normal spread; revisit if it feels off.
- Whether `LeftPage` / `RightPage` need `React.forwardRef` wrapping. Check the library's typing on integration.
- Whether the `‹` / `›` edge clickers should be hidden during an active drag to avoid double-fires. Probably yes; library state is queryable via `getState()`.
