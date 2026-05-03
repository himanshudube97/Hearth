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
    select: { recipientId: true },
  })
  if (!note) return NextResponse.json({ ok: true })
  if (note.recipientId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.strangerNote.delete({ where: { id } })
  // Cascade deletes any attached reply via Prisma relation onDelete.

  return NextResponse.json({ ok: true })
}
