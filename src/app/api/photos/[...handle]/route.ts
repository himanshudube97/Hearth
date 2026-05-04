import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getPhotoAdapter } from '@/lib/storage/photo-adapter'

// Catch-all dynamic segment ([...handle]) so the route also matches handles
// containing slashes — the Supabase adapter stores blobs as
// `{userId}/{uuid}.bin`, which a single-segment [handle] dynamic route would
// reject with a 404.
interface RouteParams {
  params: Promise<{ handle: string[] }>
}

function joinHandle(parts: string[]): string {
  // Each path segment is already URL-decoded by Next; rejoining with `/`
  // reconstructs the storage adapter handle exactly as it was issued.
  return parts.join('/')
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { handle: handleParts } = await params
  const handle = joinHandle(handleParts)
  const adapter = await getPhotoAdapter()
  try {
    const bytes = await adapter.retrieve(handle, user.id)
    return new NextResponse(bytes as unknown as BodyInit, {
      status: 200,
      headers: { 'Content-Type': 'application/octet-stream' },
    })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { handle: handleParts } = await params
  const handle = joinHandle(handleParts)
  const adapter = await getPhotoAdapter()
  await adapter.delete(handle, user.id)
  return NextResponse.json({ ok: true })
}
