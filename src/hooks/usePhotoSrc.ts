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
 * Resolves the display src for a photo that may be either a plain data-URL
 * or an E2EE-encrypted reference (handle + IV stored as encrypted JSON).
 *
 * - If `photo.url` is set: returns it directly (non-E2EE path).
 * - If `photo.encryptedRef` is set: fetches the ciphertext bytes from
 *   `/api/photos/[handle]`, decrypts them, and returns a blob URL.
 *   Revokes the blob URL on cleanup.
 * - Returns null while loading or on error.
 */
export function usePhotoSrc(photo: PhotoWithE2EE): string | null {
  const masterKey = useE2EEStore((s) => s.masterKey)
  const [src, setSrc] = useState<string | null>(photo.url ?? null)

  useEffect(() => {
    if (photo.url) {
      setSrc(photo.url)
      return
    }
    if (!photo.encryptedRef || !photo.encryptedRefIV || !masterKey) {
      setSrc(null)
      return
    }

    let cancelled = false
    let revokeUrl: string | null = null

    ;(async () => {
      try {
        const refJson = await decryptString(
          photo.encryptedRef!,
          photo.encryptedRefIV!,
          masterKey,
        )
        const { handle, iv } = JSON.parse(refJson) as { handle: string; iv: string }

        const res = await fetch(`/api/photos/${handle}`)
        if (!res.ok) throw new Error(`photo fetch failed: ${res.status}`)

        const cipherBytes = new Uint8Array(await res.arrayBuffer())
        // Convert bytes → base64 for decryptBytes
        let binary = ''
        for (let i = 0; i < cipherBytes.length; i++) {
          binary += String.fromCharCode(cipherBytes[i])
        }
        const cipherB64 = btoa(binary)

        const plain = await decryptBytes(cipherB64, iv, masterKey)
        if (cancelled) return

        const blob = new Blob([plain])
        const url = URL.createObjectURL(blob)
        revokeUrl = url
        setSrc(url)
      } catch (err) {
        console.error('usePhotoSrc: decrypt failed', err)
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
