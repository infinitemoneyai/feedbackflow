import Stripe from "stripe";

// Initialize Stripe client
// Note: This should only be used in server-side code (API routes, server actions)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
  typescript: true,
});

// Stripe Price IDs - These will be created in Stripe Dashboard
// Test mode prices for development
export const STRIPE_PRICES = {
  PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY || "price_pro_monthly_test",
} as const;

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

/**
 * Create a Stripe Checkout session for upgrading to Pro
 */
export async function createCheckoutSession({
  teamId,
  customerId,
  seats,
  successUrl,
  cancelUrl,
}: {
  teamId: string;
  customerId: string;
  seats: number;
  successUrl: string;
  cancelUrl: string;
}): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [
      {
        price: STRIPE_PRICES.PRO_MONTHLY,
        quantity: seats,
      },
    ],
    metadata: {
      teamId,
    },
    subscription_data: {
      metadata: {
        teamId,
      },
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
  });

  return session;
}

/**
 * Create or get a Stripe customer for a team
 */
export async function getOrCreateCustomer({
  email,
  name,
  teamId,
  existingCustomerId,
}: {
  email: string;
  name: string;
  teamId: string;
  existingCustomerId?: string;
}): Promise<Stripe.Customer> {
  // If we have an existing customer ID, retrieve it
  if (existingCustomerId) {
    try {
      const customer = await stripe.customers.retrieve(existingCustomerId);
      if (!customer.deleted) {
        return customer as Stripe.Customer;
      }
    } catch {
      // Customer not found, create new one
    }
  }

  // Create a new customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      teamId,
    },
  });

  return customer;
}

/**
 * Create a Stripe Billing Portal session
 */
export async function createBillingPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}): Promise<Stripe.BillingPortal.Session> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

/**
 * Get a subscription by ID
 */
export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription | null> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch {
    return null;
  }
}

/**
 * Cancel a subscription at period end
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });

  return subscription;
}

/**
 * Resume a cancelled subscription
 */
export async function resumeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });

  return subscription;
}

/**
 * Update subscription quantity (seats)
 */
export async function updateSubscriptionSeats({
  subscriptionId,
  seats,
}: {
  subscriptionId: string;
  seats: number;
}): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const subscriptionItemId = subscription.items.data[0]?.id;

  if (!subscriptionItemId) {
    throw new Error("Subscription item not found");
  }

  const updatedSubscription = await stripe.subscriptions.update(
    subscriptionId,
    {
      items: [
        {
          id: subscriptionItemId,
          quantity: seats,
        },
      ],
      proration_behavior: "create_prorations",
    }
  );

  return updatedSubscription;
}

/**
 * Verify Stripe webhook signature
 */
export function constructWebhookEvent(
  payload: string,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

// Type helper for subscription status
export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "trialing";

export function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":
      return "active";
    case "canceled":
      return "canceled";
    case "past_due":
      return "past_due";
    case "trialing":
      return "trialing";
    default:
      return "canceled";
  }
}
