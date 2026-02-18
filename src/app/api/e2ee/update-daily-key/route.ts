import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// POST - Update daily key (re-wrap master key after recovery)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { encryptedMasterKey, masterKeyIV, masterKeySalt } = body

    // Validate required fields
    if (!encryptedMasterKey || !masterKeyIV || !masterKeySalt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if E2EE is enabled
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { e2eeEnabled: true },
    })

    if (!existingUser?.e2eeEnabled) {
      return NextResponse.json(
        { error: 'E2EE is not enabled' },
        { status: 400 }
      )
    }

    // Update the encrypted master key with new daily key
    await prisma.user.update({
      where: { id: user.id },
      data: {
        encryptedMasterKey,
        masterKeyIV,
        masterKeySalt,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating daily key:', error)
    return NextResponse.json(
      { error: 'Failed to update daily key' },
      { status: 500 }
    )
  }
}
