import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getPhotoAdapter } from '@/lib/storage/photo-adapter'

interface RouteParams {
  params: Promise<{ handle: string }>
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { handle } = await params
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

  const { handle } = await params
  const adapter = await getPhotoAdapter()
  await adapter.delete(handle, user.id)
  return NextResponse.json({ ok: true })
}
