# Payment Integration - Lemon Squeezy

## Overview

Hearth uses **Lemon Squeezy** as its payment processor and Merchant of Record (MoR). This document explains the decision, setup, and pricing details.

---

## Why Not Stripe?

We initially attempted to integrate Stripe, but encountered a regulatory blocker:

### The Problem

```
Error: As per Indian regulations, only registered Indian businesses
(i.e. sole proprietorships, limited liability partnerships and companies,
but not individuals) can accept international payments.
```

**Indian RBI regulations require:**
- Only registered businesses can accept international payments via Stripe
- Individual accounts are restricted to domestic (INR) payments only
- Business registration requires: GST, PAN, and formal business entity

Since Hearth is developed by an individual (not a registered business), Stripe was not viable for accepting global USD payments.

---

## Why Lemon Squeezy?

### Merchant of Record Model

Lemon Squeezy acts as the **Merchant of Record (MoR)**, meaning:
- They are the legal seller to customers
- They handle all tax compliance (GST, VAT, sales tax globally)
- They handle payment processing, fraud protection, chargebacks
- You (the developer) are a "vendor" receiving payouts
- **No business registration required**

### Comparison: Payment Processors for Indian Individuals

| Platform | Works for Individuals? | Global Payments? | Total Fees |
|----------|------------------------|------------------|------------|
| **Stripe** | No (India regulations) | N/A | N/A |
| **Razorpay** | Yes | India only | ~2-3% |
| **PayPal** | Yes | Yes | ~8-9% (high!) |
| **Lemon Squeezy** | Yes | Yes | ~5-6% |
| **Paddle** | Yes | Yes | ~5-6% |

### Why Lemon Squeezy over Paddle?

- Simpler dashboard, indie-developer friendly
- Recently acquired by Stripe (reliability)
- Better documentation
- Popular in indie hacker community
- Slightly lower international fees

---

## Pricing Structure

### Hearth Subscription Plans

| Plan | Price | Billing |
|------|-------|---------|
| Monthly | $5/month | Recurring |
| Yearly | $40/year | Recurring (save $20) |

### Why USD?

1. **Global appeal** - $5 is standard SaaS pricing worldwide
2. **Single conversion** - Customer pays USD → You receive USD → Convert to INR once
3. **Professional positioning** - Positions Hearth as a global product, not "cheap Indian app"
4. **Simpler accounting** - One currency to track

### Fee Breakdown

#### Monthly Plan ($5)
```
Customer pays:           $5.00
Lemon Squeezy fee:      -$0.75 (5% + $0.50)
International fee:      -$0.08 (1.5% for non-US)
You receive:             $4.17 USD
After INR conversion:    ~₹345 (at ₹83/USD)
```

#### Yearly Plan ($40)
```
Customer pays:           $40.00
Lemon Squeezy fee:       -$2.50 (5% + $0.50)
International fee:       -$0.60 (1.5% for non-US)
You receive:             $36.90 USD
After INR conversion:    ~₹3,060 (at ₹83/USD)
```

### Payout Details

- Payouts on 1st and 15th of each month
- 13-day hold on funds before payout eligibility
- Minimum $50 threshold (rolls over if not met)
- Bank transfer in USD → Your bank converts to INR
- Mid-market exchange rate used

---

## Technical Implementation

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         HEARTH APP                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌─────────────────────┐    ┌────────────┐ │
│  │ Pricing Page │───▶│ /api/checkout       │───▶│  Lemon     │ │
│  │ (Click Buy)  │    │ (Create checkout)   │    │  Squeezy   │ │
│  └──────────────┘    └─────────────────────┘    │  Checkout  │ │
│                                                  └─────┬──────┘ │
│                                                        │        │
│                                                        ▼        │
│  ┌──────────────┐    ┌─────────────────────┐    ┌────────────┐ │
│  │ Database     │◀───│ /api/webhooks/      │◀───│  Lemon     │ │
│  │ (Update sub) │    │ lemonsqueezy        │    │  Squeezy   │ │
│  └──────────────┘    └─────────────────────┘    │  Webhooks  │ │
│                                                  └────────────┘ │
│                                                                 │
│  ┌──────────────┐    ┌─────────────────────┐                   │
│  │ Settings     │───▶│ /api/billing-portal │───▶ Customer      │
│  │ (Manage sub) │    │                     │    Portal         │
│  └──────────────┘    └─────────────────────┘                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Database Schema

```prisma
model User {
  // ... other fields

  // Lemon Squeezy subscription fields
  lemonSqueezyCustomerId String?   @unique
  subscriptionId         String?   @unique
  subscriptionStatus     String?   // "active", "cancelled", "past_due", "on_trial", "paused"
  variantId              String?   // which variant/plan they subscribed to
  currentPeriodEnd       DateTime? // when current billing period ends (renews_at)
}
```

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/checkout` | POST | Create Lemon Squeezy checkout URL |
| `/api/webhooks/lemonsqueezy` | POST | Handle subscription events |
| `/api/subscription/status` | GET | Get user's subscription status |
| `/api/billing-portal` | POST | Get customer portal URL |

### Environment Variables

```bash
# Lemon Squeezy
LEMONSQUEEZY_API_KEY=eyJ0eXAiOiJKV1Q...
LEMONSQUEEZY_STORE_ID=294477
LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret
LEMONSQUEEZY_VARIANT_MONTHLY=1314455
LEMONSQUEEZY_VARIANT_YEARLY=1314444

# App URL
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Files

| File | Purpose |
|------|---------|
| `src/lib/lemonsqueezy.ts` | SDK setup, checkout creation, helpers |
| `src/app/api/checkout/route.ts` | Create checkout sessions |
| `src/app/api/webhooks/lemonsqueezy/route.ts` | Handle webhooks |
| `src/app/api/subscription/status/route.ts` | Return subscription status |
| `src/app/api/billing-portal/route.ts` | Get customer portal URL |
| `src/hooks/useSubscription.ts` | React hook for subscription state |
| `src/app/pricing/page.tsx` | Pricing page with checkout buttons |

---

## Webhook Events Handled

| Event | Action |
|-------|--------|
| `subscription_created` | Set user as premium, store subscription ID |
| `subscription_updated` | Update status, renewal date |
| `subscription_cancelled` | Mark as cancelled, set end date |
| `subscription_payment_success` | Log success |
| `subscription_payment_failed` | Mark as past_due |

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
Lemon Squeezy has a test mode toggle in the dashboard. Use test mode during development.

### Test Cards
Use standard test card: `4242 4242 4242 4242` with any future expiry and CVC.

### Local Webhook Testing
Use ngrok to expose local server:
```bash
ngrok http 3000
```
Then set webhook URL in Lemon Squeezy to your ngrok URL.

---

## Going Live Checklist

- [ ] Switch Lemon Squeezy to live mode
- [ ] Update webhook URL to production domain
- [ ] Verify webhook signing secret is set
- [ ] Test with real card (can refund immediately)
- [ ] Set up payout method (bank account or PayPal)
- [ ] Complete identity verification in Lemon Squeezy
- [ ] Add refund policy to pricing page

---

## Refund Policy

> **No refunds** – here's why: I'm a solo developer, and processing refunds is genuinely hard for me. But more importantly, there are no surprises here. You get full access to everything during your free tier. The paid plan is the exact same thing, just for longer. Take your time, explore the app, and only subscribe when you're sure. Cancel anytime – you keep access until your billing period ends.

---

## Alternative Considered

### If Business Registration Happens Later

If Hearth becomes a registered business in India, consider:
1. **Razorpay** for Indian customers (lower fees, UPI support)
2. **Stripe** for international customers
3. Keep Lemon Squeezy as single solution (simpler)

### Multi-Currency Future

Could offer INR pricing for Indian customers:
- ₹399/month (~$5)
- ₹3,199/year (~$40)

This would require detecting user location and showing appropriate pricing.

---

## Resources

- [Lemon Squeezy Docs](https://docs.lemonsqueezy.com)
- [Lemon Squeezy API Reference](https://docs.lemonsqueezy.com/api)
- [Lemon Squeezy Dashboard](https://app.lemonsqueezy.com)
- [Webhook Events Reference](https://docs.lemonsqueezy.com/help/webhooks)
