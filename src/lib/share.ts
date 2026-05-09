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

/**
 * Wrap a captured PNG inside a polaroid-style frame: white border, thicker
 * bottom strip with a handwritten-feel caption. Returns a new PNG blob.
 *
 * Pure canvas — no DOM dependency — so it can run after a live-DOM capture
 * without re-introducing the parent-context fragility we saw when synthesizing
 * the diary off-screen.
 */
export async function wrapInPolaroid(
  sourceBlob: Blob,
  caption: string,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(sourceBlob)
    const img = new Image()
    img.onload = () => {
      try {
        const SIDE = Math.round(img.width * 0.04) // ~4% of width
        const TOP = SIDE
        const BOTTOM = Math.round(img.height * 0.16) // thicker bottom strip
        const W = img.width + SIDE * 2
        const H = img.height + TOP + BOTTOM

        const canvas = document.createElement('canvas')
        canvas.width = W
        canvas.height = H
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          URL.revokeObjectURL(objectUrl)
          resolve(null)
          return
        }

        // Off-white paper background
        ctx.fillStyle = '#fbfaf6'
        ctx.fillRect(0, 0, W, H)

        // Very subtle paper grain via radial vignette in the corners
        const grad = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.1, W / 2, H / 2, Math.max(W, H) * 0.7)
        grad.addColorStop(0, 'rgba(0,0,0,0)')
        grad.addColorStop(1, 'rgba(0,0,0,0.04)')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, W, H)

        // The captured diary image
        ctx.drawImage(img, SIDE, TOP)

        // Caption in the bottom strip — caveat-style cursive feel via Georgia italic
        const fontSize = Math.round(BOTTOM * 0.30)
        ctx.fillStyle = '#5a4a3e'
        ctx.font = `italic ${fontSize}px "Caveat", "Georgia", serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const captionY = TOP + img.height + BOTTOM / 2
        ctx.fillText(caption, W / 2, captionY)

        canvas.toBlob((blob) => {
          URL.revokeObjectURL(objectUrl)
          resolve(blob)
        }, 'image/png')
      } catch (err) {
        console.error('[share] polaroid wrap failed', err)
        URL.revokeObjectURL(objectUrl)
        resolve(null)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(null)
    }
    img.src = objectUrl
  })
}

/** `hearth-diary-2026-05-09.png` */
export function makeShareFilename(surface: ShareSurface, date: Date): string {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `hearth-${surface}-${yyyy}-${mm}-${dd}.png`
}
