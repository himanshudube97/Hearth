import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createCheckoutUrl, LEMONSQUEEZY_VARIANTS } from '@/lib/lemonsqueezy'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const priceId = body.priceId as string

    if (priceId !== 'monthly' && priceId !== 'yearly') {
      return NextResponse.json({ error: 'Invalid price ID' }, { status: 400 })
    }

    const variantId = LEMONSQUEEZY_VARIANTS[priceId as keyof typeof LEMONSQUEEZY_VARIANTS]
    if (!variantId) {
      return NextResponse.json(
        { error: 'Variant not configured' },
        { status: 500 }
      )
    }

    const checkoutUrl = await createCheckoutUrl(
      variantId,
      user.id,
      user.email,
      user.name || undefined
    )

    if (!checkoutUrl) {
      return NextResponse.json(
        { error: 'Failed to create checkout' },
        { status: 500 }
      )
    }

    return NextResponse.json({ url: checkoutUrl })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
