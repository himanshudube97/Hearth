# Write Page Templates + Photo Collage Design

## Summary

Add three switchable writing templates to `/write` and integrate a 2-photo collage feature using the existing `PhotoSlot`/`CameraModal` components.

## Architecture: Approach A — Template Renderer

`WritePage` holds shared logic (saving, mood, song, photos, doodles). A `writeTemplateStore` (Zustand + localStorage) persists the selected template. Three template components receive identical props and render differently.

## Templates

### 1. Cozy Journal (default — current look, refined)
- Notebook lines, margin line, spine binding, corner flourishes, date header
- Warm serif font (Georgia), handwritten feel
- Photos: small optional polaroid pair below editor
- Container width: `max-w-[722px]`

### 2. Clean Minimal
- No notebook lines, no margin, no corner designs, no spine
- Larger serif font, generous whitespace, thin subtle border
- Date as small top-left text, muted
- No photo area — pure writing focus
- Container width: `max-w-2xl`

### 3. Scrapbook / Creative
- Side-by-side layout: editor ~60% left, photo collage ~40% right
- Reuse existing `PhotoSlot` for 2 photo positions (upload + camera)
- Polaroid rotation, tape/pin SVG decorations on photos
- More playful feel — slightly looser spacing
- On mobile (<768px): photos stack below editor
- Container width: `max-w-4xl`

## Template Switcher

- Three small icon buttons in the action bar (alongside doodle + song buttons)
- Icons: notebook (cozy), pen nib (minimal), scissors (scrapbook)
- Active template highlighted with `theme.accent.warm`
- Stored in `writeTemplateStore` via Zustand `persist` middleware

## New Files

- `src/store/writeTemplate.ts` — Zustand store for template preference
- `src/components/write/CozyTemplate.tsx` — Current editor look (extract from Editor.tsx)
- `src/components/write/MinimalTemplate.tsx` — Clean writer layout
- `src/components/write/ScrapbookTemplate.tsx` — Editor + photo collage side-by-side
- `src/components/write/TemplateSwitcher.tsx` — 3-icon toggle component

## Modified Files

- `src/app/write/page.tsx` — Import templates, render based on store selection, pass shared props, widen container for scrapbook mode
- `src/components/Editor.tsx` — Extract template-specific styling (lines, corners, date) out of base Editor so it becomes a pure TipTap wrapper reusable across templates

## Shared Props Interface

```typescript
interface WriteTemplateProps {
  editor: Editor | null  // TipTap editor instance
  theme: Theme
  dateStr: string
  prompt: string
  // Photo collage (scrapbook only uses this)
  photos: Photo[]
  onPhotoAdd?: (position: 1 | 2, dataUrl: string) => void
}
```

## Photo Integration

- Reuse `PhotoSlot` and `CameraModal` from `src/components/desk/`
- Photos stored as data URLs during writing, saved to `EntryPhoto` on entry save
- Only the scrapbook template renders the photo area by default
- The existing API routes (`/api/entries`) already handle `EntryPhoto` via Prisma

## Data Flow

1. User selects template via switcher -> `writeTemplateStore` updates
2. `WritePage` reads store, renders the matching template component
3. All templates share: mood picker, prompt, song input, save button, doodle modal
4. Only the template-specific editor area (notebook vs minimal vs scrapbook) changes
5. On save, photos (if any) are included in the entry payload
