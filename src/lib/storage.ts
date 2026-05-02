import { createClient } from '@supabase/supabase-js'

function getAdapter() {
  return process.env.STORAGE_ADAPTER || 'local'
}

/**
 * Upload a photo to the configured storage backend.
 * - local: returns the data URL unchanged (base64 stored in DB)
 * - supabase: uploads to Supabase Storage bucket 'entry-photos', returns public URL
 *
 * If the URL is already a remote URL (not a data: URI), it is returned as-is.
 */
export async function uploadPhoto(
  url: string,
  entryId: string,
  position: number,
  spread: number
): Promise<string> {
  if (!url.startsWith('data:')) return url
  if (getAdapter() !== 'supabase') return url

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const matches = url.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9\-.+]+);base64,(.+)$/)
  if (!matches) return url

  const mimeType = matches[1]
  const base64Data = matches[2]
  const buffer = Buffer.from(base64Data, 'base64')
  const ext = mimeType.includes('png') ? 'png' : 'jpg'
  const path = `${entryId}/${spread}-${position}-${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('entry-photos')
    .upload(path, buffer, { contentType: mimeType, upsert: true })

  if (error) {
    console.error('[storage] Upload failed, falling back to base64:', error.message)
    return url
  }

  return supabase.storage.from('entry-photos').getPublicUrl(path).data.publicUrl
}

/**
 * Upload multiple photos for an entry, returning updated photo objects.
 */
export async function uploadPhotos<T extends { url: string; position: number; spread: number }>(
  photos: T[],
  entryId: string
): Promise<T[]> {
  if (getAdapter() !== 'supabase') return photos
  return Promise.all(
    photos.map(async (p) => ({
      ...p,
      url: await uploadPhoto(p.url, entryId, p.position, p.spread),
    }))
  )
}
