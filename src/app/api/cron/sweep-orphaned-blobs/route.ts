import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getPhotoAdapter } from '@/lib/storage/photo-adapter'

const BATCH_SIZE = 50

// Cron sweep: delete blobs that the backfill flow flagged as orphaned
// (entry PUT failed after the upload succeeded). Idempotent — adapters'
// delete() already swallows missing-handle errors. Marks each row sweptAt
// after a successful delete so subsequent runs skip it.
export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const orphans = await prisma.orphanedBlob.findMany({
    where: { sweptAt: null },
    take: BATCH_SIZE,
  })

  if (orphans.length === 0) {
    return NextResponse.json({ message: 'No orphans to sweep', swept: 0 })
  }

  const adapter = await getPhotoAdapter()
  let swept = 0
  const errors: string[] = []

  for (const orphan of orphans) {
    try {
      await adapter.delete(orphan.handle, orphan.userId)
      await prisma.orphanedBlob.update({
        where: { id: orphan.id },
        data: { sweptAt: new Date() },
      })
      swept++
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown'
      errors.push(`${orphan.handle}: ${msg}`)
    }
  }

  return NextResponse.json({
    swept,
    remaining: orphans.length - swept,
    errors,
  })
}

export async function GET(request: NextRequest) {
  return POST(request)
}
