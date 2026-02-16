import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { configureLemonSqueezy, getSubscriptionDetails } from '@/lib/lemonsqueezy'

export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { subscriptionId: true },
    })

    if (!dbUser?.subscriptionId) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 400 }
      )
    }

    configureLemonSqueezy()

    // Get subscription to find customer portal URL
    const subscription = await getSubscriptionDetails(dbUser.subscriptionId)

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    // Lemon Squeezy provides a customer portal URL in subscription attributes
    const portalUrl = subscription.attributes.urls?.customer_portal

    if (!portalUrl) {
      return NextResponse.json(
        { error: 'Customer portal not available' },
        { status: 400 }
      )
    }

    return NextResponse.json({ url: portalUrl })
  } catch (error) {
    console.error('Billing portal error:', error)
    return NextResponse.json(
      { error: 'Failed to get billing portal' },
      { status: 500 }
    )
  }
}
