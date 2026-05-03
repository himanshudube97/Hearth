# Auth Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the existing Supabase auth flow with forgot-password, an email-verification gate, a resend-OTP affordance, and tighten the E2EE/auth boundary (logout wipes the master key, unlock modal offers a "trust device" toggle).

**Architecture:** All auth endpoints stay on `src/app/api/auth/*`. Forgot-password uses Supabase's built-in `resetPasswordForEmail` + a new `/forgot` and `/reset` page pair. The verification gate runs in `src/middleware.ts` (Supabase path only — dev mode is exempt) and rejects Supabase users whose `email_confirmed_at` is null. Logout already calls `/api/auth/logout`; we add a client-side hook that clears the in-memory + localStorage master key before the request fires. The "trust this device" toggle threads a `persist: boolean` flag through the existing `storeMasterKeyLocally` API (it already supports `ttlMs = 0` → sessionStorage, so this is plumbing only).

**Tech Stack:** Next.js 16 App Router, Supabase Auth (`@supabase/ssr`), Zustand, Tailwind. Tests run with vitest (`npm run test`).

---

## Manual Setup (User must do this once before Tasks 1-6 land in production)

These cannot be automated by CLI. Do them in parallel while the engineer works through tasks.

- [ ] **In Supabase dashboard → Auth → Email Templates:** customize the "Reset Password" template subject + body. Set the redirect URL to `${NEXT_PUBLIC_APP_URL}/reset` (e.g. `https://hearth.app/reset`).
- [ ] **In Supabase dashboard → Auth → URL Configuration:** add `${NEXT_PUBLIC_APP_URL}/reset` to "Redirect URLs" allowlist.
- [ ] **In Supabase dashboard → Auth → Settings:** confirm "Confirm email" is enabled. Note the rate limit (free tier: ~3-4 emails/hour) — sufficient for early users.
- [ ] **In `.env`:** ensure `NEXT_PUBLIC_APP_URL` matches the actual deployed domain (currently set to `http://localhost:3111` for dev).

These tasks block **production behavior** but not the implementation work — the engineer can build, test, and commit everything against the dev-auth path without these being done first.

---

## File Structure

**Created:**
- `src/app/api/auth/forgot/route.ts` — POST: send Supabase password reset email
- `src/app/api/auth/reset/route.ts` — POST: complete reset with new password (uses Supabase recovery token)
- `src/app/api/auth/resend-otp/route.ts` — POST: re-send signup OTP
- `src/app/forgot/page.tsx` — UI to enter email and trigger reset
- `src/app/reset/page.tsx` — UI to set new password (lands here from email link)
- `src/__tests__/auth/email-verified.test.ts` — unit test for the verification helper

**Modified:**
- `src/middleware.ts` — add `email_confirmed_at` check in Supabase path
- `src/lib/auth/index.ts` — `getCurrentUser()` returns null if Supabase user exists but email is unconfirmed
- `src/app/login/page.tsx` — add "Forgot password?" link, "Resend code" button on OTP step
- `src/store/auth.ts` — `signOut()` calls `useE2EEStore.getState().clearMasterKey()` before fetching logout
- `src/components/e2ee/UnlockModal.tsx` — add "Trust this device for 7 days" checkbox (default checked)
- `src/lib/e2ee/crypto.ts` — already supports `ttlMs = 0` → sessionStorage; no change needed
- `src/store/e2ee.ts` — `storeMasterKey(key, ttlDays)`; if `ttlDays === 0`, pass `0` through to `storeMasterKeyLocally` (already works — verify path)

---

### Task 1: Logout wipes the E2EE master key

**Files:**
- Modify: `src/store/auth.ts` (the `signOut` action)

- [ ] **Step 1: Read current signOut**

Open `src/store/auth.ts`. The `signOut` action currently does:

```typescript
signOut: async () => {
  await fetch('/api/auth/logout', { method: 'POST' })
  // ...redirects, clears auth state
}
```

- [ ] **Step 2: Add E2EE clear before logout**

Modify `signOut` to import and call `useE2EEStore.getState().clearMasterKey()` before the fetch. Avoid a circular import by using a dynamic require inside the function:

```typescript
signOut: async () => {
  // Clear E2EE master key first (in-memory + localStorage + sessionStorage)
  try {
    const { useE2EEStore } = await import('@/store/e2ee')
    useE2EEStore.getState().clearMasterKey()
  } catch {}
  await fetch('/api/auth/logout', { method: 'POST' })
  // ...rest unchanged
}
```

- [ ] **Step 3: Manual verification**

Run `docker compose up -d`. Log in as a user with E2EE enabled, unlock the journal, then log out. Reopen DevTools → Application → Local Storage → confirm `hearth-e2ee-master-key` (or whatever the storage key is — check `src/lib/e2ee/crypto.ts` `MASTER_KEY_STORAGE_KEY` constant) is removed. Same for sessionStorage.

- [ ] **Step 4: Commit**

```bash
git add src/store/auth.ts
git commit -m "feat(auth): wipe E2EE master key on logout"
```

---

### Task 2: "Trust this device 7 days" toggle on unlock modal

**Files:**
- Modify: `src/components/e2ee/UnlockModal.tsx`
- Modify: `src/store/e2ee.ts` (verify `ttlDays = 0` path works)

- [ ] **Step 1: Read UnlockModal**

Open `src/components/e2ee/UnlockModal.tsx`. Find the unlock submission handler — it currently calls `useE2EEStore.getState().storeMasterKey(key)` (defaults to 7-day TTL).

- [ ] **Step 2: Add a state hook for the checkbox**

Near the other `useState` calls in `UnlockModal.tsx`, add:

```typescript
const [trustDevice, setTrustDevice] = useState(true)
```

- [ ] **Step 3: Render the checkbox above the submit button**

Replace the existing modal layout (passphrase input + submit button) by inserting this block just above the submit button. Match existing Tailwind styling — look at adjacent labels in the file for the right colors.

```tsx
<label className="flex items-center gap-2 text-sm text-stone-600 mt-2">
  <input
    type="checkbox"
    checked={trustDevice}
    onChange={(e) => setTrustDevice(e.target.checked)}
    className="rounded border-stone-300"
  />
  Trust this device for 7 days
</label>
```

- [ ] **Step 4: Pass the flag to storeMasterKey**

In the unlock handler, change the call from `storeMasterKey(key)` to:

```typescript
await useE2EEStore.getState().storeMasterKey(key, trustDevice ? 7 : 0)
```

- [ ] **Step 5: Verify the store handles ttlDays = 0**

Open `src/store/e2ee.ts`. Confirm the `storeMasterKey` action passes `ttlDays * 24 * 60 * 60 * 1000` to `storeMasterKeyLocally`. When `ttlDays = 0`, this evaluates to 0, and `crypto.ts` line 391 routes `ttlMs <= 0` to sessionStorage. ✓ Already works — no code change needed.

- [ ] **Step 6: Manual verification**

Log in, enable E2EE, lock the journal (close + reopen). Unlock with the checkbox UNCHECKED. Open DevTools → Application → Session Storage → confirm `hearth-e2ee-master-key` is there. Local Storage should NOT contain it. Close the tab, reopen — should prompt for unlock again. Repeat with checkbox CHECKED — Local Storage should have the entry, key persists across tab close.

- [ ] **Step 7: Commit**

```bash
git add src/components/e2ee/UnlockModal.tsx
git commit -m "feat(e2ee): add 'trust this device' toggle on unlock"
```

---

### Task 3: Email verification helper + unit test

**Files:**
- Create: `src/lib/auth/email-verified.ts`
- Create: `src/__tests__/auth/email-verified.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/auth/email-verified.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { isEmailVerified } from '@/lib/auth/email-verified'

describe('isEmailVerified', () => {
  it('returns true for a Supabase user with email_confirmed_at set', () => {
    const user = { email_confirmed_at: '2026-05-03T12:00:00Z' }
    expect(isEmailVerified(user)).toBe(true)
  })

  it('returns false for a Supabase user with email_confirmed_at null', () => {
    const user = { email_confirmed_at: null }
    expect(isEmailVerified(user)).toBe(false)
  })

  it('returns false when user is null', () => {
    expect(isEmailVerified(null)).toBe(false)
  })

  it('returns false when email_confirmed_at is undefined', () => {
    const user = {}
    expect(isEmailVerified(user)).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- email-verified`
Expected: FAIL — `Cannot find module '@/lib/auth/email-verified'`

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/auth/email-verified.ts`:

```typescript
type WithEmailConfirmedAt = { email_confirmed_at?: string | null } | null | undefined

export function isEmailVerified(user: WithEmailConfirmedAt): boolean {
  if (!user) return false
  return Boolean(user.email_confirmed_at)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- email-verified`
Expected: PASS — all 4 tests green

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth/email-verified.ts src/__tests__/auth/email-verified.test.ts
git commit -m "feat(auth): add isEmailVerified helper with tests"
```

---

### Task 4: Apply verification gate in middleware

**Files:**
- Modify: `src/middleware.ts`

- [ ] **Step 1: Read current middleware**

Open `src/middleware.ts`. The Supabase path is `checkSupabaseAuth` (lines 42-69). It calls `supabase.auth.getUser()` and rejects if `user` is null.

- [ ] **Step 2: Add verification check after getUser**

After the `if (!user) return unauthorized(...)` line, add a verification check. Import `isEmailVerified` at the top:

```typescript
import { isEmailVerified } from '@/lib/auth/email-verified'
```

Then in `checkSupabaseAuth`, after the existing user-null check:

```typescript
const { data: { user } } = await supabase.auth.getUser()

if (!user) return unauthorized(request, pathname)

if (!isEmailVerified(user)) {
  // Allow access to a "verify" page so the user can act on this state
  if (pathname.startsWith('/verify')) return response
  if (pathname.startsWith('/api/auth/')) return response
  // Block everything else
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Email not verified' }, { status: 403 })
  }
  const verifyUrl = new URL('/verify', request.url)
  return NextResponse.redirect(verifyUrl)
}

return response
```

- [ ] **Step 3: Create the /verify landing page**

Create `src/app/verify/page.tsx`:

```tsx
'use client'

import { useState } from 'react'

export default function VerifyPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function resend() {
    setErr(null)
    const res = await fetch('/api/auth/resend-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setErr(data.error || 'Failed to resend')
      return
    }
    setSent(true)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-50 px-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-serif text-stone-800 mb-2">Verify your email</h1>
        <p className="text-stone-600 text-sm mb-6">
          We sent you a code to confirm your email. Enter it on the login page, or
          request a new one below.
        </p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="w-full border border-stone-300 rounded-lg px-3 py-2 mb-3"
        />
        <button
          onClick={resend}
          disabled={!email || sent}
          className="w-full bg-stone-800 text-white rounded-lg py-2 disabled:opacity-50"
        >
          {sent ? 'Sent — check your inbox' : 'Resend verification code'}
        </button>
        {err && <p className="text-red-600 text-sm mt-3">{err}</p>}
      </div>
    </main>
  )
}
```

- [ ] **Step 4: Manual verification**

Switch to a Supabase setup (set `USE_DEV_AUTH=false`, ensure `NEXT_PUBLIC_SUPABASE_*` vars are set). Sign up a new user — Supabase sends OTP. **Without** verifying, try to navigate to `/write`. Expected: redirect to `/verify`. Verify the OTP via the login page. Now `/write` should load.

- [ ] **Step 5: Commit**

```bash
git add src/middleware.ts src/app/verify/page.tsx
git commit -m "feat(auth): block access until email is verified"
```

---

### Task 5: Resend-OTP endpoint

**Files:**
- Create: `src/app/api/auth/resend-otp/route.ts`

- [ ] **Step 1: Write the route**

Create `src/app/api/auth/resend-otp/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase/server'
import { isDevAuth } from '@/lib/auth/config'

export async function POST(request: NextRequest) {
  if (isDevAuth) {
    return NextResponse.json({ success: true, message: 'Dev auth — no OTP needed' })
  }

  const { email } = await request.json()
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resend({ type: 'signup', email })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 2: Add a "Resend code" button to the OTP step on login**

Open `src/app/login/page.tsx`. Find the OTP-entry section (where the user enters the verification token). Add a button beneath the OTP input:

```tsx
<button
  type="button"
  onClick={async () => {
    const res = await fetch('/api/auth/resend-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    if (res.ok) setResendCooldown(60)
  }}
  disabled={resendCooldown > 0}
  className="text-sm text-stone-500 hover:text-stone-800 mt-2"
>
  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
</button>
```

Also add the cooldown state at the top of the component:

```typescript
const [resendCooldown, setResendCooldown] = useState(0)

useEffect(() => {
  if (resendCooldown <= 0) return
  const t = setTimeout(() => setResendCooldown(s => s - 1), 1000)
  return () => clearTimeout(t)
}, [resendCooldown])
```

- [ ] **Step 3: Manual verification**

In Supabase mode: sign up. Click "Resend code." Confirm a new OTP arrives. Confirm the button shows a 60s countdown.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/auth/resend-otp/route.ts src/app/login/page.tsx
git commit -m "feat(auth): add resend-OTP button with 60s cooldown"
```

---

### Task 6: Forgot-password endpoint

**Files:**
- Create: `src/app/api/auth/forgot/route.ts`

- [ ] **Step 1: Write the route**

Create `src/app/api/auth/forgot/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase/server'
import { isDevAuth } from '@/lib/auth/config'

export async function POST(request: NextRequest) {
  if (isDevAuth) {
    return NextResponse.json({ success: true, message: 'Dev auth — no password reset' })
  }

  const { email } = await request.json()
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset`,
  })

  // Don't leak whether the email exists — always return success
  if (error) console.error('reset password error:', error.message)
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/auth/forgot/route.ts
git commit -m "feat(auth): forgot-password endpoint via Supabase reset email"
```

---

### Task 7: Forgot-password page

**Files:**
- Create: `src/app/forgot/page.tsx`

- [ ] **Step 1: Write the page**

Create `src/app/forgot/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    await fetch('/api/auth/forgot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setSubmitting(false)
    setSubmitted(true)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-50 px-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-serif text-stone-800 mb-2">Reset your password</h1>
        {submitted ? (
          <p className="text-stone-600 text-sm">
            If an account exists for <strong>{email}</strong>, we sent a reset link.
            Check your inbox (and spam folder).
          </p>
        ) : (
          <form onSubmit={onSubmit}>
            <p className="text-stone-600 text-sm mb-4">
              Enter your email and we&apos;ll send you a link to set a new password.
            </p>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full border border-stone-300 rounded-lg px-3 py-2 mb-3"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-stone-800 text-white rounded-lg py-2 disabled:opacity-50"
            >
              {submitting ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}
        <Link href="/login" className="block text-center text-sm text-stone-500 mt-6">
          Back to login
        </Link>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Add 'Forgot password?' link on login page**

Open `src/app/login/page.tsx`. Find the password input on the email/password login form. Beneath it, add:

```tsx
<Link href="/forgot" className="text-sm text-stone-500 hover:text-stone-800">
  Forgot password?
</Link>
```

Make sure `Link` from `next/link` is imported.

- [ ] **Step 3: Commit**

```bash
git add src/app/forgot/page.tsx src/app/login/page.tsx
git commit -m "feat(auth): forgot-password page + link from login"
```

---

### Task 8: Reset-password endpoint + page

**Files:**
- Create: `src/app/api/auth/reset/route.ts`
- Create: `src/app/reset/page.tsx`

- [ ] **Step 1: Write the reset endpoint**

Create `src/app/api/auth/reset/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase/server'

export async function POST(request: NextRequest) {
  const { password } = await request.json()
  if (!password || typeof password !== 'string' || password.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters' },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  // The recovery session was set by Supabase when the user clicked the email link.
  // This call updates the currently-recovered user's password.
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 2: Write the reset page**

Create `src/app/reset/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ResetPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    if (password !== confirm) {
      setErr('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setErr('Password must be at least 8 characters')
      return
    }
    setSubmitting(true)
    const res = await fetch('/api/auth/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    setSubmitting(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setErr(data.error || 'Reset failed')
      return
    }
    router.push('/login?reset=success')
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-50 px-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-serif text-stone-800 mb-2">Set a new password</h1>
        <form onSubmit={onSubmit}>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            className="w-full border border-stone-300 rounded-lg px-3 py-2 mb-3"
          />
          <input
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm new password"
            className="w-full border border-stone-300 rounded-lg px-3 py-2 mb-3"
          />
          {err && <p className="text-red-600 text-sm mb-3">{err}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-stone-800 text-white rounded-lg py-2 disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Save new password'}
          </button>
        </form>
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Add /reset to public paths in middleware**

Open `src/middleware.ts`. The recovery flow lands on `/reset` *before* the user is fully authenticated. Add `/reset` to `PUBLIC_EXACT_PATHS`:

```typescript
const PUBLIC_EXACT_PATHS = ['/', '/pricing', '/forgot', '/reset']
```

(Add `/forgot` while you're there — also a public path.)

- [ ] **Step 4: Manual verification**

In Supabase mode: go to `/forgot`, submit email. Click the link in the reset email — should land on `/reset`. Set a new password. Should redirect to `/login?reset=success`. Log in with new password — should work.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/auth/reset/route.ts src/app/reset/page.tsx src/middleware.ts
git commit -m "feat(auth): password-reset flow (endpoint + page + public-path)"
```

---

### Task 9: Final integration check

- [ ] **Step 1: Run lint**

Run: `npm run lint`
Expected: no errors. Fix any that appear (most likely unused imports).

- [ ] **Step 2: Run tests**

Run: `npm run test`
Expected: all green, including the new `isEmailVerified` tests.

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: build succeeds with no type errors.

- [ ] **Step 4: Manual smoke test in dev mode**

```bash
docker compose restart app
docker compose logs -f app  # in another terminal
```

Visit `http://localhost:3111/login` — log in via dev quick-fill (`dev@hearth.app`). Verify:
- `/forgot` page renders
- `/reset` page renders
- Logging out clears localStorage `hearth-e2ee-master-key` (after enabling E2EE first)
- "Trust this device" checkbox toggle on UnlockModal works (verify in DevTools storage panel)

- [ ] **Step 5: Final commit (if any cleanup needed)**

```bash
git add -A
git status  # should be clean if no fixes needed
```

---

## Self-Review Checklist (run before handing off)

- [ ] Every task lists exact file paths under **Files**
- [ ] Every code step contains the actual code, not "implement X"
- [ ] No "TBD" / "TODO" / "fill in" placeholders remain
- [ ] `isEmailVerified` is consistently named across tasks 3 and 4
- [ ] `clearMasterKey` (no extra suffixes) is used in task 1 — matches `src/store/e2ee.ts:103`
- [ ] `storeMasterKey(key, ttlDays)` signature in task 2 matches `src/store/e2ee.ts:88`
- [ ] All commits are scoped (no cross-task file mixing)

---

## Rollback Plan

If anything goes wrong mid-execution:
- All commits are scoped per-task; revert with `git revert <sha>`
- No DB schema changes in this plan, so no migration rollback needed
- No env-var changes are required for the code to compile (Supabase env vars only matter at runtime in non-dev mode)
