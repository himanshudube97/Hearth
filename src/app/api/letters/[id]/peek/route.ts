// src/app/api/letters/[id]/peek/route.ts
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { safeDecrypt } from '@/lib/encryption'

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const letter = await prisma.journalEntry.findFirst({
    where: { id, userId: user.id, isSealed: true },
    select: { id: true, text: true, encryptionType: true, e2eeIVs: true, letterPeekedAt: true },
  })
  if (!letter) return NextResponse.json({ error: 'not found' }, { status: 404 })

  if (!letter.letterPeekedAt) {
    await prisma.journalEntry.update({
      where: { id },
      data: { letterPeekedAt: new Date() },
    })
  }

  // For E2EE return ciphertext + IVs so client decrypts; otherwise decrypt server-side.
  const body = letter.encryptionType === 'server' ? safeDecrypt(letter.text) : letter.text
  return NextResponse.json({
    body,
    encryptionType: letter.encryptionType,
    e2eeIVs: letter.e2eeIVs,
  })
}
