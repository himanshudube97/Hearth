# Left Page Cleanup & Auto-Page-Switch Design

## Changes

### 1. Comment Out Mood Picker (not remove)
- Comment out mood picker JSX in LeftPage.tsx (new entry mode, lines 116-148)
- Comment out mood display in LeftPage.tsx (view mode, lines 245-257)
- Keep mood default at 2 (neutral) for saves - no schema changes

### 2. Fix Double Lines on Left Page
- Root cause: PageWrapper (BookSpread.tsx:132-143) renders line pattern AND textarea (LeftPage.tsx:199) renders its own linePattern
- Fix: Pass `skipLinePattern` to left PageWrapper in BookSpread.tsx line 431
- Textarea keeps its own lines (scrolls with text via backgroundAttachment: 'local')

### 3. Auto-Switch to Right Page When Left Fills
- Calculate available text height on left page
- Use hidden div measurement to detect text overflow
- Set `overflow: hidden` on left page textarea
- Emit `onPageFull` callback from LeftPage to BookSpread
- BookSpread forwards focus to RightPage textarea via ref
- Left page text becomes read-only once full; backspace resumes editing

### 4. Saved Version Consistency
- View mode left page: song + text (mood commented out)
- View mode right page: unchanged (photos, text, doodle)
- Same font/lineHeight/styling in edit and view modes

## Files Modified
- `src/components/desk/LeftPage.tsx` - comment mood, add overflow detection
- `src/components/desk/RightPage.tsx` - accept focus ref
- `src/components/desk/BookSpread.tsx` - skipLinePattern for left page, wire auto-focus
