import {
  lemonSqueezySetup,
  createCheckout,
  getSubscription,
  type Checkout,
} from '@lemonsqueezy/lemonsqueezy.js'

// Initialize Lemon Squeezy
export function configureLemonSqueezy() {
  lemonSqueezySetup({
    apiKey: process.env.LEMONSQUEEZY_API_KEY!,
    onError: (error) => {
      console.error('Lemon Squeezy error:', error)
      throw error
    },
  })
}

// Variant IDs for your plans (set in .env)
export const LEMONSQUEEZY_VARIANTS = {
  monthly: process.env.LEMONSQUEEZY_VARIANT_MONTHLY!,
  yearly: process.env.LEMONSQUEEZY_VARIANT_YEARLY!,
}

export const LEMONSQUEEZY_STORE_ID = process.env.LEMONSQUEEZY_STORE_ID!

export async function createCheckoutUrl(
  variantId: string,
  userId: string,
  userEmail: string,
  userName?: string
): Promise<string> {
  configureLemonSqueezy()

  const checkout = await createCheckout(LEMONSQUEEZY_STORE_ID, variantId, {
    checkoutData: {
      email: userEmail,
      name: userName || undefined,
      custom: {
        user_id: userId,
      },
    },
    productOptions: {
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pricing?success=true`,
    },
  })

  return (checkout.data?.data.attributes.url as string) || ''
}

export async function getSubscriptionDetails(subscriptionId: string) {
  configureLemonSqueezy()
  const subscription = await getSubscription(subscriptionId)
  return subscription.data?.data
}

export function isPremium(
  subscriptionStatus: string | null,
  currentPeriodEnd: Date | null
): boolean {
  if (!subscriptionStatus || !currentPeriodEnd) return false
  const activeStatuses = ['active', 'on_trial']
  return (
    activeStatuses.includes(subscriptionStatus) &&
    new Date(currentPeriodEnd) > new Date()
  )
}

// Verify webhook signature
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require('crypto')
  const hmac = crypto.createHmac('sha256', secret)
  const digest = hmac.update(payload).digest('hex')

  try {
    return crypto.timingSafeEqual(
      Buffer.from(digest),
      Buffer.from(signature)
    )
  } catch {
    return false
  }
}
