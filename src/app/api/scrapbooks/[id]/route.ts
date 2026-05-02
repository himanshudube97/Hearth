import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
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

  const isE2EE = row.encryptionType === 'e2ee'
  const items = isE2EE ? (row.items ?? []) : (decryptJson<ScrapbookItem[]>(row.items) ?? [])
  return NextResponse.json({
    id: row.id,
    title: isE2EE ? row.title : (row.title ? safeDecrypt(row.title) : null),
    items,
    encryptionType: row.encryptionType,
    e2eeIVs: row.e2eeIVs,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  })
}

export async function PUT(req: NextRequest, { params }: Params) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const body = (await req.json()) as {
    title?: string | null
    items?: ScrapbookItem[]
    encryptionType?: string
    e2eeIVs?: Prisma.InputJsonValue
  }

  const { encryptionType, e2eeIVs } = body
  const isE2EE = encryptionType === 'e2ee'

  const data: {
    title?: string | null
    items?: string
    encryptionType?: string
    e2eeIVs?: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue
  } = {}
  if (body.title !== undefined) {
    data.title = body.title ? (isE2EE ? body.title : encrypt(body.title)) : null
  }
  if (body.items !== undefined) {
    data.items = isE2EE ? JSON.stringify(body.items) : encryptJson(body.items)
  }
  if (encryptionType !== undefined) {
    data.encryptionType = encryptionType
  }
  if (e2eeIVs !== undefined) {
    data.e2eeIVs = e2eeIVs
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
