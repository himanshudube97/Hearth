# Handwriting Mode for iPad Users

## Overview

iPad users with Apple Pencil may want to handwrite journal entries instead of typing. Currently, the app offers:
- **TipTap Editor**: Typing with formatting (bold, italic, headings, blockquotes)
- **Doodle Canvas**: Drawing with pressure-sensitive strokes

The gap: No dedicated handwriting experience for journaling.

## Proposed Solution

Enhance the doodle canvas with a "handwriting mode" rather than building OCR/text conversion. Handwriting preserved as-is feels more personal and authentic for a journaling app.

### Features to Add
- Lined/ruled paper background toggle
- "Pen" brush optimized for writing (thinner, more consistent)
- Slightly larger default canvas
- Multi-page support for long entries

## Technical Considerations

### Current Doodle Storage
```prisma
model Doodle {
  id              String       @id @default(cuid())
  journalEntryId  String
  strokes         Json         // Array of stroke data
  positionInEntry Int          @default(0)
}
```

Stroke structure:
```typescript
interface StrokeData {
  points: number[][]  // [x, y, pressure]
  color: string
  size: number
}
```

### Size Estimates for Handwriting

| Content | Strokes | Points | JSON Size |
|---------|---------|--------|-----------|
| Small doodle | 20-50 | ~500 | ~15-30 KB |
| Short sentence | 50-100 | ~2,000 | ~60-100 KB |
| Full paragraph | 200-400 | ~10,000 | ~300-500 KB |
| Full page of writing | 1000+ | ~50,000 | 1.5-3 MB |

### Potential Issues

1. **Database**: PostgreSQL JSON handles large data, but queries slow down
2. **Network**: Loading 2-3MB doodles is slow, especially on mobile
3. **localStorage drafts**: Browser limit ~5MB total shared across app
4. **Rendering**: SVG with 50,000+ path points = laggy on older devices

## Solutions for Long Content

### 1. Multi-page Doodles (Recommended - Start Here)
- Split long writing into "pages" like a notebook
- Each page = separate Doodle record
- Natural UX for journaling
- Better rendering performance

### 2. Stroke Simplification
- Use Ramer-Douglas-Peucker algorithm
- Can reduce points by 50-70% with minimal visual loss
- `perfect-freehand` already does some smoothing

### 3. Rasterize to Image (For Heavy Use)
- Convert SVG to PNG/WebP on save
- Much smaller file size for dense content
- Store in blob storage (S3/Cloudflare R2)
- Loses vector quality but acceptable for handwriting

### 4. Hybrid Approach (Long-term)
- Keep strokes for small doodles (under ~500 strokes)
- Auto-convert to image for "writing mode" / long content

## Implementation Priority

1. **Phase 1**: Multi-page support + lined background option
2. **Phase 2**: Stroke simplification on save
3. **Phase 3**: Image export for heavy content (if needed)

## Current iPad Support

Already implemented in doodle canvas:
- Apple Pencil pressure sensitivity via `perfect-freehand`
- Pointer Events API for unified input handling
- Touch support with `touch-none` CSS
- Multiple brush sizes (pencil, pen, marker)

## Status

**Parked** - Documented for future implementation.
