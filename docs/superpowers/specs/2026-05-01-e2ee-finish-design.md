# Finish E2EE for own entries

**Date:** 2026-05-01
**Scope:** Wire up end-to-end encryption for the user's own journal data — entries, photos, doodles, scrapbooks. Settings-only opt-in. Mutually exclusive with server-side encryption (per-entry, not per-user).
**Surface:** Browser write/read paths for entries; photo storage; scrapbook; backfill flow; SetupModal/UnlockModal; user-facing privacy doc.
**Out of scope:** Friend letters (Spec B). Friend letter delivery continues on the existing server-encryption + email path until Spec B redesigns the cross-recipient flow.

## Problem

Hearth ships an E2EE module ([src/lib/e2ee/](../../src/lib/e2ee/)) with a complete crypto stack — Web Crypto API, AES-256-GCM, PBKDF2 key derivation, master-key wrapping with daily-key + recovery-key, a thoughtful 7-step setup wizard, and server endpoints to store the wrapped keys. The **read path** is wired: `useEntries` calls `decryptEntriesFromServer` to handle E2EE entries client-side.

The **write path is not wired.** `encryptEntryData` is defined and exported in `src/hooks/useE2EE.ts` but is never called anywhere in the codebase. Verified by grep: only matches are the function definition itself. The autosave hook `useAutosaveEntry` POSTs plaintext directly, the server runs its own server-side encryption, and every entry is stored as `encryptionType='server'` regardless of whether the user has completed E2EE setup. The decrypt-on-read code is therefore dead in practice — `entry.encryptionType === 'e2ee'` is never true for new writes.

Net effect: a user can complete the SetupModal, save a recovery key, see "E2EE is now active," and write entries that **the server can read in plaintext on disk**. The privacy guarantee marketed to users is not delivered.

This spec finishes E2EE so it actually works, extends coverage beyond text, and adds backfill + a Supabase Storage adapter for photos.

## Goals

1. **Wire the write path.** When `useE2EEStore.isUnlocked === true`, the autosave hook encrypts the draft client-side before sending. Server skips its own encryption when `encryptionType: 'e2ee'`.
2. **Cover everything the user creates.** Text, text preview, mood, tags, song, photos (bytes), doodles (strokes), self-letter metadata, scrapbook items.
3. **Backfill existing entries on enable.** A user who toggles E2EE on with N existing server-encrypted entries gets all N migrated to E2EE in their browser. Server-encrypted plaintext copies are dropped. Resumable across tab closes via localStorage checkpoint.
4. **Storage adapter for photos.** Browser code is identical for dev and prod. Server-side adapter routes encrypted bytes to local Postgres (dev) or Supabase Storage (prod) based on env var.
5. **7-day TTL for the master key in localStorage.** "Remember for 7 days" is the default checked option in UnlockModal, framed to users as "so you don't forget your daily key."
6. **Two docs.** A user-facing privacy page (~400 words, plain English) and a developer/architecture doc (~1500 words).
7. **Single integrated delivery.** All work lands in one branch. No phased rollout, no feature flags.

## Non-goals

- **Friend letters (cross-recipient E2EE).** Deferred to Spec B. Current friend-letter delivery (cron → Resend → email) keeps working for both E2EE and non-E2EE users; recipient email stays plaintext as the cron requires it.
- **Server-side full-text search.** Not built today. E2EE makes server-side search impossible by design. Client-side search across decrypted-in-memory entries is acceptable for journaling-app scale.
- **E2EE on signup / first-entry prompt.** Settings-only opt-in. No new entry points beyond the existing settings panel.
- **Multi-device key sync.** Each new browser/device unlocks independently with daily key (or recovery key). No cross-device push of the master key.
- **Recovery without keys.** Lose both daily key and recovery key, data is unrecoverable. No backdoor.
- **Recovery key rotation.** Recovery key is permanent. Users who think it's exposed must disable E2EE and re-enable, which is forbidden while entries exist (so effectively: not supported in v1).
- **Audit logging.** No "who accessed what when" log.
- **Orphan blob cleanup job.** Acknowledged as a v1.1 chore.
- **Mood-based stats endpoint for E2EE users.** Mood histograms for E2EE users are computed client-side after decryption. The server-side stats endpoint returns counts only for these users.

## Architecture overview

```
┌───────────────────────────── BROWSER ─────────────────────────────┐
│                                                                    │
│  Editor / PhotoSlot / Doodle / Scrapbook                           │
│                          │                                          │
│  useAutosaveEntry        ▼                                          │
│   (debounced 1500ms)                                                │
│                          │                                          │
│       NEW: if useE2EEStore.isUnlocked:                              │
│         draft = await encryptDraft(draft, masterKey)                │
│              (delegated to crypto-worker.ts)                        │
│                          │                                          │
│                          ▼                                          │
│              POST/PUT /api/entries (or /api/scrapbooks)             │
│                                                                     │
│  useEntries / useScrapbooks                                         │
│           │                                                         │
│           ▼                                                         │
│   decryptEntryFromServer (existing, extended for new fields)        │
│                                                                     │
│   Master key in localStorage: { key: <base64>, expiresAt: <iso> }   │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌───────────────────────────── SERVER ──────────────────────────────┐
│                                                                    │
│  if encryptionType === 'e2ee':                                     │
│      persist ciphertext + IVs as-is (no server encryption)         │
│  else:                                                              │
│      run existing server-side encrypt() (lib/encryption.ts)        │
│                                                                     │
│  Photo bytes route through PhotoStorageAdapter:                    │
│    - LocalPostgresAdapter (dev): writes to EncryptedBlob table     │
│    - SupabaseStorageAdapter (prod): uploads to Storage bucket      │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

The split is per-entry: `encryptionType` is a field on `JournalEntry`. A user can have a mix of server-encrypted and E2EE entries during backfill or before opting in. Server and client both branch correctly on this field today.

## Data coverage

When `encryptionType === 'e2ee'`:

| Field | E2EE'd | Why |
|---|---|---|
| `text` | ✓ | core content |
| `textPreview` | ✓ | client-generated when E2EE on |
| `mood` | ✓ | "anything user puts" |
| `tags` | ✓ | "anything user puts" |
| `song` | ✓ | what user listened to is private |
| `photos[].encryptedRef` | ✓ | encrypted `{handle, iv}`; bytes encrypted separately and stored via adapter |
| `doodles[].strokes` | ✓ | encrypted strokes JSON |
| `senderName`, `recipientName`, `letterLocation` (self-letters) | ✓ | letter metadata |
| Scrapbook `items`, `title` | ✓ | already server-encrypted; switches to E2EE when user opts in |

Plaintext (server functional requirement, unavoidable):

- `entryType` — server needs for routing (`normal`/`letter`/etc.)
- `createdAt`, `updatedAt` — sort, pagination, cron eligibility
- `unlockDate`, `isSealed`, `isDelivered` — letter delivery cron queries on these
- `recipientEmail` — friend-letter cron needs plaintext to send email; for self-letters this is the user's own email or null
- `isReceivedLetter`, `originalSenderId`, `originalEntryId` — structural / FK

The user-facing privacy doc must disclose this honestly: "We can see when you wrote, what type it was (entry vs. sealed letter), and whether/when a sealed letter was delivered. We cannot see contents."

## Setup & unlock flow

### Settings panel (only entry point)

New "End-to-end encryption" section:

- **Toggle**: enable / disable. Disable is hidden once any E2EE entry exists (one-way street for v1).
- **Lock journal** button: clears master key from localStorage immediately, forces re-unlock.
- **Change daily key**: re-runs the wrap-with-new-passphrase flow against the existing master key.
- **Status line**: "Encrypted on [date]. Unlocked on this device until [expiresAt]."

### Setup flow (toggle on → SetupModal)

Existing 7-step wizard runs. On `complete`:

1. Master key generated (in browser, never sent).
2. Recovery key generated (in browser, shown once, user copies/saves).
3. Master key wrapped twice (daily-key-derived wrapping key + recovery-key-derived wrapping key).
4. Recovery key SHA-256 hashed for verification.
5. POST `/api/e2ee/setup` with the wrapped blobs + IVs + salt + hash.
6. Master key cached in localStorage as `{ key: <base64>, expiresAt: now + 7d }`.
7. Backfill triggered (next section). Toast: "Migrating your N entries…"

Modal copy update: "Your existing N entries will also be encrypted. This may take a moment."

### Unlock flow (new browser/device, or 7-day TTL expired)

```
App load
  → check localStorage for { key, expiresAt }
  → if expiresAt > now: load key, isUnlocked = true
  → else: clear, show UnlockModal

UnlockModal:
  - Daily key input (autofocus, password type)
  - "Remember for 7 days" checkbox — checked by default
  - "Forgot your daily key? Use recovery key" → RecoveryModal
  - Submit: PBKDF2(dailyKey, salt) → unwrap encryptedMasterKey
            → cache as { key, expiresAt: now + 7d }
```

### RecoveryModal flow (forgot daily key)

```
1. User enters recovery key (24-char XXXX-XXXX-…)
2. Verify hash matches stored recoveryKeyHash
3. PBKDF2(recoveryKey, deterministic salt) → unwrap encryptedMasterKeyRecovery
4. Master key in memory
5. Prompt: "Set a new daily key"
6. PBKDF2(newDailyKey, fresh salt) → re-wrap master key
7. POST /api/e2ee/update-daily-key with new { encryptedMasterKey, masterKeyIV, masterKeySalt }
8. encryptedMasterKeyRecovery and recoveryKeyHash are unchanged
9. User unlocked, master key cached with TTL
```

The master key never changes. Existing E2EE entries continue to decrypt with the same key. The recovery key remains valid for future use.

### Edge cases

- User closes Setup wizard mid-flow: no DB changes have happened (server `setup` only fires after recovery-key verification). Safe to abort.
- User closes app during backfill: per-entry checkpoint in localStorage. Resume on next unlock.
- User loses both keys: data genuinely unrecoverable. SetupModal already requires typing "I understand I may lose my data."
- User unlocks on a new device: only daily key (or recovery key) works. Master key never leaves the original browser.

## Read & write flows (daily use)

### Write

```
User edits entry (text/photo/doodle/song/mood/tags)
  ↓
useAutosaveEntry debounces 1500ms, builds AutosaveDraft
  ↓
NEW: if useE2EEStore.isUnlocked:
  draft = await encryptDraft(draft, masterKey)
    text:        encryptString(text)        → ciphertext + iv
    textPreview: client-generates from text, then encryptString
    mood:        encryptString(JSON.stringify(mood))    → ciphertext + iv
    tags:        encryptString(JSON.stringify(tags))    → ciphertext + iv
    song:        encryptString(song)        → ciphertext + iv
    photos:      for each, encryptPhoto() (Photo flow section)
    doodles:     for each, encryptString(JSON.stringify(strokes)) + iv
    letter metadata (if applicable): encryptString
  → returns { ...draft, encryptionType: 'e2ee', e2eeIVs: { text, mood, ... } }
  ↓
POST /api/entries (or PUT /api/entries/[id])
  ↓
Server: if encryptionType === 'e2ee':
  - skip server-side encryption
  - persist ciphertext + per-field IVs
```

Crypto runs in a Web Worker (`src/lib/e2ee/crypto-worker.ts`) so encrypting a draft with photos doesn't freeze the main thread.

### Read

```
GET /api/entries (cursor-paginated)
  ↓
Server returns rows; for E2EE rows skips its own decrypt (existing logic)
  ↓
useEntries → decryptEntriesFromServer (extended)
  ↓
For each E2EE entry:
  decryptString(text, e2eeIVs.text, masterKey)
  decryptString(textPreview, e2eeIVs.textPreview, masterKey)
  decryptString(mood, e2eeIVs.mood) → JSON.parse
  ... (same for tags, song, doodles)
  for each photo: decryptPhoto() (Photo flow)
  ↓
Render with full plaintext content
```

**Eager full decrypt.** When a list page loads (e.g., 50 entries from cursor pagination), decrypt them all in parallel before rendering. The list paints once with everything ready — no per-entry flicker. First unlock shows a brief "Unlocking your journal…" overlay; subsequent navigations work from in-memory cache.

If `isUnlocked === false` (TTL expired or fresh browser), entries render as `[Encrypted — unlock to view]` placeholders, UnlockModal opens, list re-renders on success. Already wired in `useE2EE.decryptEntryFromServer:73-79`; extension covers new fields.

### Stats endpoint behavior

For E2EE users: `/api/entries/stats` returns row counts (server can still count by `createdAt`), but mood histograms come back empty. Client falls back to fetching all entries (cursor-paginated), decrypting in memory, aggregating locally. Cached in Zustand. For typical journal sizes (≤2000 entries) this is a one-time ~1-2s cost.

## Backfill flow

When user enables E2EE for the first time and they already have non-E2EE entries:

```
SetupModal completes successfully
  ↓
masterKey is in memory + localStorage
  ↓
useBackfill triggers (async, non-blocking)
  ↓
Loop:
  1. GET /api/entries/backfill-batch?cursor=X&limit=20
     → server returns plaintext batch (decrypted with server key on the way out)
     → only returns rows where encryptionType='server', scoped to user
  2. For each entry:
       encrypt all fields with masterKey (same logic as write flow)
       PUT /api/entries/[id] with encryptionType='e2ee' + ciphertext + IVs
     → server overwrites row, drops server-side ciphertext
  3. Update local progress { migrated, total }
  4. Persist progress in localStorage: { lastCursor, migratedCount }
  5. Continue until no more rows
  ↓
Same loop for scrapbooks via /api/scrapbooks/backfill-batch
  ↓
Toast persists during run: "Migrating your journal… 23 / 47" — non-blocking, no cancel button (paused implicitly by tab close, resumed on next unlock)
On completion: "Your journal is now end-to-end encrypted ✓"
```

### Mixed state during backfill

The user can keep using the app:

- New entries written during backfill → encrypted as E2EE (write path is already E2EE'd by then).
- Old entries opened during backfill → decrypted with server key (read path handles either type).
- Old entries edited during backfill → autosave PUTs as E2EE; that entry just gets migrated early.
- The migration batch endpoint only fetches `encryptionType='server'` entries, so no double-migration.

### Tab close mid-backfill

`localStorage.backfillProgress = { lastCursor, migratedCount, totalAtStart }`. On next unlock, `useBackfill` detects pending state and resumes from `lastCursor`. There is no robust way for a browser app to do real long-running work after tab close; resume-on-reopen is the realistic pattern, matching how Notion/Linear/etc. handle similar work.

### Failure on a single entry

Log to console, mark id in `failedMigrations: string[]` set in localStorage, continue. User sees "Migrated 46 of 47 entries. 1 entry could not be migrated — open it to retry." in settings.

### Photos in backfill

Backfill handles photos: server returns the existing photo `url` (legacy base64 data URL), client encrypts the bytes, uploads via the new adapter, replaces the photo row with `encryptedRef`. Same loop as text fields, just with extra round-trip per photo.

### Disable during backfill

Not allowed. UI shows: "Finish migrating your journal first." Backfill cannot be cancelled, only paused (by closing the tab) and resumed.

## Photo encryption + storage adapter

### Adapter interface

```typescript
// src/lib/storage/photo-adapter.ts
interface PhotoStorageAdapter {
  store(encryptedBytes: Buffer, userId: string): Promise<string>  // returns storage handle
  retrieve(handle: string, userId: string): Promise<Buffer>
  delete(handle: string, userId: string): Promise<void>
}

const adapter: PhotoStorageAdapter =
  process.env.PHOTO_STORAGE === 'supabase'
    ? new SupabaseStorageAdapter(...)
    : new LocalPostgresAdapter()
```

**LocalPostgresAdapter (dev):**
- Stores ciphertext as base64 in a new `EncryptedBlob` table.
- Handle returned = blob row id.
- No external dependency; works in local Docker stack.

**SupabaseStorageAdapter (prod):**
- Uploads ciphertext bytes to a private Supabase Storage bucket (`journal-photos`) at path `{userId}/{uuid}.bin`.
- Handle returned = the storage path string.
- Bucket is private with RLS (only authenticated user can read their own folder).

### API routes (single browser code path)

- `POST /api/photos` — multipart body, ciphertext bytes. Calls `adapter.store(bytes, userId)`. Returns `{ handle: string }`.
- `GET /api/photos/[handle]` — calls `adapter.retrieve(handle, userId)` (verifying handle belongs to user). Returns ciphertext bytes with `Content-Type: application/octet-stream`.
- `DELETE /api/photos/[handle]` — called when entry is deleted, on each photo. Calls `adapter.delete(handle, userId)`.

### Browser flow (identical for dev and prod)

**Save:**

```
User drops photo into PhotoSlot
  ↓
File → ArrayBuffer of raw bytes
  ↓
encryptBytes(rawBytes, masterKey) → { ciphertext: ArrayBuffer, iv }
  ↓
POST /api/photos with multipart body containing ciphertext bytes
  ↓
Server adapter stores, returns { handle: "abc123" }
  ↓
Browser: encryptString(JSON.stringify({ handle, iv }), masterKey)
  → encryptedRef + encryptedRefIV
  ↓
encryptedRef goes into autosave draft as photo.encryptedRef
```

**Read:**

```
GET /api/entries → entry includes photos[] with encryptedRef
  ↓
Browser: decryptString(encryptedRef, encryptedRefIV, masterKey)
  → JSON.parse → { handle, iv }
  ↓
fetch(`/api/photos/${handle}`) → ciphertext bytes
  ↓
decryptBytes(bytes, iv, masterKey) → raw image bytes
  ↓
URL.createObjectURL(new Blob([rawBytes])) → blob: URL
  ↓
<img src={blobUrl} />  + revokeObjectURL on unmount
```

The `EncryptedBlob` table will technically exist in prod schema (Prisma migrations apply everywhere) but stay empty — Supabase adapter writes to the storage bucket instead. Empty tables cost nothing in Postgres.

### Cleanup / orphans

When an entry is deleted: server iterates its `EntryPhoto` rows, calls `adapter.delete(handle)` for each, then deletes the rows. If adapter call fails, log it — orphans are recoverable later via cleanup job. Out of scope for this spec.

## Schema changes

One Prisma migration. All additive. No data loss.

```prisma
model JournalEntry {
  // ... existing fields
  e2eeIVs   Json?     // per-field IVs map: { text, textPreview, mood, tags, song, ... }
  // existing e2eeIV column kept nullable for backwards compat (drop post-beta)
}

model EncryptedBlob {  // NEW
  id         String   @id @default(cuid())
  userId     String
  ciphertext String   @db.Text
  createdAt  DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
}

model EntryPhoto {
  // ... existing fields
  url            String?  // legacy / non-E2EE: data URL or cloud URL
  encryptedRef   String?  // ciphertext of {handle, iv} for E2EE
  encryptedRefIV String?
  // exactly one of url / encryptedRef is set per row
}

model Scrapbook {
  // ... existing fields
  encryptionType String  @default("server")
  e2eeIVs        Json?
}
```

## Files affected

### Encryption core

- `src/lib/e2ee/crypto.ts` *(extend)* — add `encryptString`/`decryptString` helpers, TTL-aware key load
- `src/lib/e2ee/draft-encryptor.ts` *(new)* — pure `encryptDraft(draft, key)` / `decryptEntry(entry, key)` covering all field types
- `src/lib/e2ee/crypto-worker.ts` *(new)* — Web Worker wrapping crypto ops
- `src/store/e2ee.ts` *(extend)* — `{ key, expiresAt }` persistence; backfill-progress slice

### Setup & unlock UX

- `src/components/e2ee/SetupModal.tsx` *(extend)* — copy update for "your existing entries will also be encrypted"
- `src/components/e2ee/UnlockModal.tsx` *(extend)* — "Remember for 7 days" default checked
- `src/components/e2ee/BackfillToast.tsx` *(new)* — non-blocking corner progress toast

### Write path (the currently-broken piece)

- `src/hooks/useAutosaveEntry.ts` *(extend)* — branch on `useE2EEStore.isUnlocked`, run `encryptDraft()` before fetch

### Read path

- `src/hooks/useE2EE.ts` *(extend)* — `decryptEntryFromServer` covers all new fields
- `src/hooks/useEntries.ts` — already wired, no change

### Photo storage

- `src/lib/storage/photo-adapter.ts` *(new)* — interface + factory
- `src/lib/storage/local-postgres-adapter.ts` *(new)* — dev adapter
- `src/lib/storage/supabase-storage-adapter.ts` *(new)* — prod adapter
- `src/app/api/photos/route.ts` *(new)* — POST upload
- `src/app/api/photos/[handle]/route.ts` *(new)* — GET retrieve, DELETE
- `src/components/desk/PhotoSlot.tsx` *(extend)* — encrypt → upload → store handle when E2EE on

### Server APIs

- `src/app/api/entries/route.ts` *(extend)* — accept `e2eeIVs` JSON
- `src/app/api/entries/[id]/route.ts` *(extend)* — same
- `src/app/api/scrapbooks/route.ts` *(extend)* — accept `encryptionType: 'e2ee'` + IVs
- `src/app/api/entries/backfill-batch/route.ts` *(new)* — GET plaintext batch
- `src/app/api/scrapbooks/backfill-batch/route.ts` *(new)* — same for scrapbooks

### Backfill orchestration

- `src/hooks/useBackfill.ts` *(new)* — fetches batch → encrypts → PUTs → checkpoint → loops

### Schema

- `prisma/schema.prisma` *(modify)* — additions described above
- One Prisma migration file

### Env vars

- `.env.example` *(extend)*:
  ```
  PHOTO_STORAGE=local                # 'local' (dev) or 'supabase' (prod)
  SUPABASE_SERVICE_ROLE_KEY=         # prod only
  SUPABASE_STORAGE_BUCKET=           # prod only
  ```

### Docs

- `docs/e2ee-architecture.md` *(new)* — developer/contributor/auditor doc, ~1500 words. Covers crypto stack (PBKDF2/AES-GCM/IV handling), key wrapping, photo flow, backfill, threat model, what server can/can't see.
- `src/app/security/page.tsx` *(new)* — user-facing privacy page, ~400 words. Plain English. Covers: what E2EE means, what we can't see, what we can see, what happens if you lose your daily key, what happens if you lose both keys. Linked from Settings → "How E2EE works."

### Files explicitly NOT touched (Spec B territory)

- `src/app/api/cron/deliver-letters/route.ts`
- `src/app/api/letters/mine/route.ts`
- `src/lib/encryption.ts` (server-side encryption stays for non-E2EE entries)

## Risks

- **Web Crypto API differences across browsers.** AES-GCM and PBKDF2 are well-supported (Safari 11+, Chrome, Firefox, Edge). No expected blockers, but worth a smoke test on Safari.
- **localStorage quota.** Master key + backfill progress is ~100 bytes. Photo backfill could move large amounts of data through the browser, but never stored in localStorage. Low risk.
- **Photo upload memory pressure.** Large photos (several MB) being read as ArrayBuffer + encrypted in memory could spike RAM. Mitigation: stream where possible, but for now accept that 10MB photos will use 10-20MB RAM during upload. Acceptable.
- **Backfill interrupted mid-photo.** Resume logic must handle partial photo migration: if entry's text fields are migrated but photos aren't, that entry's encryption state is inconsistent. Mitigation: per-entry atomic migration — encrypt all fields locally first, then send a single PUT that updates everything together. The PUT replaces the row.
- **Mood histograms degrading to client-side.** Could be slow for users with thousands of entries. Mitigation: aggregate once, cache in Zustand, don't recompute unless entries change.
- **Recovery key loss.** Out of our control. Strongly emphasized in SetupModal copy ("Save this somewhere safe — write it down or use a password manager").

## Success criteria

1. Toggle E2EE on in Settings → SetupModal completes → master key in localStorage with 7-day TTL → backfill toast appears → all existing entries migrated within minutes (depending on count) → write a new entry with text + photo + doodle + mood + song + tags → close tab → reopen → enter daily key → entry renders correctly with all fields decrypted.
2. Disable E2EE shows "not allowed while entries exist" message after first E2EE entry.
3. Lose daily key → enter recovery key in RecoveryModal → set new daily key → existing entries continue to decrypt.
4. Server admin with full DB and Supabase Storage access cannot read any user's E2EE-flagged content. Verifiable by inspecting Postgres rows + Supabase blobs directly.
5. Browser performance: write+encrypt of a draft with one 5MB photo completes in <1s on a typical phone. List page render with 50 E2EE entries (no photos) completes in <500ms.
6. Both docs published. User-facing doc accessible at `/security`. Developer doc in `docs/e2ee-architecture.md`.
