'use client'

import { useEffect, useState } from 'react'
import { useE2EEStore } from '@/store/e2ee'
import { decryptString, decryptBytes } from '@/lib/e2ee/crypto'

export interface PhotoWithE2EE {
  url?: string
  encryptedRef?: string
  encryptedRefIV?: string
}

/**
 * Resolves the display src for a photo. Three cases, picked by what fields are set:
 *
 * - Plain data-URL or absolute external URL on `photo.url`: returned as-is.
 *   This covers legacy entries written before the storage adapter existed.
 *
 * - `/api/photos/{handle}` on `photo.url`: a non-E2EE photo stored via the
 *   adapter (Postgres in dev, Supabase Storage in prod). We fetch the bytes
 *   and wrap them in a blob URL so the browser doesn't depend on the route's
 *   octet-stream Content-Type to render.
 *
 * - `photo.encryptedRef` set: an E2EE photo. Decrypt the {handle, iv} ref,
 *   fetch ciphertext, decrypt, return as a blob URL.
 *
 * Returns null while loading or on error. Revokes any created blob URL on
 * cleanup.
 */
export function usePhotoSrc(photo: PhotoWithE2EE): string | null {
  const masterKey = useE2EEStore((s) => s.masterKey)
  const isHandleUrl = !!photo.url && photo.url.startsWith('/api/photos/')
  const initialSrc = photo.url && !isHandleUrl ? photo.url : null
  const [src, setSrc] = useState<string | null>(initialSrc)

  useEffect(() => {
    // Direct URL (data: or absolute) — render as-is, no fetch needed.
    if (photo.url && !photo.url.startsWith('/api/photos/')) {
      setSrc(photo.url)
      return
    }

    const isHandle = photo.url && photo.url.startsWith('/api/photos/')
    const isE2EE = !!photo.encryptedRef && !!photo.encryptedRefIV && !!masterKey
    if (!isHandle && !isE2EE) {
      setSrc(null)
      return
    }

    let cancelled = false
    let revokeUrl: string | null = null

    ;(async () => {
      try {
        let plain: ArrayBuffer | Uint8Array

        if (isE2EE) {
          const refJson = await decryptString(
            photo.encryptedRef!,
            photo.encryptedRefIV!,
            masterKey!,
          )
          const { handle, iv } = JSON.parse(refJson) as { handle: string; iv: string }
          const res = await fetch(`/api/photos/${handle}`)
          if (!res.ok) throw new Error(`photo fetch failed: ${res.status}`)
          const cipherBytes = new Uint8Array(await res.arrayBuffer())
          let binary = ''
          for (let i = 0; i < cipherBytes.length; i++) {
            binary += String.fromCharCode(cipherBytes[i])
          }
          plain = await decryptBytes(btoa(binary), iv, masterKey!)
        } else {
          // Non-E2EE handle URL: fetch the bytes and wrap as a blob URL.
          const res = await fetch(photo.url!)
          if (!res.ok) throw new Error(`photo fetch failed: ${res.status}`)
          plain = await res.arrayBuffer()
        }

        if (cancelled) return
        const blob = new Blob([plain])
        const url = URL.createObjectURL(blob)
        revokeUrl = url
        setSrc(url)
      } catch (err) {
        console.error('usePhotoSrc: load failed', err)
        if (!cancelled) setSrc(null)
      }
    })()

    return () => {
      cancelled = true
      if (revokeUrl) URL.revokeObjectURL(revokeUrl)
    }
  }, [photo.url, photo.encryptedRef, photo.encryptedRefIV, masterKey])

  return src
}
