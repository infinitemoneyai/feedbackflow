// Stripe configuration that's safe for client-side use
// Note: This file does NOT import or initialize the Stripe client

// Plan configuration
export const PLANS = {
  free: {
    name: "Free",
    seats: 1,
    feedbackLimit: 25,
    features: [
      "1 team seat",
      "25 feedback/month",
      "Screenshot capture",
      "Basic analytics",
      "Community support",
    ],
  },
  pro: {
    name: "Pro",
    seats: "unlimited",
    feedbackLimit: null, // unlimited
    pricePerSeat: 12, // $12/seat/month
    pricePerSeatYearly: 120, // $120/seat/year (2 months free)
    features: [
      "Unlimited team seats",
      "Unlimited feedback",
      "Screen recording with audio",
      "AI-powered triage",
      "Linear & Notion export",
      "Custom webhooks",
      "Priority support",
    ],
  },
} as const;

// Stripe Price IDs - These will be created in Stripe Dashboard
// Test mode prices for development
export const STRIPE_PRICES = {
  PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY || "price_pro_monthly_test",
  PRO_YEARLY: process.env.STRIPE_PRICE_PRO_YEARLY || "price_pro_yearly_test",
} as const;

// Type helper for subscription status
export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "trialing";
