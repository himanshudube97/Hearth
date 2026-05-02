import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getPhotoAdapter } from '@/lib/storage/photo-adapter'

const MAX_BYTES = 25 * 1024 * 1024 // 25 MB

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const arrayBuffer = await request.arrayBuffer()
  if (arrayBuffer.byteLength === 0) {
    return NextResponse.json({ error: 'Empty body' }, { status: 400 })
  }
  if (arrayBuffer.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large' }, { status: 413 })
  }

  const buffer = Buffer.from(arrayBuffer)
  const adapter = await getPhotoAdapter()
  const handle = await adapter.store(buffer, user.id)
  return NextResponse.json({ handle })
}
