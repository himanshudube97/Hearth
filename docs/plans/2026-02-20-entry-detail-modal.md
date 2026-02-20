# Entry Detail Modal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** When clicking a Timeline entry, open a notebook-style modal matching the Write page aesthetic, with append-only editing (real diary rules).

**Architecture:** New `EntryDetailModal` component reusing the notebook styling from `Editor.tsx`. Uses `useEntry` hook to fetch full entry data. Append-only save sends `appendText`/`newDoodles`/`newPhotos` to existing PUT `/api/entries/[id]`. Timeline page wires modal open/close and refresh.

**Tech Stack:** React 19, Framer Motion, TipTap (for append area), existing components (DoodlePreview, DoodleCanvas, SongEmbed, CollagePhoto)

---

### Task 1: Create EntryDetailModal Component

**Files:**
- Create: `src/components/EntryDetailModal.tsx`

**Step 1: Create the modal shell with notebook aesthetic**

Build the full `EntryDetailModal` component in one go. It needs:

**Props:**
```tsx
interface EntryDetailModalProps {
  entryId: string | null      // null = closed
  onClose: () => void
  onUpdated: () => void       // called after append-save to refresh timeline
}
```

**Modal structure (top to bottom):**
1. **Backdrop** — fixed overlay, `bg-black/50 backdrop-blur-sm`, click to close
2. **Modal container** — `w-[90vw] max-w-2xl max-h-[85vh]`, centered with flex
3. **Notebook wrapper** — same styling as `Editor.tsx`:
   - Glass background with blur
   - Left binding spine (`w-3`, warm gradient)
   - Left margin line (at `48px`, warm color)
   - Ruled lines background (40px spacing)
   - Paper texture overlay
4. **Close button** — top-right, X icon

**Content inside notebook (scrollable area, `overflow-y-auto`):**
- `paddingLeft: 56px`, `paddingRight: 24px` (matching Editor)
- All text in `font-caveat`, `fontSize: 20px`, `lineHeight: 2`

**Content sections:**
1. **Date header** — top-right, formatted like Write page: `"Friday, February 20, 2026"` + time below in smaller text
2. **Mood badge** — emoji in a colored circle, left-aligned, with mood label text
3. **Entry text** — rendered via `dangerouslySetInnerHTML` in Caveat font on ruled lines, NOT editable
4. **Doodles** — rendered with `DoodlePreview` component (larger size, ~200px)
5. **Photos** — if entry has photos, render polaroid-style (reuse CollagePhoto styling but read-only)
6. **Song** — `SongEmbed` component with `compact` mode

**Append section (below existing content, with a divider):**
- Thin divider line in warm accent
- "Add to this page..." label in muted text
- **Append text area** — small TipTap editor (controlled mode: `value`/`onChange`), only visible. Height ~150px, same Caveat styling
- **Add buttons row** — only show buttons for MISSING media:
  - Doodle button (if no doodles) → opens DoodleCanvas modal
  - Song input (if no song) → text input for URL
  - Photo button (if no photos) → file input for upload (reuse CollagePhoto logic)
- **Save button** — only visible when user has added something. Calls PUT `/api/entries/[id]` with `appendText`, `newDoodles`, `newPhotos`, `song` as appropriate

**Data fetching:**
- Use `useEntry(entryId)` hook from `src/hooks/useEntries.ts`
- Show loading spinner while fetching
- On save success: call `onUpdated()`, then `onClose()`

**Animation:**
- Modal: `initial={{ opacity: 0, scale: 0.95 }}` → `animate={{ opacity: 1, scale: 1 }}`
- Backdrop: `initial={{ opacity: 0 }}` → `animate={{ opacity: 1 }}`
- Use `AnimatePresence` for mount/unmount

**Key code patterns to follow (from Editor.tsx):**
```tsx
// Notebook spine
<div className="absolute left-0 top-0 bottom-0 w-3" style={{
  background: `linear-gradient(to right, ${theme.accent.warm}15 0%, ${theme.accent.warm}08 50%, transparent 100%)`,
  borderRight: `1px solid ${theme.accent.warm}20`,
}} />

// Margin line
<div className="absolute top-0 bottom-0 w-px" style={{
  left: '48px',
  background: `${theme.accent.warm}40`,
}} />

// Ruled lines
<div className="absolute inset-0 pointer-events-none" style={{
  left: '48px',
  backgroundImage: `repeating-linear-gradient(to bottom,
    transparent 0px, transparent 39px,
    ${theme.text.muted}15 39px, ${theme.text.muted}15 40px)`,
  backgroundPosition: '0 24px',
}} />

// Text styling
style={{
  fontFamily: 'var(--font-caveat), cursive',
  fontSize: '20px',
  lineHeight: 2,
  color: theme.text.primary,
}}
```

**Step 2: Verify it renders**

Run: `docker compose restart app` and open Timeline. Click an entry — modal should open with notebook style.

**Step 3: Commit**

```bash
git add src/components/EntryDetailModal.tsx
git commit -m "feat: add EntryDetailModal with notebook aesthetic and append-only editing"
```

---

### Task 2: Wire Modal into Timeline Page

**Files:**
- Modify: `src/app/timeline/page.tsx`

**Step 1: Replace inline expand with modal**

Changes to `timeline/page.tsx`:

1. Add import: `import EntryDetailModal from '@/components/EntryDetailModal'`
2. Replace `expandedEntry` state with `selectedEntryId`:
   ```tsx
   const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)
   ```
3. Update `EntryCard` onClick to open modal:
   ```tsx
   <EntryCard
     key={entry.id}
     entry={entry}
     onClick={isLetter ? undefined : () => setSelectedEntryId(entry.id)}
     onEdit={isLetter ? undefined : handleEditEntry}
   />
   ```
   - Remove `expanded` prop from EntryCard (entries no longer expand inline)
4. Add modal at bottom of JSX:
   ```tsx
   <EntryDetailModal
     entryId={selectedEntryId}
     onClose={() => setSelectedEntryId(null)}
     onUpdated={refresh}
   />
   ```
5. Remove the `handleEditEntry` function entirely — editing now happens through the modal's append-only system, not by navigating to the Write page

**Step 2: Clean up EntryCard**

In `EntryCard.tsx`:
- Remove the `expanded` prop and all expanded-state rendering (the full text, expanded song embed)
- Remove the `onEdit` prop and edit button — the modal handles this now
- Keep the card as a compact preview only (mood emoji, time, text preview, doodle thumbnails, song indicator)

**Step 3: Verify timeline + modal flow**

Run: `docker compose restart app`, go to Timeline, click an entry. Verify:
- Modal opens with notebook style
- Entry content is displayed correctly
- Close works (X button and backdrop click)
- Append area appears with correct controls

**Step 4: Commit**

```bash
git add src/app/timeline/page.tsx src/components/EntryCard.tsx
git commit -m "feat: wire EntryDetailModal into timeline, replace inline expand"
```

---

### Task 3: Test Append-Only Save Flow

**Step 1: Test appending text**

1. Open an entry in the modal
2. Type additional text in the "Add to this page..." area
3. Click Save
4. Verify the PUT request sends `appendText` field
5. Reopen the entry — new text should appear below original

**Step 2: Test adding doodle to entry without one**

1. Find/create an entry without a doodle
2. Open in modal — doodle button should appear
3. Draw something, save
4. Verify doodle appears on reopen

**Step 3: Test adding song to entry without one**

1. Find/create an entry without a song
2. Open in modal — song input should appear
3. Paste a YouTube/Spotify URL, save
4. Verify song embed appears on reopen

**Step 4: Test that existing content can't be modified**

1. Open entry with text — verify text is NOT editable (no cursor)
2. Open entry with doodle — verify no delete button on doodle
3. Open entry with song — verify no remove option

**Step 5: Commit if any fixes needed**

```bash
git add -u
git commit -m "fix: polish append-only save flow in entry detail modal"
```
