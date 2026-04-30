// Measures caret position inside a textarea by mirroring its content into a
// hidden div and reading the pixel offset of a marker placed at selectionStart.
// Used for cross-spine ArrowUp/ArrowDown navigation in the diary, where the
// destination page wants to land its caret at roughly the same visual column.

const MIRRORED_PROPS = [
  'boxSizing',
  'width',
  'height',
  'overflowX',
  'overflowY',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderStyle',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'fontStyle',
  'fontVariant',
  'fontWeight',
  'fontStretch',
  'fontSize',
  'fontSizeAdjust',
  'lineHeight',
  'fontFamily',
  'textAlign',
  'textTransform',
  'textIndent',
  'textDecoration',
  'letterSpacing',
  'wordSpacing',
  'tabSize',
  'whiteSpace',
  'wordBreak',
  'overflowWrap',
] as const

function buildMirror(textarea: HTMLTextAreaElement): HTMLDivElement {
  const mirror = document.createElement('div')
  const computed = window.getComputedStyle(textarea)

  mirror.style.position = 'absolute'
  mirror.style.visibility = 'hidden'
  mirror.style.whiteSpace = 'pre-wrap'
  mirror.style.wordWrap = 'break-word'
  mirror.style.top = '0'
  mirror.style.left = '-9999px'

  for (const prop of MIRRORED_PROPS) {
    const cssProp = prop.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())
    mirror.style.setProperty(cssProp, computed.getPropertyValue(cssProp))
  }
  return mirror
}

function measureAt(
  mirror: HTMLDivElement,
  span: HTMLSpanElement,
  value: string,
  position: number,
): { top: number; left: number; height: number } {
  mirror.textContent = value.substring(0, position)
  // Trailing newline isn't measured unless we add a char after it.
  if (value.substring(position - 1, position) === '\n') {
    mirror.textContent += ' '
  }
  span.textContent = value.substring(position) || '.'
  mirror.appendChild(span)
  return { top: span.offsetTop, left: span.offsetLeft, height: span.offsetHeight }
}

function getCaretCoordinates(
  textarea: HTMLTextAreaElement,
  position: number,
): { top: number; left: number; height: number } {
  const mirror = buildMirror(textarea)
  const span = document.createElement('span')
  document.body.appendChild(mirror)
  try {
    return measureAt(mirror, span, textarea.value, position)
  } finally {
    document.body.removeChild(mirror)
  }
}

export function isCaretOnFirstVisualRow(textarea: HTMLTextAreaElement): boolean {
  const { top, height } = getCaretCoordinates(textarea, textarea.selectionStart)
  return top < height * 0.5
}

export function isCaretOnLastVisualRow(textarea: HTMLTextAreaElement): boolean {
  const caret = getCaretCoordinates(textarea, textarea.selectionStart)
  const end = getCaretCoordinates(textarea, textarea.value.length)
  return Math.abs(caret.top - end.top) < caret.height * 0.5
}

export function getCaretLeftOffset(textarea: HTMLTextAreaElement): number {
  return getCaretCoordinates(textarea, textarea.selectionStart).left
}

// Find the character index whose visual position lies on the first visual row
// and whose left offset is closest to targetLeft. Used to land the caret in
// the correct column when ArrowUp crosses the spine.
export function findPositionOnFirstRow(
  textarea: HTMLTextAreaElement,
  targetLeft: number,
): number {
  const value = textarea.value
  if (!value) return 0

  const mirror = buildMirror(textarea)
  const span = document.createElement('span')
  document.body.appendChild(mirror)
  try {
    const first = measureAt(mirror, span, value, 0)
    const tolerance = first.height * 0.5

    let best = 0
    let bestDist = Math.abs(first.left - targetLeft)
    for (let i = 1; i <= value.length; i++) {
      const c = measureAt(mirror, span, value, i)
      if (Math.abs(c.top - first.top) > tolerance) break
      const d = Math.abs(c.left - targetLeft)
      if (d < bestDist) {
        bestDist = d
        best = i
      }
    }
    return best
  } finally {
    document.body.removeChild(mirror)
  }
}

// Find the character index whose visual position lies on the last visual row
// and whose left offset is closest to targetLeft. Used to land the caret in
// the correct column when ArrowDown crosses the spine.
export function findPositionOnLastRow(
  textarea: HTMLTextAreaElement,
  targetLeft: number,
): number {
  const value = textarea.value
  if (!value) return 0

  const mirror = buildMirror(textarea)
  const span = document.createElement('span')
  document.body.appendChild(mirror)
  try {
    const end = measureAt(mirror, span, value, value.length)
    const tolerance = end.height * 0.5

    let best = value.length
    let bestDist = Math.abs(end.left - targetLeft)
    for (let i = value.length - 1; i >= 0; i--) {
      const c = measureAt(mirror, span, value, i)
      if (Math.abs(c.top - end.top) > tolerance) break
      const d = Math.abs(c.left - targetLeft)
      if (d < bestDist) {
        bestDist = d
        best = i
      }
    }
    return best
  } finally {
    document.body.removeChild(mirror)
  }
}
