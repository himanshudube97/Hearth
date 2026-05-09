// src/lib/journal-constants.ts

export const JOURNAL = {
  LINE_HEIGHT: 32,             // px - matches line pattern spacing
  FONT_SIZE: 21,               // px - Caveat font size
  MAX_CHARS: 1200,             // Total character limit per entry (both pages combined)

  // Desktop book dimensions
  BOOK_WIDTH: 1300,            // px
  BOOK_HEIGHT: 820,            // px
  PAGE_PADDING_TOP: 20,        // px
  PAGE_PADDING_BOTTOM: 20,     // px
  LEFT_SONG_SECTION_HEIGHT: 80,  // px - compact song embed + label
  LEFT_LABEL_HEIGHT: 20,       // px - "Write your thoughts" label
  RIGHT_PHOTO_SECTION_HEIGHT: 110, // px - photos + label
  RIGHT_DOODLE_SECTION_HEIGHT: 155, // px - doodle canvas + label + margin
  RIGHT_SAVE_SECTION_HEIGHT: 50,    // px - save button area
  RIGHT_PROMPT_HEIGHT: 30,     // px - writing prompt

  // Responsive breakpoints
  BREAKPOINT_DESKTOP: 1400,    // px - full book spread
  BREAKPOINT_TABLET: 1024,     // px - scaled book spread (below = mobile form)

  // Chars per line estimate for Caveat at 20px in ~560px writing area
  CHARS_PER_LINE: 38,
} as const

/**
 * Calculate how many lines fit in the left page writing area.
 * Uses known layout heights, not DOM measurement.
 */
export function getLeftPageMaxLines(bookHeight: number = JOURNAL.BOOK_HEIGHT): number {
  const availableHeight = bookHeight
    - JOURNAL.PAGE_PADDING_TOP
    - JOURNAL.PAGE_PADDING_BOTTOM
    - JOURNAL.LEFT_SONG_SECTION_HEIGHT
    - JOURNAL.LEFT_LABEL_HEIGHT
  return Math.floor(availableHeight / JOURNAL.LINE_HEIGHT)
}

/**
 * Calculate how many lines fit in the right page writing area.
 */
export function getRightPageMaxLines(bookHeight: number = JOURNAL.BOOK_HEIGHT): number {
  const availableHeight = bookHeight
    - JOURNAL.PAGE_PADDING_TOP
    - JOURNAL.PAGE_PADDING_BOTTOM
    - JOURNAL.RIGHT_PHOTO_SECTION_HEIGHT
    - JOURNAL.RIGHT_PROMPT_HEIGHT
    - JOURNAL.RIGHT_DOODLE_SECTION_HEIGHT
    - JOURNAL.RIGHT_SAVE_SECTION_HEIGHT
  return Math.floor(availableHeight / JOURNAL.LINE_HEIGHT)
}

/**
 * Mobile pagination — number of writing lines that fit in a single phone page,
 * computed from viewport height.
 *
 * Layout reserved per page:
 *   - 56px header row (date / close)
 *   - 88px song section (only on page 0; ignored here so all writing pages
 *     have the same capacity — page 0 just starts further down)
 *   - 32px label "WRITE YOUR THOUGHTS"
 *   - 56px pagination dots row
 *   - 32px bottom safe area
 */
export function getMobileWritingLinesPerPage(viewportHeight: number): number {
  const reserved = 56 + 88 + 32 + 56 + 32
  const writingHeight = Math.max(0, viewportHeight - reserved)
  return Math.max(4, Math.floor(writingHeight / JOURNAL.LINE_HEIGHT))
}

/**
 * Estimate how many text characters fit on a mobile writing page given a
 * line capacity. Used as a coarse upper bound; the real pagination is
 * visual-line based (newlines count too — see countVisualLines).
 */
export function getMobileCharsPerPage(linesPerPage: number): number {
  return linesPerPage * JOURNAL.CHARS_PER_LINE
}

/**
 * Total writing pages we display as dots from the moment a fresh entry
 * opens. Derived from MAX_CHARS so the user sees up-front how much room
 * they have to fill (matching the desktop's two pre-existing pages).
 * Pages may grow beyond this if a user newlines extensively.
 */
export function getMobileTotalWritingPages(linesPerPage: number): number {
  return Math.max(2, Math.ceil(JOURNAL.MAX_CHARS / (linesPerPage * JOURNAL.CHARS_PER_LINE)))
}

/**
 * Count the visual lines a string occupies if rendered with `charsPerLine`
 * soft-wrap. Each `\n` is 1 line; each segment between newlines wraps every
 * `charsPerLine` chars. An empty segment counts as 1 blank line.
 */
export function countVisualLines(text: string, charsPerLine: number): number {
  if (text === '') return 0
  return text.split('\n').reduce((sum, seg) =>
    sum + (seg === '' ? 1 : Math.ceil(seg.length / charsPerLine)), 0)
}
