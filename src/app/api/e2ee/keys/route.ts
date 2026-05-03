import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET - Return E2EE key data for unlocking
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        e2eeEnabled: true,
        encryptedMasterKey: true,
        masterKeyIV: true,
        masterKeySalt: true,
        recoveryKeyHash: true,
        encryptedMasterKeyRecovery: true,
        recoveryKeyIV: true,
        e2eeSetupAt: true,
      },
    })

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      e2eeEnabled: userData.e2eeEnabled,
      encryptedMasterKey: userData.encryptedMasterKey,
      masterKeyIV: userData.masterKeyIV,
      masterKeySalt: userData.masterKeySalt,
      recoveryKeyHash: userData.recoveryKeyHash,
      encryptedMasterKeyRecovery: userData.encryptedMasterKeyRecovery,
      recoveryKeyIV: userData.recoveryKeyIV,
      e2eeSetupAt: userData.e2eeSetupAt ? userData.e2eeSetupAt.toISOString() : null,
    })
  } catch (error) {
    console.error('Error fetching E2EE keys:', error)
    return NextResponse.json(
      { error: 'Failed to fetch E2EE keys' },
      { status: 500 }
    )
  }
}
