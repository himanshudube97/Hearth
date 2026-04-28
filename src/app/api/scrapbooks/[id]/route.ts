import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { encrypt, encryptJson, decryptJson, safeDecrypt } from '@/lib/encryption'
import type { ScrapbookItem } from '@/lib/scrapbook'

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const row = await prisma.scrapbook.findFirst({
    where: { id, userId: user.id },
  })
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const items = decryptJson<ScrapbookItem[]>(row.items) ?? []
  return NextResponse.json({
    id: row.id,
    title: row.title ? safeDecrypt(row.title) : null,
    items,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  })
}

export async function PUT(req: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const body = (await req.json()) as { title?: string | null; items?: ScrapbookItem[] }

  const data: { title?: string | null; items?: string } = {}
  if (body.title !== undefined) {
    data.title = body.title ? encrypt(body.title) : null
  }
  if (body.items !== undefined) {
    data.items = encryptJson(body.items)
  }

  const updated = await prisma.scrapbook.updateMany({
    where: { id, userId: user.id },
    data,
  })
  if (updated.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const deleted = await prisma.scrapbook.deleteMany({
    where: { id, userId: user.id },
  })
  if (deleted.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ ok: true })
}
