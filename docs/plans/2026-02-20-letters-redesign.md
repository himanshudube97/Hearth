# Letters Feature Redesign - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the letters page with poetic hero cards, inline expand writing with full media (photos, doodles, music), rich emails for both self and friend letters, and a sent/received archive with cross-user delivery.

**Architecture:** Single-page redesign of `/letters` with 4 vertical sections (hero cards, inline writing area, sent archive, received letters). Backend updates to cron delivery for rich emails and Hearth-user detection. New `doodle-to-image` server utility using `perfect-freehand` + `sharp` for email embedding.

**Tech Stack:** Next.js App Router, Prisma, TipTap, Framer Motion, Resend (email), sharp (image), perfect-freehand (doodle rendering)

**Design Doc:** `docs/plans/2026-02-20-letters-redesign-design.md`

---

## Phase 1: Infrastructure

### Task 1: Schema Migration

**Files:**
- Modify: `prisma/schema.prisma` (add 3 fields to JournalEntry, around line 65)

**Step 1: Add new fields to schema**

In `prisma/schema.prisma`, add these fields to the `JournalEntry` model after `isViewed` (around line 63):

```prisma
  // Received letter tracking
  isReceivedLetter  Boolean   @default(false)
  originalSenderId  String?
  originalEntryId   String?
```

**Step 2: Run migration**

```bash
docker compose exec app npx prisma migrate dev --name add-received-letter-fields
```

Expected: Migration created and applied successfully. No data loss warnings since all fields are additive (optional or have defaults).

**Step 3: Verify**

```bash
docker compose exec app npx prisma studio
```

Check that JournalEntry table shows the 3 new columns.

**Step 4: Commit**

```bash
git add prisma/
git commit -m "feat: add received letter schema fields"
```

---

### Task 2: Install sharp

**Step 1: Install in Docker container**

```bash
docker compose exec app pnpm add sharp
```

**Step 2: Verify installation**

```bash
docker compose exec app node -e "const sharp = require('sharp'); console.log('sharp version:', sharp.versions)"
```

Expected: Prints sharp version info without errors. Alpine Linux + Node 20 have pre-built sharp binaries.

**Step 3: Copy lockfile changes to host**

```bash
docker compose exec app cat pnpm-lock.yaml > pnpm-lock.yaml
```

Actually, since the project mounts `.:/app` and uses a separate volume for `node_modules`, the `package.json` changes will be reflected on host. Just run:

```bash
pnpm add sharp
```

on the host as well so `package.json` and lockfile are in sync.

**Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "feat: add sharp for server-side image processing"
```

---

### Task 3: Create Doodle-to-Image Utility

**Files:**
- Create: `src/lib/doodle-to-image.ts`

**Context:** The `DoodlePreview.tsx` component (line 12-26) has `getSvgPathFromStroke` which converts `perfect-freehand` output to SVG path data. We need the same logic server-side, plus SVG→PNG conversion via `sharp`.

**Step 1: Create the utility**

Create `src/lib/doodle-to-image.ts`:

```typescript
import { getStroke } from 'perfect-freehand'
import sharp from 'sharp'

interface StrokeData {
  points: number[][]
  color: string
  size: number
}

function getSvgPathFromStroke(stroke: number[][]): string {
  if (!stroke.length) return ''

  const d = stroke.reduce(
    (acc: (string | number)[], [x0, y0]: number[], i: number, arr: number[][]) => {
      const [x1, y1] = arr[(i + 1) % arr.length]
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
      return acc
    },
    ['M', ...stroke[0], 'Q']
  )

  d.push('Z')
  return d.join(' ')
}

/**
 * Convert doodle stroke data to an SVG string.
 * This is the same logic as DoodlePreview.tsx but without React/DOM dependencies.
 */
export function strokesToSvg(strokes: StrokeData[], width = 400, height = 400): string {
  if (!strokes || strokes.length === 0) return ''

  // Calculate bounds
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  strokes.forEach(stroke => {
    stroke.points.forEach(([x, y]) => {
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    })
  })

  const padding = 20
  const viewBox = `${minX - padding} ${minY - padding} ${maxX - minX + padding * 2} ${maxY - minY + padding * 2}`

  const paths = strokes.map(strokeData => {
    const outlinePoints = getStroke(strokeData.points, {
      size: strokeData.size,
      thinning: 0.5,
      smoothing: 0.5,
      streamline: 0.5,
    })
    const pathData = getSvgPathFromStroke(outlinePoints)
    return `<path d="${pathData}" fill="${strokeData.color}" opacity="0.9"/>`
  }).join('\n    ')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}">
    <rect width="100%" height="100%" fill="transparent"/>
    ${paths}
  </svg>`
}

/**
 * Convert doodle stroke data to a PNG buffer.
 * Used for embedding doodles in emails.
 */
export async function strokesToPng(strokes: StrokeData[], width = 400, height = 400): Promise<Buffer | null> {
  const svg = strokesToSvg(strokes, width, height)
  if (!svg) return null

  try {
    const pngBuffer = await sharp(Buffer.from(svg))
      .png()
      .toBuffer()
    return pngBuffer
  } catch (error) {
    console.error('Failed to convert doodle to PNG:', error)
    return null
  }
}

/**
 * Convert doodle stroke data to a base64 data URL.
 */
export async function strokesToDataUrl(strokes: StrokeData[], width = 400, height = 400): Promise<string | null> {
  const pngBuffer = await strokesToPng(strokes, width, height)
  if (!pngBuffer) return null
  return `data:image/png;base64,${pngBuffer.toString('base64')}`
}
```

**Step 2: Verify it compiles**

```bash
docker compose exec app npx tsc --noEmit src/lib/doodle-to-image.ts 2>&1 || echo "Check for errors"
```

Note: This may not work standalone due to path aliases. Just ensure no red squiggles in the IDE.

**Step 3: Commit**

```bash
git add src/lib/doodle-to-image.ts
git commit -m "feat: add server-side doodle to image conversion utility"
```

---

## Phase 2: Backend - API & Email Updates

### Task 4: Update Email Templates

**Files:**
- Modify: `src/lib/email.ts`

**Context:** Currently `generateLetterEmail` (line 15-143) renders only text. `sendSelfLetterNotification` (line 182-256) sends a notification-only email. We need both to support full media content.

**Step 1: Update `generateLetterEmail` to accept media params**

Add photo, doodle, and music parameters to the function. Update the HTML template to render:
- Photos as `<img>` tags with polaroid styling after the letter text
- Doodle as a `<img>` tag (base64 data URL from `strokesToDataUrl`)
- Music link as a styled card with "Listen" button

The function signature becomes:

```typescript
function generateLetterEmail(params: {
  recipientName: string
  senderName: string
  letterContent: string
  letterLocation?: string | null
  writtenAt: Date
  photos?: { url: string; position: number }[]
  doodleDataUrl?: string | null
  songLink?: string | null
}): string
```

Add after the letter content div (around line 100 in current template), before the closing card:

- **Photos section**: If photos exist, render them as 120px wide images with 6px padding (polaroid style), slight rotation via CSS transform, centered in a flex row
- **Doodle section**: If doodleDataUrl, render as a centered `<img>` with max-width 300px, rounded corners, margin top 20px
- **Music section**: If songLink, render a styled card with music note emoji, the link text (truncated), and a "Listen" button linking to the URL. Background `rgba(255,255,255,0.05)`, border `rgba(232,148,90,0.3)`, padding 12px

**Step 2: Create `sendSelfLetterEmail` (rename from notification)**

Create a new function `sendSelfLetterEmail` that uses `generateLetterEmail` to send full content, matching the friend letter email pattern:

```typescript
export async function sendSelfLetterEmail({
  to,
  userName,
  letterContent,
  letterLocation,
  writtenAt,
  photos,
  doodleDataUrl,
  songLink,
}: {
  to: string
  userName: string
  letterContent: string
  letterLocation?: string | null
  writtenAt: Date
  photos?: { url: string; position: number }[]
  doodleDataUrl?: string | null
  songLink?: string | null
}) {
  const html = generateLetterEmail({
    recipientName: userName || 'future me',
    senderName: 'Your past self',
    letterContent,
    letterLocation,
    writtenAt,
    photos,
    doodleDataUrl,
    songLink,
  })

  return resend.emails.send({
    from: 'Hearth Letters <letters@hearth.app>',
    to,
    subject: 'A letter from your past self has arrived',
    html,
  })
}
```

Keep the old `sendSelfLetterNotification` temporarily for backwards compatibility but mark it deprecated. The cron job will be updated to call the new function.

**Step 3: Commit**

```bash
git add src/lib/email.ts
git commit -m "feat: add rich media support to letter email templates"
```

---

### Task 5: Update Letters Mine API

**Files:**
- Modify: `src/app/api/letters/mine/route.ts`

**Context:** Currently selects only text fields (line 18-28). Needs to include photos, doodles, song. Also needs to exclude received letters.

**Step 1: Update the query**

Add to the `where` clause:
```typescript
isReceivedLetter: false,
```

Add to the `select`:
```typescript
song: true,
photos: {
  select: { url: true, position: true, spread: true, rotation: true }
},
doodles: {
  select: { strokes: true, positionInEntry: true, spread: true }
},
```

**Step 2: Update the response mapping**

Add to each mapped letter:
```typescript
song: letter.song,
photos: letter.photos || [],
doodles: letter.doodles || [],
```

**Step 3: Commit**

```bash
git add src/app/api/letters/mine/route.ts
git commit -m "feat: include media in letters mine API, exclude received"
```

---

### Task 6: Update Letters Arrived API

**Files:**
- Modify: `src/app/api/letters/arrived/route.ts`

**Context:** Currently selects `id, text, createdAt, unlockDate, letterLocation, isDelivered` (line 28-35). Needs photos, doodles, song for the postcard modal.

**Step 1: Add to the `select`**

```typescript
song: true,
photos: {
  select: { url: true, position: true, spread: true, rotation: true }
},
doodles: {
  select: { strokes: true, positionInEntry: true, spread: true }
},
```

**Step 2: Include in response**

Map photos, doodles, and song through to the response objects.

**Step 3: Commit**

```bash
git add src/app/api/letters/arrived/route.ts
git commit -m "feat: include media in arrived letters API"
```

---

### Task 7: Create Letters Received API

**Files:**
- Create: `src/app/api/letters/received/route.ts`

**Step 1: Create the endpoint**

```typescript
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/db'
import { safeDecrypt } from '@/lib/encryption'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  const letters = await prisma.journalEntry.findMany({
    where: {
      userId: user.id,
      entryType: 'letter',
      isReceivedLetter: true,
    },
    select: {
      id: true,
      text: true,
      createdAt: true,
      unlockDate: true,
      isSealed: true,
      letterLocation: true,
      senderName: true,
      originalSenderId: true,
      isViewed: true,
      isDelivered: true,
      deliveredAt: true,
      song: true,
      photos: {
        select: { url: true, position: true, spread: true, rotation: true }
      },
      doodles: {
        select: { strokes: true, positionInEntry: true, spread: true }
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const decryptedLetters = letters.map(letter => ({
    ...letter,
    text: safeDecrypt(letter.text),
    letterLocation: safeDecrypt(letter.letterLocation),
    senderName: safeDecrypt(letter.senderName),
    hasArrived: letter.unlockDate ? new Date(letter.unlockDate) <= now : true,
  }))

  return NextResponse.json(decryptedLetters)
}
```

**Step 2: Commit**

```bash
git add src/app/api/letters/received/route.ts
git commit -m "feat: add received letters API endpoint"
```

---

### Task 8: Update Cron Job - Rich Emails + Cross-User Delivery

**Files:**
- Modify: `src/app/api/cron/deliver-letters/route.ts`

**Context:** Currently (line 22-40) fetches letters without photos/doodles/song. Email calls (line 59-92) pass only text. No Hearth-user check exists.

**Step 1: Update the Prisma query to include media**

Add to the `include` (around line 32):
```typescript
include: {
  user: { select: { email: true, name: true } },
  photos: { select: { url: true, position: true, spread: true, rotation: true } },
  doodles: { select: { strokes: true, positionInEntry: true, spread: true } },
},
```

**Step 2: Import doodle utility and generate PNG**

```typescript
import { strokesToDataUrl } from '@/lib/doodle-to-image'
```

Inside the letter processing loop, before sending email:
```typescript
// Render doodle to image if exists
let doodleDataUrl: string | null = null
if (letter.doodles && letter.doodles.length > 0) {
  const strokes = letter.doodles[0].strokes as StrokeData[]
  doodleDataUrl = await strokesToDataUrl(strokes)
}

const photos = letter.photos || []
const songLink = letter.song || null
```

**Step 3: Update friend letter email call**

Replace the `sendLetterEmail` call (around line 67) with:
```typescript
await sendLetterEmail({
  to: letter.recipientEmail!,
  recipientName,
  senderName,
  letterContent,
  letterLocation,
  writtenAt: letter.createdAt,
  photos: photos.map(p => ({ url: p.url, position: p.position })),
  doodleDataUrl,
  songLink,
})
```

**Step 4: Update self letter email call**

Replace `sendSelfLetterNotification` (around line 85) with:
```typescript
await sendSelfLetterEmail({
  to: letter.user.email!,
  userName: letter.user.name || '',
  letterContent: safeDecrypt(letter.text),
  letterLocation: safeDecrypt(letter.letterLocation),
  writtenAt: letter.createdAt,
  photos: photos.map(p => ({ url: p.url, position: p.position })),
  doodleDataUrl,
  songLink,
})
```

**Step 5: Add cross-user delivery for friend letters**

After marking the letter as delivered (around line 100), for friend letters:
```typescript
if (letter.recipientEmail) {
  // Check if recipient is a Hearth user
  const recipientUser = await prisma.user.findUnique({
    where: { email: letter.recipientEmail },
  })

  if (recipientUser) {
    // Create a received letter entry for the Hearth user
    await prisma.journalEntry.create({
      data: {
        text: letter.text,  // Keep encrypted
        textPreview: letter.textPreview,
        mood: letter.mood,
        song: letter.song,
        entryType: 'letter',
        unlockDate: letter.unlockDate,
        isSealed: true,
        isDelivered: true,
        deliveredAt: new Date(),
        isReceivedLetter: true,
        originalSenderId: letter.userId,
        originalEntryId: letter.id,
        senderName: letter.senderName,  // Keep encrypted
        recipientName: letter.recipientName,
        letterLocation: letter.letterLocation,
        encryptionType: letter.encryptionType,
        userId: recipientUser.id,
        // Copy photos
        photos: letter.photos.length > 0 ? {
          create: letter.photos.map(p => ({
            url: p.url,
            position: p.position,
            spread: p.spread,
            rotation: p.rotation,
          }))
        } : undefined,
        // Copy doodles
        doodles: letter.doodles.length > 0 ? {
          create: letter.doodles.map(d => ({
            strokes: d.strokes,
            positionInEntry: d.positionInEntry,
            spread: d.spread,
          }))
        } : undefined,
      },
    })
  }
}
```

**Step 6: Commit**

```bash
git add src/app/api/cron/deliver-letters/route.ts
git commit -m "feat: rich emails and cross-user delivery in cron job"
```

---

## Phase 3: Frontend - Letters Page Rewrite

### Task 9: Letters Page - Hero Cards Section

**Files:**
- Modify: `src/app/letters/page.tsx` (major rewrite, lines 1-1798)

**Context:** This is the biggest task. The current page has a toggle button UI (self/friend), an editor area, and a letter archive below. We're replacing the entire page structure.

**Approach:** Rewrite in stages. This task focuses on the hero cards and selection state.

**Step 1: Update imports**

Add to existing imports:
```typescript
import DoodleCanvas from '@/components/DoodleCanvas'
import DoodlePreview from '@/components/DoodlePreview'
import SongEmbed, { isMusicUrl } from '@/components/SongEmbed'
import { StrokeData } from '@/store/journal'
```

**Step 2: Add new state variables**

Add alongside existing state:
```typescript
const [selectedCard, setSelectedCard] = useState<'self' | 'friend' | null>(null)
const [songLink, setSongLink] = useState('')
const [doodleStrokes, setDoodleStrokes] = useState<StrokeData[]>([])
const [showDoodle, setShowDoodle] = useState(false)
const [receivedLetters, setReceivedLetters] = useState<any[]>([])
```

**Step 3: Replace the recipient toggle UI with hero cards**

Replace the current toggle buttons (around lines 870-920 in the existing page) with two side-by-side cards:

- **"Letter to Future Self"** card:
  - Warm amber/gold gradient background
  - Envelope icon (use an inline SVG or emoji)
  - Title: "Letter to Future Self"
  - Subtitle: "Write to the person you're becoming. Seal your words in time — they'll find you when the moment is right."
  - On click: `setSelectedCard(selectedCard === 'self' ? null : 'self')`, also set `recipientType` to `'self'`
  - Highlight border when selected

- **"Letter to a Friend"** card:
  - Soft blue/indigo gradient background
  - Paper plane icon
  - Title: "Letter to a Friend"
  - Subtitle: "Send your heart across the distance. A letter that arrives not when it's sent, but when it's meant to."
  - On click: `setSelectedCard(selectedCard === 'friend' ? null : 'friend')`, also set `recipientType` to `'friend'`
  - Highlight border when selected

Cards should be responsive: `grid grid-cols-2 gap-4` on desktop, `grid-cols-1` on mobile.

Use Framer Motion `motion.div` with `whileHover={{ scale: 1.02 }}` and `whileTap={{ scale: 0.98 }}` for interaction feel.

**Step 4: Wrap writing area in AnimatePresence**

The existing editor/writing area should be wrapped in:
```tsx
<AnimatePresence>
  {selectedCard && (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
    >
      {/* existing writing area content */}
    </motion.div>
  )}
</AnimatePresence>
```

**Step 5: Commit**

```bash
git add src/app/letters/page.tsx
git commit -m "feat: letters page hero cards with inline expand"
```

---

### Task 10: Letters Page - Writing Area with Full Media

**Files:**
- Modify: `src/app/letters/page.tsx` (continuing from Task 9)

**Context:** The write page (`src/app/write/page.tsx`, lines 288-408) shows exactly how doodle, song, and photo UI is wired up. Replicate the same pattern in the letters writing area.

**Step 1: Add doodle button and preview to the action bar**

Below the editor (inside the expanded writing area), add an action bar similar to the write page (lines 304-408):

```tsx
{/* Action bar - below editor */}
<div className="flex items-center gap-3 mt-3 px-2">
  {/* Doodle button / preview */}
  {doodleStrokes.length > 0 ? (
    <button onClick={() => setShowDoodle(true)} className="relative group">
      <DoodlePreview strokes={doodleStrokes} size={44} />
      <span className="absolute -top-1 -right-1 text-xs">✏️</span>
    </button>
  ) : (
    <button
      onClick={() => setShowDoodle(true)}
      className="w-10 h-10 rounded-full flex items-center justify-center"
      style={{ background: 'rgba(255,255,255,0.1)', color: theme.text.secondary }}
    >
      ✎
    </button>
  )}

  {/* Song input */}
  <div className="flex-1 relative">
    <input
      type="text"
      value={songLink}
      onChange={(e) => setSongLink(e.target.value)}
      placeholder="Paste a song link..."
      className="w-full bg-transparent text-sm px-3 py-2 rounded-lg outline-none"
      style={{
        border: `1px solid ${theme.glass.border}`,
        color: theme.text.primary,
      }}
    />
  </div>
</div>

{/* Song embed preview */}
{songLink && isMusicUrl(songLink) && (
  <div className="mt-3 px-2">
    <SongEmbed url={songLink} compact />
  </div>
)}
```

**Step 2: Add DoodleCanvas modal**

Add at the end of the component (inside the return, near other modals):
```tsx
<AnimatePresence>
  {showDoodle && (
    <DoodleCanvas
      onSave={(strokes) => { setDoodleStrokes(strokes); setShowDoodle(false) }}
      onClose={() => setShowDoodle(false)}
      initialStrokes={doodleStrokes}
    />
  )}
</AnimatePresence>
```

**Important:** The DoodleCanvas uses localStorage key `'hearth_doodle_draft'`. Since the write page uses the same key, consider either:
- Clearing it on letter page mount, or
- Accepting this shared state (doodle drafts are transient anyway)

For simplicity, clear on mount:
```typescript
useEffect(() => {
  // Don't load write page's doodle draft into letters
  localStorage.removeItem('hearth_doodle_draft')
}, [])
```

**Step 3: Fix container overflow for photos**

The current letters page editor container (around line 940) has `overflow-hidden` which clips polaroid photos. Change the editor wrapper to use `overflow: 'visible'`:

```tsx
<motion.div className="relative mt-5" style={{ overflow: 'visible' }}>
  <Editor prompt={prompt} value={letterText} onChange={setLetterText} flexible />
  <CollagePhoto position="top-right" photo={photoTopRight} onPhotoChange={setPhotoTopRight} />
  <CollagePhoto position="bottom-left" photo={photoBottomLeft} onPhotoChange={setPhotoBottomLeft} />
</motion.div>
```

**Step 4: Include song and doodle in the POST payload**

Update `handleSendLetter` (around line 735) to include the new media:

```typescript
const entryData = {
  text: letterText,
  mood: 2,
  entryType: 'letter',
  unlockDate: unlockDate.toISOString(),
  isSealed: true,
  recipientEmail: recipientType === 'friend' ? friendEmail : null,
  recipientName: recipientType === 'friend' ? friendName : null,
  senderName: recipientType === 'friend' ? signAs : null,
  letterLocation: location || null,
  photos,
  song: songLink || null,
  doodles: doodleStrokes.length > 0
    ? [{ strokes: doodleStrokes, positionInEntry: 0 }]
    : [],
}
```

The `POST /api/entries` already handles `song` and `doodles` in the body destructuring (line 167-173 of `entries/route.ts`), so no backend changes needed.

**Step 5: Reset media state after successful send**

In the success handler, after the animation:
```typescript
setSongLink('')
setDoodleStrokes([])
setPhotoTopRight(null)
setPhotoBottomLeft(null)
setSelectedCard(null)
```

**Step 6: Commit**

```bash
git add src/app/letters/page.tsx
git commit -m "feat: add doodle, music, and photo support to letter writing"
```

---

### Task 11: Letters Page - Sent Archive Sections

**Files:**
- Modify: `src/app/letters/page.tsx` (continuing)

**Context:** Currently there's a "Wandering letters" count badge and a "Letters from the past" section. We're replacing these with two organized sub-sections.

**Step 1: Split myLetters into categories**

Add computed values:
```typescript
const selfLettersSent = myLetters.filter(l => !l.recipientEmail)
const friendLettersSent = myLetters.filter(l => !!l.recipientEmail)
const selfLettersArrived = selfLettersSent.filter(l => l.hasArrived)
const selfLettersWaiting = selfLettersSent.filter(l => !l.hasArrived)
```

**Step 2: Render "Letters to Myself" section**

```tsx
<div className="mt-12 px-4">
  <h2 className="text-lg font-medium mb-4" style={{ color: theme.text.primary, fontFamily: 'Caveat' }}>
    Letters to Myself
  </h2>

  {selfLettersSent.length === 0 ? (
    <p className="text-sm opacity-50" style={{ color: theme.text.secondary }}>
      No letters written yet
    </p>
  ) : (
    <div className="grid gap-3">
      {selfLettersSent.map(letter => (
        <motion.div
          key={letter.id}
          className="p-4 rounded-xl cursor-pointer"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${theme.glass.border}`,
          }}
          whileHover={{ scale: 1.01 }}
          onClick={() => {
            if (letter.hasArrived) {
              setSelectedLetter(letter)
              setShowLetterModal(true)
            }
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: theme.text.secondary }}>
                Sealed on {format(new Date(letter.createdAt), 'MMM d, yyyy')}
              </p>
              <p className="text-sm mt-1" style={{ color: theme.text.primary }}>
                {letter.hasArrived ? 'Arrived' : `Arriving ${format(new Date(letter.unlockDate!), 'MMM d, yyyy')}`}
              </p>
            </div>
            <span className="text-xl">
              {letter.hasArrived ? '💌' : '🔒'}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  )}
</div>
```

**Step 3: Render "Letters to Friends" section**

```tsx
<div className="mt-8 px-4">
  <h2 className="text-lg font-medium mb-4" style={{ color: theme.text.primary, fontFamily: 'Caveat' }}>
    Letters to Friends
  </h2>

  {friendLettersSent.length === 0 ? (
    <p className="text-sm opacity-50" style={{ color: theme.text.secondary }}>
      No letters sent yet
    </p>
  ) : (
    <div className="grid gap-3">
      {friendLettersSent.map(letter => (
        <motion.div
          key={letter.id}
          className="p-4 rounded-xl"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${theme.glass.border}`,
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: theme.text.primary }}>
                To {letter.recipientName || 'a friend'}
              </p>
              <p className="text-sm mt-1" style={{ color: theme.text.secondary }}>
                Sent {format(new Date(letter.createdAt), 'MMM d, yyyy')} · Arriving {format(new Date(letter.unlockDate!), 'MMM d, yyyy')}
              </p>
            </div>
            <span className="text-xl">🔒</span>
          </div>
        </motion.div>
      ))}
    </div>
  )}
</div>
```

**Step 4: Remove old "Wandering letters" and "Letters from the past" sections**

Delete the old sections (around lines 1021-1149 in the current file) and replace with the new sections above.

**Step 5: Commit**

```bash
git add src/app/letters/page.tsx
git commit -m "feat: add sent letters archive with self and friend sections"
```

---

### Task 12: Letters Page - Received Letters Section

**Files:**
- Modify: `src/app/letters/page.tsx` (continuing)

**Step 1: Fetch received letters on mount**

Add to the existing `useEffect` that fetches `myLetters`:
```typescript
// Fetch received letters
const fetchReceived = async () => {
  try {
    const res = await fetch('/api/letters/received')
    if (res.ok) {
      const data = await res.json()
      setReceivedLetters(data)
    }
  } catch (err) {
    console.error('Failed to fetch received letters:', err)
  }
}
fetchReceived()
```

**Step 2: Render received letters section**

Below the sent archive sections:

```tsx
<div className="mt-12 px-4 pb-16">
  <h2 className="text-lg font-medium mb-4" style={{ color: theme.text.primary, fontFamily: 'Caveat' }}>
    Received Letters
  </h2>

  {/* Self-letters that arrived */}
  {selfLettersArrived.length > 0 && (
    <div className="mb-6">
      <h3 className="text-sm font-medium mb-3 opacity-60" style={{ color: theme.text.secondary }}>
        Letters from the past
      </h3>
      <div className="grid gap-3">
        {selfLettersArrived.map(letter => (
          <motion.div
            key={letter.id}
            className="p-4 rounded-xl cursor-pointer"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: `1px solid ${theme.glass.border}`,
            }}
            whileHover={{ scale: 1.01 }}
            onClick={() => {
              setSelectedLetter(letter)
              setShowLetterModal(true)
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: theme.text.primary }}>
                  Written {format(new Date(letter.createdAt), 'MMM d, yyyy')}
                </p>
                {letter.letterLocation && (
                  <p className="text-xs mt-1 opacity-60" style={{ color: theme.text.secondary }}>
                    from {letter.letterLocation}
                  </p>
                )}
              </div>
              <span className="text-xl">💌</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )}

  {/* Letters from friends (Hearth users) */}
  <div>
    <h3 className="text-sm font-medium mb-3 opacity-60" style={{ color: theme.text.secondary }}>
      Letters from friends
    </h3>
    {receivedLetters.length === 0 ? (
      <p className="text-sm opacity-40" style={{ color: theme.text.secondary }}>
        No letters received yet
      </p>
    ) : (
      <div className="grid gap-3">
        {receivedLetters.filter(l => l.hasArrived).map(letter => (
          <motion.div
            key={letter.id}
            className="p-4 rounded-xl cursor-pointer"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: `1px solid ${theme.glass.border}`,
            }}
            whileHover={{ scale: 1.01 }}
            onClick={() => {
              setSelectedLetter(letter)
              setShowLetterModal(true)
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: theme.text.primary }}>
                  From {letter.senderName || 'a friend'}
                </p>
                <p className="text-xs mt-1 opacity-60" style={{ color: theme.text.secondary }}>
                  Arrived {letter.deliveredAt ? format(new Date(letter.deliveredAt), 'MMM d, yyyy') : ''}
                </p>
              </div>
              <span className="text-xl">💌</span>
            </div>
          </motion.div>
        ))}
      </div>
    )}
  </div>
</div>
```

**Step 3: Commit**

```bash
git add src/app/letters/page.tsx
git commit -m "feat: add received letters section to letters page"
```

---

### Task 13: Update Postcard Reading Modal with Media

**Files:**
- Modify: `src/app/letters/page.tsx` (the letter reading modal section, around lines 1401-1795)
- Also modify: `src/components/LetterArrivedBanner.tsx` (the write-page letter reveal modal)

**Context:** Both the letters page modal and the LetterArrivedBanner show arrived letters. Both need to display photos, doodles, and music. The `selectedLetter` object now includes `photos`, `doodles`, and `song` from the updated API.

**Step 1: Update the letters page postcard modal**

In the existing postcard reading modal (inside `showLetterModal`), after the letter text content `dangerouslySetInnerHTML`:

```tsx
{/* Photos */}
{selectedLetter?.photos && selectedLetter.photos.length > 0 && (
  <div className="flex justify-center gap-4 mt-6">
    {selectedLetter.photos.map((photo: any, i: number) => (
      <div
        key={i}
        className="relative"
        style={{
          transform: `rotate(${photo.rotation || (i === 0 ? 7 : -7)}deg)`,
          padding: '6px 6px 20px 6px',
          background: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          width: 120,
        }}
      >
        <img
          src={photo.url}
          alt=""
          style={{ width: '100%', aspectRatio: '4/5', objectFit: 'cover' }}
        />
      </div>
    ))}
  </div>
)}

{/* Doodle */}
{selectedLetter?.doodles && selectedLetter.doodles.length > 0 && (
  <div className="flex justify-center mt-6">
    <DoodlePreview
      strokes={selectedLetter.doodles[0].strokes as StrokeData[]}
      size={200}
    />
  </div>
)}

{/* Music */}
{selectedLetter?.song && isMusicUrl(selectedLetter.song) && (
  <div className="mt-6">
    <SongEmbed url={selectedLetter.song} compact />
  </div>
)}
```

**Step 2: Update the hidden capture element for download**

The hidden capture div (around line 1634, `ref={letterCaptureRef}`) also needs photos and doodle rendered inline so they appear in the downloaded PNG. For the doodle, render it as an inline SVG (since the capture uses `html2canvas` which handles SVGs).

**Step 3: Update LetterArrivedBanner similarly**

In `src/components/LetterArrivedBanner.tsx`, the `ArrivedLetter` interface (around line 8) needs to be expanded:
```typescript
interface ArrivedLetter {
  id: string
  text: string
  createdAt: string
  unlockDate: string
  letterLocation: string | null
  song?: string | null
  photos?: { url: string; position: number; spread: number; rotation: number }[]
  doodles?: { strokes: StrokeData[]; positionInEntry: number; spread: number }[]
}
```

Then in the reading phase section of the modal (around line 700-840), add the same photo/doodle/music rendering after the letter text.

**Step 4: Commit**

```bash
git add src/app/letters/page.tsx src/components/LetterArrivedBanner.tsx
git commit -m "feat: show photos, doodles, and music in letter reading modals"
```

---

## Phase 4: Verification

### Task 14: Manual Integration Test

**Step 1: Restart the app**

```bash
docker compose restart app
```

**Step 2: Verify letters page loads**

Visit `http://localhost:3111/letters` — should show two poetic hero cards.

**Step 3: Test letter to self**

- Click "Letter to Future Self" card — writing area expands inline
- Write text, add a photo, paste a music link, draw a doodle
- Click "Ready to send" — verify send drawer opens with date picker
- Set a short unlock date (tomorrow for self)
- Send — verify envelope animation plays
- After animation: verify the letter appears in "Letters to Myself" section as locked

**Step 4: Test letter to friend**

- Click "Letter to a Friend" card — writing area expands
- Write text, add all media
- Fill in friend details in send drawer
- Send — verify it saves

**Step 5: Test cron delivery (manual trigger)**

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3111/api/cron/deliver-letters
```

Check that:
- Self-letter email arrives with full content (text, photos, doodle, music link)
- Friend letter email arrives with full content
- If recipient email matches a Hearth user, a received letter entry is created

**Step 6: Test letter reading**

- Verify arrived self-letters open in postcard modal with all media
- Verify photos display as polaroids
- Verify doodle displays inline
- Verify music link shows as embed/link

**Step 7: Verify archive sections**

- "Letters to Myself" shows correct counts and states
- "Letters to Friends" shows locked cards with recipient names
- "Received Letters" shows any friend letters from Hearth users

**Step 8: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address integration test feedback"
```

---

## Summary of Files Modified/Created

| File | Action | Description |
|---|---|---|
| `prisma/schema.prisma` | Modify | Add 3 fields: `isReceivedLetter`, `originalSenderId`, `originalEntryId` |
| `package.json` | Modify | Add `sharp` dependency |
| `src/lib/doodle-to-image.ts` | **Create** | Server-side doodle → SVG → PNG conversion |
| `src/lib/email.ts` | Modify | Rich media in both email templates, new `sendSelfLetterEmail` |
| `src/app/api/letters/mine/route.ts` | Modify | Include media, exclude received letters |
| `src/app/api/letters/arrived/route.ts` | Modify | Include media in response |
| `src/app/api/letters/received/route.ts` | **Create** | New endpoint for received letters |
| `src/app/api/cron/deliver-letters/route.ts` | Modify | Rich emails, doodle rendering, cross-user delivery |
| `src/app/letters/page.tsx` | Modify (major) | Full page rewrite: hero cards, inline media, archive sections |
| `src/components/LetterArrivedBanner.tsx` | Modify | Show media in letter reading modal |
