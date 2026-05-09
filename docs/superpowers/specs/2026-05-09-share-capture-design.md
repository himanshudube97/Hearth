# Share Capture — Design

**Date:** 2026-05-09
**Branch:** `worktree-share-capture`

## Goal

Let the user share a beautiful image of their **diary spread**, **scrapbook page**, or **revealed memory** to social apps (Instagram, WhatsApp, Twitter, etc.) or save it as a PNG. The flow uses Hearth's existing butterfly reveal motif from [PromptCard.tsx](../../src/components/desk/PromptCard.tsx), and reuses the off-screen capture pattern already proven in [LetterArrivedBanner.tsx](../../src/components/LetterArrivedBanner.tsx).

Letters are explicitly out of scope — they already have their own download flow.

## User flow

1. User taps a small camera icon in the **top-right corner** of the diary spread / scrapbook page / memory reveal.
2. A full-screen overlay opens. A **butterfly** flies in from the edge with a random theme-hue rotation (same art and pattern as the prompt-card butterfly).
3. While the butterfly flies, the share image is captured **in parallel** off-screen via `html-to-image`.
4. The butterfly lands centered with a soft pulsing glow, inviting a click.
5. User clicks the butterfly. It dissolves and the captured image scales in inside a clean preview card.
6. Two buttons under the preview: **Share** (Web Share API w/ files; falls back to download + toast on platforms that don't support file-share) and **Save** (always downloads).
7. Click outside the card to dismiss.

## Visual composition of the captured image

A single shared frame component, three content variants. All three render off-screen in a hidden container at `left: -9999px` until capture, then `html-to-image` snaps them at `pixelRatio: 2`.

### `<ShareCardFrame>` — wraps all three

- Fixed dimensions: **1080 × 1350** (4:5 portrait — Instagram-feed and story-friendly). Captured at pixelRatio 2 → ~2160 × 2700 PNG.
- **Theme-aware soft frame**: the user's current theme tints the background (uses `theme.bg.primary` plus a subtle radial highlight in `theme.accent.warm`). No heavy chrome, just a soft tinted backdrop.
- **Top-right corner stamp**: reuses the existing `themeStamps` map from `LetterArrivedBanner.tsx` (`rivendell: 🌲`, `sunset: 🌅`, `ocean: 🌊`, etc.) styled like a small postage stamp.
- **Bottom footer**: tiny serif italic — *"hearth · May 9, 2026"* — using the same `var(--font-caveat)` family already used in letters for visual cohesion.
- The actual content (diary / scrapbook / memory) sits centered in the remaining vertical space with generous padding.

### `<JournalShareCard>`

The current diary spread rendered cleanly. Reuses the existing `LeftPage` and `RightPage` components at fixed dimensions (no toolbars, no whisper footer, no spread navigation). Includes:
- Mood (rendered as the existing mood-icon SVG, top-left of left page)
- Entry text (TipTap content rendered as static HTML)
- Photo block (whichever photos are present, in their saved positions / rotations)
- Song embed (if present; rendered as a static "🎵 song · {title}" pill rather than an iframe — iframes don't capture)
- Doodle (rendered via the existing `DoodlePreview` component)

### `<ScrapbookShareCard>`

The scrapbook page surface with all placed items, scaled to fit the frame width. Reuses [PageSurface.tsx](../../src/components/scrapbook/PageSurface.tsx) at a fixed canvas size with `pointerEvents: 'none'` so no editing chrome leaks in.

### `<MemoryShareCard>`

Same as `<JournalShareCard>` — a memory IS a journal entry from the past — with one extra label above the spread: *"a memory from {time-ago}"* (e.g. "3 weeks ago", reusing the existing `formatTimeAgo` from `MemoryModal.tsx`).

### Note on iframes / decrypted assets

The song embed renders as an iframe in normal app use. `html-to-image` cannot capture iframe contents, so the share card replaces it with a static "song" pill showing the link's source label (Spotify / YouTube / SoundCloud). Photos are loaded as blob URLs by `usePhotoSrc` and capture fine. Doodles are SVG and capture fine.

## Component architecture

Five new files, four edits.

```
src/components/share/
  ShareableCapture.tsx        # Orchestrator: butterfly, capture, reveal modal, share/save buttons
  ShareCardFrame.tsx          # Theme-tinted frame with stamp + footer
  JournalShareCard.tsx        # Diary spread layout (used for both diary and memory)
  ScrapbookShareCard.tsx      # Scrapbook page layout

src/lib/
  share.ts                    # captureToBlob() + shareOrDownload() helpers
```

**Wiring (4 edits):**

- [src/components/desk/BookSpread.tsx](../../src/components/desk/BookSpread.tsx) — add camera button + ShareableCapture (desktop diary)
- [src/components/desk/MobileJournalEntry.tsx](../../src/components/desk/MobileJournalEntry.tsx) — same (mobile diary)
- [src/components/scrapbook/PageSurface.tsx](../../src/components/scrapbook/PageSurface.tsx) — same (scrapbook, mobile + desktop)
- [src/components/constellation/MemoryDiaryView.tsx](../../src/components/constellation/MemoryDiaryView.tsx) — same (memory reveal)

## `<ShareableCapture>` — orchestrator

```tsx
type ShareableCaptureProps = {
  /** What to render off-screen for the capture */
  cardContent: React.ReactNode
  /** Filename suffix: 'diary' | 'scrapbook' | 'memory' */
  surface: 'diary' | 'scrapbook' | 'memory'
  /** Date associated with the content (used in filename + footer) */
  date: Date
}
```

Internal state: `phase: 'closed' | 'butterfly' | 'preview'`, `imageUrl: string | null`, `isCapturing: boolean`, `butterflyHue: number`.

External API: a single hook `useShareableCapture({ cardContent, surface, date })` that returns `{ CameraButton, Capture }`. Each surface drops `CameraButton` inline at the position it wants (top-right corner of the page) and `Capture` anywhere in the tree (it portals out for the overlay):

```tsx
const { CameraButton, Capture } = useShareableCapture({
  cardContent: <JournalShareCard entry={...} />,
  surface: 'diary',
  date: new Date(entry.createdAt),
})
// then:
<div className="top-right-of-page">{CameraButton}</div>
{Capture}
```

The hook handles all internal state, capture pipeline, and the overlay portal. The surface only deals with placement. No prop drilling.

## Capture pipeline

```
on click camera:
  1. setPhase('butterfly')                    // user sees butterfly fly in
  2. mount off-screen <ShareCardFrame>        // hidden div, left: -9999px
  3. await new Promise(r => setTimeout(r, 200))   // let images / fonts settle
  4. const blob = await toPng(frameRef, { pixelRatio: 2 })
  5. setImageUrl(blob)
  6. // butterfly is still flying / pulsing — user clicks it whenever
on butterfly click:
  setPhase('preview')                         // butterfly dissolves, preview scales in
on share click:
  shareOrDownload(blob, `hearth-${surface}-${yyyy-MM-dd}.png`)
on save click:
  download(blob, filename)
on close / outside click:
  setPhase('closed')
  unmount off-screen container, revoke blob URL
```

If capture fails (rare, but possible — corrupt image, encoding issue), surface a small toast: *"Couldn't snap that page — try again?"* and dismiss the overlay.

## `lib/share.ts`

```ts
export async function shareOrDownload(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: 'image/png' })

  // Web Share API path — works on iOS, Android, Mac Safari, recent desktop Chrome
  if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'A page from Hearth',
      })
      return { method: 'share' as const }
    } catch (err) {
      // User cancelled the share sheet — not an error worth surfacing
      if ((err as Error).name === 'AbortError') return { method: 'cancelled' as const }
      // Fall through to download fallback
    }
  }

  // Download fallback — Firefox, Tauri, older browsers
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
  return { method: 'download' as const }
}
```

`captureToBlob(element)` is a thin wrapper around `html-to-image`'s `toBlob` with our standard options (pixelRatio 2, backgroundColor null, cacheBust true) so all three surfaces capture identically.

## Camera button

A single shared component used in all four surfaces:

```tsx
<ShareCameraButton onClick={open} />
```

- Inline SVG camera glyph drawn in the same minimalist line style as the existing pen / song / mood SVGs (no icon library is installed; the project uses inline SVGs throughout). 18×18px line icon, 1.5px stroke, currentColor.
- On desktop: opacity 0.45, fades to 0.85 on hover. No background, no border.
- On mobile: opacity 0.6 always (no hover state). Slightly larger touch target (44px square).
- Color follows `theme.text.muted`.

## Phase-by-phase visual spec

### Phase: butterfly

- Backdrop: `theme.bg.primary` at 60% opacity with `backdrop-filter: blur(8px)`.
- Butterfly: existing `DeskDecoration name="butterfly"` reused as-is, with `hueRotate` randomized from the same 5-value palette as PromptCard (`[0, -55, 200, 280, 95]`).
- Animation: butterfly enters from a random edge offset (top-left or top-right ~20% off-screen), curves to center over 1.4s with a gentle bezier easing (matches PromptCard).
- After landing: pulses gently (scale 1.0 ↔ 1.05, opacity 0.92 ↔ 1.0, 2.6s loop) until clicked.
- A faint radial glow under the butterfly invites the click.

### Phase: preview

- Butterfly fades and shrinks (0.4s) — its "wings" leave behind sparkles (reuse the existing sparkle particles from LetterArrivedBanner).
- Preview card scales in (spring, 0.6s) at the same center point. Card is 90vw wide max 480px on mobile, max 540px on desktop, white-bordered, soft shadow.
- Image fills the card with 16px inset padding.
- Two buttons under it (`Share` primary, `Save` secondary).
- Click outside → fade out (0.4s), unmount.

## Out of scope (v1)

These are listed so we can defer them cleanly without ambiguity later.

- **Letters** — already have a download flow; user explicitly excluded.
- **Sealed memories** — sealed letter envelopes in the constellation are not shareable. Only revealed entries are.
- **Editable captions** — the share image is fixed. No user-typed caption added on top.
- **Multi-spread diary export** — only the current spread, not the whole diary or a date range.
- **Redaction / blur tool** — the exported PNG is unencrypted, but it's the user's data and they're explicitly choosing to export. No paranoia gate.
- **Public share URLs** — Hearth is private; we don't host shareable web pages. The image is the share artifact.

## Privacy note

This feature deliberately produces an unencrypted image of E2EE content, because the user is taking a deliberate action to export it. We do not surface a confirmation dialog or warning — that would be paternalistic for a feature whose entire purpose is "share this with someone." If a future product decision changes that, the gate goes inside `<ShareableCapture>` before phase transitions to `'butterfly'`.

## Implementation sequence (rough)

1. Build `lib/share.ts` (helpers, no UI).
2. Build `<ShareCardFrame>` standalone — verify a static dummy renders + captures correctly off-screen.
3. Build `<JournalShareCard>` and verify a real entry renders inside the frame at the right size.
4. Build `<ScrapbookShareCard>` likewise.
5. Build `<ShareableCapture>` orchestrator (butterfly + preview + capture pipeline).
6. Wire into BookSpread (desktop diary) — verify end-to-end.
7. Wire into MobileJournalEntry (mobile diary).
8. Wire into MemoryDiaryView (memory reveal — same card as diary, just with the time-ago label).
9. Wire into PageSurface / ScrapbookCanvas (scrapbook).
10. Manual QA: each surface, each theme (8 themes), capture quality, share-sheet behavior on iOS / Android / Mac Safari / desktop Chrome / Firefox / Tauri.

## Risk / open questions

- **Iframe in song embed**: confirmed handled by static "song" pill in the share card. Not a regression — the share card is a different render than the live page.
- **Photo encryption**: photos rendered through `usePhotoSrc` produce blob URLs that are same-origin and capture fine. No CORS issue.
- **Doodle**: SVG, no risk.
- **Theme particles**: we do NOT include the page background's particles in the share card (snow / fireflies / sakura). The frame uses a flat theme tint instead — particles in a still PNG would look weird and add render risk. If user wants them later, easy to add.
- **Tauri desktop**: `navigator.share` with files is unreliable in Tauri's webview. The fallback (download via anchor) works there. Acceptable.
- **Font loading**: `html-to-image` sometimes captures before web fonts settle. The 200ms pre-capture wait should be enough; if not, we'll switch to `document.fonts.ready` before the capture call.

## Files touched

**New:**
- `src/components/share/ShareableCapture.tsx`
- `src/components/share/ShareCardFrame.tsx`
- `src/components/share/JournalShareCard.tsx`
- `src/components/share/ScrapbookShareCard.tsx`
- `src/lib/share.ts`

**Modified:**
- `src/components/desk/BookSpread.tsx`
- `src/components/desk/MobileJournalEntry.tsx`
- `src/components/scrapbook/PageSurface.tsx`
- `src/components/constellation/MemoryDiaryView.tsx`
