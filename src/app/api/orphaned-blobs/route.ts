import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// Authenticated users record their own orphaned blobs here. Used by the
// backfill flow when a photo upload succeeded but the parent entry's PUT
// failed, leaving a paid-for blob nobody references. The sweep cron
// (POST /api/cron/sweep-orphaned-blobs) deletes them on a schedule.
export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { handle, reason } = await request.json()
  if (typeof handle !== 'string' || typeof reason !== 'string') {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  await prisma.orphanedBlob.create({
    data: { userId: user.id, handle, reason },
  })
  return NextResponse.json({ success: true })
}
