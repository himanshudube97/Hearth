// src/app/api/letters/[id]/read/route.ts
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const result = await prisma.journalEntry.updateMany({
    where: { id, userId: user.id, isViewed: false },
    data: { isViewed: true },
  })

  return NextResponse.json({ ok: true, updated: result.count })
}
