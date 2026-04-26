# Home Screen Parallax & Scroll-to-Open Diary

**Status:** Design approved (2026-04-27)
**Owner:** Himanshu

## Goal

Replace the current `/write` route — which opens directly into the glass diary — with a personalized welcome zone that the user scrolls through to "open" the diary. The scroll itself becomes the act of opening a book.

## User Story

After signing in, Himanshu lands on `/write` and sees a full-viewport welcome screen: a time-of-day greeting with his name, a whisper from the current theme, contextual banners (a letter has arrived, it's his birthday), a small stats row, and a subtle "scroll to open your diary" cue. As he scrolls, a small closed diary at the bottom of the hero grows, centers, and its cover swings open — by the time he's a full viewport down, the diary is fully open and he can click to flip pages and write. Scrolling back up reverses the animation: the book closes, the welcome returns.

## Scope

**In scope:**
- New welcome zone on top of `/write` (hero above the existing diary)
- Scroll-driven open/close animation tied to scroll progress over the first viewport
- One new API endpoint aggregating greeting/stats/banner data
- Reduced-motion fallback
- Mobile variant (same scroll-open, no parallax layers)

**Out of scope:**
- Changes to the diary itself (pagination, page-flipping, doodle/photo/song features stay as they are)
- Changes to the public landing page at `/`
- Mood pulse charts, inspirational quotes (kept out per Q3)
- Changes to letters, themes, or auth

## Architecture

`/write` becomes a two-zone scrollable page:

```
┌─────────────────────────┐  ← scroll position 0
│                         │
│      WELCOME ZONE       │  100vh
│      (full hero)        │
│                         │
│   [closed diary peek]   │  ← scroll progress drives animation
├─────────────────────────┤  ← scroll position ~100vh
│                         │
│      DIARY STAGE        │  100vh (sticky-ish positioned)
│   (existing DeskScene)  │
│                         │
└─────────────────────────┘
```

`scrollYProgress` (from Framer Motion's `useScroll`) is `0` when the hero top is at the viewport top, and `1` when the hero bottom hits the viewport top. Three visual states are derived from this single progress value:

| Element                          | progress 0     | progress 1      |
|----------------------------------|----------------|-----------------|
| Welcome content                  | opaque, in place | faded, translated up ~40px |
| Closed-book peek (hero bottom)   | small, ≈30% width | full viewport, centered |
| Diary cover overlay              | covering open spread | rotated up ~120°, faded out |

Once at progress 1, the page is at the diary stage and the diary's existing pagination takes over — clicks/taps flip pages, no scroll involvement. Scrolling up reverses everything for free (Framer Motion transforms are reactive to scroll).

### File Layout

```
src/app/write/page.tsx                       # entry — renders <HomeScrollExperience />
src/components/home/HomeScrollExperience.tsx # orchestrator: scroll tracking + zone composition
src/components/home/WelcomeZone.tsx          # hero content
src/components/home/DiaryStage.tsx           # wraps DeskScene with scroll-driven transforms
src/app/api/home/route.ts                    # aggregated home data endpoint
src/hooks/useHomeData.ts                     # client hook fetching /api/home
```

`src/components/desk/` is untouched. The new `home/` folder keeps the welcome experience self-contained.

## Components

### `HomeScrollExperience`

Top-level orchestrator. Single `useScroll` instance bound to the welcome ref provides `scrollYProgress`. Renders `<WelcomeZone />` followed by `<DiaryStage />`. Detects mobile via `useMediaQuery('(max-width: 768px)')` and threads a `simplifiedMotion: boolean` prop down to children.

### `WelcomeZone`

Full viewport hero. Renders (in order):

1. **Greeting line** — "Good morning/afternoon/evening, {name}". Time-of-day cutoffs: morning < 12, afternoon < 17, otherwise evening. Name from `useAuthStore`. Falls back to "Welcome" if no display name.
2. **Whisper** — one whisper from the current theme's `whispers` array, picked deterministically by today's date so it's stable for the day. (Hash today's `YYYY-MM-DD` → index into array.)
3. **Banners (conditional)**:
   - `<LetterArrivedBanner />` if `banners.hasUnreadLetter` is true.
   - `<BirthdayBanner />` if `banners.isBirthday` is true.
4. **Stats row** — "12 entries this month · 4-day streak · 2 sealed letters waiting". Hidden entirely if all three values are 0 (avoids depressing first-day display).
5. **Scroll cue** — bouncing arrow + "Scroll to open your diary".

Parallax: on desktop, theme background ornaments translate at ~0.5× the scroll velocity while content moves at 1×. Two layers, no more. Disabled on mobile and when `prefers-reduced-motion: reduce`.

### `DiaryStage`

Wraps the existing `<DeskScene />` in a transform layer driven by `scrollYProgress`:

```tsx
const { scrollYProgress } = useScroll(...)
const bookScale    = useTransform(scrollYProgress, [0, 1], [0.3, 1])
const coverRotate  = useTransform(scrollYProgress, [0.4, 0.9], [0, -120])  // degrees
const coverOpacity = useTransform(scrollYProgress, [0.7, 1], [1, 0])
```

The cover overlay is a separate visual element above the open diary spread that rotates open and fades. The diary itself sits at full size beneath, scaled down by `bookScale` while progress < 1.

### `useHomeData`

Client hook. SWR or simple `useEffect` + `fetch` (no SWR in the project today, so plain `useEffect` is fine). Fetches `/api/home` once on mount, returns `{ data, loading, error }`. Welcome zone shows skeleton placeholders for stats/banners while loading; the greeting and whisper render immediately because they don't need the network.

## Data

### API: `GET /api/home`

Authenticated via `getCurrentUser()` like other API routes. Returns:

```ts
{
  name: string,                    // display name or "" if unset
  whisperSeed: string,             // "YYYY-MM-DD" for deterministic whisper pick
  stats: {
    entriesThisMonth: number,
    streak: number,                // consecutive days with entries, ending today
    sealedLetters: number,         // letters sealed and not yet delivered
  },
  banners: {
    hasUnreadLetter: boolean,      // any delivered letter the user hasn't opened
    isBirthday: boolean,           // today matches User.profile.birthday (MM-DD)
  }
}
```

**Implementation notes:**
- `entriesThisMonth`: `prisma.journalEntry.count({ where: { userId, createdAt: { gte: startOfMonth } } })`
- `streak`: query distinct `DATE(createdAt)` values for the user, sorted desc. Count consecutive days ending at today if today has an entry, else ending at yesterday. (So an active streak doesn't reset to 0 just because the user hasn't written *yet* today.) If yesterday has no entry either, streak is 0.
- `sealedLetters`: `prisma.journalEntry.count({ where: { userId, isSealed: true, isDelivered: false } })`
- `hasUnreadLetter`: a delivered letter that the user hasn't opened. (Existing letter-arrived flow already tracks this via `LetterArrivedBanner` — reuse the same query.)
- `isBirthday`: parse `User.profile.birthday` JSON field, compare `MM-DD` against today.

The greeting time-of-day is computed client-side (it depends on the user's local clock, not the server's).

## Scroll Mechanics

Framer Motion's `useScroll` returns motion values that update synchronously with scroll. We map progress through `useTransform`:

```tsx
const heroRef = useRef<HTMLDivElement>(null)
const { scrollYProgress } = useScroll({
  target: heroRef,
  offset: ['start start', 'end start'],
})

// Welcome content fade
const welcomeOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])
const welcomeY       = useTransform(scrollYProgress, [0, 1], [0, -40])

// Book peek -> full diary
const bookScale      = useTransform(scrollYProgress, [0, 1], [0.3, 1])
const bookY          = useTransform(scrollYProgress, [0, 1], ['85%', '0%'])

// Cover swings open
const coverRotate    = useTransform(scrollYProgress, [0.4, 0.9], [0, -120])
const coverOpacity   = useTransform(scrollYProgress, [0.7, 1], [1, 0])

// Parallax (desktop only)
const ornamentY      = useTransform(scrollYProgress, [0, 1], [0, -100])  // moves slower than -200 of content
```

**Reduced motion (`prefers-reduced-motion: reduce`):**
- `bookScale` stays (the metaphor depends on it).
- `coverRotate` is dropped — cover just fades out via `coverOpacity`.
- `welcomeY`, `ornamentY` set to constant 0.
- Bouncing scroll-cue arrow becomes a static arrow.

**Mobile (`max-width: 768px`):**
- Same `bookScale`, `coverRotate`, `coverOpacity`, `welcomeOpacity`.
- `ornamentY` parallax dropped (set to 0).
- `welcomeY` reduced to 0 to avoid jank during mobile address-bar collapse.

## Edge Cases

- **No entries, no letters:** stats row hidden, banners hidden. Greeting + whisper + scroll cue still render.
- **No name:** "Welcome" (no comma, no name).
- **Empty whisper array (defensive):** fall back to a single hard-coded whisper string.
- **Short viewport:** hero is `100vh` so it always fits the viewport. If hero content overflows (lots of stacked banners on a small phone), allow internal scroll inside the hero — outer page scroll still drives the diary animation.
- **API failure:** show greeting + whisper + scroll cue; suppress stats and banners (don't block the user from getting to their diary because stats failed to load).

## Risks & Mitigations

- **Mobile Safari scroll quirks (address bar collapse during scroll):** mitigated by dropping vertical parallax translations on mobile so the only motion tied to scroll is `bookScale` and `coverRotate`/`coverOpacity`, which are insensitive to viewport-height jitter.
- **Performance:** all animations use `transform` and `opacity` (compositor-only). No layout-affecting properties animate.
- **Streak calculation cost:** if a user has thousands of entries, the streak query could be slow. Mitigation: cap the lookback to 365 days — if the streak is over a year long, it's still shown as "365+".

## Verification

No test framework is configured in the project (only ESLint), so verification is manual plus typecheck/lint.

**Manual desktop:**
- Open `/write` — hero full viewport, diary peeks at the bottom.
- Scroll down — book scales, cover rotates open, welcome fades.
- At full scroll — diary open, clicks flip pages (existing behavior).
- Scroll back up — book closes, welcome returns.
- Verify parallax: theme ornaments visibly lag content during scroll.
- Cycle through all 10 themes — whisper and ornaments adapt.

**Manual mobile (real device + DevTools mobile mode):**
- Same scroll-open works.
- No parallax-layer jank during address-bar collapse.
- Existing diary pagination/touch gestures still work after open.

**Conditional content:**
- 0 entries / 0 letters → stats row hidden.
- Sealed letter ready → letter banner shows.
- Birthday → birthday banner shows (test by faking `User.profile.birthday`).
- `prefers-reduced-motion: reduce` set in DevTools → cover fades instead of rotating, ornaments don't parallax.

**Type/lint:** `npm run lint` passes, `npm run build` succeeds.

## Open Questions

None as of approval. Any later refinements (greeting copy, exact stat labels, motion timing curves) are visual polish for the implementation phase, not design decisions.
