# Scrapboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `/scrapbook` from a single ephemeral canvas into a persistent collection of free-form scrapboards, with new item types (clip, mood, stamp, date), per-type attachment styles, and a kraft scrapbook-page surface.

**Architecture:** New `Scrapbook` Prisma model with an encrypted JSON `items` blob (matches the journal entry encryption pattern). REST routes under `/api/scrapbooks/`. The `/scrapbook` route becomes a grid of boards; `/scrapbook/[id]` is a per-board canvas with debounced autosave. Existing canvas wrapper, drag/resize/rotate, and existing item components (text/sticker/photo/song/doodle) are reused — no rewrite. New item types are added as additional `ScrapbookItem` variants. Attachment styles (pin/tape/grommets/corners/clip) are pure rendering, derived from item type at render time.

**Tech Stack:** Next.js 16 App Router, React 19, Prisma + PostgreSQL, Framer Motion v12, AES-256-GCM encryption (`src/lib/encryption.ts`).

**Naming note:** Spec uses "scrapboard"; the existing codebase consistently uses "scrapbook". This plan uses **scrapbook** in code (model = `Scrapbook`, route = `/api/scrapbooks/[id]`, types = `ScrapbookItem`) to match the rest of the codebase. The branch name and spec filename keep "scrapboard" — no impact on code.

**Verification model:** This codebase has no test runner. Each task ends with `npm run lint`, `npx tsc --noEmit`, and (where the task touches the UI or DB) explicit manual verification steps. Treat lint + typecheck as the equivalent of "tests pass."

---

## File map

**Create**
- `src/app/api/scrapbooks/route.ts`
- `src/app/api/scrapbooks/[id]/route.ts`
- `src/app/scrapbook/[id]/page.tsx`
- `src/components/scrapbook/PageSurface.tsx`
- `src/components/scrapbook/Attachments.tsx`
- `src/components/scrapbook/ScrapbookGrid.tsx`
- `src/components/scrapbook/ScrapbookTile.tsx`
- `src/components/scrapbook/items/DateItem.tsx`
- `src/components/scrapbook/items/ClipItem.tsx`
- `src/components/scrapbook/items/MoodItem.tsx`
- `src/components/scrapbook/items/StampItem.tsx`
- `src/hooks/useAutosaveScrapbook.ts`

**Modify**
- `prisma/schema.prisma`
- `src/lib/scrapbook.ts`
- `src/components/scrapbook/ScrapbookCanvas.tsx`
- `src/components/scrapbook/CanvasItemWrapper.tsx`
- `src/components/scrapbook/CanvasToolbar.tsx`
- `src/components/scrapbook/items/PhotoItem.tsx` (compression)
- `src/app/scrapbook/page.tsx`

---

## Task 1: Add `Scrapbook` Prisma model + migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add the model and the back-relation.**

In `prisma/schema.prisma`, add a `scrapbooks` field to the existing `User` model (after `entries`):

```prisma
model User {
  // ... existing fields above ...
  entries     JournalEntry[]
  scrapbooks  Scrapbook[]   // NEW
  // ... existing fields below ...
}
```

Append a new model at the bottom of the file (before any closing markers):

```prisma
model Scrapbook {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     String?  // encrypted (AES-256-GCM, ciphertext format from src/lib/encryption.ts)
  items     String   @db.Text // encrypted JSON blob (ScrapbookItem[])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId, updatedAt(sort: Desc)])
  @@map("scrapbooks")
}
```

- [ ] **Step 2: Generate the Prisma client and create the migration.**

Run (from worktree root):

```bash
docker compose exec app npx prisma migrate dev --name add_scrapbook_model
```

If Docker isn't running locally for the worktree, fall back to:

```bash
DATABASE_URL=$(grep '^DATABASE_URL' .env | cut -d= -f2-) npx prisma migrate dev --name add_scrapbook_model
```

Expected: a new file `prisma/migrations/<timestamp>_add_scrapbook_model/migration.sql` with `CREATE TABLE "scrapbooks"` and an `ALTER TABLE` that does **not** drop or modify any existing column. **Verify by reading the generated SQL — if it mentions `DROP COLUMN` or `ALTER COLUMN ... DROP NOT NULL` on existing tables, abort and inspect.**

- [ ] **Step 3: Verify lint + typecheck.**

```bash
npm run lint
npx tsc --noEmit
```

Both must succeed.

- [ ] **Step 4: Commit.**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(scrapbook): add Scrapbook model + migration"
```

---

## Task 2: API list + create routes

**Files:**
- Create: `src/app/api/scrapbooks/route.ts`

- [ ] **Step 1: Write the route file.**

```ts
// src/app/api/scrapbooks/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { encryptJson, decryptJson, safeDecrypt } from '@/lib/encryption'
import type { ScrapbookItem } from '@/lib/scrapbook'
import { makeDateItem } from '@/lib/scrapbook'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await prisma.scrapbook.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, title: true, items: true, createdAt: true, updatedAt: true },
  })

  const list = rows.map((row) => {
    const items = decryptJson<ScrapbookItem[]>(row.items) ?? []
    return {
      id: row.id,
      title: row.title ? safeDecrypt(row.title) : null,
      itemCount: items.length,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  })

  return NextResponse.json(list)
}

export async function POST(_req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const initialItems: ScrapbookItem[] = [makeDateItem(new Date(), [])]

  const created = await prisma.scrapbook.create({
    data: {
      userId: user.id,
      title: null,
      items: encryptJson(initialItems),
    },
  })

  return NextResponse.json({
    id: created.id,
    title: null,
    items: initialItems,
    createdAt: created.createdAt,
    updatedAt: created.updatedAt,
  })
}
```

> **Note:** `makeDateItem` is created in Task 4. This file will fail to typecheck until Task 4 ships — we accept the temporary break and verify after Task 4.

- [ ] **Step 2: Skip lint/typecheck for now.**

This file imports `makeDateItem` which doesn't exist yet. Lint will fail; we'll re-run after Task 4.

- [ ] **Step 3: Commit.**

```bash
git add src/app/api/scrapbooks/route.ts
git commit -m "feat(scrapbook): add list + create API routes (depends on Task 4)"
```

---

## Task 3: API get/put/delete by id

**Files:**
- Create: `src/app/api/scrapbooks/[id]/route.ts`

- [ ] **Step 1: Write the route file.**

```ts
// src/app/api/scrapbooks/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { encrypt, encryptJson, decryptJson, safeDecrypt } from '@/lib/encryption'
import type { ScrapbookItem } from '@/lib/scrapbook'

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const row = await prisma.scrapbook.findFirst({
    where: { id, userId: user.id },
  })
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const items = decryptJson<ScrapbookItem[]>(row.items) ?? []
  return NextResponse.json({
    id: row.id,
    title: row.title ? safeDecrypt(row.title) : null,
    items,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  })
}

export async function PUT(req: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const body = (await req.json()) as { title?: string | null; items?: ScrapbookItem[] }

  const data: { title?: string | null; items?: string } = {}
  if (body.title !== undefined) {
    data.title = body.title ? encrypt(body.title) : null
  }
  if (body.items !== undefined) {
    data.items = encryptJson(body.items)
  }

  const updated = await prisma.scrapbook.updateMany({
    where: { id, userId: user.id },
    data,
  })
  if (updated.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const deleted = await prisma.scrapbook.deleteMany({
    where: { id, userId: user.id },
  })
  if (deleted.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Skip verification.** Same dependency on Task 4 types.

- [ ] **Step 3: Commit.**

```bash
git add src/app/api/scrapbooks/[id]/route.ts
git commit -m "feat(scrapbook): add per-board API routes (get/put/delete)"
```

---

## Task 4: Extend item types + factories

**Files:**
- Modify: `src/lib/scrapbook.ts`

- [ ] **Step 1: Extend the item-type union.**

Find the existing `ScrapbookItemType` declaration and replace with:

```ts
export type ScrapbookItemType =
  | 'text' | 'sticker' | 'photo' | 'song' | 'doodle'
  | 'clip' | 'mood' | 'stamp' | 'date'
```

- [ ] **Step 2: Add the four new item interfaces.**

After `DoodleItemData`:

```ts
export type ClipVariant = 'index-card' | 'ticket-stub' | 'receipt'

export interface ClipItemData extends BaseItem {
  type: 'clip'
  variant: ClipVariant
  lines: string[] // e.g. ['L TRAIN · 04·28·26', 'Bedford → 1st']
}

export interface MoodItemData extends BaseItem {
  type: 'mood'
  level: 0 | 1 | 2 | 3 | 4
}

export interface StampItemData extends BaseItem {
  type: 'stamp'
  topLine: string
  midLine: string
  bottomLine: string
  ink: 'red' | 'blue' | 'black'
}

export interface DateItemData extends BaseItem {
  type: 'date'
  isoDate: string         // 'YYYY-MM-DD'
  displayText?: string    // user override; falls back to formatted isoDate
}
```

- [ ] **Step 3: Update the `ScrapbookItem` union.**

Replace:

```ts
export type ScrapbookItem =
  | TextItemData
  | StickerItemData
  | PhotoItemData
  | SongItemData
  | DoodleItemData
  | ClipItemData
  | MoodItemData
  | StampItemData
  | DateItemData
```

- [ ] **Step 4: Update `isEditableType` and `minSizeFor`.**

Replace `isEditableType`:

```ts
export function isEditableType(type: ScrapbookItemType): boolean {
  return (
    type === 'text' ||
    type === 'photo' ||
    type === 'song' ||
    type === 'doodle' ||
    type === 'clip' ||
    type === 'stamp' ||
    type === 'date'
  )
}
```

Extend `minSizeFor`:

```ts
export function minSizeFor(type: ScrapbookItemType): { w: number; h: number } {
  switch (type) {
    case 'sticker': return { w: 4, h: 4 }
    case 'text':    return { w: 12, h: 4 }
    case 'photo':   return { w: 12, h: 12 }
    case 'song':    return { w: 22, h: 6 }
    case 'doodle':  return { w: 12, h: 12 }
    case 'clip':    return { w: 16, h: 6 }
    case 'mood':    return { w: 6, h: 6 }
    case 'stamp':   return { w: 10, h: 10 }
    case 'date':    return { w: 14, h: 4 }
  }
}
```

- [ ] **Step 5: Add the four new factories.**

Append before the existing `paperForTheme` function:

```ts
export function makeClipItem(
  variant: ClipVariant,
  lines: string[],
  items: ScrapbookItem[],
): ClipItemData {
  const sizeByVariant: Record<ClipVariant, { width: number; height: number }> = {
    'index-card': { width: 26, height: 14 },
    'ticket-stub': { width: 24, height: 8 },
    'receipt': { width: 16, height: 14 },
  }
  const { width, height } = sizeByVariant[variant]
  return {
    id: makeId(),
    type: 'clip',
    x: 35,
    y: 50,
    width,
    height,
    rotation: randomTilt(),
    z: nextZ(items),
    variant,
    lines,
  }
}

export function makeMoodItem(level: 0 | 1 | 2 | 3 | 4, items: ScrapbookItem[]): MoodItemData {
  return {
    id: makeId(),
    type: 'mood',
    x: 50,
    y: 55,
    width: 8,
    height: 8,
    rotation: randomTilt(),
    z: nextZ(items),
    level,
  }
}

export function makeStampItem(
  topLine: string,
  midLine: string,
  bottomLine: string,
  items: ScrapbookItem[],
): StampItemData {
  return {
    id: makeId(),
    type: 'stamp',
    x: 70,
    y: 30,
    width: 14,
    height: 14,
    rotation: randomTilt() * 1.5,
    z: nextZ(items),
    topLine,
    midLine,
    bottomLine,
    ink: 'red',
  }
}

export function makeDateItem(date: Date, items: ScrapbookItem[]): DateItemData {
  const iso = date.toISOString().slice(0, 10)
  return {
    id: makeId(),
    type: 'date',
    x: 42,
    y: 6,
    width: 18,
    height: 5,
    rotation: 0,
    z: nextZ(items),
    isoDate: iso,
  }
}

// Default mood color palette — reused by MoodItem and any other surface
// that wants to render the 0-4 mood scale.
export const MOOD_COLORS: Record<number, string> = {
  0: '#5b6b7a', // Heavy — slate
  1: '#5e80a8', // Low — blue
  2: '#c97da3', // Tender — pink
  3: '#d39a4f', // Warm — amber
  4: '#d3a84f', // Radiant — gold
}
```

- [ ] **Step 6: Add render-time attachment helper.**

After `MOOD_COLORS`:

```ts
export type AttachmentKind =
  | 'pin'           // push-pin top-center
  | 'tape'          // washi tape top edge
  | 'corners'       // photo corners (four corners)
  | 'grommets'      // two grommets on left edge
  | 'paper-clip'    // tiny clip top-left
  | 'none'          // no attachment

export function attachmentForItem(item: ScrapbookItem): AttachmentKind {
  switch (item.type) {
    case 'text':    return 'pin'
    case 'photo':   return hashId(item.id) % 2 === 0 ? 'tape' : 'pin'
    case 'song':    return 'tape'
    case 'doodle':  return 'corners'
    case 'sticker': return 'none'
    case 'mood':    return 'none'
    case 'stamp':   return 'none'
    case 'date':    return 'pin'
    case 'clip':
      if (item.variant === 'ticket-stub') return 'grommets'
      if (item.variant === 'receipt')     return 'paper-clip'
      return 'pin'
  }
}

function hashId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0
  return Math.abs(h)
}
```

- [ ] **Step 7: Verify lint + typecheck (Tasks 2 & 3 should now compile).**

```bash
npm run lint
npx tsc --noEmit
```

Both must succeed.

- [ ] **Step 8: Commit.**

```bash
git add src/lib/scrapbook.ts
git commit -m "feat(scrapbook): add clip/mood/stamp/date item types + factories"
```

---

## Task 5: Page surface (kraft scrapbook page)

**Files:**
- Create: `src/components/scrapbook/PageSurface.tsx`

- [ ] **Step 1: Write the surface component.**

```tsx
// src/components/scrapbook/PageSurface.tsx
'use client'

import React from 'react'

interface Props {
  children: React.ReactNode
}

/**
 * Kraft scrapbook page — replaces the corkboard / cream-paper surface from v0.
 * Theme-tinted variants are deferred to v2.
 */
export default function PageSurface({ children }: Props) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: '#e8d8b0',
        backgroundImage: [
          // soft warm shading — gives the page a slight bowl / depth feel
          'radial-gradient(circle at 18% 22%, rgba(255, 240, 200, 0.45) 0%, transparent 55%)',
          'radial-gradient(circle at 82% 78%, rgba(120, 80, 30, 0.10) 0%, transparent 55%)',
          // micro-grain dots — paper fibers
          'radial-gradient(circle at 35% 60%, rgba(120, 80, 30, 0.06) 0%, transparent 6%)',
          'radial-gradient(circle at 70% 30%, rgba(120, 80, 30, 0.05) 0%, transparent 4%)',
        ].join(', '),
        boxShadow: [
          '0 14px 40px rgba(0,0,0,0.40)',
          '0 2px 6px rgba(0,0,0,0.22)',
          'inset 0 0 0 1px rgba(255, 255, 255, 0.35)',
          'inset 0 0 60px rgba(120, 80, 30, 0.10)',
        ].join(', '),
        borderRadius: 4,
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Verify.**

```bash
npm run lint
npx tsc --noEmit
```

- [ ] **Step 3: Commit.**

```bash
git add src/components/scrapbook/PageSurface.tsx
git commit -m "feat(scrapbook): add kraft PageSurface component"
```

---

## Task 6: Attachment overlays + wire into wrapper

**Files:**
- Create: `src/components/scrapbook/Attachments.tsx`
- Modify: `src/components/scrapbook/CanvasItemWrapper.tsx`

- [ ] **Step 1: Write `Attachments.tsx`.**

```tsx
// src/components/scrapbook/Attachments.tsx
'use client'

import React from 'react'
import { AttachmentKind, ScrapbookItem, attachmentForItem } from '@/lib/scrapbook'

const PIN_COLORS = ['#a3413a', '#3a5a8a', '#3a8a4a', '#8a6a3a']

interface Props {
  item: ScrapbookItem
}

export default function Attachments({ item }: Props) {
  const kind: AttachmentKind = attachmentForItem(item)
  const color = PIN_COLORS[Math.abs(simpleHash(item.id)) % PIN_COLORS.length]

  if (kind === 'pin') return <Pin color={color} />
  if (kind === 'tape') return <Tape />
  if (kind === 'corners') return <Corners />
  if (kind === 'grommets') return <Grommets />
  if (kind === 'paper-clip') return <PaperClip />
  return null
}

function Pin({ color }: { color: string }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: '50%',
        top: -7,
        width: 14,
        height: 14,
        transform: 'translateX(-50%)',
        background: `radial-gradient(circle at 35% 30%, #fff 0%, ${color} 35%, #2a1a14 100%)`,
        borderRadius: '50%',
        boxShadow: '0 2px 4px rgba(0,0,0,0.35)',
        zIndex: 10,
      }}
    />
  )
}

function Tape() {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: '50%',
        top: -10,
        width: '40%',
        height: 20,
        transform: 'translateX(-50%) rotate(-2deg)',
        background: 'rgba(245, 230, 180, 0.78)',
        borderLeft: '1px dashed rgba(120, 80, 30, 0.18)',
        borderRight: '1px dashed rgba(120, 80, 30, 0.18)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
        zIndex: 10,
      }}
    />
  )
}

function Corners() {
  const corner = (style: React.CSSProperties) => (
    <div
      className="absolute pointer-events-none"
      style={{
        width: 14,
        height: 14,
        background: 'rgba(58, 52, 41, 0.35)',
        clipPath: 'polygon(0 0, 100% 0, 100% 100%)',
        zIndex: 10,
        ...style,
      }}
    />
  )
  return (
    <>
      {corner({ top: -2, left: -2, transform: 'rotate(0deg)' })}
      {corner({ top: -2, right: -2, transform: 'rotate(90deg)' })}
      {corner({ bottom: -2, right: -2, transform: 'rotate(180deg)' })}
      {corner({ bottom: -2, left: -2, transform: 'rotate(270deg)' })}
    </>
  )
}

function Grommets() {
  return (
    <>
      {[20, 80].map((top) => (
        <div
          key={top}
          className="absolute pointer-events-none"
          style={{
            left: 6,
            top: `${top}%`,
            width: 10,
            height: 10,
            background: '#2a1a14',
            borderRadius: '50%',
            boxShadow: 'inset 0 0 0 2px rgba(245, 230, 180, 0.55)',
            zIndex: 10,
          }}
        />
      ))}
    </>
  )
}

function PaperClip() {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        top: -8,
        left: 8,
        width: 14,
        height: 22,
        border: '2px solid #6b6e74',
        borderRadius: '6px 6px 0 0',
        borderBottom: 'none',
        zIndex: 10,
      }}
    />
  )
}

function simpleHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return h
}
```

- [ ] **Step 2: Wire `Attachments` into `CanvasItemWrapper`.**

Open `src/components/scrapbook/CanvasItemWrapper.tsx`. At the top of the imports list (after the existing `import {...} from '@/lib/scrapbook'` block), add:

```tsx
import Attachments from './Attachments'
```

Inside the returned JSX, insert `<Attachments item={item} />` immediately after the closing `</div>` of the body wrapper, **before** the outer container's closing `</div>`. Specifically, place it as a sibling of the body div (the one that wraps `{children}`), nested inside the outer absolute container so it inherits transforms.

Find the line that opens the body:

```tsx
{/* body — drags by hold-and-move, taps to enter edit (if editable) */}
<div
  onPointerDown={onBodyPointerDown}
```

…and immediately before it (between the delete button block `)}` and the body comment) insert:

```tsx
{/* attachment overlay — pin / tape / corners / grommets / clip */}
<Attachments item={item} />
```

- [ ] **Step 3: Verify.**

```bash
npm run lint
npx tsc --noEmit
```

- [ ] **Step 4: Commit.**

```bash
git add src/components/scrapbook/Attachments.tsx src/components/scrapbook/CanvasItemWrapper.tsx
git commit -m "feat(scrapbook): per-type attachment overlays (pin/tape/corners/grommets/clip)"
```

---

## Task 7: `DateItem` component

**Files:**
- Create: `src/components/scrapbook/items/DateItem.tsx`

- [ ] **Step 1: Write the component.**

```tsx
// src/components/scrapbook/items/DateItem.tsx
'use client'

import React, { useEffect, useRef } from 'react'
import { DateItemData } from '@/lib/scrapbook'

interface Props {
  item: DateItemData
  isEditing: boolean
  onChange: (next: DateItemData) => void
}

function formatDisplay(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00')
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).toLowerCase()
}

export default function DateItem({ item, isEditing, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const text = item.displayText ?? formatDisplay(item.isoDate)

  useEffect(() => {
    if (ref.current && ref.current.innerText !== text) {
      ref.current.innerText = text
    }
  }, [text])

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{
        background: '#fefdf8',
        border: '1px solid rgba(58, 52, 41, 0.18)',
        boxShadow: '0 2px 5px rgba(0,0,0,0.10)',
        borderRadius: 6,
        padding: '4px 14px',
      }}
    >
      <div
        ref={ref}
        contentEditable={isEditing}
        suppressContentEditableWarning
        onInput={(e) =>
          onChange({ ...item, displayText: (e.currentTarget as HTMLDivElement).innerText })
        }
        onPointerDown={(e) => { if (isEditing) e.stopPropagation() }}
        spellCheck={false}
        style={{
          fontFamily: 'var(--font-playfair), serif',
          fontStyle: 'italic',
          fontSize: 'min(2.6vw, 19px)',
          color: '#a3413a',
          letterSpacing: 0.3,
          outline: 'none',
          minWidth: 60,
          textAlign: 'center',
        }}
      >
        {text}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify.**

```bash
npm run lint
npx tsc --noEmit
```

- [ ] **Step 3: Commit.**

```bash
git add src/components/scrapbook/items/DateItem.tsx
git commit -m "feat(scrapbook): add DateItem (date pill, editable)"
```

---

## Task 8: `ClipItem` component (3 variants)

**Files:**
- Create: `src/components/scrapbook/items/ClipItem.tsx`

- [ ] **Step 1: Write the component.**

```tsx
// src/components/scrapbook/items/ClipItem.tsx
'use client'

import React, { useEffect, useRef } from 'react'
import { ClipItemData } from '@/lib/scrapbook'

interface Props {
  item: ClipItemData
  isEditing: boolean
  onChange: (next: ClipItemData) => void
}

export default function ClipItem({ item, isEditing, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const display = item.lines.join('\n')

  useEffect(() => {
    if (ref.current && ref.current.innerText !== display) {
      ref.current.innerText = display
    }
  }, [display])

  function handleInput(e: React.FormEvent<HTMLDivElement>) {
    const text = (e.currentTarget as HTMLDivElement).innerText
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
    onChange({ ...item, lines })
  }

  if (item.variant === 'ticket-stub') {
    return (
      <Surface
        background="#f5e7c4"
        ruled={false}
        leftPad={28}
      >
        <Editable
          refEl={ref}
          isEditing={isEditing}
          onInput={handleInput}
          fontFamily="ui-monospace, SFMono-Regular, monospace"
          fontSize={12}
          letterSpacing={1}
          textTransform="uppercase"
          color="#3a3429"
          text={display}
        />
      </Surface>
    )
  }

  if (item.variant === 'receipt') {
    return (
      <Surface background="#fdfcf6" ruled={false} leftPad={20}>
        <Editable
          refEl={ref}
          isEditing={isEditing}
          onInput={handleInput}
          fontFamily="ui-monospace, SFMono-Regular, monospace"
          fontSize={11}
          letterSpacing={0.4}
          color="#2a2a2a"
          text={display}
        />
      </Surface>
    )
  }

  // index-card (default)
  return (
    <Surface background="#fefdf8" ruled={true}>
      <Editable
        refEl={ref}
        isEditing={isEditing}
        onInput={handleInput}
        fontFamily="var(--font-caveat), cursive"
        fontSize={18}
        color="#3a3429"
        text={display}
      />
    </Surface>
  )
}

function Surface({
  children,
  background,
  ruled,
  leftPad = 14,
}: {
  children: React.ReactNode
  background: string
  ruled: boolean
  leftPad?: number
}) {
  return (
    <div
      className="w-full h-full"
      style={{
        background,
        backgroundImage: ruled
          ? 'repeating-linear-gradient(0deg, transparent 0 22px, rgba(58,52,41,0.10) 22px 23px)'
          : undefined,
        boxShadow: '0 2px 5px rgba(0,0,0,0.12)',
        borderRadius: 2,
        padding: `8px 12px 8px ${leftPad}px`,
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  )
}

function Editable({
  refEl,
  isEditing,
  onInput,
  fontFamily,
  fontSize,
  letterSpacing,
  textTransform,
  color,
  text,
}: {
  refEl: React.RefObject<HTMLDivElement | null>
  isEditing: boolean
  onInput: (e: React.FormEvent<HTMLDivElement>) => void
  fontFamily: string
  fontSize: number
  letterSpacing?: number
  textTransform?: 'uppercase' | 'none'
  color: string
  text: string
}) {
  return (
    <div
      ref={refEl}
      contentEditable={isEditing}
      suppressContentEditableWarning
      onInput={onInput}
      onPointerDown={(e) => { if (isEditing) e.stopPropagation() }}
      spellCheck={false}
      style={{
        fontFamily,
        fontSize,
        letterSpacing,
        textTransform,
        color,
        outline: 'none',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {text}
    </div>
  )
}
```

- [ ] **Step 2: Verify.**

```bash
npm run lint
npx tsc --noEmit
```

- [ ] **Step 3: Commit.**

```bash
git add src/components/scrapbook/items/ClipItem.tsx
git commit -m "feat(scrapbook): add ClipItem (index-card / ticket-stub / receipt)"
```

---

## Task 9: `MoodItem` component (wax seal)

**Files:**
- Create: `src/components/scrapbook/items/MoodItem.tsx`

- [ ] **Step 1: Write the component.**

```tsx
// src/components/scrapbook/items/MoodItem.tsx
'use client'

import React from 'react'
import { MoodItemData, MOOD_COLORS } from '@/lib/scrapbook'

const MOOD_LABELS = ['heavy', 'low', 'tender', 'warm', 'radiant']

interface Props {
  item: MoodItemData
  onChange: (next: MoodItemData) => void
}

export default function MoodItem({ item, onChange }: Props) {
  const color = MOOD_COLORS[item.level]
  const label = MOOD_LABELS[item.level]

  function cycle() {
    const next = ((item.level + 1) % 5) as 0 | 1 | 2 | 3 | 4
    onChange({ ...item, level: next })
  }

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      onClick={(e) => { e.stopPropagation(); cycle() }}
      style={{
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          width: '90%',
          height: '90%',
          borderRadius: '50%',
          background: `radial-gradient(circle at 30% 30%, ${lighten(color)} 0%, ${color} 50%, ${darken(color)} 100%)`,
          boxShadow: '0 2px 4px rgba(0,0,0,0.30), inset 0 -2px 4px rgba(0,0,0,0.20)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.92)',
          fontFamily: 'var(--font-playfair), serif',
          fontStyle: 'italic',
          fontSize: 'min(1.4vw, 11px)',
          letterSpacing: 0.4,
          textShadow: '0 1px 1px rgba(0,0,0,0.35)',
        }}
      >
        {label}
      </div>
    </div>
  )
}

function lighten(hex: string): string {
  return shade(hex, 30)
}

function darken(hex: string): string {
  return shade(hex, -30)
}

function shade(hex: string, amount: number): string {
  const m = hex.match(/^#([0-9a-f]{6})$/i)
  if (!m) return hex
  const n = parseInt(m[1], 16)
  const r = Math.max(0, Math.min(255, ((n >> 16) & 0xff) + amount))
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amount))
  const b = Math.max(0, Math.min(255, (n & 0xff) + amount))
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}
```

- [ ] **Step 2: Verify.**

```bash
npm run lint
npx tsc --noEmit
```

- [ ] **Step 3: Commit.**

```bash
git add src/components/scrapbook/items/MoodItem.tsx
git commit -m "feat(scrapbook): add MoodItem (wax-seal mood)"
```

---

## Task 10: `StampItem` component (ink stamp)

**Files:**
- Create: `src/components/scrapbook/items/StampItem.tsx`

- [ ] **Step 1: Write the component.**

```tsx
// src/components/scrapbook/items/StampItem.tsx
'use client'

import React, { useEffect, useRef } from 'react'
import { StampItemData } from '@/lib/scrapbook'

interface Props {
  item: StampItemData
  isEditing: boolean
  onChange: (next: StampItemData) => void
}

const INK_COLORS: Record<StampItemData['ink'], string> = {
  red: '#a3413a',
  blue: '#3a5a8a',
  black: '#2a2a2a',
}

export default function StampItem({ item, isEditing, onChange }: Props) {
  const color = INK_COLORS[item.ink]

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{
        position: 'relative',
        color,
        opacity: 0.78,
        filter: 'contrast(1.05)',
      }}
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ overflow: 'visible' }}>
        <circle cx="50" cy="50" r="46" fill="none" stroke={color} strokeWidth="1.4" />
        <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="0.7" />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-playfair), serif',
          textTransform: 'uppercase',
          letterSpacing: 1.2,
          gap: 1,
        }}
      >
        <EditableLine
          text={item.topLine}
          isEditing={isEditing}
          onChange={(t) => onChange({ ...item, topLine: t })}
          color={color}
          fontSize="min(1.1vw, 9px)"
        />
        <EditableLine
          text={item.midLine}
          isEditing={isEditing}
          onChange={(t) => onChange({ ...item, midLine: t })}
          color={color}
          fontSize="min(1.6vw, 13px)"
          fontStyle="italic"
        />
        <EditableLine
          text={item.bottomLine}
          isEditing={isEditing}
          onChange={(t) => onChange({ ...item, bottomLine: t })}
          color={color}
          fontSize="min(1vw, 8px)"
        />
      </div>
    </div>
  )
}

function EditableLine({
  text,
  isEditing,
  onChange,
  color,
  fontSize,
  fontStyle,
}: {
  text: string
  isEditing: boolean
  onChange: (t: string) => void
  color: string
  fontSize: string
  fontStyle?: 'italic' | 'normal'
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (ref.current && ref.current.innerText !== text) {
      ref.current.innerText = text
    }
  }, [text])
  return (
    <div
      ref={ref}
      contentEditable={isEditing}
      suppressContentEditableWarning
      onInput={(e) => onChange((e.currentTarget as HTMLDivElement).innerText)}
      onPointerDown={(e) => { if (isEditing) e.stopPropagation() }}
      spellCheck={false}
      style={{
        color,
        fontSize,
        fontStyle,
        outline: 'none',
        textAlign: 'center',
        minHeight: 8,
        minWidth: 12,
      }}
    >
      {text}
    </div>
  )
}
```

- [ ] **Step 2: Verify.**

```bash
npm run lint
npx tsc --noEmit
```

- [ ] **Step 3: Commit.**

```bash
git add src/components/scrapbook/items/StampItem.tsx
git commit -m "feat(scrapbook): add StampItem (ink stamp)"
```

---

## Task 11: Toolbar additions (clip / mood / stamp / reset)

**Files:**
- Modify: `src/components/scrapbook/CanvasToolbar.tsx`

- [ ] **Step 1: Extend the props interface.**

Replace the `Props` interface in `CanvasToolbar.tsx`:

```tsx
interface Props {
  onAddText: () => void
  onAddSticker: (stickerId: string) => void
  onAddPhoto: () => void
  onAddSong: (url: string) => void
  onAddDoodle: () => void
  onAddClip: (variant: 'index-card' | 'ticket-stub' | 'receipt') => void
  onAddMood: () => void
  onAddStamp: () => void
  onReset: () => void
}
```

Update the destructured params at the top of the component:

```tsx
export default function CanvasToolbar({
  onAddText,
  onAddSticker,
  onAddPhoto,
  onAddSong,
  onAddDoodle,
  onAddClip,
  onAddMood,
  onAddStamp,
  onReset,
}: Props) {
```

- [ ] **Step 2: Add a clip-variant dropdown state and UI block.**

Add new state vars near the top of the component, alongside the existing `stickerOpen` state:

```tsx
const [clipOpen, setClipOpen] = useState(false)
const clipWrapRef = useRef<HTMLDivElement>(null)
```

Extend the existing `useEffect` that closes dropdowns on outside click — add this branch inside `onDocClick`:

```tsx
if (clipWrapRef.current && !clipWrapRef.current.contains(e.target as Node)) {
  setClipOpen(false)
}
```

Inside the toolbar JSX, after the doodle button (`<ToolbarButton onClick={onAddDoodle} icon="✏" label="doodle" />`), append:

```tsx
<div className="relative" ref={clipWrapRef}>
  <ToolbarButton
    onClick={() => setClipOpen((o) => !o)}
    icon="✂"
    label="clip"
    active={clipOpen}
  />
  {clipOpen && (
    <div
      className="absolute left-1/2 -translate-x-1/2 mt-2 p-2 rounded-2xl flex flex-col gap-1"
      style={{
        top: '100%',
        background: '#fefaf0',
        border: '1px solid rgba(58, 52, 41, 0.18)',
        boxShadow: '0 8px 24px rgba(20, 14, 4, 0.22)',
        zIndex: 50,
        width: 160,
      }}
    >
      {(['index-card', 'ticket-stub', 'receipt'] as const).map((v) => (
        <button
          key={v}
          onClick={() => { onAddClip(v); setClipOpen(false) }}
          style={{
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid rgba(58, 52, 41, 0.18)',
            background: '#fefdf8',
            cursor: 'pointer',
            fontFamily: 'var(--font-caveat), cursive',
            fontSize: 16,
            color: '#3a3429',
            textAlign: 'left',
          }}
        >
          {v.replace('-', ' ')}
        </button>
      ))}
    </div>
  )}
</div>

<ToolbarButton onClick={onAddMood} icon="❤" label="mood" />
<ToolbarButton onClick={onAddStamp} icon="◉" label="stamp" />

<div style={{ width: 1, height: 22, background: 'rgba(58, 52, 41, 0.18)', margin: '0 4px' }} />

<ToolbarButton
  onClick={() => {
    if (window.confirm('Reset this scrapbook? All items will be removed.')) {
      onReset()
    }
  }}
  icon="↺"
  label="reset"
/>
```

- [ ] **Step 3: Verify.**

```bash
npm run lint
npx tsc --noEmit
```

(Lint will show that `ScrapbookCanvas.tsx` doesn't yet pass the new props — that's expected; Task 14 wires it up. Note any errors you see and continue.)

- [ ] **Step 4: Commit.**

```bash
git add src/components/scrapbook/CanvasToolbar.tsx
git commit -m "feat(scrapbook): toolbar adds for clip/mood/stamp + reset"
```

---

## Task 12: Photo compression in scrapbook upload path

**Files:**
- Modify: `src/components/scrapbook/ScrapbookCanvas.tsx`

- [ ] **Step 1: Add the compression helper inline.**

At the top of `ScrapbookCanvas.tsx`, after the imports, add:

```ts
const PHOTO_MAX_BYTES = 5 * 1024 * 1024
const PHOTO_MAX_WIDTH = 1600

async function compressPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()
    reader.onload = (e) => { img.src = e.target?.result as string }
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas context unavailable'))

      let width = img.width
      let height = img.height
      if (width > PHOTO_MAX_WIDTH) {
        height = Math.round((height * PHOTO_MAX_WIDTH) / width)
        width = PHOTO_MAX_WIDTH
      }
      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)

      let quality = 0.85
      let dataUrl = canvas.toDataURL('image/jpeg', quality)
      while (dataUrl.length > PHOTO_MAX_BYTES * 1.37 && quality > 0.3) {
        quality -= 0.1
        dataUrl = canvas.toDataURL('image/jpeg', quality)
      }
      resolve(dataUrl)
    }
    img.onerror = () => reject(new Error('Image load failed'))
    reader.onerror = () => reject(new Error('File read failed'))
    reader.readAsDataURL(file)
  })
}
```

- [ ] **Step 2: Replace the `onFilePicked` handler.**

Find:

```tsx
function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0]
  const targetId = uploadTargetId
  e.target.value = ''
  if (!file || !targetId) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    const result = ev.target?.result
    if (typeof result === 'string') fillPhoto(targetId, result)
  }
  reader.readAsDataURL(file)
  setUploadTargetId(null)
}
```

Replace with:

```tsx
async function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0]
  const targetId = uploadTargetId
  e.target.value = ''
  if (!file || !targetId) return
  try {
    const dataUrl = await compressPhoto(file)
    fillPhoto(targetId, dataUrl)
  } catch (err) {
    console.error('Failed to compress photo:', err)
  }
  setUploadTargetId(null)
}
```

- [ ] **Step 3: Verify.**

```bash
npm run lint
npx tsc --noEmit
```

- [ ] **Step 4: Commit.**

```bash
git add src/components/scrapbook/ScrapbookCanvas.tsx
git commit -m "feat(scrapbook): compress uploaded photos client-side (max 1600px JPEG q0.85)"
```

---

## Task 13: `useAutosaveScrapbook` hook

**Files:**
- Create: `src/hooks/useAutosaveScrapbook.ts`

- [ ] **Step 1: Write the hook.**

```ts
// src/hooks/useAutosaveScrapbook.ts
'use client'

import { useEffect, useRef, useState } from 'react'
import type { ScrapbookItem } from '@/lib/scrapbook'

const DEBOUNCE_MS = 1500
const RETRY_DELAY_MS = 2000

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface Options {
  boardId: string
}

interface UseAutosaveScrapbookResult {
  status: SaveStatus
  trigger: (items: ScrapbookItem[], title?: string | null) => void
  flush: () => Promise<void>
}

export function useAutosaveScrapbook({ boardId }: Options): UseAutosaveScrapbookResult {
  const [status, setStatus] = useState<SaveStatus>('idle')

  const draftRef = useRef<{ items: ScrapbookItem[]; title?: string | null } | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inFlightRef = useRef(false)
  const dirtyRef = useRef(false)

  async function performSave(retryCount = 0): Promise<void> {
    const draft = draftRef.current
    if (!draft) return
    if (inFlightRef.current) {
      dirtyRef.current = true
      return
    }
    inFlightRef.current = true
    setStatus('saving')
    try {
      const res = await fetch(`/api/scrapbooks/${boardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setStatus('saved')
      if (dirtyRef.current) {
        dirtyRef.current = false
        await performSave(0)
      }
    } catch (err) {
      console.error('Scrapbook autosave failed:', err)
      setStatus('error')
      if (retryCount < 2) {
        setTimeout(() => performSave(retryCount + 1), RETRY_DELAY_MS)
      }
    } finally {
      inFlightRef.current = false
    }
  }

  function trigger(items: ScrapbookItem[], title?: string | null) {
    draftRef.current = { items, title }
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      performSave()
    }, DEBOUNCE_MS)
  }

  async function flush() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    await performSave()
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return { status, trigger, flush }
}
```

- [ ] **Step 2: Verify.**

```bash
npm run lint
npx tsc --noEmit
```

- [ ] **Step 3: Commit.**

```bash
git add src/hooks/useAutosaveScrapbook.ts
git commit -m "feat(scrapbook): add useAutosaveScrapbook hook"
```

---

## Task 14: Per-board canvas route + render new items + autosave

**Files:**
- Modify: `src/components/scrapbook/ScrapbookCanvas.tsx`
- Create: `src/app/scrapbook/[id]/page.tsx`

### Part A: Refactor `ScrapbookCanvas.tsx` to accept board props

- [ ] **Step 1: Update the imports at the top of `ScrapbookCanvas.tsx`.**

Add to the existing `import { ... } from '@/lib/scrapbook'`:

```ts
import {
  ScrapbookItem,
  TextItemData,
  StickerItemData,
  PhotoItemData,
  SongItemData,
  DoodleItemData,
  ClipItemData,
  MoodItemData,
  StampItemData,
  DateItemData,
  makeStickerItem,
  makeTextItem,
  makePhotoItem,
  makeSongItem,
  makeDoodleItem,
  makeClipItem,
  makeMoodItem,
  makeStampItem,
  makeDateItem,
  ClipVariant,
} from '@/lib/scrapbook'
```

Add new component imports:

```tsx
import ClipItem from './items/ClipItem'
import MoodItem from './items/MoodItem'
import StampItem from './items/StampItem'
import DateItem from './items/DateItem'
import PageSurface from './PageSurface'
import { useAutosaveScrapbook } from '@/hooks/useAutosaveScrapbook'
```

- [ ] **Step 2: Add a `Props` interface and update the function signature.**

Replace `export default function ScrapbookCanvas() {` with:

```tsx
interface Props {
  boardId: string
  initialItems: ScrapbookItem[]
}

export default function ScrapbookCanvas({ boardId, initialItems }: Props) {
```

Replace `const [items, setItems] = useState<ScrapbookItem[]>([])` with:

```tsx
const [items, setItems] = useState<ScrapbookItem[]>(initialItems)
const { status: saveStatus, trigger: triggerSave, flush: flushSave } = useAutosaveScrapbook({ boardId })
```

- [ ] **Step 3: Wire autosave on every items change.**

Add this `useEffect` near the other effects at the top of the component body:

```tsx
useEffect(() => {
  triggerSave(items)
}, [items, triggerSave])

useEffect(() => {
  const onBeforeUnload = () => { flushSave() }
  window.addEventListener('beforeunload', onBeforeUnload)
  return () => window.removeEventListener('beforeunload', onBeforeUnload)
}, [flushSave])
```

- [ ] **Step 4: Add new item factory call sites.**

Add after the existing `addDoodle` function:

```tsx
function addClip(variant: ClipVariant) {
  const defaults: Record<ClipVariant, string[]> = {
    'index-card': ['a small note'],
    'ticket-stub': ['L TRAIN · 04·28·26', 'Bedford → 1st'],
    'receipt': ['café', '$ 4.50'],
  }
  const item = makeClipItem(variant, defaults[variant], items)
  setItems((prev) => [...prev, item])
  setSelectedId(item.id)
  setEditingId(item.id)
}

function addMood() {
  const item = makeMoodItem(2, items)
  setItems((prev) => [...prev, item])
  setSelectedId(item.id)
}

function addStamp() {
  const { themeName } = useThemeStore.getState()
  const today = new Date()
  const dateStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
  const item = makeStampItem(`apr · ${today.getDate()}`, themeName, dateStr, items)
  setItems((prev) => [...prev, item])
  setSelectedId(item.id)
  setEditingId(item.id)
}

function resetBoard() {
  setItems([])
  setSelectedId(null)
  setEditingId(null)
}
```

- [ ] **Step 5: Pass new toolbar props.**

Find the `<CanvasToolbar ... />` block and replace with:

```tsx
<CanvasToolbar
  onAddText={addText}
  onAddSticker={addSticker}
  onAddPhoto={addPhoto}
  onAddSong={addSong}
  onAddDoodle={addDoodle}
  onAddClip={addClip}
  onAddMood={addMood}
  onAddStamp={addStamp}
  onReset={resetBoard}
/>
```

- [ ] **Step 6: Render the new item types.**

Find the `{items.map((item) => { ... })}` block. Inside the `<CanvasItemWrapper>`, after the existing `{item.type === 'doodle' && ( ... )}` block, append:

```tsx
{item.type === 'clip' && (
  <ClipItem
    item={item as ClipItemData}
    isEditing={isItemEditing}
    onChange={updateItem}
  />
)}
{item.type === 'mood' && (
  <MoodItem item={item as MoodItemData} onChange={updateItem} />
)}
{item.type === 'stamp' && (
  <StampItem
    item={item as StampItemData}
    isEditing={isItemEditing}
    onChange={updateItem}
  />
)}
{item.type === 'date' && (
  <DateItem
    item={item as DateItemData}
    isEditing={isItemEditing}
    onChange={updateItem}
  />
)}
```

- [ ] **Step 7: Replace the inline page surface with `<PageSurface>`.**

Find the `<div ref={canvasRef} ... style={{ width: 'min(720px, ...)', ... background: paper.base, ... }}>` block. Wrap its contents in `<PageSurface>`. The simplest patch:

Replace:

```tsx
<div
  ref={canvasRef}
  onClick={deselectAll}
  className="relative"
  style={{
    width: 'min(720px, calc((100vh - 220px) * 0.8))',
    aspectRatio: '4 / 5',
    background: paper.base,
    backgroundImage: `radial-gradient(...)`,
    borderRadius: 4,
    boxShadow: '...',
    overflow: 'hidden',
    cursor: selectedId ? 'default' : 'auto',
  }}
>
  <div
    className="absolute pointer-events-none"
    style={{
      inset: 18,
      border: `1.5px dashed ${withAlpha(theme.accent.warm, 0.32)}`,
      borderRadius: 2,
    }}
  />
  <CornerTape position="tl" color={tapeLeft} />
  <CornerTape position="tr" color={tapeRight} />
  ...rest of children...
</div>
```

with:

```tsx
<div
  ref={canvasRef}
  onClick={deselectAll}
  className="relative"
  style={{
    width: 'min(720px, calc((100vh - 220px) * 0.8))',
    aspectRatio: '4 / 5',
    cursor: selectedId ? 'default' : 'auto',
  }}
>
  <PageSurface>
    {/* Keep existing inner dashed border + CornerTape decorations as-is */}
    <div
      className="absolute pointer-events-none"
      style={{
        inset: 18,
        border: `1.5px dashed ${withAlpha(theme.accent.warm, 0.32)}`,
        borderRadius: 2,
      }}
    />
    <CornerTape position="tl" color={tapeLeft} />
    <CornerTape position="tr" color={tapeRight} />
    ...rest of children unchanged...
  </PageSurface>
</div>
```

**Cleanup:** after the replace, `const paper = paperForTheme(themeName)` is no longer referenced (its `paper.base` and `paper.grain` are gone). Delete that line. Also remove `paperForTheme` from the imports of `@/lib/scrapbook` (the imports list earlier in this task) — it is no longer used by `ScrapbookCanvas.tsx`. `tapeLeft` and `tapeRight` are still used by the two `<CornerTape>` decorations.

- [ ] **Step 8: Optional save-status indicator (lightweight).**

Below the existing `<CanvasToolbar />` wrapper, add:

```tsx
<div
  style={{
    fontSize: 12,
    color: 'rgba(58, 52, 41, 0.55)',
    fontFamily: 'var(--font-caveat), cursive',
    marginTop: 4,
    minHeight: 16,
  }}
>
  {saveStatus === 'saving' && 'saving…'}
  {saveStatus === 'saved' && 'saved'}
  {saveStatus === 'error' && 'save error — retrying'}
</div>
```

### Part B: Create the per-board route

- [ ] **Step 9: Write `src/app/scrapbook/[id]/page.tsx`.**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ScrapbookCanvas from '@/components/scrapbook/ScrapbookCanvas'
import type { ScrapbookItem } from '@/lib/scrapbook'

interface BoardData {
  id: string
  title: string | null
  items: ScrapbookItem[]
}

export default function ScrapbookBoardPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [board, setBoard] = useState<BoardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/scrapbooks/${params.id}`)
      .then(async (res) => {
        if (res.status === 404) throw new Error('Board not found')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<BoardData>
      })
      .then((data) => { if (!cancelled) setBoard(data) })
      .catch((err) => { if (!cancelled) setError(err.message) })
    return () => { cancelled = true }
  }, [params.id])

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'rgba(58,52,41,0.7)' }}>
        <div style={{ fontFamily: 'var(--font-caveat), cursive', fontSize: 22 }}>
          couldn’t open this scrapbook
        </div>
        <div style={{ marginTop: 6, fontSize: 14 }}>{error}</div>
        <button
          onClick={() => router.push('/scrapbook')}
          style={{
            marginTop: 16,
            padding: '6px 14px',
            border: '1px solid rgba(58,52,41,0.22)',
            borderRadius: 999,
            background: '#fefdf8',
            cursor: 'pointer',
          }}
        >
          back to scrapbooks
        </button>
      </div>
    )
  }

  if (!board) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'rgba(58,52,41,0.55)' }}>
        opening…
      </div>
    )
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{ padding: '8px 24px' }}>
        <button
          onClick={() => router.push('/scrapbook')}
          style={{
            padding: '4px 12px',
            border: '1px solid rgba(58,52,41,0.22)',
            borderRadius: 999,
            background: '#fefdf8',
            cursor: 'pointer',
            fontFamily: 'var(--font-caveat), cursive',
            fontSize: 16,
            color: '#3a3429',
          }}
        >
          ← all scrapbooks
        </button>
      </div>
      <ScrapbookCanvas boardId={board.id} initialItems={board.items} />
    </div>
  )
}
```

- [ ] **Step 10: Verify.**

```bash
npm run lint
npx tsc --noEmit
```

- [ ] **Step 11: Commit.**

```bash
git add src/components/scrapbook/ScrapbookCanvas.tsx src/app/scrapbook/[id]/page.tsx
git commit -m "feat(scrapbook): per-board canvas route + autosave + new item rendering"
```

---

## Task 15: Grid index page + tile component

**Files:**
- Create: `src/components/scrapbook/ScrapbookGrid.tsx`
- Create: `src/components/scrapbook/ScrapbookTile.tsx`
- Modify: `src/app/scrapbook/page.tsx`

- [ ] **Step 1: Write `ScrapbookTile.tsx`.**

```tsx
// src/components/scrapbook/ScrapbookTile.tsx
'use client'

import React from 'react'

export interface ScrapbookSummary {
  id: string
  title: string | null
  itemCount: number
  createdAt: string
  updatedAt: string
}

interface Props {
  summary: ScrapbookSummary
  onOpen: () => void
  onDelete: () => void
}

export default function ScrapbookTile({ summary, onOpen, onDelete }: Props) {
  const dateLabel = new Date(summary.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <button
        onClick={onOpen}
        style={{
          aspectRatio: '4 / 5',
          background: '#e8d8b0',
          border: 'none',
          borderRadius: 4,
          boxShadow: '0 8px 22px rgba(20, 14, 4, 0.30), inset 0 0 0 1px rgba(255,255,255,0.35)',
          cursor: 'pointer',
          padding: 0,
          width: '100%',
          textAlign: 'left',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundImage: [
              'radial-gradient(circle at 18% 22%, rgba(255, 240, 200, 0.45) 0%, transparent 55%)',
              'radial-gradient(circle at 82% 78%, rgba(120, 80, 30, 0.10) 0%, transparent 55%)',
            ].join(', '),
            display: 'flex',
            alignItems: 'flex-end',
            padding: 16,
            color: 'rgba(58, 52, 41, 0.7)',
            fontFamily: 'var(--font-caveat), cursive',
            fontSize: 16,
          }}
        >
          {summary.itemCount} {summary.itemCount === 1 ? 'item' : 'items'}
        </div>
      </button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div
          style={{
            fontFamily: 'var(--font-playfair), serif',
            fontStyle: 'italic',
            fontSize: 16,
            color: '#3a3429',
          }}
        >
          {summary.title ?? dateLabel}
        </div>
        <button
          onClick={() => {
            if (window.confirm('Delete this scrapbook? This cannot be undone.')) onDelete()
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(58, 52, 41, 0.45)',
            fontSize: 14,
            cursor: 'pointer',
          }}
          title="Delete scrapbook"
        >
          ×
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write `ScrapbookGrid.tsx`.**

```tsx
// src/components/scrapbook/ScrapbookGrid.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ScrapbookTile, { ScrapbookSummary } from './ScrapbookTile'

export default function ScrapbookGrid() {
  const router = useRouter()
  const [boards, setBoards] = useState<ScrapbookSummary[] | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/scrapbooks')
      .then((r) => r.json())
      .then((list: ScrapbookSummary[]) => setBoards(list))
      .catch((err) => setError(String(err)))
  }, [])

  async function createBoard() {
    if (creating) return
    setCreating(true)
    try {
      const res = await fetch('/api/scrapbooks', { method: 'POST' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const created = await res.json()
      router.push(`/scrapbook/${created.id}`)
    } catch (err) {
      setError(String(err))
      setCreating(false)
    }
  }

  async function deleteBoard(id: string) {
    const res = await fetch(`/api/scrapbooks/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      setError(`Failed to delete (HTTP ${res.status})`)
      return
    }
    setBoards((prev) => (prev ? prev.filter((b) => b.id !== id) : prev))
  }

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '24px 32px 64px',
        fontFamily: 'var(--font-caveat), cursive',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-playfair), serif',
            fontStyle: 'italic',
            fontSize: 32,
            color: '#3a3429',
          }}
        >
          your scrapbooks
        </div>
        <button
          onClick={createBoard}
          disabled={creating}
          style={{
            padding: '8px 18px',
            borderRadius: 999,
            border: '1px solid rgba(58, 52, 41, 0.22)',
            background: '#3a3429',
            color: '#f4ecd8',
            cursor: creating ? 'wait' : 'pointer',
            fontFamily: 'var(--font-caveat), cursive',
            fontSize: 18,
          }}
        >
          + new scrapbook
        </button>
      </div>

      {error && (
        <div style={{ color: '#a3413a', marginBottom: 16, fontSize: 14 }}>{error}</div>
      )}

      {boards === null && (
        <div style={{ color: 'rgba(58,52,41,0.55)' }}>loading…</div>
      )}

      {boards !== null && boards.length === 0 && (
        <div
          style={{
            padding: 40,
            color: 'rgba(58,52,41,0.55)',
            textAlign: 'center',
            fontSize: 18,
          }}
        >
          no scrapbooks yet — start one with the button above.
        </div>
      )}

      {boards !== null && boards.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 24,
          }}
        >
          {boards.map((b) => (
            <ScrapbookTile
              key={b.id}
              summary={b}
              onOpen={() => router.push(`/scrapbook/${b.id}`)}
              onDelete={() => deleteBoard(b.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Replace `src/app/scrapbook/page.tsx`.**

Replace the entire file contents with:

```tsx
'use client'

import ScrapbookGrid from '@/components/scrapbook/ScrapbookGrid'

export default function ScrapbookPage() {
  return <ScrapbookGrid />
}
```

- [ ] **Step 4: Verify.**

```bash
npm run lint
npx tsc --noEmit
```

- [ ] **Step 5: Commit.**

```bash
git add src/components/scrapbook/ScrapbookGrid.tsx \
        src/components/scrapbook/ScrapbookTile.tsx \
        src/app/scrapbook/page.tsx
git commit -m "feat(scrapbook): grid index of all boards + new-board button"
```

---

## Task 16: Final build, manual smoke test, README note

**Files:**
- (no new files — verification + docs only)

- [ ] **Step 1: Run the production build.**

```bash
npm run build
```

Expected: build succeeds with no type errors. If it warns about route handlers, inspect — the build going green is the gate.

- [ ] **Step 2: Bring up Docker + run migration.**

```bash
docker compose up -d
docker compose exec app npx prisma migrate deploy
```

If running in a worktree without docker, the migration was already applied in Task 1. Skip.

- [ ] **Step 3: Manual smoke test.**

Open `http://localhost:3111/scrapbook`. Verify:

1. Empty state renders ("no scrapbooks yet").
2. Click "+ new scrapbook" → routes to `/scrapbook/<id>`. The kraft surface shows. A date pill is auto-placed near the top.
3. Add one of every item type via the toolbar: text, photo (upload + camera), song, sticker, doodle, clip (each variant), mood, stamp.
4. Drag, rotate, resize each. Confirm pin / tape / corners / grommets / paper-clip render where expected (per `attachmentForItem` mapping).
5. Edit text on the date pill, an index card, a stamp. Click the mood seal — it cycles 0 → 1 → 2 → 3 → 4 → 0.
6. Click reset — confirm dialog appears; accept → board clears.
7. Reload the page — items re-fetched from the server, all positions/rotations/sizes preserved.
8. Click "← all scrapbooks" — grid shows the board. Item count matches.
9. Create a second board. Verify both appear in the grid.
10. Delete a board via the × button — confirm dialog, board disappears from the grid.

If anything fails, file the failure as a follow-up — do not block the merge unless it's a regression of an existing v0 behavior.

- [ ] **Step 4: Update root README/CLAUDE if appropriate.**

If the worktree's `CLAUDE.md` describes scrapbook behavior that has changed, update it. As of this plan, `CLAUDE.md` does not mention scrapbook specifics, so this step is likely a no-op — confirm by:

```bash
grep -ni scrapbook CLAUDE.md
```

If it returns nothing, skip. If it returns lines describing the v0 ephemeral canvas, update them to reflect the persistent collection model.

- [ ] **Step 5: Commit any docs updates.**

```bash
git add CLAUDE.md  # only if changed
git commit -m "docs(scrapbook): note persistent collection model" || true
```

- [ ] **Step 6: Final lint pass.**

```bash
npm run lint
npx tsc --noEmit
```

Both must succeed.

---

## Self-review checklist (run before handoff)

- [ ] Every spec section has a corresponding task: data model → T1; APIs → T2/T3; item types → T4; surface → T5; attachments → T6; new item components → T7–T10; toolbar → T11; photo compression → T12; autosave → T13; per-board route → T14; grid → T15; smoke test → T16.
- [ ] No `TBD`, `TODO`, `implement later`, or vague "handle errors" placeholders.
- [ ] Type names match across tasks: `Scrapbook` model, `ScrapbookItem` union, `makeDateItem`/`makeClipItem`/`makeMoodItem`/`makeStampItem` factories, `attachmentForItem`, `useAutosaveScrapbook`, `ScrapbookGrid`, `ScrapbookTile`.
- [ ] Routes consistent: `/api/scrapbooks` (list, create), `/api/scrapbooks/[id]` (get, put, delete), `/scrapbook` (grid), `/scrapbook/[id]` (canvas).
- [ ] Encryption uses `encryptJson` / `decryptJson` (existing helpers), not bespoke wrappers.

---

## Execution

Plan complete and committed.
