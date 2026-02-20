// src/lib/text-utils.ts

import { JOURNAL, getLeftPageMaxLines } from './journal-constants'

const PAGE_BREAK_MARKER = '<!--page-break-->'

/**
 * Strip the <!--page-break--> marker from stored HTML and join into one string.
 * Handles legacy entries that have the marker.
 */
export function stripPageBreak(html: string): string {
  if (!html) return ''
  return html.replace(PAGE_BREAK_MARKER, '')
}

/**
 * Convert stored HTML to an array of plain-text lines.
 * Each <p>...</p> becomes one line. Empty <p></p> becomes ''.
 */
export function htmlToLines(html: string): string[] {
  if (!html) return ['']
  const cleaned = stripPageBreak(html)
  // Split on </p><p> boundaries
  const paragraphs = cleaned
    .replace(/^<p>/, '')
    .replace(/<\/p>$/, '')
    .split(/<\/p><p>/g)
    .map(p =>
      p
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
    )
  return paragraphs
}

/**
 * Count how many display lines a text string occupies,
 * accounting for word wrap at CHARS_PER_LINE.
 */
export function countDisplayLines(lines: string[], charsPerLine: number = JOURNAL.CHARS_PER_LINE): number {
  let total = 0
  for (const line of lines) {
    if (line.length === 0) {
      total += 1 // blank line still takes a line
    } else {
      total += Math.ceil(line.length / charsPerLine)
    }
  }
  return total
}

/**
 * Split plain text into left-page and right-page portions
 * based on the left page's line capacity.
 *
 * Returns [leftText, rightText] as plain text with \n separators.
 */
export function splitTextForSpread(
  fullPlainText: string,
  maxLeftLines: number = getLeftPageMaxLines(),
  charsPerLine: number = JOURNAL.CHARS_PER_LINE,
): [string, string] {
  const lines = fullPlainText.split('\n')
  let displayLineCount = 0
  let splitIndex = lines.length // default: everything on left

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineDisplayLines = line.length === 0 ? 1 : Math.ceil(line.length / charsPerLine)

    if (displayLineCount + lineDisplayLines > maxLeftLines) {
      splitIndex = i
      break
    }
    displayLineCount += lineDisplayLines
  }

  const leftLines = lines.slice(0, splitIndex)
  const rightLines = lines.slice(splitIndex)

  return [leftLines.join('\n'), rightLines.join('\n')]
}

/**
 * Convert stored HTML entry text to plain text (full, no split).
 */
export function htmlToPlainText(html: string): string {
  const lines = htmlToLines(html)
  return lines.join('\n')
}

/**
 * Find the last word boundary in a string that fits within maxChars.
 * Returns the index to split at. If no space found, returns maxChars.
 */
export function findWordBoundary(text: string, maxChars: number): number {
  if (text.length <= maxChars) return text.length
  // Look backwards from maxChars for a space
  const lastSpace = text.lastIndexOf(' ', maxChars)
  if (lastSpace > 0) return lastSpace
  // No space found — break at maxChars (very long word)
  return maxChars
}

/**
 * Convert plain textarea text (\n-separated) to HTML paragraphs for storage.
 */
export function plainTextToHtml(text: string): string {
  if (!text.trim()) return ''
  return '<p>' + text.replace(/\n/g, '</p><p>') + '</p>'
}
