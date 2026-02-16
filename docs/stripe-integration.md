# Stripe Integration Plan for Hearth

## Overview

Hearth uses Stripe for subscription payments with two plans:
- **Monthly**: $5/month
- **Yearly**: $40/year (save 2 months)

No refunds policy. Users get full access during free tier and know exactly what they're paying for.

---

## Pricing Policy

> **No refunds** – here's why: I'm a solo developer, and processing refunds is genuinely hard for me. But more importantly, there are no surprises here. You get full access to everything during your free trial. The paid plan is the exact same thing, just for longer. Take your time, explore the app, and only subscribe when you're sure. Cancel anytime – you keep access until your billing period ends.

---

## Stripe Dashboard Setup (One-time)

### Step 1: Create Stripe Account
- Go to [stripe.com](https://stripe.com) and sign up
- Use test mode initially (toggle in dashboard)

### Step 2: Create Product
- Go to **Products → Add Product**
- Name: `Hearth Premium`
- Description: `Unlimited journaling, letters, themes, and more`

### Step 3: Create Prices
On the Hearth Premium product, add two prices:

| Price | Amount | Billing | ID (copy this) |
|-------|--------|---------|----------------|
| Monthly | $5.00 | Monthly recurring | `price_xxx...` |
| Yearly | $40.00 | Yearly recurring | `price_xxx...` |

### Step 4: Get API Keys
- Go to **Developers → API Keys**
- Copy:
  - Publishable key: `pk_test_xxx...`
  - Secret key: `sk_test_xxx...`

### Step 5: Set Up Webhook
- Go to **Developers → Webhooks → Add Endpoint**
- URL: `https://yourdomain.com/api/webhooks/stripe`
- Events to select:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- Copy the webhook signing secret: `whsec_xxx...`

---

## Environment Variables

Add to `.env`:

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_MONTHLY=price_xxxxx
STRIPE_PRICE_YEARLY=price_xxxxx
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         HEARTH APP                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌─────────────────────┐    ┌────────────┐  │
│  │ Pricing Page │───▶│ /api/checkout       │───▶│  Stripe    │  │
│  │ (Click Buy)  │    │ (Create session)    │    │  Checkout  │  │
│  └──────────────┘    └─────────────────────┘    └─────┬──────┘  │
│                                                        │         │
│                                                        ▼         │
│  ┌──────────────┐    ┌─────────────────────┐    ┌────────────┐  │
│  │ Database     │◀───│ /api/webhooks/stripe│◀───│  Stripe    │  │
│  │ (Update sub) │    │ (Listen to events)  │    │  Webhooks  │  │
│  └──────────────┘    └─────────────────────┘    └────────────┘  │
│                                                                  │
│  ┌──────────────┐    ┌─────────────────────┐                    │
│  │ Settings     │───▶│ /api/billing-portal │───▶ Stripe Portal  │
│  │ (Manage sub) │    │ (Create portal)     │    (Cancel/Update) │
│  └──────────────┘    └─────────────────────┘                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema Changes

Add to `User` model in `prisma/schema.prisma`:

```prisma
model User {
  // ... existing fields

  // Stripe subscription
  stripeCustomerId     String?   @unique
  subscriptionId       String?   @unique
  subscriptionStatus   String?   // "active", "canceled", "past_due", "trialing"
  priceId              String?   // which price they subscribed to
  currentPeriodEnd     DateTime? // when current billing period ends
}
```

---

## API Endpoints

### POST `/api/checkout`

Creates a Stripe Checkout session for subscription.

**Request:**
```json
{
  "priceId": "monthly" | "yearly"
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_xxx..."
}
```

**Flow:**
1. Get current user from session
2. Create or retrieve Stripe Customer
3. Create Checkout Session with price
4. Return checkout URL
5. Frontend redirects user to Stripe

---

### POST `/api/webhooks/stripe`

Receives events from Stripe and updates database.

**Events handled:**

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Link Stripe customer to user, set subscription active |
| `customer.subscription.updated` | Update subscription status, period end date |
| `customer.subscription.deleted` | Set subscription status to canceled |

**Security:**
- Verify webhook signature using `STRIPE_WEBHOOK_SECRET`
- Reject requests with invalid signatures

---

### POST `/api/billing-portal`

Creates a Stripe Customer Portal session for self-service.

**Response:**
```json
{
  "url": "https://billing.stripe.com/p/session/xxx..."
}
```

**What users can do in portal:**
- View billing history
- Update payment method
- Cancel subscription
- (Upgrade/downgrade if configured)

---

## Files to Create/Modify

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Add subscription fields to User model |
| `src/lib/stripe.ts` | Initialize Stripe SDK |
| `src/app/api/checkout/route.ts` | Create checkout sessions |
| `src/app/api/webhooks/stripe/route.ts` | Handle Stripe webhooks |
| `src/app/api/billing-portal/route.ts` | Create portal sessions |
| `src/app/pricing/page.tsx` | Connect buttons to checkout |
| `src/hooks/useSubscription.ts` | Hook to check subscription status |

---

## User Flows

### New Subscription

```
1. User on pricing page clicks "Get Yearly — Best Value"
2. Frontend: POST /api/checkout { priceId: "yearly" }
3. Backend: Create Stripe Checkout session
4. Backend: Return { url: "https://checkout.stripe.com/..." }
5. Frontend: Redirect user to Stripe Checkout
6. User: Enters card details, clicks Pay
7. Stripe: Redirects to /pricing?success=true
8. Stripe: Sends checkout.session.completed webhook
9. Backend: Updates user.subscriptionStatus = "active"
10. User: Now has premium access!
```

### Cancel Subscription

```
1. User in settings clicks "Manage Subscription"
2. Frontend: POST /api/billing-portal
3. Backend: Return Stripe Portal URL
4. Frontend: Redirect to Stripe Portal
5. User: Clicks "Cancel subscription"
6. Stripe: Sets cancel_at_period_end = true
7. Stripe: Sends customer.subscription.updated webhook
8. Backend: Updates user record
9. User: Keeps access until currentPeriodEnd
10. At period end: Stripe sends subscription.deleted
11. Backend: Sets subscriptionStatus = "canceled"
```

### Upgrade (Monthly → Yearly)

```
1. User clicks "Manage Subscription"
2. In Stripe Portal, selects yearly plan
3. Stripe calculates proration (charges difference)
4. Stripe sends subscription.updated webhook
5. Backend updates priceId and currentPeriodEnd
6. User now on yearly plan
```

### Downgrade (Yearly → Monthly)

```
1. User in Stripe Portal selects monthly plan
2. Stripe schedules change for end of current period
3. No immediate charge (already paid for year)
4. At period end, switches to monthly billing
```

---

## Checking Premium Access

```typescript
// In any API route or server component
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { subscriptionStatus: true, currentPeriodEnd: true }
});

const isPremium =
  user?.subscriptionStatus === 'active' &&
  user?.currentPeriodEnd &&
  new Date(user.currentPeriodEnd) > new Date();
```

```typescript
// Hook for client components
function useSubscription() {
  const { data } = useSWR('/api/subscription/status');
  return {
    isPremium: data?.isPremium ?? false,
    plan: data?.plan, // 'monthly' | 'yearly' | null
    endsAt: data?.currentPeriodEnd,
  };
}
```

---

## Free Tier Limits

When `isPremium === false`, enforce these limits:

| Feature | Free Limit |
|---------|------------|
| Journal entries | 10 per month |
| Themes | 3 themes |
| Cursors | 1 cursor |
| Letters to self | 1 lifetime |
| Letters to friends | 1 lifetime |
| Letter themes | 2 themes |

---

## Testing

### Test Mode
- Use `sk_test_` and `pk_test_` keys during development
- Use [Stripe test cards](https://stripe.com/docs/testing#cards):
  - Success: `4242 4242 4242 4242`
  - Decline: `4000 0000 0000 0002`

### Test Webhooks Locally
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Test Subscription Lifecycle
1. Subscribe with test card
2. Check database for subscription status
3. Go to Stripe Dashboard → Subscriptions
4. Cancel subscription manually
5. Verify webhook updates database

---

## Going Live Checklist

- [ ] Switch to live API keys (`sk_live_`, `pk_live_`)
- [ ] Create live product and prices in Stripe
- [ ] Update environment variables
- [ ] Set up live webhook endpoint
- [ ] Test with real card (can refund immediately)
- [ ] Add policy text to pricing page
- [ ] Verify HTTPS on webhook endpoint

---

## Stripe Customer Portal Configuration

In Stripe Dashboard → Settings → Billing → Customer Portal:

- [x] Allow customers to update payment methods
- [x] Allow customers to view invoice history
- [x] Allow customers to cancel subscriptions
- [ ] Allow customers to switch plans (optional)
- Set cancellation policy: "Cancel at end of billing period"

---

## Error Handling

| Scenario | How to Handle |
|----------|---------------|
| Webhook signature invalid | Return 400, log error |
| User not found for customer | Log warning, skip update |
| Checkout session creation fails | Return error to frontend, show message |
| Card declined | Stripe handles this in Checkout UI |
| Subscription payment fails | Stripe retries, sends `invoice.payment_failed` |

---

## Future Enhancements

- [ ] Email receipts (Stripe can do this automatically)
- [ ] Usage-based billing alerts
- [ ] Referral discounts / promo codes
- [ ] Team/family plans
