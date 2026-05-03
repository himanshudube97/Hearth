import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const note = await prisma.strangerNote.findUnique({
    where: { id },
    select: { recipientId: true, readAt: true },
  })
  if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (note.recipientId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (note.readAt) return NextResponse.json({ ok: true })

  await prisma.strangerNote.update({
    where: { id },
    data: { readAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}
