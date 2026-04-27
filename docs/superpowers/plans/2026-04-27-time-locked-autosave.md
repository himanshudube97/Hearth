# Time-Locked Autosave Implementation Plan

**Goal:** Replace the "Seal" button + localStorage draft with full DB autosave. An entry is freely editable within its calendar day of creation, then locks into append-only mode (existing content is read-only; empty slots — blank lines, missing photos, no song, no doodle — remain fillable forever).

**Architecture:**
- Frontend autosaves on every change (debounced 1500ms). First change creates the entry; subsequent changes PUT the full state.
- Backend enforces the calendar-day lock and append-only rules. UI is the second line of defense, not the first.
- Calendar-day comparison happens in the user's local timezone on the frontend; server uses 24-hour grace from `createdAt` as a reasonable approximation (slightly more lenient than strict calendar day, never stricter — the worst case is users get a few extra hours, which is fine).

**Tech Stack:** Next.js 16 App Router, Prisma, AES-256-GCM encryption (existing), Zustand.

---

## Decisions Locked In

- **Lock window:** strict calendar-day on both sides. Server compares calendar dates using the timezone the client sends in the `X-User-TZ` header (IANA name, e.g. `Asia/Kolkata`); falls back to UTC if absent or invalid. UI uses `Date.toDateString()` (local).
- **Existing entries** (created before this change): immediately locked; only append-only changes accepted.
- **Seal button:** removed entirely.
- **Concurrency:** last-write-wins. No version check.
- **Deletion:** not allowed (already enforced).
- **Autosave debounce:** 1500ms.
- **Failure mode on autosave error:** silent retry once, then a subtle "couldn't save" toast/indicator. Local state stays — user doesn't lose typing.

---

## File Structure

**Backend:**
- Modify: `src/app/api/entries/[id]/route.ts` — extend PUT with lock-state validation.
- Create: `src/lib/entry-lock.ts` — pure helpers: `isEntryLocked(createdAt)`, `validateAppendOnlyDiff(oldEntry, newPayload)` returning `{ ok, reason }`.

**Frontend:**
- Modify: `src/components/desk/BookSpread.tsx` — replace draft state + save flow with autosave hook; drop flipbook remount-on-save key.
- Modify: `src/components/desk/RightPage.tsx` — delete Seal button; treat `text` as the source of truth from the entry being edited; pass autosave handlers down.
- Modify: `src/components/desk/LeftPage.tsx` — same: drive textarea from the entry being edited; lock styling for filled lines past 24h.
- Modify: `src/store/desk.ts` — strip the persist middleware + draft fields (no longer needed).
- Create: `src/hooks/useAutosaveEntry.ts` — encapsulates: tracking the active entry id, the debounced PUT/POST cycle, retry, and the saving/error indicator state.
- Create: `src/lib/entry-lock-client.ts` — client-side `isEntryLocked(createdAt)` mirroring the server (but using local-day comparison) plus diff helpers used by the UI to compute "which lines/slots are still editable."

**Cleanup:**
- Modify: `package.json` — none expected; `zustand` persist middleware stays available even if unused elsewhere.

---

## Task 1: Server-side lock helpers

**Files:**
- Create: `src/lib/entry-lock.ts`

```ts
const LOCK_GRACE_MS = 24 * 60 * 60 * 1000

export function isEntryLocked(createdAt: Date | string): boolean {
  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt
  return Date.now() - created.getTime() > LOCK_GRACE_MS
}

interface LockedDiffInput {
  oldText: string                  // already decrypted plain HTML
  newText?: string                 // candidate replacement (full replace)
  appendText?: string              // candidate append
  oldSong: string | null
  newSong?: string | null
  oldPhotos: { spread: number; position: number }[]
  newPhotoSlots?: { spread: number; position: number }[] // slots being filled
  oldDoodleSpreads: number[]       // spread numbers that already have a doodle
  newDoodleSpreads?: number[]
  oldMood: number
  newMood?: number
}

export function validateAppendOnlyDiff(input: LockedDiffInput): { ok: true } | { ok: false; reason: string } {
  // Mood is fixed once the entry locks
  if (input.newMood !== undefined && input.newMood !== input.oldMood) {
    return { ok: false, reason: 'Mood is locked after the day of writing' }
  }
  // Song: if already set, can't change. If unset, can be set.
  if (input.newSong !== undefined && input.oldSong && input.newSong !== input.oldSong) {
    return { ok: false, reason: 'Song is locked once added' }
  }
  // Text: full replace not allowed when locked. Only appendText is.
  if (input.newText !== undefined && input.newText !== input.oldText) {
    return { ok: false, reason: 'Existing text is locked; only new lines can be added' }
  }
  // Photos: each new slot must not collide with an existing one
  if (input.newPhotoSlots) {
    for (const slot of input.newPhotoSlots) {
      const taken = input.oldPhotos.some(p => p.spread === slot.spread && p.position === slot.position)
      if (taken) return { ok: false, reason: 'A photo already exists in that slot' }
    }
  }
  // Doodles: only new spreads
  if (input.newDoodleSpreads) {
    for (const s of input.newDoodleSpreads) {
      if (input.oldDoodleSpreads.includes(s)) {
        return { ok: false, reason: 'A doodle already exists for that spread' }
      }
    }
  }
  return { ok: true }
}
```

- [ ] **Step 1: Write file as above.**
- [ ] **Step 2: Commit.**
  ```bash
  git add src/lib/entry-lock.ts
  git commit -m "feat: add entry lock + append-only diff helpers"
  ```

---

## Task 2: Wire lock check into PUT /api/entries/[id]

**Files:**
- Modify: `src/app/api/entries/[id]/route.ts` (PUT handler, currently lines 68-202)

Behavior:
- Before applying any update, fetch the existing entry's `createdAt`, decrypted text, song, mood, doodle spread numbers, photo slots.
- If `isEntryLocked(createdAt)` is true: run `validateAppendOnlyDiff(...)` against the candidate payload. If it returns `{ ok: false, reason }`, respond 403 with `{ error: reason }`.
- Otherwise (within fresh window) proceed unchanged.

- [ ] **Step 1:** Import the helpers and load `createdAt` + relations needed for the diff up-front in PUT.
- [ ] **Step 2:** Run the lock check before any mutations. Return 403 on violation.
- [ ] **Step 3:** Manual smoke test via `docker compose logs -f app` while editing an old entry — confirm 403 fires for a text overwrite, succeeds for `appendText`.
- [ ] **Step 4:** Commit:
  ```bash
  git add src/app/api/entries/[id]/route.ts
  git commit -m "feat: enforce 24h lock + append-only on entry PUT"
  ```

---

## Task 3: Client lock helper

**Files:**
- Create: `src/lib/entry-lock-client.ts`

```ts
export function isEntryLocked(createdAt: Date | string): boolean {
  // Locked once we've crossed into a different local calendar day from createdAt
  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt
  const now = new Date()
  return created.toDateString() !== now.toDateString()
}
```

- [ ] **Step 1:** Write file.
- [ ] **Step 2:** Commit.

---

## Task 4: Autosave hook

**Files:**
- Create: `src/hooks/useAutosaveEntry.ts`

Surface:

```ts
interface AutosaveDraft {
  text: string                   // combined left+right HTML, the way handleSave currently builds it
  mood: number
  song: string | null
  photos: { url: string; position: number; rotation: number; spread: number }[]
  doodles: { strokes: StrokeData[]; spread: number }[]
}

interface UseAutosaveResult {
  entryId: string | null         // null until the first save creates one
  status: 'idle' | 'saving' | 'saved' | 'error'
  flush: () => Promise<void>     // for immediate save (e.g., before navigation)
  reset: () => void              // call after navigating to a different entry
  trigger: (draft: AutosaveDraft) => void  // call on every change; debounced internally
}

export function useAutosaveEntry(initialEntryId: string | null = null): UseAutosaveResult
```

Internal logic:
- 1500ms debounce.
- On first `trigger` with content present: POST `/api/entries`, capture id.
- Subsequent triggers: PUT `/api/entries/{id}` with the full draft.
- On 403 (lock violation): set status `'error'`, log reason, do not retry.
- On network error: retry once after 2s, then status `'error'`.
- Cancel in-flight debounce on `reset`.

- [ ] **Step 1:** Implement hook. Use `useRef` for the timeout, the in-flight controller, and the latest draft.
- [ ] **Step 2:** Commit.

---

## Task 5: Strip drafts from desk store

**Files:**
- Modify: `src/store/desk.ts`

Remove: `leftPageDraft`, `rightPageDraft`, `setLeftPageDraft`, `setRightPageDraft`, `clearDrafts`, the `persist` middleware. Keep only `currentSpread`, `totalSpreads`, `goToSpread`, `setTotalSpreads`. (LocalStorage drafts are now obsolete because the server is the source of truth.)

- [ ] **Step 1:** Pare the store back to navigation-only.
- [ ] **Step 2:** Commit.

---

## Task 6: Switch BookSpread to the autosave model

**Files:**
- Modify: `src/components/desk/BookSpread.tsx`

Changes:
- Replace draft logic with `const autosave = useAutosaveEntry(currentEntryId)`.
- Track `editingEntry`: either an existing entry from the list, or a placeholder for "new entry today" with `createdAt = now()`.
- LeftPage and RightPage now receive: `entry`, `isLocked`, and an `onChange(partial)` callback that builds the full draft and calls `autosave.trigger(...)`.
- Remove the `key={`flipbook-${entries.length}`}` workaround — the page count no longer jumps on save (the new entry exists from the first keystroke). If the page count still grows on the very first POST response, swap the placeholder spread for the real entry in `entries` state without changing total page count by reusing the same key.
- Drop `handleLeftPageFull`'s call to `setRightPageDraft`; right-page text is now driven by the entry's stored `text` after the next save round-trip. (Mid-flight overflow continues to work because we update local state in LeftPage/RightPage *and* call `autosave.trigger`.)
- Remove the saved-entry overlay or repurpose it as a tiny "saved" pill driven by `autosave.status`.

- [ ] **Step 1:** Wire `useAutosaveEntry`.
- [ ] **Step 2:** Replace draft props with entry+lock+onChange.
- [ ] **Step 3:** Remove flipbook remount key. Verify typing past page break still works.
- [ ] **Step 4:** Commit.

---

## Task 7: LeftPage & RightPage — drive from entry, drop seal, lock UI

**Files:**
- Modify: `src/components/desk/LeftPage.tsx`
- Modify: `src/components/desk/RightPage.tsx`

Changes:
- Both pages receive `entry: Entry | null` (current real entry being edited) and `isLocked: boolean`.
- For new-entry mode (`entry === null`): always interactive; on every `onChange`, parent triggers autosave.
- For existing-entry mode:
  - If `!isLocked`: same as new-entry — fully interactive.
  - If `isLocked`: textarea is read-only for filled lines, interactive for blank lines below. Music input hidden if `entry.song` set; visible if not. Photo slots: each filled slot is read-only, empty slots accept upload. Doodle: read-only preview if drawn, interactive canvas if empty.
- RightPage: delete the entire Seal button block (lines ~388-440 of current file). Replace with a small unobtrusive autosave indicator: text only, e.g., "saved" / "saving…" / "couldn't save".
- LeftPage's overflow logic stays the same conceptually (fitsText + onPageFull) but instead of pushing into a parent ref it now updates the right-side text and calls `onChange`.

- [ ] **Step 1:** Add `entry` + `isLocked` props, drive the textarea from `entry?.text` (or local state when in fresh window).
- [ ] **Step 2:** Wire the `onChange` callback for text/photo/song/doodle changes.
- [ ] **Step 3:** Apply lock styling: `readOnly` on textarea; hide upload affordances on filled slots; hide doodle canvas tools when a doodle exists.
- [ ] **Step 4:** Delete Seal button JSX and `handleSave` flow in RightPage.
- [ ] **Step 5:** Add autosave-status indicator (small text, no spinner needed).
- [ ] **Step 6:** Commit.

---

## Task 8: Manual end-to-end smoke test

- [ ] Start fresh: `docker compose restart app`.
- [ ] Open `/write`. Type a sentence — should see "saving…" then "saved" within ~2s. Network tab: POST to /api/entries, then PUT.
- [ ] Refresh the page. Text should still be there (loaded from DB, not localStorage).
- [ ] Add a photo, song, doodle in any order. Each triggers autosave.
- [ ] Backdate an entry in the DB to 2 days ago: `docker compose exec app npx prisma studio` → set createdAt. Reload `/write`. Try editing existing text — should be read-only. Try adding new lines after — should work and autosave succeeds. Try replacing the photo — slot should refuse the upload UI. Add a song where there was none — should work.
- [ ] Confirm Network tab returns 403 if you craft a manual fetch trying to overwrite text on a locked entry.

- [ ] **Step 1:** Run the smoke test, fix any discovered bugs.
- [ ] **Step 2:** Commit any fixes.

---

## Task 9: Cleanup

- [ ] Confirm `hearth-diary-draft` localStorage key is no longer written. (We removed the persist middleware, so it won't be — but the old value may still be in users' browsers. Acceptable to leave as orphan; no PII.)
- [ ] Search for any remaining references to "Seal" / "saveButton" / `clearDrafts` / `setLeftPageDraft` / `setRightPageDraft` and remove.
- [ ] Update `CLAUDE.md` "Journal Entry Editing Rules" section to reflect the new lifecycle (24h fresh window → calendar-day lock → append-only forever).

```bash
git add src/components src/store src/hooks src/lib src/app CLAUDE.md
git commit -m "refactor: replace seal-and-save with time-locked DB autosave"
```

---

## Self-Review Checklist (run before executing)

- ✅ Spec coverage: 24h fresh window, append-only after, no deletion, no concurrency check, Seal removed, calendar-day UI vs 24h server. All represented.
- ✅ No placeholders. Every task has concrete file paths.
- ✅ Type consistency: `AutosaveDraft`, `LockedDiffInput`, `isEntryLocked` consistent across server and client (the names diverge intentionally — `entry-lock.ts` server-side uses 24h, `entry-lock-client.ts` uses local calendar day).
- ⚠️ One thing left implicit: how the placeholder "new entry today" spread morphs into a real entry once the first POST returns. Plan addresses this in Task 6 Step 3 — reuse the same React key so the flipbook doesn't see a length change. Watch for this during execution; if it gets messy, fall back to a one-time remount on first-save (key changes from `'new'` to `entry.id`).
