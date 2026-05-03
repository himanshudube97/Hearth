// src/app/api/scrapbooks/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { encryptJson, decryptJson, safeDecrypt } from '@/lib/encryption'
import type { ScrapbookItem } from '@/lib/scrapbook'
import { makeDateItem } from '@/lib/scrapbook'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await prisma.scrapbook.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, title: true, items: true, encryptionType: true, createdAt: true, updatedAt: true },
  })

  const list = rows.map((row) => {
    const isE2EE = row.encryptionType === 'e2ee'
    const items = isE2EE ? [] : (decryptJson<ScrapbookItem[]>(row.items) ?? [])
    return {
      id: row.id,
      title: isE2EE ? row.title : (row.title ? safeDecrypt(row.title) : null),
      encryptionType: row.encryptionType,
      itemCount: isE2EE ? null : items.length,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  })

  return NextResponse.json(list)
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = req.headers.get('content-length') === '0' || req.headers.get('content-type') === null
    ? {}
    : await req.json().catch(() => ({}))

  const { encryptionType, e2eeIVs } = body as { encryptionType?: string; e2eeIVs?: unknown }
  const isE2EE = encryptionType === 'e2ee'

  const initialItems: ScrapbookItem[] = [makeDateItem(new Date(), [])]

  const created = await prisma.scrapbook.create({
    data: {
      userId: user.id,
      title: null,
      items: isE2EE ? JSON.stringify(initialItems) : encryptJson(initialItems),
      encryptionType: encryptionType ?? 'server',
      e2eeIVs: e2eeIVs ?? undefined,
    },
  })

  return NextResponse.json({
    id: created.id,
    title: null,
    items: initialItems,
    createdAt: created.createdAt,
    updatedAt: created.updatedAt,
  })
}
