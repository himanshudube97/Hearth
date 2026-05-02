/**
 * Photo storage adapter.
 *
 * Browser uploads encrypted photo bytes to /api/photos. The route handler
 * delegates to the adapter selected at startup based on PHOTO_STORAGE env var.
 *
 * Adapters store ciphertext only — they have no knowledge of encryption.
 */
export interface PhotoStorageAdapter {
  /** Persist ciphertext bytes for a user. Returns an opaque handle. */
  store(encryptedBytes: Buffer, userId: string): Promise<string>

  /** Retrieve ciphertext bytes for a user. Throws if not found / not owned. */
  retrieve(handle: string, userId: string): Promise<Buffer>

  /** Remove ciphertext bytes for a user. Idempotent. */
  delete(handle: string, userId: string): Promise<void>
}

let _adapter: PhotoStorageAdapter | null = null

export async function getPhotoAdapter(): Promise<PhotoStorageAdapter> {
  if (_adapter) return _adapter

  const mode = process.env.PHOTO_STORAGE ?? 'local'
  if (mode === 'supabase') {
    const { SupabaseStorageAdapter } = await import('./supabase-storage-adapter')
    _adapter = new SupabaseStorageAdapter()
  } else {
    const { LocalPostgresAdapter } = await import('./local-postgres-adapter')
    _adapter = new LocalPostgresAdapter()
  }

  return _adapter
}

/** Reset for tests. Not for production use. */
export function _resetPhotoAdapterForTests() {
  _adapter = null
}
