import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { encryptJson, decryptJson } from '@/lib/encryption'

// Profile questions keys
export type ProfileKey =
  | 'nickname'
  | 'dateOfBirth'
  | 'lostHobby'
  | 'recharges'
  | 'smallJoy'
  | 'wantToReturn'
  | 'comfortThing'
  | 'friendDescription'

export type ProfileData = Partial<Record<ProfileKey, string>>

// GET - Fetch current user's profile data
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { profile: true },
    })

    // Decrypt profile data
    const profile = dbUser?.profile
      ? decryptJson<ProfileData>(dbUser.profile as string) || {}
      : {}

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

// PUT - Update current user's profile data (partial updates supported)
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updates: ProfileData = await request.json()

    // Get current profile and decrypt
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { profile: true },
    })

    const currentProfile = dbUser?.profile
      ? decryptJson<ProfileData>(dbUser.profile as string) || {}
      : {}

    // Merge updates with current profile
    const newProfile = { ...currentProfile, ...updates }

    // Encrypt and update user profile
    const encryptedProfile = encryptJson(newProfile)

    await prisma.user.update({
      where: { id: user.id },
      data: { profile: encryptedProfile },
    })

    return NextResponse.json({ profile: newProfile })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
