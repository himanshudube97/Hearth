// Card-draw deck. The blank-page solver — see docs/superpowers/specs/2026-05-08-card-draw-design.md
// Voice rules live in the design doc; please read them before adding/editing cards.
// Three tenses, one shuffled pile in v1. Categories below are for editing only.

export type CardTense = 'present' | 'past' | 'future'

export type Card = {
  id: number
  prompt: string
  wink: string
  tense: CardTense
}

export const CARD_DECK: Card[] = [
  // ─── Present — Permissions ───────────────────────────────────────
  { id: 1,  prompt: `Complain.`,                                   wink: `No one's keeping score.`,                              tense: 'present' },
  { id: 2,  prompt: `Write something petty.`,                      wink: `Pettiness is a feeling like any other.`,               tense: 'present' },
  { id: 3,  prompt: `Write badly on purpose.`,                     wink: `It's a relief.`,                                       tense: 'present' },
  { id: 4,  prompt: `Be boring on purpose.`,                       wink: `Most days are. Honor it.`,                             tense: 'present' },
  { id: 5,  prompt: `Write about nothing.`,                        wink: `Nothing is plenty.`,                                   tense: 'present' },
  { id: 6,  prompt: `Whine for one full paragraph.`,               wink: `Don't stop early.`,                                    tense: 'present' },
  { id: 7,  prompt: `Be dramatic about something small.`,          wink: `The smaller the better.`,                              tense: 'present' },
  { id: 8,  prompt: `Write a sentence you'd never say out loud.`,  wink: `Nobody else is going to read this.`,                   tense: 'present' },
  { id: 9,  prompt: `Write something nobody asked for.`,           wink: `Especially that.`,                                     tense: 'present' },
  { id: 10, prompt: `Admit one small thing.`,                      wink: `Small. Just to yourself.`,                             tense: 'present' },

  // ─── Present — Shapes ────────────────────────────────────────────
  { id: 11, prompt: `Write a poem.`,                                       wink: `It can be terrible. Most are.`,                         tense: 'present' },
  { id: 12, prompt: `Write a joke nobody will read.`,                      wink: `That's the freest joke there is.`,                      tense: 'present' },
  { id: 13, prompt: `Write a haiku.`,                                      wink: `Don't count the syllables.`,                            tense: 'present' },
  { id: 14, prompt: `Write a letter to no one.`,                           wink: `No greeting required.`,                                 tense: 'present' },
  { id: 15, prompt: `Write a note to the you who woke up this morning.`,   wink: `They could use the update.`,                            tense: 'present' },
  { id: 16, prompt: `Write tomorrow's diary.`,                             wink: `Make it up. It probably won't go like this anyway.`,    tense: 'present' },
  { id: 17, prompt: `Write today as a recipe.`,                            wink: `Ingredients, method, optional garnish.`,                tense: 'present' },
  { id: 18, prompt: `Write a one-star review of today.`,                   wink: `Be vicious. Be specific.`,                              tense: 'present' },
  { id: 19, prompt: `Write a five-star review of today.`,                  wink: `Even if you have to stretch.`,                          tense: 'present' },
  { id: 20, prompt: `Write a horoscope for yourself.`,                     wink: `Predict things that already happened.`,                 tense: 'present' },

  // ─── Present — Observations ──────────────────────────────────────
  { id: 21, prompt: `Describe one small thing in too much detail.`,        wink: `The smaller the thing, the better.`,                    tense: 'present' },
  { id: 22, prompt: `Write what you ate today.`,                           wink: `Slowly. Every bite.`,                                   tense: 'present' },
  { id: 23, prompt: `Write what you saw out a window today.`,              wink: `Any window. Any moment.`,                               tense: 'present' },
  { id: 24, prompt: `Write what the room sounds like.`,                    wink: `Listen for thirty seconds first.`,                      tense: 'present' },
  { id: 25, prompt: `Write what's on your desk.`,                          wink: `Everything. The dust counts.`,                          tense: 'present' },
  { id: 26, prompt: `Describe the weather like you're paid by the word.`,  wink: `Stretch it.`,                                           tense: 'present' },
  { id: 27, prompt: `Name three things within arm's reach.`,               wink: `Then describe one of them.`,                            tense: 'present' },
  { id: 28, prompt: `Write what made you laugh today.`,                    wink: `Even if it was nothing.`,                               tense: 'present' },
  { id: 29, prompt: `Write what almost made you cry today.`,               wink: `"Almost" is the right word.`,                           tense: 'present' },
  { id: 30, prompt: `Write what nobody noticed today.`,                    wink: `That you noticed.`,                                     tense: 'present' },

  // ─── Present — Tiny ──────────────────────────────────────────────
  { id: 31, prompt: `One sentence.`,            wink: `That's a journal entry. We promise.`, tense: 'present' },
  { id: 32, prompt: `Three words.`,             wink: `Then stop. Really.`,                  tense: 'present' },
  { id: 33, prompt: `Write until you stop.`,    wink: `No matter how short.`,                tense: 'present' },
  { id: 34, prompt: `No periods.`,              wink: `One long line.`,                      tense: 'present' },
  { id: 35, prompt: `Write only nouns.`,        wink: `No verbs sneak in.`,                  tense: 'present' },

  // ─── Present — Whimsy ────────────────────────────────────────────
  { id: 36, prompt: `Invent a word for what you're feeling.`,         wink: `Real ones don't fit anyway.`,        tense: 'present' },
  { id: 37, prompt: `Name today like you'd name a chapter.`,          wink: `Title only. No subtitle.`,           tense: 'present' },
  { id: 38, prompt: `Give today a weather report.`,                   wink: `Then a forecast for tonight.`,       tense: 'present' },
  { id: 39, prompt: `Write what a stranger would notice about today.`, wink: `They notice differently.`,          tense: 'present' },
  { id: 40, prompt: `Write what last-week-you would think.`,          wink: `Be honest.`,                         tense: 'present' },
  { id: 41, prompt: `Write a feeling without naming it.`,             wink: `Around it. Not at it.`,              tense: 'present' },
  { id: 42, prompt: `Write a note to drop in tomorrow's pocket.`,     wink: `Something small. They'll find it.`,  tense: 'present' },

  // ─── Past — gentle questions ─────────────────────────────────────
  { id: 43, prompt: `What did you want to be when you were eight?`,      wink: `Don't update the answer.`,                       tense: 'past' },
  { id: 44, prompt: `Is there a smell from your grandparents' house?`,   wink: `Or a sound. Or a chair.`,                        tense: 'past' },
  { id: 45, prompt: `Was there a friend you used to laugh with constantly?`, wink: `What was the joke about?`,                   tense: 'past' },
  { id: 46, prompt: `Was there a phase that embarrasses you now?`,       wink: `Embarrassment ages into fondness. Speed it up.`, tense: 'past' },
  { id: 47, prompt: `Was there a song you ruined by overplaying?`,       wink: `You loved it. That's why.`,                      tense: 'past' },

  // ─── Future — musings ────────────────────────────────────────────
  { id: 48, prompt: `What would you like tomorrow morning to feel like?`, wink: `Not a plan. A weather report.`,                              tense: 'future' },
  { id: 49, prompt: `What are you quietly hoping for?`,                   wink: `Quietly is the only way it counts.`,                          tense: 'future' },
  { id: 50, prompt: `What would a perfectly ordinary day look like?`,     wink: `Not a good one. A normal one. The ones we miss most.`,        tense: 'future' },
  { id: 51, prompt: `What's a feeling you'd like more of?`,               wink: `Doesn't need a reason.`,                                     tense: 'future' },
  { id: 52, prompt: `What do you hope is still true ten years from now?`, wink: `Anything. A friendship, a smell, a song.`,                   tense: 'future' },
]
