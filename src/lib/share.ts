import { toBlob } from 'html-to-image'

export type ShareSurface = 'diary' | 'scrapbook' | 'memory'

export interface ShareResult {
  method: 'share' | 'download' | 'cancelled'
}

/**
 * Wait for all `<img>` elements inside `el` to finish loading. `html-to-image`
 * captures whatever is in the DOM at the moment it runs, so unloaded images
 * become broken-image rectangles in the PNG.
 */
async function waitForImages(el: HTMLElement): Promise<void> {
  const imgs = Array.from(el.querySelectorAll('img'))
  await Promise.all(
    imgs.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve()
      return new Promise<void>((resolve) => {
        const done = () => {
          img.removeEventListener('load', done)
          img.removeEventListener('error', done)
          resolve()
        }
        img.addEventListener('load', done)
        img.addEventListener('error', done) // resolve even on error so we don't hang
      })
    }),
  )
}

/**
 * Capture an HTMLElement to a PNG blob at 2× device pixel ratio.
 * Waits for fonts + images to settle before snapshotting so the result
 * isn't blank or broken. Returns null on failure so callers can show a toast.
 */
export async function captureToBlob(element: HTMLElement): Promise<Blob | null> {
  try {
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      await document.fonts.ready
    }
    await waitForImages(element)

    const blob = await toBlob(element, {
      pixelRatio: 2,
      // cacheBust appends `?timestamp` to image URLs, which breaks the
      // blob: URLs that usePhotoSrc returns for E2EE-decrypted photos.
      // Photos are already same-origin and freshly fetched, so caching
      // isn't a concern here.
      cacheBust: false,
      backgroundColor: undefined, // let the frame paint its own background
    })
    if (!blob) {
      console.error('[share] capture returned null blob — element may be empty or tainted')
    }
    return blob
  } catch (err) {
    const e = err as Error
    console.error('[share] capture failed:', e?.message || err, e)
    return null
  }
}

/**
 * Share a PNG blob via the native share sheet when available, else download.
 * Returns the method actually used so callers can show the right toast.
 */
export async function shareOrDownload(blob: Blob, filename: string): Promise<ShareResult> {
  const file = new File([blob], filename, { type: 'image/png' })

  // Web Share API path — iOS, Android, Mac Safari, recent desktop Chrome
  if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'A page from Hearth' })
      return { method: 'share' }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return { method: 'cancelled' }
      // Fall through to download
    }
  }

  downloadBlob(blob, filename)
  return { method: 'download' }
}

/** Plain download — used as fallback and as the explicit "Save" button. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** `hearth-diary-2026-05-09.png` */
export function makeShareFilename(surface: ShareSurface, date: Date): string {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `hearth-${surface}-${yyyy}-${mm}-${dd}.png`
}
