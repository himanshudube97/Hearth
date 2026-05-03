import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { decryptJson, safeDecrypt } from '@/lib/encryption'

const BATCH_LIMIT = 20

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cursor = request.nextUrl.searchParams.get('cursor')

  const scrapbooks = await prisma.scrapbook.findMany({
    where: { userId: user.id, encryptionType: 'server' },
    take: BATCH_LIMIT,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { id: 'asc' },
  })

  const plaintext = scrapbooks.map((s) => ({
    ...s,
    title: s.title ? safeDecrypt(s.title) : s.title,
    items: s.items ? decryptJson<unknown[]>(s.items as string) : [],
  }))

  const nextCursor = scrapbooks.length === BATCH_LIMIT ? scrapbooks[scrapbooks.length - 1].id : null
  return NextResponse.json({ scrapbooks: plaintext, nextCursor })
}
