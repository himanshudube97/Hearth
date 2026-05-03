import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const sub = await prisma.pushSubscription.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: { pausedAt: true, consecutiveIgnored: true },
  })
  return NextResponse.json({
    paused: Boolean(sub?.pausedAt),
    consecutiveIgnored: sub?.consecutiveIgnored ?? 0,
  })
}
