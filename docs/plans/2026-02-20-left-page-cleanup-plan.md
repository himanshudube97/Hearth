# Left Page Cleanup & Auto-Page-Switch Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove mood picker (commented out), fix double line issue, add auto-switch from left page to right page when typing fills the page.

**Architecture:** Three independent UI changes to LeftPage.tsx + one wiring change in BookSpread.tsx + one ref-based focus change in RightPage.tsx. Changes are additive and don't touch the database or API layer.

**Tech Stack:** React 19, Next.js 16, Framer Motion, Zustand

---

### Task 1: Fix Double Lines on Left Page

**Files:**
- Modify: `src/components/desk/BookSpread.tsx:431`

**Step 1: Add `skipLinePattern` to left PageWrapper**

In BookSpread.tsx line 431, change:
```tsx
<PageWrapper side="left" diaryTheme={diaryTheme} isGlass={currentDiaryTheme === 'glass'} glassSettings={theme.glass}>
```
to:
```tsx
<PageWrapper side="left" diaryTheme={diaryTheme} isGlass={currentDiaryTheme === 'glass'} glassSettings={theme.glass} skipLinePattern>
```

This stops the PageWrapper from rendering a second set of lines behind the textarea's own lines (which already use `backgroundAttachment: 'local'` to scroll with text).

**Step 2: Verify visually**

Run: `docker compose restart app` and check the left page - should see single lines only, no doubled/offset lines.

**Step 3: Commit**

```bash
git add src/components/desk/BookSpread.tsx
git commit -m "fix: remove double line pattern on left page"
```

---

### Task 2: Comment Out Mood Picker

**Files:**
- Modify: `src/components/desk/LeftPage.tsx:116-148` (new entry mood picker)
- Modify: `src/components/desk/LeftPage.tsx:244-257` (view mode mood display)

**Step 1: Comment out mood picker in new entry mode**

In LeftPage.tsx, wrap lines 115-148 in JSX comment `{/* ... */}`. The block to comment starts at `{/* Mood Section - Compact */}` and ends at the closing `</div>` before the Music Section comment.

Replace:
```tsx
            {/* Mood Section - Compact */}
            <div className="mb-3 flex-shrink-0">
              <div
                className="text-[10px] uppercase tracking-[0.15em] mb-2 font-medium"
                style={{ color: mutedColor }}
              >
                How are you feeling?
              </div>
              <div className="flex items-center gap-1.5">
                {moods.map((mood) => (
                  <motion.button
                    key={mood.value}
                    onClick={() => setCurrentMood(mood.value)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-base relative"
                    style={{
                      background: currentMood === mood.value
                        ? `${theme.moods[mood.value as keyof typeof theme.moods]}25`
                        : 'rgba(0,0,0,0.02)',
                      border: currentMood === mood.value
                        ? `2px solid ${theme.moods[mood.value as keyof typeof theme.moods]}`
                        : '1px solid rgba(0,0,0,0.05)',
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    title={mood.label}
                  >
                    {mood.emoji}
                  </motion.button>
                ))}
              </div>
              <div className="mt-1 text-[10px]" style={{ color: mutedColor }}>
                {theme.moodLabels[currentMood]}
              </div>
            </div>
```

With a commented-out version wrapped in `{/* MOOD PICKER - commented out, keeping code for future use` and `*/}`.

**Step 2: Comment out mood display in view mode**

In LeftPage.tsx view mode (around line 244-257), comment out the mood display block:

Replace:
```tsx
          {/* Mood display */}
          <div className="mb-3 flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{theme.moodEmojis[entry?.mood ?? 2]}</span>
              <div>
                <div className="text-sm font-medium" style={{ color: textColor }}>
                  {theme.moodLabels[entry?.mood ?? 2]}
                </div>
                <div className="text-xs" style={{ color: mutedColor }}>
                  {spreadDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
```

With a commented-out version. Keep the timestamp info visible somewhere if needed (e.g. move it to the song section or remove for now).

**Step 3: Verify visually**

Run: `docker compose restart app` and check:
- New entry: no mood picker shown, song input at top
- Existing entry: no mood emoji/label, song still visible

**Step 4: Commit**

```bash
git add src/components/desk/LeftPage.tsx
git commit -m "ui: comment out mood picker, keep song at top"
```

---

### Task 3: Auto-Switch Focus to Right Page When Left Page Fills

This is the most complex change. It involves:
- LeftPage: detecting overflow and calling `onPageFull` callback
- BookSpread: wiring the callback to focus the right page
- RightPage: accepting a `textareaRef` to receive focus

**Files:**
- Modify: `src/components/desk/LeftPage.tsx` - add overflow detection, `onPageFull` prop
- Modify: `src/components/desk/RightPage.tsx` - accept `textareaRef` prop
- Modify: `src/components/desk/BookSpread.tsx` - wire `onPageFull` to right page focus

**Step 1: Add overflow detection to LeftPage**

In LeftPage.tsx:

a) Add `useRef` to the React import (already has it? no - currently imports: `memo, useState, useCallback, useEffect`). Add `useRef`.

b) Add `onPageFull` to the `LeftPageProps` interface:
```tsx
interface LeftPageProps {
  // ... existing props
  onPageFull?: () => void  // Called when text overflows the visible area
}
```

c) Add `onPageFull` to the destructured props.

d) Inside the new entry branch, add a ref for the textarea wrapper and overflow detection:

```tsx
const writingAreaRef = useRef<HTMLDivElement>(null)
const textareaRef = useRef<HTMLTextAreaElement>(null)
const [isPageFull, setIsPageFull] = useState(false)

// Detect when text overflows the textarea visible area
useEffect(() => {
  const textarea = textareaRef.current
  if (!textarea) return

  // Check if content exceeds visible area
  const isOverflowing = textarea.scrollHeight > textarea.clientHeight + 4 // small buffer

  if (isOverflowing && !isPageFull) {
    setIsPageFull(true)
    onPageFull?.()
  } else if (!isOverflowing && isPageFull) {
    setIsPageFull(false)
  }
}, [text, isPageFull, onPageFull])
```

e) Add `ref={textareaRef}` to the textarea element and change overflow to hidden:
```tsx
<textarea
  ref={textareaRef}
  value={text}
  onChange={(e) => onTextChange?.(e.target.value)}
  placeholder={currentSpread === 1 ? "What's on your mind today..." : "Continue your thoughts..."}
  className="w-full h-full resize-none outline-none flex-1"
  style={{
    // ... existing styles
    overflow: 'hidden',  // prevent scrolling - auto-switch to right page instead
  }}
/>
```

**Step 2: Add textareaRef to RightPage**

In RightPage.tsx:

a) Add `textareaRef` to `RightPageProps`:
```tsx
interface RightPageProps {
  // ... existing props
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>
}
```

b) Destructure it in the component.

c) In the new entry textarea (line 476), add the ref:
```tsx
<textarea
  ref={textareaRef}
  value={text}
  // ... rest unchanged
/>
```

**Step 3: Wire up in BookSpread**

In BookSpread.tsx:

a) Add a ref for the right page textarea:
```tsx
const rightPageTextareaRef = useRef<HTMLTextAreaElement>(null)
```

b) Add handler for page full:
```tsx
const handleLeftPageFull = useCallback(() => {
  rightPageTextareaRef.current?.focus()
}, [])
```

c) Pass `onPageFull` to LeftPage:
```tsx
<LeftPage
  // ... existing props
  onPageFull={handleLeftPageFull}
/>
```

d) Pass `textareaRef` to RightPage:
```tsx
<RightPage
  // ... existing props
  textareaRef={rightPageTextareaRef}
/>
```

**Step 4: Verify visually**

Run: `docker compose restart app` and test:
- Type enough text on left page to fill it
- Cursor should auto-move to right page textarea
- Left page should not scroll
- Deleting text on left page should allow typing again

**Step 5: Commit**

```bash
git add src/components/desk/LeftPage.tsx src/components/desk/RightPage.tsx src/components/desk/BookSpread.tsx
git commit -m "feat: auto-switch focus to right page when left page fills"
```

---

### Task 4: Saved View Consistency

**Files:**
- Modify: `src/components/desk/LeftPage.tsx` (view mode)

**Step 1: Verify view mode matches edit mode**

After tasks 1-3, the view mode on the left page should already look consistent because:
- Mood is commented out (Task 2)
- Double lines are fixed (Task 1)
- Song display remains at top in view mode

Check that the font size and line height match between edit (`fontSize: '20px'`) and view (`fontSize: '18px'`). If they differ, align view mode to `20px`:

In the view mode text content div (around line 276-286), change `fontSize: '18px'` to `fontSize: '20px'` to match the edit mode textarea.

**Step 2: Verify visually**

Run: `docker compose restart app` and compare:
- Create a new entry with text + song
- Save it
- View the saved entry - should look consistent with edit mode

**Step 3: Commit**

```bash
git add src/components/desk/LeftPage.tsx
git commit -m "ui: align view mode font size with edit mode for consistency"
```

---

### Task 5: Lint Check

**Step 1: Run lint**

```bash
npm run lint
```

Fix any lint errors introduced by the changes.

**Step 2: Commit fixes if needed**

```bash
git add -A
git commit -m "fix: lint errors from left page cleanup"
```
