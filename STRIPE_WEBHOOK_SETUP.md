# Stripe Webhook Setup for Local Development

## Issue
After completing checkout, the subscription doesn't upgrade to Pro because webhooks aren't being received locally.

## Solution: Use Stripe CLI

### 1. Install Stripe CLI
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Or download from: https://stripe.com/docs/stripe-cli
```

### 2. Login to Stripe
```bash
stripe login
```

### 3. Forward Webhooks to Local Server
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will output a webhook signing secret like:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

### 4. Update .env.local
Copy the webhook secret and update your `.env.local`:
```
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### 5. Restart Next.js Dev Server
```bash
npm run dev
```

### 6. Test the Flow
1. Go to Settings → Billing
2. Click "Upgrade to Pro"
3. Select number of seats
4. Complete checkout with test card: `4242 4242 4242 4242`
5. The webhook will fire and upgrade your subscription

## Webhook Events Handled
- `checkout.session.completed` - Updates customer ID
- `customer.subscription.created` - Creates/updates subscription
- `customer.subscription.updated` - Updates subscription details
- `customer.subscription.deleted` - Cancels subscription
- `invoice.payment_succeeded` - Marks invoice as paid
- `invoice.payment_failed` - Marks invoice as failed

## Troubleshooting

### Subscription not upgrading?
- Check Stripe CLI is running and forwarding webhooks
- Check Next.js server logs for webhook errors
- Verify `STRIPE_WEBHOOK_SECRET` matches the CLI output
- Check Stripe Dashboard → Developers → Webhooks for event logs

### Testing without webhooks?
For quick testing, you can manually update the subscription in Convex:
1. Go to Convex Dashboard
2. Find your subscription in the `subscriptions` table
3. Update: `plan: "pro"`, `status: "active"`, `seats: <number>`
