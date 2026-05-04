'use client'

import { decryptString } from '@/lib/e2ee/crypto'

interface PhotoLike {
  url?: string | null
  encryptedRef?: string | null
  encryptedRefIV?: string | null
}

/**
 * Tell the server to delete the underlying bytes for a photo (Postgres blob
 * row in dev, Supabase object in prod). Fire-and-forget — failures here
 * shouldn't block the user removing the photo from their entry.
 *
 * Two shapes:
 *   - Non-E2EE: `url: '/api/photos/{handle}'` — handle is in the URL,
 *     server could do this itself in principle, but having the client do it
 *     keeps the deletion path uniform with the E2EE case below.
 *   - E2EE: `encryptedRef` is an encrypted JSON `{handle, iv}`. Server can't
 *     read it. The browser is the only party that knows which storage object
 *     to delete, so this MUST happen client-side.
 *
 * masterKey is required only for the E2EE branch. Pass null/undefined if the
 * key isn't available — the function will silently skip an E2EE-encrypted
 * photo rather than throw, since blocking removal would frustrate the user.
 */
export async function deletePhotoBlob(
  photo: PhotoLike,
  masterKey: CryptoKey | null,
): Promise<void> {
  let handle: string | null = null

  if (photo.url && photo.url.startsWith('/api/photos/')) {
    handle = photo.url.slice('/api/photos/'.length)
  } else if (photo.encryptedRef && photo.encryptedRefIV && masterKey) {
    try {
      const refJson = await decryptString(
        photo.encryptedRef,
        photo.encryptedRefIV,
        masterKey,
      )
      const parsed = JSON.parse(refJson) as { handle?: string }
      if (parsed.handle) handle = parsed.handle
    } catch (err) {
      console.warn('deletePhotoBlob: could not decrypt ref', err)
      return
    }
  }

  if (!handle) return

  try {
    // Don't encodeURIComponent the whole handle — the Supabase adapter issues
    // handles like `{userId}/{uuid}.bin` and the route is a catch-all, so the
    // slashes need to stay as path separators. Encode each segment instead.
    const path = handle.split('/').map(encodeURIComponent).join('/')
    await fetch(`/api/photos/${path}`, { method: 'DELETE' })
  } catch (err) {
    console.warn('deletePhotoBlob: DELETE failed', err)
  }
}
