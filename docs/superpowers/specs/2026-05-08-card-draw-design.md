# Card Draw — Design

**Status:** design only, not implemented
**Deck:** `src/lib/card-deck.ts` (52 cards, v1)

## Summary

The blank-page solver for Hearth. When a user opens a new entry and doesn't know what to write, they can pull a card. A card is a tiny, hand-curated prompt-with-a-wink that gives them a *shape* to write in — not a topic, not an assignment.

The default state is still a blank page. The card-draw is opt-in and lives at the edge of the spread. It doesn't pressure, doesn't gamify, doesn't track. It's a folded note from a friend who knows journaling can be silly.

## Positioning

This feature is what crystallizes Hearth's positioning out of "yet another journaling app" and into something defensible:

> **A journaling app that doesn't ask you to journal.**

Supporting line for the landing page:
> *The page is never blank.*

The card-draw is the screenshot under that headline. It is the proof of stance. Most journaling apps are subtly self-improvement-coded ("reflect on your gratitude," "set intentions"). Hearth is the opposite: permission-coded. *Complain. Just complain.* That voice IS the brand.

## The mechanic

- Deck of 52 cards, hand-curated, three tenses: present (42), past (5), future (5).
- Each card has a **prompt** (clean imperative or gentle question) and a **wink** (small italic line that does the warmth work).
- Affordance fades in near the cursor after ~12s of editor idle. Subtle paper-icon, not a splashy button.
- User taps → card unfolds slowly (~700–900ms) above the editor area.
- User can: start writing (card fades to small corner thumbnail), redraw (tap the card), or dismiss (tap outside).
- The card is *permission, not a label*: the entry isn't tagged with the card. The card disappears once writing finishes.

### Three grammars for three tenses

This is the pattern that makes the deck feel cohesive even though the cards are very different. Future card additions must respect it.

| Tense   | Grammar      | Example                                         |
|---------|--------------|-------------------------------------------------|
| Present | Imperative   | *"Complain. No one's keeping score."*           |
| Past    | Question     | *"Is there a smell from your grandparents' house?"* |
| Future  | Musing       | *"What are you quietly hoping for?"*            |

Past asks because memories are intimate; you don't command them up. Present commands because the user is right here, right now. Future muses because the future is open-ended.

## Voice rules (read before adding cards)

These are the rules I held to writing v1. Future contributions must hold them too or the deck dilutes.

- **Imperatives, not invitations.** *"Complain"* not *"You might try complaining."*
- **Concrete, not abstract.** *"Write what you ate"* not *"Reflect on nourishment."* Concreteness is funny; abstraction is therapy.
- **Short.** Most cards are under 8 words on the prompt line. A long card is a lecture.
- **Permission-shaped, not assignment-shaped.** *"It can be terrible"* / *"That's it"* / *"No matter how short."* Every wink should feel like the deck is on your side.
- **Gentle bias on past cards.** Fond, ordinary, slightly funny. Range from *"smell of grandparents' house"* to *"phase that embarrasses you now"* — nothing heavier. No cards about heartbreak, regret, loss, trauma. Hearth's vibe is permission, not excavation. If the user wants to go deep, they will. The deck shouldn't *invite* it.
- **No future cards in postcard/note/letter form.** That grammar belongs to Hearth's Letters feature. Future cards stay in the user's own voice, looking forward.
- **Banned vocabulary:** *journey, growth, truth, energy, intention, gratitude, mindful, reflect, capture, document, essence.* If you find yourself reaching for these, the card is wrong.

## Implementation decisions

These came up in conversation but were not implemented. Whoever picks this up should read these and either adopt the recommendations or revisit explicitly.

### 1. Trigger / affordance placement — **DECIDED**

**Decision:** the card-draw replaces the existing `WhisperFooter` at the bottom-center of the spread, between the two theme ornaments. See [`BookSpread.tsx:564-569`](../../../src/components/desk/BookSpread.tsx).

**Always-folded-default behavior.** The folded note IS the new ambient state. On every spread paint, the user sees a small folded note (with "✦ pull a card" or just the note's back) where the static italic whisper used to live. Tapping the note unfolds it (~700–900ms) into prompt + wink. Tapping again redraws.

This means there's no separate "fade-in on idle" affordance — the user sees the closed note immediately and can engage at any time. We get the same magical effect without the layout going empty during the 12s idle window.

**The mid-page prompt seen in some themes (e.g., *"Where do you feel most at home?"* on the right page above "Begin writing…") is a separate system** — likely the stranger-notes feature or a per-page seed. Card-draw does not touch it. Different feature, different surface.

**Spacing note:** I bumped the whisper container's `-bottom-12` to `-bottom-20` to give the area more breathing room from the book — the unfolded card is two lines tall (prompt + wink) and needs a bit more vertical space than the single-italic line had.

**Alternatives considered and rejected:**
- *Fade-in near cursor on idle:* clean but leaves the bottom-of-spread area visually empty in the meantime. Loses the existing whisper anchor.
- *Top-right corner near the date hangtag:* clutters that corner; date hangtag is already a strong element.
- *Inside the page (replacing the existing mid-page prompt):* conflicts with the separate prompt system and contaminates the writing area.

### 2. Animation

**Metaphor:** small folded note (not a playing card). Reasons in the brainstorm — paper feels intimate, playing card has a poker-table connotation that fights the cozy aesthetic.

**Reveal:** ~700–900ms slow unfold. Subtle particle puff on open, themed to the current Hearth theme (sakura petal, snowflake, firefly, etc.).

**Speed rule:** unhurried. A fast flip would feel like a slot machine. Hearth's whole personality is unhurried.

### 3. On-type behavior

**Recommended:** card fades to a small thumbnail in the corner of the spread when the user starts typing. Tap thumbnail to redraw. Thumbnail disappears when the entry is saved or when the user navigates away.

**Alternative:** card disappears entirely on first keystroke. Simpler but loses the "I want a different shape" affordance mid-write.

### 4. Anti-repeat strategy

**Recommended:** shuffle the full deck once per user, walk through it card-by-card on each draw, reshuffle when exhausted. Guarantees no repeat until all 52 cards have been seen — feels much more curated than pure random.

**Alternative:** pure random. Simpler, but users will notice repeats within a week.

### 5. Deck location

**Recommended for v1:** local TS file (`src/lib/card-deck.ts`). Zero latency, no network call, easy to iterate by editing the file and shipping.

**Future:** server-fetched if we add per-theme decks, seasonal cards, or a way for users to author their own.

### 6. Web + Desktop parity

**Yes, both.** The card-draw is part of the editor, not a desktop-only feature. No Tauri-specific code needed for v1.

### 7. Per-user shuffle persistence

**Recommended:** `localStorage` keyed `card-deck-state-v1`, holding `{ shuffleSeed: number, nextIndex: number }`. Resets across devices, which is fine — the deck is small enough that occasional re-shuffles don't matter.

**Future:** sync to DB if we add per-user "favorited cards," "hidden cards," etc. Out of scope for v1.

## Out of scope for v1

These came up in brainstorming and were explicitly deferred. **Don't build them with v1.**

- **Categories or filters** in UI. The deck ships shuffled. Surfacing categories would push Hearth toward "tool" and away from "place." The randomness is the feature.
- **Theme-tied cards.** No "this card only appears on the sakura theme." Premature complexity.
- **AI-generated cards.** Don't. The whole point is hand-curated voice. AI dilutes the deck instantly.
- **User-authored cards.** A nice-to-have but pushes Hearth toward the customizable-tool genre. Skip for v1, revisit only if users ask.
- **Card analytics.** No tracking which cards are drawn, redrawn, ignored. Privacy posture + the card-draw should not feel measured.
- **Pinning a card** to revisit. If a user loves a card, they can write it down. Card-draw is ephemeral by design.

## Marketing copy that comes out of this feature

These are sketches, not committed. Worth A/B-ing on the landing page:

- Headline: ***The page is never blank.***
- Subhead: *A journaling app that doesn't ask you to journal.*
- Feature line: *Pull a card when you don't know what to write. Some are silly. None are deep.*

## Open questions worth re-visiting before build

- **What happens to the theme-specific whispers in `lib/themes.ts`?** Card-draw replaces the WhisperFooter visually, but the whispers data is still loaded. Decision needed: retire the whispers entirely, or fold the strongest theme-specific ones into the deck (with `tense: 'present'`)? My recommendation: retire — the deck's voice is stronger, and theme-specific cards are a v2 nice-to-have.
- **Is there a way to make the card-draw discoverable without an onboarding tooltip?** Hearth's whole vibe is anti-onboarding. The always-folded-default helps — the folded note is *visible* on every spread, so discovery happens by sight. A subtle text label on the closed note ("✦ pull a card") may be enough.
- **Should redraw have a soft cap?** Right now unlimited. Fine for v1 — abuse is unlikely with 52 cards.
