# Journal Theme & Font Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace 11 of 12 current themes with 10 new paper-textured themes from the Journal Redesign mockups (keeping Rivendell), swap Playfair Display for EB Garamond, add a `mode: 'light' | 'dark'` field used by a new theme-aware Stars page renderer split (constellation in dark, garden in light).

**Architecture:** Visual + theme + renderer-split overhaul. Zero changes to: data model, schema, API, editor (TipTap), Journal page layout, or feature behavior. New code centralizes in `src/lib/themes.ts`, `src/store/theme.ts`, `src/components/Background.tsx`, `src/components/ThemeSwitcher.tsx`, and a new `src/components/constellation/` directory. Fonts are already loaded by `next/font/google`; only the font choice swaps.

**Tech Stack:** Next.js 16 (App Router), React 19, Zustand for theme state, Framer Motion for animation, `next/font/google` for fonts, TipTap editor (untouched).

**Reference spec:** `docs/superpowers/specs/2026-04-27-journal-theme-overhaul-design.md`

**No automated test framework is configured** in this repo (`package.json` has no `test` script, no `*.test.ts(x)` files, no vitest/jest config). For each task, verification is one of:
- `npm run lint` (or `docker compose exec app npm run lint`) — passes for type/lint changes
- `npm run build` — passes for type-checking the whole app
- Browser visual check at `http://localhost:3111` after `docker compose restart app` — for visual changes
- Inline node/TS check (`npx tsx -e '...'`) — for pure-logic changes like the localStorage migration

When the user runs the dev stack via Docker, prefix `npm` commands with `docker compose exec app`. Otherwise plain `npm` works locally if Node is set up. Both forms are noted in steps below.

---

## Pre-flight: Branch setup

### Task 0: Preserve current state on a new branch, start working branch

**Files:** none (git only)

- [ ] **Step 1: Verify clean working state and current branch**

```bash
git status
git branch --show-current
```

Expected: branch is `main`. Working tree may have uncommitted changes from earlier sessions (per the gitStatus snapshot: `package.json`, `pnpm-lock.yaml`, several component files). **Do not discard them.** They should be preserved on the safety branch.

- [ ] **Step 2: Stage and commit any uncommitted changes on main first (if any), so they end up on the preservation branch**

If `git status` shows modified files, ask the user how to handle them before continuing — they may be in-progress work that shouldn't ship with this redesign. Do NOT auto-commit ambiguous changes.

If there are no uncommitted changes, proceed to step 3.

- [ ] **Step 3: Create the preservation branch pointing at current main**

```bash
git branch claude-design-pre-overhaul
```

This creates the safety branch at the current `main` HEAD. Existing work is now recoverable from `claude-design-pre-overhaul`.

- [ ] **Step 4: Create and switch to the working branch**

```bash
git checkout -b feat/design-overhaul-themes
```

- [ ] **Step 5: Verify branches**

```bash
git branch
```

Expected: `claude-design-pre-overhaul` listed, current branch marked `* feat/design-overhaul-themes`.

- [ ] **Step 6: Commit nothing (no code changes yet)** — proceed to Task 1.

---

## Phase 1: Foundation

### Task 1: Add `mode: 'light' | 'dark'` to the Theme interface and existing Rivendell

**Files:**
- Modify: `src/lib/themes.ts`

- [ ] **Step 1: Open `src/lib/themes.ts` and add `mode` to the Theme interface**

In the `Theme` interface (around line 5-40), add the `mode` field right after `description`:

```ts
export interface Theme {
  name: string
  description: string
  mode: 'light' | 'dark'   // NEW
  bg: { primary: string; secondary: string; gradient: string }
  // ... rest unchanged
}
```

- [ ] **Step 2: Add `mode: 'dark'` to the existing `rivendellTheme` object**

In the `rivendellTheme` definition (around line 43-78), insert `mode: 'dark',` right after the `description` field:

```ts
export const rivendellTheme: Theme = {
  name: 'Rivendell Sunset',
  description: 'Elvish forest at golden hour',
  mode: 'dark',   // NEW
  bg: { ... },
  // ... rest unchanged
}
```

- [ ] **Step 3: Add `mode` to every other existing theme object so the file still type-checks**

Even though we'll delete most of these in Task 2, the file must compile in the meantime. Add the appropriate `mode` to each existing theme:

- `hobbitonTheme` → `mode: 'dark'`
- `winterSunsetTheme` → `mode: 'dark'`
- `cherryBlossomTheme` → `mode: 'dark'`
- `northernLightsTheme` → `mode: 'dark'`
- `mistyMountainsTheme` → `mode: 'dark'`
- `gentleRainTheme` → `mode: 'dark'`
- `cosmosTheme` → `mode: 'dark'`
- `candlelightTheme` → `mode: 'dark'`
- `oceanTwilightTheme` → `mode: 'dark'`
- `quietSnowTheme` → `mode: 'dark'`
- `warmPeacefulTheme` → `mode: 'light'`  *(this is the only existing light theme)*

- [ ] **Step 4: Type-check**

```bash
docker compose exec app npm run build
# or, if running locally:
npm run build
```

Expected: build succeeds with no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/themes.ts
git commit -m "feat(themes): add mode field to Theme interface"
```

---

### Task 2: Swap font from Playfair Display to EB Garamond

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css` (likely; check current usage of `--font-playfair`)

- [ ] **Step 1: Find all usages of `--font-playfair` in the codebase**

```bash
grep -rn "font-playfair\|Playfair" src/
```

Note the files and lines that reference it. Each will need a corresponding change (either to `--font-serif` or by leaving the variable name and just changing the underlying font).

**Strategy:** rename the CSS variable to `--font-serif` (cleaner, font-name agnostic) and update all references in one sweep. Caveat stays as `--font-caveat` (it's still Caveat).

- [ ] **Step 2: Update `src/app/layout.tsx`**

Replace the import and font setup:

```tsx
// before:
import { Playfair_Display, Caveat } from "next/font/google";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
});

// after:
import { EB_Garamond, Caveat } from "next/font/google";

const ebGaramond = EB_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
});
```

Update the body className accordingly:

```tsx
// before:
<body className={`${playfair.variable} ${caveat.variable} antialiased`}>
// after:
<body className={`${ebGaramond.variable} ${caveat.variable} antialiased font-serif`}>
```

The `font-serif` class makes EB Garamond the default body font globally. (Tailwind's `font-serif` resolves via `var(--font-serif)` once we wire it in `globals.css` — see Step 3.)

- [ ] **Step 3: Update `src/app/globals.css` to use `--font-serif` and set the body default**

Find any `--font-playfair` references and rename to `--font-serif`. Add (or update) the body font-family to use it:

```css
body {
  font-family: var(--font-serif), 'Cormorant Garamond', 'Iowan Old Style', Georgia, serif;
}
```

If Tailwind's `font-serif` utility is configured in `tailwind.config.ts`, update its mapping there too. If unsure, just rely on the CSS variable directly via `style={{ fontFamily: 'var(--font-serif)' }}` in components.

- [ ] **Step 4: Update remaining grep hits from Step 1**

For every file that still references `font-playfair`, change to `font-serif`. Do not change references to `font-caveat` — those are still correct.

- [ ] **Step 5: Verify build and visual**

```bash
docker compose exec app npm run build
docker compose restart app
```

Open `http://localhost:3111`, confirm body text now renders in EB Garamond (humanist serif, not high-contrast Playfair). Caveat-styled elements (mood word, dates, etc.) should look unchanged.

- [ ] **Step 6: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css [other-files-touched]
git commit -m "feat(fonts): swap Playfair Display for EB Garamond as body serif"
```

---

## Phase 2: Theme palettes

### Task 3: Drop unused themes from themes.ts, keep Rivendell only

**Files:**
- Modify: `src/lib/themes.ts`

- [ ] **Step 1: Delete every theme export except `rivendellTheme`**

In `src/lib/themes.ts`, remove the `const` exports for: `hobbitonTheme`, `winterSunsetTheme`, `cherryBlossomTheme`, `northernLightsTheme`, `mistyMountainsTheme`, `gentleRainTheme`, `cosmosTheme`, `candlelightTheme`, `oceanTwilightTheme`, `quietSnowTheme`, `warmPeacefulTheme`. Keep `rivendellTheme`.

- [ ] **Step 2: Update the `ThemeName` type union**

```ts
// before:
export type ThemeName = 'rivendell' | 'hobbiton' | 'winterSunset' | 'cherryBlossom' | 'northernLights' | 'mistyMountains' | 'gentleRain' | 'cosmos' | 'candlelight' | 'oceanTwilight' | 'quietSnow' | 'warmPeaceful'

// after (this will grow in Task 4-6 as we add new themes):
export type ThemeName = 'rivendell'
```

- [ ] **Step 3: Update the `themes` record to only include rivendell**

```ts
export const themes: Record<ThemeName, Theme> = {
  rivendell: rivendellTheme,
}
```

- [ ] **Step 4: Update the `particles` and `ambience` type unions to remove no-longer-used values (and add new ones)**

Replace the existing union types:

```ts
// in the Theme interface:
particles: 'fireflies' | 'embers' | 'goldFlecks' | 'leaves' | 'sakura' | 'sunbeam' | 'foam' | 'mist' | 'dust'
ambience: 'forest' | 'firelight' | 'midnight' | 'sun' | 'rose' | 'sage' | 'ocean' | 'saffron' | 'garden' | 'postal' | 'linen'
```

(These cover Rivendell + the 10 new themes. We'll wire up `embers`, `goldFlecks`, and `leaves` particle implementations in Phase 4.)

- [ ] **Step 5: Type-check**

```bash
docker compose exec app npm run build
```

Expected: errors in files that reference removed theme names (e.g., `theme.ts` defaults to `winterSunset`, `ThemeSwitcher.tsx` has emoji map for all 12). **Do not fix them yet** — Task 4 fixes the store default; Task 7 fixes the switcher. The build will be temporarily broken between Task 3 and Task 4.

- [ ] **Step 6: Commit (build-broken state — acceptable for the next task to fix)**

```bash
git add src/lib/themes.ts
git commit -m "feat(themes): remove dropped themes, keep only Rivendell"
```

---

### Task 4: Add 5 new themes (hearth, paperSun, rose, sage, ocean) and fix store default

**Files:**
- Modify: `src/lib/themes.ts`
- Modify: `src/store/theme.ts`

The hex values below are starting palettes derived from the mockup screenshots. Side-by-side render comparison during browser verification will reveal any palette that needs tuning — adjust as needed and commit a follow-up tweak.

- [ ] **Step 1: Append `hearthTheme` to themes.ts**

Insert after `rivendellTheme`:

```ts
// Hearth — firelight night (deep brown + amber + cream)
export const hearthTheme: Theme = {
  name: 'Hearth',
  description: 'Firelight at the close of the day',
  mode: 'dark',
  bg: {
    primary: '#1A140E',
    secondary: '#221A12',
    gradient: 'linear-gradient(180deg, #221A12 0%, #1A140E 50%, #14100A 100%)',
  },
  text: {
    primary: '#E8DCC8',
    secondary: '#C8B898',
    muted: '#8A7858',
  },
  accent: {
    primary: '#C8742C',
    secondary: '#B0651F',
    warm: '#E8A050',
    highlight: '#FFD090',
  },
  glass: {
    bg: 'rgba(34, 26, 18, 0.55)',
    border: 'rgba(200, 116, 44, 0.15)',
    blur: '28px',
  },
  moods: {
    0: '#5A4A3A',
    1: '#7A6A50',
    2: '#A08050',
    3: '#C8742C',
    4: '#E8A050',
  },
  moodEmojis: ['🔥', '🕯️', '✨', '🌟', '💫'],
  moodLabels: ['Embers', 'Flicker', 'Steady', 'Bright', 'Glowing'],
  particles: 'embers',
  ambience: 'firelight',
}
```

- [ ] **Step 2: Append `paperSunTheme`**

```ts
// Paper Sun — warm cream paper with rust accent
export const paperSunTheme: Theme = {
  name: 'Paper Sun',
  description: 'Warm afternoon light on cream paper',
  mode: 'light',
  bg: {
    primary: '#F5E8C8',
    secondary: '#F0E0B5',
    gradient: 'linear-gradient(180deg, #F8EDD0 0%, #F2E2B8 50%, #ECD8A8 100%)',
  },
  text: {
    primary: '#3A2818',
    secondary: '#6A4F30',
    muted: '#9A7B58',
  },
  accent: {
    primary: '#B8612A',
    secondary: '#9A4F1F',
    warm: '#D4823A',
    highlight: '#E89A50',
  },
  glass: {
    bg: 'rgba(248, 237, 208, 0.65)',
    border: 'rgba(184, 97, 42, 0.2)',
    blur: '24px',
  },
  moods: {
    0: '#8A7050',
    1: '#A88858',
    2: '#C49060',
    3: '#B8612A',
    4: '#D4823A',
  },
  moodEmojis: ['☁️', '🌤️', '☀️', '🌻', '🌅'],
  moodLabels: ['Heavy', 'Low', 'Okay', 'Good', 'Radiant'],
  particles: 'sunbeam',
  ambience: 'sun',
}
```

- [ ] **Step 3: Append `roseTheme`**

```ts
// Rose — blush & cherry blossom paper
export const roseTheme: Theme = {
  name: 'Rose',
  description: 'Blush paper and cherry blossom drift',
  mode: 'light',
  bg: {
    primary: '#FFEAEA',
    secondary: '#F8D8D0',
    gradient: 'linear-gradient(180deg, #FFEEEC 0%, #F8DCD4 50%, #F2D0CC 100%)',
  },
  text: {
    primary: '#3A2025',
    secondary: '#6A4048',
    muted: '#9A7078',
  },
  accent: {
    primary: '#9A4555',
    secondary: '#843E4F',
    warm: '#C2667A',
    highlight: '#D88898',
  },
  glass: {
    bg: 'rgba(255, 234, 234, 0.7)',
    border: 'rgba(154, 69, 85, 0.18)',
    blur: '24px',
  },
  moods: {
    0: '#7A6068',
    1: '#9A707A',
    2: '#C2667A',
    3: '#9A4555',
    4: '#D88898',
  },
  moodEmojis: ['🥀', '🌸', '💮', '🌷', '🏵️'],
  moodLabels: ['Wilting', 'Budding', 'Blooming', 'Radiant', 'Full Bloom'],
  particles: 'sakura',
  ambience: 'rose',
}
```

- [ ] **Step 4: Append `sageTheme`**

```ts
// Sage — matcha & cream
export const sageTheme: Theme = {
  name: 'Sage',
  description: 'Matcha morning, cream paper',
  mode: 'light',
  bg: {
    primary: '#E8E8CC',
    secondary: '#D8DDB8',
    gradient: 'linear-gradient(180deg, #ECECCE 0%, #DCE0BC 50%, #CED4AC 100%)',
  },
  text: {
    primary: '#2F2D1F',
    secondary: '#5A5A40',
    muted: '#8A8868',
  },
  accent: {
    primary: '#6B7A4B',
    secondary: '#5A6840',
    warm: '#8A9A65',
    highlight: '#A8B888',
  },
  glass: {
    bg: 'rgba(232, 232, 204, 0.7)',
    border: 'rgba(107, 122, 75, 0.2)',
    blur: '24px',
  },
  moods: {
    0: '#7A7858',
    1: '#8A8868',
    2: '#6B7A4B',
    3: '#8A9A65',
    4: '#A8B888',
  },
  moodEmojis: ['🍂', '🌱', '🌿', '🌾', '🍃'],
  moodLabels: ['Heavy', 'Low', 'Okay', 'Good', 'Radiant'],
  particles: 'leaves',
  ambience: 'sage',
}
```

- [ ] **Step 5: Append `oceanTheme`**

```ts
// Ocean — misty seaside dawn
export const oceanTheme: Theme = {
  name: 'Ocean',
  description: 'Pale dawn light on the harbour',
  mode: 'light',
  bg: {
    primary: '#E8E8E0',
    secondary: '#D8D8D0',
    gradient: 'linear-gradient(180deg, #ECECE4 0%, #DCDCD4 50%, #CCCCCC 100%)',
  },
  text: {
    primary: '#2A2820',
    secondary: '#54584C',
    muted: '#8A8A78',
  },
  accent: {
    primary: '#2C5260',
    secondary: '#1F4250',
    warm: '#4A7080',
    highlight: '#7090A0',
  },
  glass: {
    bg: 'rgba(232, 232, 224, 0.7)',
    border: 'rgba(44, 82, 96, 0.18)',
    blur: '24px',
  },
  moods: {
    0: '#5A6868',
    1: '#7A8888',
    2: '#2C5260',
    3: '#4A7080',
    4: '#7090A0',
  },
  moodEmojis: ['🌫️', '🌊', '🐚', '🌅', '✨'],
  moodLabels: ['Misty', 'Drifting', 'Surfacing', 'Clear', 'Radiant'],
  particles: 'foam',
  ambience: 'ocean',
}
```

- [ ] **Step 6: Update the `ThemeName` union and `themes` record**

```ts
export type ThemeName =
  | 'rivendell'
  | 'hearth'
  | 'paperSun'
  | 'rose'
  | 'sage'
  | 'ocean'

export const themes: Record<ThemeName, Theme> = {
  rivendell: rivendellTheme,
  hearth: hearthTheme,
  paperSun: paperSunTheme,
  rose: roseTheme,
  sage: sageTheme,
  ocean: oceanTheme,
}
```

(We'll add the remaining 5 themes in Task 5 — keeping Tasks 4 and 5 split makes commits cleaner and lets us check 5 themes render correctly before adding the next 5.)

- [ ] **Step 7: Update the theme store default (currently `winterSunset`, which we deleted)**

In `src/store/theme.ts`, change:

```ts
// before:
themeName: 'winterSunset',
theme: themes.winterSunset,

// after:
themeName: 'rivendell',
theme: themes.rivendell,
```

- [ ] **Step 8: Type-check and visually verify**

```bash
docker compose exec app npm run build
docker compose restart app
```

Open the app. Even if the ThemeSwitcher is broken (we'll fix it in Task 7), you can verify each new theme by temporarily editing `src/store/theme.ts` to start in each one, restarting, and visually comparing to the corresponding mockup. **Note any palette that feels off** for adjustment after Task 7 lands.

- [ ] **Step 9: Commit**

```bash
git add src/lib/themes.ts src/store/theme.ts
git commit -m "feat(themes): add hearth, paperSun, rose, sage, ocean themes"
```

---

### Task 5: Add remaining 5 themes (saffron, garden, postal, linen, midnight)

**Files:**
- Modify: `src/lib/themes.ts`

- [ ] **Step 1: Append `saffronTheme`**

```ts
// Saffron — marigold paper with indigo accent
export const saffronTheme: Theme = {
  name: 'Saffron',
  description: 'Marigold petals and indigo evening',
  mode: 'light',
  bg: {
    primary: '#F2DA9A',
    secondary: '#ECCF80',
    gradient: 'linear-gradient(180deg, #F5DFA0 0%, #EFD488 50%, #E8C870 100%)',
  },
  text: {
    primary: '#2A2218',
    secondary: '#54422A',
    muted: '#8A6E48',
  },
  accent: {
    primary: '#283057',
    secondary: '#1F244A',
    warm: '#B05028',
    highlight: '#D87045',
  },
  glass: {
    bg: 'rgba(242, 218, 154, 0.7)',
    border: 'rgba(40, 48, 87, 0.2)',
    blur: '24px',
  },
  moods: {
    0: '#8A7848',
    1: '#A88858',
    2: '#B05028',
    3: '#283057',
    4: '#D87045',
  },
  moodEmojis: ['🌑', '🌒', '🌕', '🌟', '✨'],
  moodLabels: ['Heavy', 'Low', 'Okay', 'Good', 'Radiant'],
  particles: 'sakura',
  ambience: 'saffron',
}
```

- [ ] **Step 2: Append `gardenTheme`**

```ts
// Garden — pressed flora on sage paper
export const gardenTheme: Theme = {
  name: 'Garden',
  description: 'Pressed flora between cream pages',
  mode: 'light',
  bg: {
    primary: '#EBE9CD',
    secondary: '#DDDABA',
    gradient: 'linear-gradient(180deg, #EFEDD0 0%, #E1DEBE 50%, #D3CFAA 100%)',
  },
  text: {
    primary: '#2D2A20',
    secondary: '#5A5440',
    muted: '#8A8260',
  },
  accent: {
    primary: '#A04E2F',
    secondary: '#8A4225',
    warm: '#C26B45',
    highlight: '#D88A65',
  },
  glass: {
    bg: 'rgba(235, 233, 205, 0.7)',
    border: 'rgba(160, 78, 47, 0.18)',
    blur: '24px',
  },
  moods: {
    0: '#7A7858',
    1: '#8A8268',
    2: '#A04E2F',
    3: '#C26B45',
    4: '#D88A65',
  },
  moodEmojis: ['🍂', '🌱', '🌿', '🌷', '🌻'],
  moodLabels: ['Wilting', 'Budding', 'Blooming', 'Radiant', 'Full Bloom'],
  particles: 'leaves',
  ambience: 'garden',
}
```

- [ ] **Step 3: Append `postalTheme`**

```ts
// Postal — letter office parchment with indigo + rust
export const postalTheme: Theme = {
  name: 'Postal',
  description: 'A quiet letter office at dusk',
  mode: 'light',
  bg: {
    primary: '#F0E5C8',
    secondary: '#E8DBB6',
    gradient: 'linear-gradient(180deg, #F4EACE 0%, #ECDFBC 50%, #E4D4AA 100%)',
  },
  text: {
    primary: '#2A2418',
    secondary: '#54482C',
    muted: '#8A7A4A',
  },
  accent: {
    primary: '#1F2750',
    secondary: '#161D40',
    warm: '#B04830',
    highlight: '#D26845',
  },
  glass: {
    bg: 'rgba(240, 229, 200, 0.7)',
    border: 'rgba(31, 39, 80, 0.2)',
    blur: '24px',
  },
  moods: {
    0: '#7A7050',
    1: '#9A8858',
    2: '#1F2750',
    3: '#B04830',
    4: '#D26845',
  },
  moodEmojis: ['✉️', '📮', '📬', '💌', '✨'],
  moodLabels: ['Heavy', 'Low', 'Okay', 'Good', 'Radiant'],
  particles: 'dust',
  ambience: 'postal',
}
```

- [ ] **Step 4: Append `linenTheme`**

```ts
// Linen — minimal off-white linen with soft rust
export const linenTheme: Theme = {
  name: 'Linen',
  description: 'Minimal calm on linen-textured paper',
  mode: 'light',
  bg: {
    primary: '#F5EFE0',
    secondary: '#EDE3D0',
    gradient: 'linear-gradient(180deg, #F8F3E5 0%, #F0E7D5 50%, #E8DCC4 100%)',
  },
  text: {
    primary: '#2A2520',
    secondary: '#5A4F40',
    muted: '#8A7C68',
  },
  accent: {
    primary: '#A85530',
    secondary: '#944525',
    warm: '#C27050',
    highlight: '#D88870',
  },
  glass: {
    bg: 'rgba(245, 239, 224, 0.7)',
    border: 'rgba(168, 85, 48, 0.16)',
    blur: '22px',
  },
  moods: {
    0: '#8A7868',
    1: '#A89080',
    2: '#A85530',
    3: '#C27050',
    4: '#D88870',
  },
  moodEmojis: ['☁️', '🌤️', '☀️', '🌻', '🌅'],
  moodLabels: ['Heavy', 'Low', 'Okay', 'Good', 'Radiant'],
  particles: 'dust',
  ambience: 'linen',
}
```

- [ ] **Step 5: Append `midnightTheme`**

```ts
// Midnight — gold leaf library
export const midnightTheme: Theme = {
  name: 'Midnight',
  description: 'A library after hours, lit by gold leaf',
  mode: 'dark',
  bg: {
    primary: '#0E1830',
    secondary: '#142040',
    gradient: 'linear-gradient(180deg, #142040 0%, #0E1830 50%, #0A1428 100%)',
  },
  text: {
    primary: '#E8DCC0',
    secondary: '#B8A88A',
    muted: '#7A6A50',
  },
  accent: {
    primary: '#C9A04A',
    secondary: '#B08838',
    warm: '#E0BC68',
    highlight: '#F2D488',
  },
  glass: {
    bg: 'rgba(20, 32, 64, 0.55)',
    border: 'rgba(201, 160, 74, 0.18)',
    blur: '32px',
  },
  moods: {
    0: '#3A4055',
    1: '#5A5070',
    2: '#7A6A50',
    3: '#C9A04A',
    4: '#F2D488',
  },
  moodEmojis: ['🌑', '🌒', '🌓', '🌔', '🌕'],
  moodLabels: ['Heavy', 'Low', 'Okay', 'Good', 'Radiant'],
  particles: 'goldFlecks',
  ambience: 'midnight',
}
```

- [ ] **Step 6: Update the `ThemeName` union and `themes` record to include all 11**

```ts
export type ThemeName =
  | 'rivendell'
  | 'hearth'
  | 'paperSun'
  | 'rose'
  | 'sage'
  | 'ocean'
  | 'saffron'
  | 'garden'
  | 'postal'
  | 'linen'
  | 'midnight'

export const themes: Record<ThemeName, Theme> = {
  rivendell: rivendellTheme,
  hearth: hearthTheme,
  paperSun: paperSunTheme,
  rose: roseTheme,
  sage: sageTheme,
  ocean: oceanTheme,
  saffron: saffronTheme,
  garden: gardenTheme,
  postal: postalTheme,
  linen: linenTheme,
  midnight: midnightTheme,
}
```

- [ ] **Step 7: Type-check**

```bash
docker compose exec app npm run build
```

Expected: passes (other than ThemeSwitcher emoji map, which Task 7 fixes; if the build still fails on emoji map references, temporarily delete the emoji map entries for removed themes — Task 7 will rewrite that file anyway).

- [ ] **Step 8: Commit**

```bash
git add src/lib/themes.ts
git commit -m "feat(themes): add saffron, garden, postal, linen, midnight themes"
```

---

## Phase 3: Theme migration

### Task 6: Add localStorage migration for old theme names

**Files:**
- Modify: `src/store/theme.ts`

- [ ] **Step 1: Add a migration map and `onRehydrateStorage` handler**

Replace the contents of `src/store/theme.ts`:

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { themes, Theme, ThemeName } from '@/lib/themes'

const LEGACY_THEME_REMAP: Record<string, ThemeName> = {
  cherryBlossom: 'rose',
  winterSunset: 'hearth',
  northernLights: 'midnight',
  mistyMountains: 'linen',
  gentleRain: 'ocean',
  cosmos: 'midnight',
  candlelight: 'hearth',
  oceanTwilight: 'ocean',
  quietSnow: 'linen',
  warmPeaceful: 'paperSun',
  hobbiton: 'sage',
}

function resolveThemeName(name: string | undefined): ThemeName {
  if (!name) return 'rivendell'
  if (name in themes) return name as ThemeName
  if (name in LEGACY_THEME_REMAP) return LEGACY_THEME_REMAP[name]
  return 'rivendell'
}

interface ThemeStore {
  themeName: ThemeName
  theme: Theme
  setTheme: (name: ThemeName) => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      themeName: 'rivendell',
      theme: themes.rivendell,
      setTheme: (name: ThemeName) => set({
        themeName: name,
        theme: themes[name],
      }),
    }),
    {
      name: 'hearth-theme',
      onRehydrateStorage: () => (state) => {
        if (!state) return
        const resolved = resolveThemeName(state.themeName as unknown as string)
        if (resolved !== state.themeName) {
          state.themeName = resolved
          state.theme = themes[resolved]
        } else {
          // ensure the cached theme object matches the current themes export
          // (shape may have changed across deploys, e.g. mode field added)
          state.theme = themes[resolved]
        }
      },
    }
  )
)
```

- [ ] **Step 2: Verify with an inline node script**

Create a temporary file `/tmp/check-migration.ts`:

```ts
const LEGACY_THEME_REMAP = {
  cherryBlossom: 'rose',
  winterSunset: 'hearth',
  northernLights: 'midnight',
  mistyMountains: 'linen',
  gentleRain: 'ocean',
  cosmos: 'midnight',
  candlelight: 'hearth',
  oceanTwilight: 'ocean',
  quietSnow: 'linen',
  warmPeaceful: 'paperSun',
  hobbiton: 'sage',
}

const knownThemes = ['rivendell', 'hearth', 'paperSun', 'rose', 'sage', 'ocean', 'saffron', 'garden', 'postal', 'linen', 'midnight']

function resolveThemeName(name: string | undefined) {
  if (!name) return 'rivendell'
  if (knownThemes.includes(name)) return name
  if (name in LEGACY_THEME_REMAP) return (LEGACY_THEME_REMAP as Record<string, string>)[name]
  return 'rivendell'
}

const cases: [string | undefined, string][] = [
  [undefined, 'rivendell'],
  ['rivendell', 'rivendell'],
  ['cherryBlossom', 'rose'],
  ['winterSunset', 'hearth'],
  ['cosmos', 'midnight'],
  ['hobbiton', 'sage'],
  ['warmPeaceful', 'paperSun'],
  ['unknownGarbage', 'rivendell'],
  ['midnight', 'midnight'],
]
let ok = true
for (const [input, expected] of cases) {
  const got = resolveThemeName(input)
  const pass = got === expected
  if (!pass) ok = false
  console.log(`${pass ? 'OK ' : 'FAIL'} resolveThemeName(${JSON.stringify(input)}) = ${got} (expected ${expected})`)
}
process.exit(ok ? 0 : 1)
```

Run it:

```bash
docker compose exec app npx tsx /tmp/check-migration.ts
# or locally:
npx tsx /tmp/check-migration.ts
```

Expected: all 9 cases print `OK` and exit code 0.

- [ ] **Step 3: Manual browser smoke test for stored old theme**

```bash
docker compose restart app
```

Open dev tools at `http://localhost:3111`, run in the console:

```js
localStorage.setItem('hearth-theme', JSON.stringify({ state: { themeName: 'cherryBlossom' }, version: 0 }))
location.reload()
```

After reload, run:

```js
JSON.parse(localStorage.getItem('hearth-theme'))
```

Expected: `themeName` is now `"rose"`. The page should load without errors.

- [ ] **Step 4: Commit**

```bash
git add src/store/theme.ts
git commit -m "feat(themes): migrate dropped theme names from localStorage"
```

---

## Phase 4: Particle systems

### Task 7: Add `embers` particle type to Background.tsx

**Files:**
- Modify: `src/components/Background.tsx`

- [ ] **Step 1: Read the current Background.tsx structure to find the particle dispatch**

```bash
grep -n "particles ===" /Users/himanshut4d/Documents/Personal_projects/feel_good/hearth/src/components/Background.tsx | head -20
```

The file (1488 lines) renders different particle systems based on `theme.particles`. Each existing particle type (`fireflies`, `snow`, `sakura`, etc.) has its own component or branch. Find an existing similar particle (e.g., `fireflies` — also small glowing dots that rise) and use it as the structural template.

- [ ] **Step 2: Implement the `Embers` particle system**

Add a new `Embers` component near the existing `Fireflies` component. Embers should:
- Spawn ~30–50 small particles (warm orange/amber color, sized 1.5–4px)
- Each particle drifts UPWARD slowly (y: bottom → top, 8–14s duration)
- Slight horizontal sway (sin wave, low amplitude)
- Opacity fades in from 0, peaks ~0.7, fades to 0 near the top
- Color: pull from `theme.accent.warm` and `theme.accent.highlight` (alternate)
- Disable when the user-level `animationsEnabled` flag is off (see how existing particles consult this — likely via `useDeskSettings` hook)

Use Framer Motion (already in use). Suggested skeleton (adapt to match the file's existing patterns):

```tsx
function Embers({ theme }: { theme: Theme }) {
  const particles = useMemo(
    () => Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 8,
      duration: 8 + Math.random() * 6,
      size: 1.5 + Math.random() * 2.5,
      sway: 5 + Math.random() * 10,
      color: i % 2 === 0 ? theme.accent.warm : theme.accent.highlight,
    })),
    [theme.accent.warm, theme.accent.highlight]
  )
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: '100vh', x: `${p.x}vw`, opacity: 0 }}
          animate={{
            y: '-10vh',
            x: [`${p.x}vw`, `${p.x + p.sway}vw`, `${p.x - p.sway}vw`, `${p.x}vw`],
            opacity: [0, 0.7, 0.5, 0],
          }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
          }}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Wire `Embers` into the particle dispatch**

In the existing dispatch (likely a switch or chain of conditionals on `theme.particles`), add:

```tsx
{theme.particles === 'embers' && <Embers theme={theme} />}
```

Match the surrounding pattern exactly.

- [ ] **Step 4: Verify visually**

Set theme to Hearth (in `src/store/theme.ts` temporarily, or via `localStorage` console), restart, view homepage. Embers should drift upward against the dark background. If too dense/sparse/fast/slow, tune the constants in Step 2 and recompare with the mockup.

- [ ] **Step 5: Commit**

```bash
git add src/components/Background.tsx
git commit -m "feat(particles): add embers particle system for hearth theme"
```

---

### Task 8: Add `goldFlecks` particle type

**Files:**
- Modify: `src/components/Background.tsx`

- [ ] **Step 1: Implement the `GoldFlecks` component near the other particle systems**

Behavior:
- Spawn ~25 small flat rectangles (gold leaf flakes), sized 3–6px wide, 1–2px tall
- Slow horizontal drift (1–3vw / 12–20s) with slight rotation tumbling
- Slight downward gravity (y: 0 → 100vh over duration)
- Opacity peaks ~0.5, lower than embers (subtle, not flashy)
- Color: `theme.accent.primary` (gold) and `theme.accent.highlight` (lighter gold)
- Each flake has random rotation that progresses slowly (0deg → 360deg over duration)

```tsx
function GoldFlecks({ theme }: { theme: Theme }) {
  const flecks = useMemo(
    () => Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 12,
      duration: 12 + Math.random() * 8,
      width: 3 + Math.random() * 3,
      height: 1 + Math.random(),
      rotate: Math.random() * 360,
      color: i % 2 === 0 ? theme.accent.primary : theme.accent.highlight,
    })),
    [theme.accent.primary, theme.accent.highlight]
  )
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {flecks.map((f) => (
        <motion.div
          key={f.id}
          initial={{ y: '-10vh', x: `${f.x}vw`, opacity: 0, rotate: f.rotate }}
          animate={{
            y: '110vh',
            opacity: [0, 0.5, 0.4, 0],
            rotate: f.rotate + 360,
          }}
          transition={{ duration: f.duration, delay: f.delay, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            width: f.width,
            height: f.height,
            background: f.color,
            boxShadow: `0 0 4px ${f.color}80`,
          }}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Wire into the particle dispatch**

```tsx
{theme.particles === 'goldFlecks' && <GoldFlecks theme={theme} />}
```

- [ ] **Step 3: Visual check (Midnight theme)**

Switch to Midnight, verify flecks drift slowly downward against navy with subtle gold shimmer.

- [ ] **Step 4: Commit**

```bash
git add src/components/Background.tsx
git commit -m "feat(particles): add gold flecks particle system for midnight theme"
```

---

### Task 9: Add `leaves` particle type (shared by sage and garden)

**Files:**
- Modify: `src/components/Background.tsx`

- [ ] **Step 1: Implement the `Leaves` component**

Behavior:
- Spawn ~18 small leaf SVG shapes (use a simple ellipse-with-stem path, no asset file needed)
- Slow downward drift with sideways sway (like a falling leaf)
- Each leaf rotates as it falls
- Opacity peaks ~0.4 (subtle on light backgrounds)
- Color: `theme.accent.primary` for the leaf body, `theme.accent.secondary` for the stem
- Density slightly lower for `garden` (it's "settled" flora, not actively falling) — pass an optional `density` prop, default 18, garden passes 12

```tsx
function Leaves({ theme, count = 18 }: { theme: Theme; count?: number }) {
  const leaves = useMemo(
    () => Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 18,
      duration: 14 + Math.random() * 10,
      size: 8 + Math.random() * 6,
      rotate: Math.random() * 360,
      sway: 8 + Math.random() * 12,
    })),
    [count]
  )
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {leaves.map((l) => (
        <motion.svg
          key={l.id}
          width={l.size}
          height={l.size * 1.4}
          viewBox="0 0 10 14"
          initial={{ y: '-10vh', x: `${l.x}vw`, opacity: 0, rotate: l.rotate }}
          animate={{
            y: '110vh',
            x: [`${l.x}vw`, `${l.x + l.sway}vw`, `${l.x - l.sway / 2}vw`, `${l.x}vw`],
            opacity: [0, 0.4, 0.3, 0],
            rotate: l.rotate + 270,
          }}
          transition={{ duration: l.duration, delay: l.delay, repeat: Infinity, ease: 'easeIn' }}
          style={{ position: 'absolute' }}
        >
          <path d="M5,1 C2,3 1,7 5,13 C9,7 8,3 5,1 Z" fill={theme.accent.primary} />
          <line x1="5" y1="13" x2="5" y2="14" stroke={theme.accent.secondary} strokeWidth="0.4" />
        </motion.svg>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Wire `leaves` into the dispatch with theme-specific density**

```tsx
{theme.particles === 'leaves' && (
  <Leaves theme={theme} count={theme.name === 'Garden' ? 12 : 18} />
)}
```

- [ ] **Step 3: Visual check**

Switch to Sage (faster, more leaves) and Garden (slower, fewer leaves) and confirm both render correctly. Leaves should be visible but not distracting on the cream backgrounds.

- [ ] **Step 4: Commit**

```bash
git add src/components/Background.tsx
git commit -m "feat(particles): add shared leaves particle system for sage and garden"
```

---

### Task 10: Retune existing particles for new themes

**Files:**
- Modify: `src/components/Background.tsx`

The existing `sakura`, `sunbeam`, `foam`, and `dust` particle systems were tuned for dark backgrounds. On the new light themes (rose, saffron, paperSun, ocean, postal, linen) they may render too strong, too dark, or in the wrong color.

- [ ] **Step 1: Audit each existing particle's color source**

Find the `sakura`, `sunbeam`, `foam`, and `dust` components and confirm they pull color from `theme.accent.*`. If they have hardcoded colors, replace them with `theme.accent.primary` / `theme.accent.warm` so the palette switches per theme.

- [ ] **Step 2: Reduce density / opacity on light themes**

For each of the four particle systems above, if the component currently uses a fixed `opacity` value > 0.5, gate it on `theme.mode`:

```tsx
const peakOpacity = theme.mode === 'light' ? 0.35 : 0.7
```

Apply this `peakOpacity` to the keyframe arrays.

- [ ] **Step 3: Visual check across all 11 themes**

Cycle through each theme (via the unfixed switcher or by editing `src/store/theme.ts`) and confirm:
- Particles are visible but unobtrusive on light themes
- Colors match the active theme's accent palette
- No theme has invisible (too low opacity) or jarring (too dark on light bg) particles

- [ ] **Step 4: Commit**

```bash
git add src/components/Background.tsx
git commit -m "refactor(particles): retune existing systems for light-mode themes"
```

---

## Phase 5: Sound mapping

### Task 11: Map new themes to existing or silent ambient sounds

**Files:**
- Modify: `src/hooks/useAmbientSound.ts` (likely — confirm with grep first)

- [ ] **Step 1: Find the ambient sound mapping**

```bash
grep -rn "ambience" /Users/himanshut4d/Documents/Personal_projects/feel_good/hearth/src/hooks/ /Users/himanshut4d/Documents/Personal_projects/feel_good/hearth/src/components/AmbientSoundLayer.tsx
ls /Users/himanshut4d/Documents/Personal_projects/feel_good/hearth/public/sounds/ 2>/dev/null || ls /Users/himanshut4d/Documents/Personal_projects/feel_good/hearth/public/ | grep -i sound
```

Identify the file that maps `theme.ambience` to an audio file path.

- [ ] **Step 2: Update the mapping for new ambience values**

For each new ambience value, map to the closest existing audio file or `null` (silent). Suggested:

```ts
const AMBIENCE_MAP: Record<string, string | null> = {
  forest: '/sounds/forest.mp3',         // existing for rivendell
  firelight: '/sounds/candle.mp3',      // hearth → reuse candle audio if it exists
  midnight: '/sounds/cosmos.mp3',       // midnight → reuse cosmos audio
  sun: null,                            // paperSun → silent
  rose: '/sounds/spring.mp3',           // rose → reuse spring/sakura
  sage: null,                           // sage → silent
  ocean: '/sounds/ocean.mp3',           // ocean → existing
  saffron: null,                        // saffron → silent
  garden: null,                         // garden → silent
  postal: null,                         // postal → silent
  linen: null,                          // linen → silent
}
```

(Adjust paths to match the actual filenames in `public/sounds/`. If a referenced file doesn't exist, leave the mapping `null`.)

- [ ] **Step 3: Ensure null entries don't error**

The hook should treat a `null` mapping as "no sound", not error. Confirm by reading the hook source — if it currently assumes a string, add a guard.

- [ ] **Step 4: Visual + audio check**

For each theme, switch to it and confirm:
- Themes with mapped audio play that audio (when ambient sound is enabled in settings)
- Themes mapped to `null` play silence (no error in console)

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useAmbientSound.ts [other-files-touched]
git commit -m "feat(sound): map new themes to existing audio or silence"
```

---

## Phase 6: Theme switcher

### Task 12: Update ThemeSwitcher for new themes and add mode indicator

**Files:**
- Modify: `src/components/ThemeSwitcher.tsx`

- [ ] **Step 1: Replace the emoji map with a new 11-theme map**

In `src/components/ThemeSwitcher.tsx` lines 8–21, replace `themeIcons` with:

```ts
const themeIcons: Record<ThemeName, string> = {
  rivendell: '🌲',
  hearth: '🔥',
  paperSun: '☀️',
  rose: '🌸',
  sage: '🌿',
  ocean: '🌊',
  saffron: '🌼',
  garden: '🌷',
  postal: '✉️',
  linen: '🕊️',
  midnight: '✨',
}
```

- [ ] **Step 2: Add a sun/moon mode indicator next to each theme name**

In the theme list rendering (around lines 68–101), modify the row so each row shows a small mode indicator. Replace the inner content of each `motion.button` with:

```tsx
<span
  className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
  style={{
    background: `linear-gradient(135deg, ${t.accent.warm}, ${t.accent.primary})`,
  }}
>
  {themeIcons[name]}
</span>
<div className="flex-1">
  <div className="flex items-center gap-2">
    <p className="text-sm font-medium" style={{ color: theme.text.primary }}>
      {t.name}
    </p>
    <span className="text-xs opacity-60" style={{ color: theme.text.muted }} title={t.mode === 'light' ? 'Light theme' : 'Dark theme'}>
      {t.mode === 'light' ? '☀' : '☾'}
    </span>
  </div>
  <p className="text-xs" style={{ color: theme.text.muted }}>
    {t.description}
  </p>
</div>
```

- [ ] **Step 3: Type-check + visual check**

```bash
docker compose exec app npm run build
docker compose restart app
```

Open the app, click the theme switcher, confirm:
- 11 themes are listed
- Each row shows the emoji icon, the name, and a sun/moon mode indicator
- Clicking a theme switches the page palette correctly
- The active theme is highlighted (existing behavior)

- [ ] **Step 4: Commit**

```bash
git add src/components/ThemeSwitcher.tsx
git commit -m "feat(themes): update theme switcher for new themes with mode indicator"
```

---

## Phase 7: Stars page split

### Task 13: Extract current Constellation logic into a renderer component

**Files:**
- Create: `src/components/constellation/ConstellationRenderer.tsx`
- Modify: `src/app/constellation/page.tsx`

- [ ] **Step 1: Read the current `src/app/constellation/page.tsx` (746 lines)**

Identify the renderer body (the JSX returned from the page component) versus the data hooks and routing setup. The renderer body is what we extract; the data fetching stays.

- [ ] **Step 2: Create `src/components/constellation/ConstellationRenderer.tsx`**

The new file should:
- Accept the same props the renderer needs (letters list, click handler, modal state — whatever the current page passes around internally)
- Contain the same JSX, motion, and styling as today
- Export a default React component named `ConstellationRenderer`

If the current page tightly couples data fetching to JSX, lift the JSX out by passing the data as props. Do not alter behavior.

- [ ] **Step 3: Update `src/app/constellation/page.tsx` to use the renderer**

The page is now a thin wrapper:

```tsx
'use client'
import { useThemeStore } from '@/store/theme'
import ConstellationRenderer from '@/components/constellation/ConstellationRenderer'
// ... data hooks unchanged

export default function ConstellationPage() {
  const theme = useThemeStore(s => s.theme)
  // ... data fetching unchanged
  // both modes get the same data; only the renderer differs

  // (Garden renderer wired in Task 15; for now both modes use Constellation)
  return <ConstellationRenderer {...rendererProps} />
}
```

- [ ] **Step 4: Verify behavior unchanged**

```bash
docker compose exec app npm run build
docker compose restart app
```

Visit `/constellation` on a dark theme (rivendell). Confirm: identical to before — same letters, same constellation layout, same click → modal behavior.

- [ ] **Step 5: Commit**

```bash
git add src/components/constellation/ConstellationRenderer.tsx src/app/constellation/page.tsx
git commit -m "refactor(constellation): extract renderer into its own component"
```

---

### Task 14: Implement GardenRenderer with pressed leaves

**Files:**
- Create: `src/components/constellation/GardenRenderer.tsx`

- [ ] **Step 1: Create the file with a leaf-scatter renderer**

```tsx
'use client'
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { Theme } from '@/lib/themes'
// import the same Letter/data type used by ConstellationRenderer

interface GardenRendererProps {
  letters: Array<{ id: string; /* fields used by renderer */ }>
  onLetterClick: (id: string) => void
  theme: Theme
}

// Deterministic positioning: hash the letter id to get a stable (x, y, rotation, isFlower)
function deterministicPlacement(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0
  const abs = Math.abs(hash)
  return {
    x: (abs % 90) + 5,                  // 5–95 vw
    y: ((abs >> 7) % 80) + 10,          // 10–90 vh
    rotate: ((abs >> 14) % 60) - 30,    // -30 to +30 deg
    isFlower: ((abs >> 21) % 8) === 0,  // ~1 in 8
  }
}

function PressedLeaf({ color, stem, rotate }: { color: string; stem: string; rotate: number }) {
  return (
    <svg width="40" height="56" viewBox="0 0 10 14" style={{ transform: `rotate(${rotate}deg)` }}>
      <path d="M5,1 C2,3 1,7 5,13 C9,7 8,3 5,1 Z" fill={color} opacity="0.85" />
      <line x1="5" y1="0.5" x2="5" y2="13" stroke={stem} strokeWidth="0.3" opacity="0.6" />
      <line x1="5" y1="6" x2="3" y2="9" stroke={stem} strokeWidth="0.2" opacity="0.5" />
      <line x1="5" y1="6" x2="7" y2="9" stroke={stem} strokeWidth="0.2" opacity="0.5" />
    </svg>
  )
}

function PressedFlower({ color, rotate }: { color: string; rotate: number }) {
  return (
    <svg width="40" height="40" viewBox="0 0 12 12" style={{ transform: `rotate(${rotate}deg)` }}>
      {[0, 60, 120, 180, 240, 300].map(a => (
        <ellipse
          key={a}
          cx="6" cy="3.5"
          rx="1.6" ry="2.5"
          fill={color}
          opacity="0.7"
          transform={`rotate(${a} 6 6)`}
        />
      ))}
      <circle cx="6" cy="6" r="1.2" fill={color} opacity="0.95" />
    </svg>
  )
}

export default function GardenRenderer({ letters, onLetterClick, theme }: GardenRendererProps) {
  const placements = useMemo(
    () => letters.map(l => ({ letter: l, ...deterministicPlacement(l.id) })),
    [letters]
  )

  return (
    <div
      className="relative w-full min-h-screen overflow-hidden"
      style={{ background: theme.bg.gradient }}
    >
      <header className="text-center pt-12 pb-8">
        <p className="text-sm tracking-[0.3em] uppercase" style={{ color: theme.text.muted, fontFamily: 'var(--font-serif)' }}>
          your garden
        </p>
        <h1 className="text-4xl mt-2 italic" style={{ color: theme.text.primary, fontFamily: 'var(--font-serif)' }}>
          {letters.length} letters pressed
        </h1>
      </header>

      <div className="relative w-full" style={{ height: '80vh' }}>
        {placements.map(({ letter, x, y, rotate, isFlower }) => (
          <motion.button
            key={letter.id}
            onClick={() => onLetterClick(letter.id)}
            className="absolute cursor-pointer"
            style={{ left: `${x}%`, top: `${y}%` }}
            whileHover={{ scale: 1.15, y: -4 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          >
            {isFlower
              ? <PressedFlower color={theme.accent.primary} rotate={rotate} />
              : <PressedLeaf color={theme.accent.primary} stem={theme.accent.secondary} rotate={rotate} />
            }
          </motion.button>
        ))}
      </div>
    </div>
  )
}
```

(Adapt the props to match what `ConstellationRenderer` actually expects — same letter data shape, same `onLetterClick` signature.)

- [ ] **Step 2: Type-check**

```bash
docker compose exec app npm run build
```

Expected: passes. The component isn't wired in yet, so no visual change.

- [ ] **Step 3: Commit**

```bash
git add src/components/constellation/GardenRenderer.tsx
git commit -m "feat(constellation): add GardenRenderer with pressed leaves and flowers"
```

---

### Task 15: Wire GardenRenderer into the page based on theme.mode

**Files:**
- Modify: `src/app/constellation/page.tsx`

- [ ] **Step 1: Pick the renderer by mode**

Update the page wrapper:

```tsx
'use client'
import { useThemeStore } from '@/store/theme'
import ConstellationRenderer from '@/components/constellation/ConstellationRenderer'
import GardenRenderer from '@/components/constellation/GardenRenderer'

export default function ConstellationPage() {
  const theme = useThemeStore(s => s.theme)
  // ... existing data fetching unchanged
  const Renderer = theme.mode === 'light' ? GardenRenderer : ConstellationRenderer
  return <Renderer letters={letters} onLetterClick={handleLetterClick} theme={theme} />
}
```

(Match the actual prop names used in your renderer extractions.)

- [ ] **Step 2: Visual check both modes**

```bash
docker compose restart app
```

- Switch to a dark theme (rivendell, hearth, midnight) → constellation renders, click letter → modal opens.
- Switch to a light theme (rose, sage, garden, etc.) → garden renders with scattered pressed leaves, click leaf → same modal opens.
- Switch back and forth a few times to confirm no state corruption.

- [ ] **Step 3: Commit**

```bash
git add src/app/constellation/page.tsx
git commit -m "feat(constellation): split renderer by theme mode"
```

---

## Phase 8: Verification

### Task 16: Acceptance walkthrough against the spec

**Files:** none — manual verification

- [ ] **Step 1: Build + lint clean**

```bash
docker compose exec app npm run build
docker compose exec app npm run lint
```

Both should pass with no errors.

- [ ] **Step 2: Walk through every acceptance criterion in the spec**

Open `docs/superpowers/specs/2026-04-27-journal-theme-overhaul-design.md` and confirm each criterion in the Acceptance Criteria section:

1. Theme switcher shows exactly 11 themes, each with sun/moon indicator. ✅
2. All 10 new themes render the Journal page matching the mockup. ✅ Side-by-side compare each theme to its mockup screenshot.
3. Each theme's particle layer matches the table; Animations toggle disables all. ✅ Test toggle in DeskSettingsPanel.
4. EB Garamond is the body font app-wide; Caveat appears on the listed accent elements. ✅
5. Stars page renders constellation in dark themes, garden in light themes; click opens letter modal in both. ✅
6. localStorage with `cherryBlossom` migrates to `rose` cleanly. ✅ (Already verified in Task 6 Step 3.)
7. No schema/migration/API changes; existing entries open and edit identically. ✅ Open an existing entry, edit, save.
8. `claude-design-pre-overhaul` branch exists and points at pre-redesign main. ✅ `git log claude-design-pre-overhaul -1` matches the original main HEAD.

- [ ] **Step 3: Spot-check Journal page against each mockup**

For each of the 10 new themes (skip Rivendell), switch to it, navigate to `/write`, and compare the rendered page to the corresponding mockup image. Note any palette tweaks needed (colors that read too dark/too light/wrong hue) and either fix inline as a small commit or open follow-up tasks.

- [ ] **Step 4: Final commit if any tweaks landed**

```bash
git add -p
git commit -m "fix(themes): tune palettes after side-by-side mockup comparison"
```

(Skip if no tweaks needed.)

- [ ] **Step 5: Stop. The plan is done. Hand back to user for review/merge.**

Do not auto-merge. The user merges `feat/design-overhaul-themes` → `main` themselves once they've approved the visual result.

---

## Self-review notes

- **Spec coverage:** every section of the spec has at least one task. Theme list (Tasks 1, 3, 4, 5). Mode field (Task 1). localStorage migration (Task 6). Particle assignments (Tasks 7–10). Sound mapping (Task 11). Theme switcher updates (Task 12). Stars page split (Tasks 13–15). Branch strategy (Task 0). Acceptance criteria (Task 16).
- **Placeholder check:** all code blocks contain real code, all commands are exact, no "TBD" or "similar to" references.
- **Type consistency:** `Theme.mode` typed `'light' | 'dark'`; `themes.particles` enum includes all referenced values; `ThemeName` union grows monotonically across Tasks 3 → 4 → 5; `LEGACY_THEME_REMAP` keys all map to valid new ThemeNames; the file references in Tasks 13–15 use consistent paths (`src/components/constellation/`).
- **Ambiguities:** palette hex values are starting estimates from screenshots — the plan is explicit that side-by-side comparison in Task 16 is the real verification, with a follow-up tweak commit allowed.
