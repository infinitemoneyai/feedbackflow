import Stripe from "stripe";
import { STRIPE_PRICES, type SubscriptionStatus } from "./stripe-config";

// Re-export config for convenience in server-side code
export { PLANS, STRIPE_PRICES, type SubscriptionStatus } from "./stripe-config";

// Initialize Stripe client
// Note: This should only be used in server-side code (API routes, server actions)
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-12-15.clover",
  typescript: true,
});

/**
 * Create a Stripe Checkout session for upgrading to Pro
 */
export async function createCheckoutSession({
  teamId,
  customerId,
  seats,
  billingInterval = "monthly",
  successUrl,
  cancelUrl,
}: {
  teamId: string;
  customerId: string;
  seats: number;
  billingInterval?: "monthly" | "yearly";
  successUrl: string;
  cancelUrl: string;
}): Promise<Stripe.Checkout.Session> {
  const priceId = billingInterval === "yearly" ? STRIPE_PRICES.PRO_YEARLY : STRIPE_PRICES.PRO_MONTHLY;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [
      {
        price: priceId,
        quantity: seats,
      },
    ],
    metadata: {
      teamId,
      billingInterval,
    },
    subscription_data: {
      metadata: {
        teamId,
        billingInterval,
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
