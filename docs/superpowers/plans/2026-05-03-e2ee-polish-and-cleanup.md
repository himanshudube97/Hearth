# E2EE Polish + Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tighten the E2EE UX (auto-download keys on setup/rotation, retry UI for failed backfill items), close a real data-leak path (orphaned blobs from failed photo migrations), and remove the now-unused mood-picker plumbing across the codebase.

**Architecture:** Three independent subsystems, executable in any order. (1) Key download is a small client utility hooked into `SetupModal` and `RotateRecoveryKeyModal`. (2) Backfill retry UI is a panel on `/security` that reads `failedIds` from the existing E2EE store and re-runs them via `useBackfill`. (3) Orphaned-blob cleanup adds an `OrphanedBlob` table written by the backfill failure path and swept by an extension to the existing `deliver-letters` cron. (4) Mood removal touches schema + 20+ files; treat it as the heaviest task and stage commits carefully.

**Tech Stack:** Next.js 16, Prisma, vitest, Web Crypto API, existing `useBackfill` hook, existing E2EE Zustand store.

---

## File Structure

**Created:**
- `src/lib/e2ee/download-keys.ts` — `downloadKeysAsFiles({passphrase, recoveryKey})` browser helper
- `src/components/security/BackfillRetryPanel.tsx` — UI listing failed IDs, retry button
- `prisma/migrations/<timestamp>_add_orphaned_blob/migration.sql` — Prisma generates
- `src/app/api/cron/sweep-orphaned-blobs/route.ts` — cron sweep route

**Modified:**
- `src/components/e2ee/SetupModal.tsx` — auto-download keys on completion
- `src/components/e2ee/RotateRecoveryKeyModal.tsx` — auto-download new recovery key
- `src/components/e2ee/RecoveryModal.tsx` (if it triggers passphrase rotation) — auto-download new passphrase
- `src/app/security/page.tsx` — render `BackfillRetryPanel`
- `src/hooks/useBackfill.ts` — on failure, write to OrphanedBlob via `/api/orphaned-blobs`
- `src/app/api/orphaned-blobs/route.ts` (create) — POST endpoint to record an orphan
- `prisma/schema.prisma` — add `OrphanedBlob` model; remove `mood`/`avgMood`/related indexes
- 20+ files referencing `mood` (see Task 4 for the audit)

---

### Task 1: Auto-download key files on E2EE setup

**Files:**
- Create: `src/lib/e2ee/download-keys.ts`
- Modify: `src/components/e2ee/SetupModal.tsx`

- [ ] **Step 1: Write the helper**

Create `src/lib/e2ee/download-keys.ts`:

```typescript
function triggerDownload(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function todaySuffix(): string {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD
}

export function downloadDailyKeyFile(passphrase: string) {
  const body = `Your Hearth daily key
================================

${passphrase}

Keep this file safe. You'll be asked for this every time you unlock
your journal on a device that hasn't been "trusted."

If you lose this, your recovery key can rotate it.
Generated: ${new Date().toISOString()}
`
  triggerDownload(`hearth-daily-key-${todaySuffix()}.txt`, body)
}

export function downloadRecoveryKeyFile(recoveryKey: string) {
  const body = `Your Hearth recovery key
================================

${recoveryKey}

Keep this file in a safe place. You'll need it if you ever forget
your daily key.

Either key can rotate the other. If you regenerate one, regenerate
the other on the same device while you're still unlocked.
Generated: ${new Date().toISOString()}
`
  triggerDownload(`hearth-recovery-key-${todaySuffix()}.txt`, body)
}
```

- [ ] **Step 2: Hook into SetupModal**

Open `src/components/e2ee/SetupModal.tsx`. Find the final-step success handler (where the user clicks "Done" or "Confirm" after writing down the recovery key). Just before the `onClose()` or equivalent, call:

```typescript
import { downloadDailyKeyFile, downloadRecoveryKeyFile } from '@/lib/e2ee/download-keys'

// in the final confirm handler:
downloadDailyKeyFile(passphrase)
downloadRecoveryKeyFile(recoveryKey)
```

(The component already has both `passphrase` and `recoveryKey` in local state — use those.)

- [ ] **Step 3: Manual verification**

Enable E2EE end-to-end. Two `.txt` files should land in your Downloads folder, named with today's date.

- [ ] **Step 4: Commit**

```bash
git add src/lib/e2ee/download-keys.ts src/components/e2ee/SetupModal.tsx
git commit -m "feat(e2ee): auto-download daily + recovery key on setup"
```

---

### Task 2: Auto-download on key rotation

**Files:**
- Modify: `src/components/e2ee/RotateRecoveryKeyModal.tsx`

- [ ] **Step 1: Hook into rotation success**

Open `src/components/e2ee/RotateRecoveryKeyModal.tsx`. Find where it generates a new recovery key and calls the API to update the wrapping. After the API success, before closing the modal:

```typescript
import { downloadRecoveryKeyFile } from '@/lib/e2ee/download-keys'

// after successful rotation:
downloadRecoveryKeyFile(newRecoveryKey)
```

- [ ] **Step 2: Hook into passphrase rotation (if a separate modal exists)**

Search for passphrase rotation:

```bash
grep -rln "rotatePassphrase\|change.*passphrase\|new.*passphrase" src/components/e2ee/
```

If there's a `RotatePassphraseModal.tsx` (or similar), do the same: import `downloadDailyKeyFile`, call it on success with the new passphrase. If there's no separate modal yet, skip this step.

- [ ] **Step 3: Manual verification**

Rotate the recovery key from the security page. Confirm the new file lands in Downloads.

- [ ] **Step 4: Commit**

```bash
git add src/components/e2ee/RotateRecoveryKeyModal.tsx
git commit -m "feat(e2ee): auto-download recovery key on rotation"
```

---

### Task 3: Backfill retry UI

**Files:**
- Create: `src/components/security/BackfillRetryPanel.tsx`
- Modify: `src/app/security/page.tsx`

- [ ] **Step 1: Read useBackfill**

Open `src/hooks/useBackfill.ts`. Confirm it exposes a `retryFailedIds` (or similar) function. If it doesn't, add one:

```typescript
async function retryFailedIds() {
  const failedIds = useE2EEStore.getState().backfillProgress.failedIds
  if (failedIds.length === 0) return
  // Reset failedIds in the store, then run the backfill loop targeting these IDs.
  useE2EEStore.getState().setBackfillProgress({ failedIds: [] })
  // ...invoke the existing per-ID encrypt+upload path
}
```

(If the existing backfill loop is keyed by cursor-based fetching, adapt by adding an explicit-ID-list mode; otherwise create a small `retryEntryById(id)` function reusing the encrypt+upload helpers already inside `useBackfill`.)

- [ ] **Step 2: Write the panel**

Create `src/components/security/BackfillRetryPanel.tsx`:

```tsx
'use client'

import { useE2EEStore } from '@/store/e2ee'
import { useBackfill } from '@/hooks/useBackfill'

export function BackfillRetryPanel() {
  const failedIds = useE2EEStore(s => s.backfillProgress.failedIds)
  const status = useE2EEStore(s => s.backfillProgress.status)
  const { retryFailedIds } = useBackfill()

  if (failedIds.length === 0) return null

  return (
    <section className="border border-amber-300 bg-amber-50 rounded-xl p-5 my-6">
      <h3 className="text-lg font-serif text-amber-900 mb-2">
        {failedIds.length} entr{failedIds.length === 1 ? 'y' : 'ies'} failed to encrypt
      </h3>
      <p className="text-sm text-amber-800 mb-4">
        These were skipped during the encryption migration. They&apos;re still readable —
        they just stayed on server-side encryption instead of moving to E2EE.
      </p>
      <button
        onClick={retryFailedIds}
        disabled={status === 'running'}
        className="bg-amber-900 text-white rounded-full px-4 py-2 text-sm disabled:opacity-50"
      >
        {status === 'running' ? 'Retrying…' : `Retry ${failedIds.length} entr${failedIds.length === 1 ? 'y' : 'ies'}`}
      </button>
    </section>
  )
}
```

- [ ] **Step 3: Mount on the security page**

Open `src/app/security/page.tsx`. Add the import and render the panel near the top of the user-actions section:

```tsx
import { BackfillRetryPanel } from '@/components/security/BackfillRetryPanel'

// inside the page render, where other E2EE controls live:
<BackfillRetryPanel />
```

- [ ] **Step 4: Manual verification**

Force a failure: in dev mode, temporarily add `if (Math.random() < 0.5) throw new Error('test')` to the per-entry path of `useBackfill`. Trigger backfill. Confirm failed IDs land in the store. Visit `/security` — panel renders. Click "Retry" — failures get re-attempted (remove the test throw first).

- [ ] **Step 5: Commit**

```bash
git add src/components/security/BackfillRetryPanel.tsx src/app/security/page.tsx src/hooks/useBackfill.ts
git commit -m "feat(e2ee): backfill retry panel on /security"
```

---

### Task 4: Orphaned blob cleanup table + sweep

**Files:**
- Modify: `prisma/schema.prisma` (add `OrphanedBlob` model)
- Create: `src/app/api/orphaned-blobs/route.ts` (POST)
- Create: `src/app/api/cron/sweep-orphaned-blobs/route.ts`
- Modify: `src/hooks/useBackfill.ts` (record orphans on entry-update failure)

- [ ] **Step 1: Add the model**

Append to `prisma/schema.prisma`:

```prisma
model OrphanedBlob {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  handle     String   // storage handle (e.g., "userId/uuid.bin")
  bucket     String?  // null for local-postgres adapter, bucket name for supabase
  reason     String   // "backfill_failed", "entry_delete", etc.
  createdAt  DateTime @default(now())
  sweptAt    DateTime?

  @@index([sweptAt])
}
```

In `User`, add the back-relation:

```prisma
orphanedBlobs OrphanedBlob[]
```

- [ ] **Step 2: Generate migration**

```bash
docker compose exec app npx prisma migrate dev --name add_orphaned_blob
```

- [ ] **Step 3: POST endpoint to record orphans**

Create `src/app/api/orphaned-blobs/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { handle, bucket, reason } = await request.json()
  if (typeof handle !== 'string' || typeof reason !== 'string') {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  await prisma.orphanedBlob.create({
    data: { userId: user.id, handle, bucket: bucket ?? null, reason },
  })
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 4: Hook into backfill failure**

Open `src/hooks/useBackfill.ts`. Find the photo-migration block — after a successful `/api/photos` upload, the code calls `PUT /api/entries/[id]` to attach the new ref. If that PUT fails, the upload is orphaned. Wrap the failure path:

```typescript
try {
  await fetch(`/api/entries/${entryId}`, { method: 'PUT', body: ... })
} catch (err) {
  // Record the orphan so it gets cleaned up later
  await fetch('/api/orphaned-blobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      handle: uploadedHandle,
      bucket: uploadedBucket,
      reason: 'backfill_failed',
    }),
  }).catch(() => {})
  throw err
}
```

(`uploadedHandle` and `uploadedBucket` come from the earlier `/api/photos` response — adjust to match the existing variable names.)

- [ ] **Step 5: Sweep cron**

Create `src/app/api/cron/sweep-orphaned-blobs/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getPhotoStorage } from '@/lib/storage/photo-adapter'

const BATCH = 50

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const orphans = await prisma.orphanedBlob.findMany({
    where: { sweptAt: null },
    take: BATCH,
  })

  const storage = getPhotoStorage()
  let swept = 0
  for (const orphan of orphans) {
    try {
      await storage.delete(orphan.handle)
      await prisma.orphanedBlob.update({
        where: { id: orphan.id },
        data: { sweptAt: new Date() },
      })
      swept++
    } catch (err) {
      console.error('sweep failed for', orphan.handle, err)
    }
  }
  return NextResponse.json({ swept, remaining: orphans.length - swept })
}
```

- [ ] **Step 6: Confirm storage adapter has `delete()`**

Open `src/lib/storage/photo-adapter.ts`. The `PhotoStorageAdapter` interface might not include `delete(handle)`. If missing:

1. Add `delete(handle: string): Promise<void>` to the interface.
2. Implement on `LocalPostgresAdapter`: `await prisma.encryptedBlob.delete({ where: { handle } })`.
3. Implement on `SupabaseStorageAdapter`: `await this.supabase.storage.from(bucket).remove([handle])`.

- [ ] **Step 7: Manual verification**

Force a backfill failure for a photo entry (as in Task 3). Confirm `OrphanedBlob` row appears. `curl -X POST http://localhost:3111/api/cron/sweep-orphaned-blobs -H "Authorization: Bearer $CRON_SECRET"`. Confirm `sweptAt` populated; the underlying blob is gone (check via `LocalPostgresAdapter` or Supabase dashboard).

- [ ] **Step 8: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/ src/app/api/orphaned-blobs/ src/app/api/cron/sweep-orphaned-blobs/ src/hooks/useBackfill.ts src/lib/storage/photo-adapter.ts
git commit -m "feat(storage): orphaned-blob recording + sweep cron"
```

---

### Task 5: Mood removal — audit + plan

**This is the largest single task.** Mood is referenced in 20+ files. Approach: audit first, then remove in layers (DB → API → UI), one commit per layer.

- [ ] **Step 1: Audit references**

```bash
grep -rln "mood\|Mood" src prisma --include="*.ts" --include="*.tsx" --include="*.prisma" > /tmp/mood-refs.txt
```

Open `/tmp/mood-refs.txt`. Bucket each file into one of:
- **Schema/data**: `prisma/schema.prisma` (the `mood` field)
- **API**: routes that read/write `mood` (likely `src/app/api/entries/route.ts`, `src/app/api/entries/[id]/route.ts`, `src/app/api/entries/stats/route.ts`)
- **Components — functional**: components that pick or display mood (`MoodPicker.tsx`, `EntryCard.tsx`, `EntryDetailModal.tsx`, `LeftPage.tsx`, `MobileJournalEntry.tsx`, `EntrySelector.tsx`, `LetterWriteView.tsx`, `ComposeView.tsx`)
- **Components — copy only** (just the word "mood" in landing/marketing text): `landing/ThemeShowcase.tsx`, `landing/FooterCTA.tsx`, `landing/FeaturesSection.tsx` — these probably do not need to change unless you want to remove the marketing message
- **Other**: `src/app/security/page.tsx`, scrapbook canvas — verify before touching

- [ ] **Step 2: Decide marketing copy**

Check the `landing/*.tsx` files. If "mood" appears as a feature claim, decide: remove the claim, or replace with another feature. Make a note of these decisions but **don't change them in the same commit as the data removal** — keep marketing as a separate cleanup.

- [ ] **Step 3: Commit**

This step is just the audit doc — no code changes yet.

```bash
echo "<paste audit list here>" > /tmp/mood-removal-audit.txt
# (no commit; this is local-only context for the next steps)
```

---

### Task 6: Mood removal — remove from UI components

**Files:** functional components from the Task 5 audit.

- [ ] **Step 1: Remove `MoodPicker` import + render from each component**

For each functional component that imports/uses `MoodPicker`, remove:
- The `import { MoodPicker } from '@/components/MoodPicker'`
- The `<MoodPicker ... />` JSX
- Any `mood` state, props, or callbacks tied to it

Components likely needing edits (verify against your audit):
- `src/components/desk/LeftPage.tsx`
- `src/components/desk/MobileJournalEntry.tsx`
- `src/components/desk/EntrySelector.tsx`
- `src/components/letters/LetterWriteView.tsx`
- `src/components/letters/compose/ComposeView.tsx`
- `src/components/EntryCard.tsx`
- `src/components/EntryDetailModal.tsx`

- [ ] **Step 2: Remove `MoodPicker.tsx` itself**

```bash
git rm src/components/MoodPicker.tsx
```

- [ ] **Step 3: Test render manually**

```bash
docker compose restart app
```

Open `/write`, `/timeline`, an entry detail, a letter compose flow. Confirm: nothing is missing visually beyond the mood picker, no console errors, no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor(mood): remove MoodPicker and all UI references"
```

---

### Task 7: Mood removal — remove from API routes

**Files:** API routes that handle `mood`.

- [ ] **Step 1: Remove `mood` from POST/PUT entry payloads**

In `src/app/api/entries/route.ts` and `src/app/api/entries/[id]/route.ts`:
- Remove `mood` from the request body destructuring
- Remove `mood` from the Prisma `create`/`update` data

- [ ] **Step 2: Remove mood aggregation from stats**

Open `src/app/api/entries/stats/route.ts`. Remove:
- `avgMood` calculation
- The `clientAggregationRequired: true` flag if it was added solely for E2EE mood
- Any per-month mood grouping

- [ ] **Step 3: Update entry response shape**

Wherever the response includes `mood`, remove it. Adjust any client-side types (`src/lib/types.ts` or similar) accordingly.

- [ ] **Step 4: Run tests + build**

```bash
npm run lint
npm run test
npm run build
```

Fix any TypeScript errors that surface from removed fields.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor(mood): remove mood from API routes and stats"
```

---

### Task 8: Mood removal — drop schema field

**Files:** `prisma/schema.prisma`

- [ ] **Step 1: Remove field from schema**

Open `prisma/schema.prisma`. Delete:
- `mood        Int       @default(2) ...`
- The two indexes that reference `mood`: `@@index([userId, mood])` and `@@index([userId, createdAt, mood])`
- Any other model field with `mood` (the Whisper model has `mood Int?` — decide whether to remove or keep; whispers may use it for prompt selection)
- The mood reference in `e2eeIVs` JSON comment (just a comment update)

If Whisper still uses `mood`, leave its field alone.

- [ ] **Step 2: Generate migration**

```bash
docker compose exec app npx prisma migrate dev --name remove_mood_from_entry
```

**⚠️ This DROPS data.** Prisma will warn. The CLAUDE.md says "Never create migrations that delete data." But the user has explicitly approved removing mood. Proceed only with explicit user confirmation in the conversation; otherwise **stop and ask** before running this command.

- [ ] **Step 3: Run tests + build**

```bash
npm run test
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "refactor(mood): drop mood field from JournalEntry"
```

---

### Task 9: Final integration check

- [ ] **Step 1: Lint + tests + build**

```bash
npm run lint
npm run test
npm run build
```

- [ ] **Step 2: Smoke test all three subsystems**

1. **Key download**: re-enable E2EE in dev (clear keys first); confirm both files download.
2. **Backfill retry**: see Task 3 verification.
3. **Orphaned blob sweep**: see Task 4 verification.
4. **Mood-free flow**: write a new entry — no mood picker visible. Inspect the API response — no `mood` field. Stats endpoint returns without errors.

---

## Self-Review Checklist

- [ ] `downloadDailyKeyFile` and `downloadRecoveryKeyFile` are consistently named across Tasks 1 and 2
- [ ] `OrphanedBlob` schema fields match across Tasks 4 (model, POST endpoint, sweep cron)
- [ ] Storage adapter `delete()` is implemented on both `LocalPostgresAdapter` and `SupabaseStorageAdapter`
- [ ] Mood-removal commits are layered: UI → API → schema (in that order — never schema first, or the API errors)
- [ ] No "TBD" / "TODO" / "implement later" placeholders
- [ ] Whisper model's `mood` field decision is explicit (kept vs removed)

---

## Rollback Plan

- **Key download / backfill retry**: pure UI additions; revert commits to remove.
- **Orphaned blob**: migration is additive (new table); safe to keep even if code is reverted. The sweep cron is opt-in (only runs when called).
- **Mood removal**: this is a destructive migration. Rolling back means re-creating the `mood` column with default `2`. Old data is **gone**; no rollback restores per-entry mood values. If unsure, hold the schema-drop commit (Task 8) until UI/API removal has been live for a week.
