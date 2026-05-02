import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { encryptedMasterKeyRecovery, recoveryKeyIV, recoveryKeyHash } = body

  if (!encryptedMasterKeyRecovery || !recoveryKeyIV || !recoveryKeyHash) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({
    where: { id: user.id },
    select: { e2eeEnabled: true },
  })
  if (!existing?.e2eeEnabled) {
    return NextResponse.json({ error: 'E2EE is not enabled' }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { encryptedMasterKeyRecovery, recoveryKeyIV, recoveryKeyHash },
  })

  return NextResponse.json({ success: true })
}
