import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'
import type { PhotoStorageAdapter } from './photo-adapter'

/**
 * Prod adapter: uploads ciphertext to a private Supabase Storage bucket.
 * Handle = the storage path "{userId}/{uuid}.bin".
 *
 * Bucket must be configured private. RLS recommended:
 *   bucket = SUPABASE_STORAGE_BUCKET
 *   policy: only authenticated user can read/write under their own folder
 *
 * This adapter uses the service-role key (server-only), so RLS is bypassed —
 * we manually scope by userId on every call.
 */
export class SupabaseStorageAdapter implements PhotoStorageAdapter {
  private client: SupabaseClient
  private bucket: string

  constructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const bucket = process.env.SUPABASE_STORAGE_BUCKET
    if (!url || !serviceKey || !bucket) {
      throw new Error(
        'SupabaseStorageAdapter requires NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_STORAGE_BUCKET'
      )
    }
    this.client = createClient(url, serviceKey)
    this.bucket = bucket
  }

  async store(encryptedBytes: Buffer, userId: string): Promise<string> {
    const handle = `${userId}/${randomUUID()}.bin`
    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(handle, encryptedBytes, {
        contentType: 'application/octet-stream',
        upsert: false,
      })
    if (error) throw new Error(`Supabase upload failed: ${error.message}`)
    return handle
  }

  async retrieve(handle: string, userId: string): Promise<Buffer> {
    if (!handle.startsWith(`${userId}/`)) {
      throw new Error('blob not owned by this user')
    }
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .download(handle)
    if (error || !data) throw new Error(`Supabase download failed: ${error?.message ?? 'no data'}`)
    return Buffer.from(await data.arrayBuffer())
  }

  async delete(handle: string, userId: string): Promise<void> {
    if (!handle.startsWith(`${userId}/`)) return
    await this.client.storage.from(this.bucket).remove([handle])
  }
}
