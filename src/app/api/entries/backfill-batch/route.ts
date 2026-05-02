import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { decryptEntryFields } from '@/lib/encryption'

const BATCH_LIMIT = 20

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cursor = request.nextUrl.searchParams.get('cursor')

  const entries = await prisma.journalEntry.findMany({
    where: {
      userId: user.id,
      encryptionType: 'server',
    },
    take: BATCH_LIMIT,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { id: 'asc' },
    include: { photos: true, doodles: true },
  })

  // Decrypt server-side encrypted fields before returning. Client will re-encrypt.
  const plaintext = entries.map((entry) => decryptEntryFields(entry))

  const nextCursor = entries.length === BATCH_LIMIT ? entries[entries.length - 1].id : null

  return NextResponse.json({
    entries: plaintext,
    nextCursor,
  })
}
