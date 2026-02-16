import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isPremium, LEMONSQUEEZY_VARIANTS } from '@/lib/lemonsqueezy'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        subscriptionStatus: true,
        variantId: true,
        currentPeriodEnd: true,
      },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const premium = isPremium(dbUser.subscriptionStatus, dbUser.currentPeriodEnd)

    // Determine plan type from variantId
    let plan: 'monthly' | 'yearly' | null = null
    if (dbUser.variantId === LEMONSQUEEZY_VARIANTS.monthly) {
      plan = 'monthly'
    } else if (dbUser.variantId === LEMONSQUEEZY_VARIANTS.yearly) {
      plan = 'yearly'
    }

    return NextResponse.json({
      isPremium: premium,
      plan,
      status: dbUser.subscriptionStatus,
      currentPeriodEnd: dbUser.currentPeriodEnd,
    })
  } catch (error) {
    console.error('Subscription status error:', error)
    return NextResponse.json(
      { error: 'Failed to get subscription status' },
      { status: 500 }
    )
  }
}
