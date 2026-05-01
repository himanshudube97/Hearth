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
    select: { id: true, title: true, items: true, createdAt: true, updatedAt: true },
  })

  const list = rows.map((row) => {
    const items = decryptJson<ScrapbookItem[]>(row.items) ?? []
    return {
      id: row.id,
      title: row.title ? safeDecrypt(row.title) : null,
      itemCount: items.length,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  })

  return NextResponse.json(list)
}

export async function POST(_req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const initialItems: ScrapbookItem[] = [makeDateItem(new Date(), [])]

  const created = await prisma.scrapbook.create({
    data: {
      userId: user.id,
      title: null,
      items: encryptJson(initialItems),
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
