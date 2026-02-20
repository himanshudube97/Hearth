# Entry Detail Modal — "Open the Journal Page"

**Date**: 2026-02-20
**Status**: Approved

## Problem

The Write screen feels warm and handcrafted (notebook paper, Caveat font, ruled lines, binding spine). The Timeline screen is functional but visually inconsistent — when you expand an entry, it renders in a flat card that doesn't match the writing experience.

## Solution

When a user clicks an entry on the Timeline, open a **large centered modal** that renders the entry in the exact same notebook aesthetic as the Write page. The modal follows "real diary" rules: you can add to a page but never erase what you wrote.

## Modal Appearance

- 80-90% of viewport, centered
- Darkened/blurred backdrop (Timeline visible behind)
- Same notebook aesthetic as Write page: ruled lines, binding spine, paper texture, Caveat font
- Smooth entrance animation (scale up + fade in)
- Close via X button or backdrop click

## Content Layout (top to bottom)

1. Date & time header (top-right corner, matching Write page style)
2. Mood indicator — emoji badge (not a picker, read-only)
3. Entry text — Caveat font on ruled lines, read-only
4. Doodle(s) — displayed inline
5. Collage photos — polaroid-style with same rotation as Write page
6. Song embed — player if a song was attached

## "Real Diary" Edit Rules

| Content | Exists? | Behavior |
|---------|---------|----------|
| Text | Yes | Read-only, cannot edit or delete |
| Text | — | "Add more..." area below existing text for appending |
| Doodle | Yes | Displayed, cannot remove |
| Doodle | No | Doodle button appears, can add one |
| Photos | Yes | Displayed, cannot remove |
| Photos | No | Photo button appears, can add |
| Song | Yes | Player displayed, cannot remove |
| Song | No | Song button appears, can add |
| Mood | Yes | Displayed as badge, cannot change |

## Interaction Flow

1. User clicks entry card on Timeline
2. Modal opens with notebook-style view
3. User reads/scrolls through entry
4. Bottom area shows add-only controls for missing media + append text area
5. If user adds anything, Save button appears
6. Save appends new content, closes modal, refreshes Timeline entry

## Scope

- New component: `EntryDetailModal.tsx`
- Modify: `timeline/page.tsx` (add modal trigger)
- Modify: `EntryCard.tsx` (click opens modal instead of inline expand)
- New or modified API: append endpoint for adding content to existing entries
- Untouched: Write page, Timeline list/search/filters
