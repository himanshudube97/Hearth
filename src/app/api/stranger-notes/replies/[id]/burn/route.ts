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

  const reply = await prisma.strangerReply.findUnique({
    where: { id },
    select: { note: { select: { senderId: true } } },
  })
  if (!reply) return NextResponse.json({ ok: true })
  if (reply.note.senderId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.strangerReply.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
