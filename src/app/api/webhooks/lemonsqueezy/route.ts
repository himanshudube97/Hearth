import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyWebhookSignature } from '@/lib/lemonsqueezy'

interface WebhookPayload {
  meta: {
    event_name: string
    custom_data?: {
      user_id?: string
    }
  }
  data: {
    id: string
    attributes: {
      store_id: number
      customer_id: number
      order_id: number
      product_id: number
      variant_id: number
      status: string
      status_formatted: string
      renews_at: string | null
      ends_at: string | null
      trial_ends_at: string | null
      user_email: string
      user_name: string
    }
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  // Verify webhook signature
  const isValid = verifyWebhookSignature(
    rawBody,
    signature,
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET!
  )

  if (!isValid) {
    console.error('Invalid webhook signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    const payload: WebhookPayload = JSON.parse(rawBody)
    const eventName = payload.meta.event_name
    const userId = payload.meta.custom_data?.user_id

    console.log(`Received Lemon Squeezy webhook: ${eventName}`)

    switch (eventName) {
      case 'subscription_created':
      case 'subscription_updated':
        await handleSubscriptionUpdate(payload, userId)
        break

      case 'subscription_cancelled':
      case 'subscription_expired':
        await handleSubscriptionCancelled(payload, userId)
        break

      case 'subscription_resumed':
        await handleSubscriptionUpdate(payload, userId)
        break

      case 'subscription_payment_success':
        // Payment succeeded, subscription should already be updated
        console.log('Payment success for subscription:', payload.data.id)
        break

      case 'subscription_payment_failed':
        await handlePaymentFailed(payload, userId)
        break

      default:
        console.log(`Unhandled event: ${eventName}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleSubscriptionUpdate(
  payload: WebhookPayload,
  userId?: string
) {
  const { data } = payload
  const subscriptionId = data.id
  const attributes = data.attributes

  if (!userId) {
    // Try to find user by email
    const user = await prisma.user.findUnique({
      where: { email: attributes.user_email },
    })
    if (user) {
      userId = user.id
    } else {
      console.warn('No user found for subscription:', subscriptionId)
      return
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      lemonSqueezyCustomerId: String(attributes.customer_id),
      subscriptionId: subscriptionId,
      subscriptionStatus: attributes.status,
      variantId: String(attributes.variant_id),
      currentPeriodEnd: attributes.renews_at
        ? new Date(attributes.renews_at)
        : attributes.ends_at
          ? new Date(attributes.ends_at)
          : null,
    },
  })

  console.log(`Subscription ${attributes.status} for user ${userId}`)
}

async function handleSubscriptionCancelled(
  payload: WebhookPayload,
  userId?: string
) {
  const { data } = payload
  const subscriptionId = data.id
  const attributes = data.attributes

  // Find user by subscription ID or email
  let user = await prisma.user.findFirst({
    where: { subscriptionId: subscriptionId },
  })

  if (!user && userId) {
    user = await prisma.user.findUnique({ where: { id: userId } })
  }

  if (!user) {
    user = await prisma.user.findUnique({
      where: { email: attributes.user_email },
    })
  }

  if (!user) {
    console.warn('No user found for cancelled subscription:', subscriptionId)
    return
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: 'cancelled',
      currentPeriodEnd: attributes.ends_at
        ? new Date(attributes.ends_at)
        : null,
    },
  })

  console.log(`Subscription cancelled for user ${user.id}`)
}

async function handlePaymentFailed(payload: WebhookPayload, userId?: string) {
  const { data } = payload
  const subscriptionId = data.id

  const user = await prisma.user.findFirst({
    where: { subscriptionId: subscriptionId },
  })

  if (!user) {
    console.warn('No user found for failed payment:', subscriptionId)
    return
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: 'past_due',
    },
  })

  console.log(`Payment failed for user ${user.id}`)
}
