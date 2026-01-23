import { NextResponse } from "next/server";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { constructWebhookEvent, mapStripeStatus } from "@/lib/stripe";
import { captureServerEvent } from "@/lib/posthog-server";

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Stripe webhook secret
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = constructWebhookEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(
          event.data.object as Stripe.Invoice
        );
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(
          event.data.object as Stripe.Invoice
        );
        break;

      default:
        // Unhandled event type
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error handling webhook:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

/**
 * Handle checkout session completed
 */
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  // Handle checkout session completion

  // Get the team ID from metadata
  const teamId = session.metadata?.teamId;
  if (!teamId) {
    console.error("No teamId in checkout session metadata");
    return;
  }

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;

  if (!customerId) {
    console.error("No customer ID in checkout session");
    return;
  }

  try {
    // Update the customer ID on the subscription
    await convex.mutation(api.billing.updateStripeCustomerIdPublic, {
      teamId: teamId as Id<"teams">,
      stripeCustomerId: customerId,
    });

    // If we have a subscription ID, fetch it from Stripe and update the subscription
    if (session.subscription) {
      const stripeSubscriptionId = typeof session.subscription === "string" 
        ? session.subscription 
        : session.subscription.id;
      
      // Fetch the full subscription from Stripe
      const { stripe } = await import("@/lib/stripe");
      const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
      
      const subscriptionItem = stripeSubscription.items.data[0];
      const priceId = subscriptionItem?.price.id;
      const quantity = subscriptionItem?.quantity || 1;
      
      // Update the subscription to Pro
      await convex.mutation(api.billing.updateSubscriptionFromStripe, {
        stripeCustomerId: customerId,
        stripeSubscriptionId: stripeSubscription.id,
        stripePriceId: priceId || "",
        plan: "pro",
        seats: quantity,
        status: mapStripeStatus(stripeSubscription.status),
        currentPeriodStart: subscriptionItem?.current_period_start ? subscriptionItem.current_period_start * 1000 : Date.now(),
        currentPeriodEnd: subscriptionItem?.current_period_end ? subscriptionItem.current_period_end * 1000 : Date.now() + 30 * 24 * 60 * 60 * 1000,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      });

      // Track checkout completed event
      captureServerEvent(teamId, "checkout_session_completed", {
        plan: "pro",
        seats: quantity,
        stripe_customer_id: customerId,
        stripe_subscription_id: stripeSubscription.id,
        amount_total: session.amount_total ? session.amount_total / 100 : 0,
        currency: session.currency,
      });
    }
  } catch (error) {
    console.error("Error handling checkout session:", error);
    throw error;
  }
}

/**
 * Handle subscription created or updated
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // Handle subscription update

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  // Get team ID from subscription metadata
  const teamId = subscription.metadata?.teamId;
  
  if (!teamId) {
    console.error("No teamId in subscription metadata");
    return;
  }

  const subscriptionItem = subscription.items.data[0];
  const priceId = subscriptionItem?.price.id;
  const quantity = subscriptionItem?.quantity || 1;

  await convex.mutation(api.billing.updateSubscriptionFromStripe, {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId || "",
    plan: "pro", // Any paid subscription is Pro
    seats: quantity,
    status: mapStripeStatus(subscription.status),
    currentPeriodStart: subscriptionItem?.current_period_start ? subscriptionItem.current_period_start * 1000 : Date.now(),
    currentPeriodEnd: subscriptionItem?.current_period_end ? subscriptionItem.current_period_end * 1000 : Date.now() + 30 * 24 * 60 * 60 * 1000,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });

  // Track subscription updated event
  captureServerEvent(teamId, "subscription_updated", {
    plan: "pro",
    seats: quantity,
    status: mapStripeStatus(subscription.status),
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    cancel_at_period_end: subscription.cancel_at_period_end,
  });
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Handle subscription deletion

  // Mark subscription as cancelled in database
  const subscriptionItem = subscription.items.data[0];
  const quantity = subscriptionItem?.quantity || 1;
  // Use type assertion since Stripe types may not include all runtime properties
  const sub = subscription as any;
  const currentPeriodStart = typeof sub.current_period_start === 'number' 
    ? sub.current_period_start * 1000 
    : Date.now();
  const currentPeriodEnd = typeof sub.current_period_end === 'number' 
    ? sub.current_period_end * 1000 
    : Date.now() + 86400000;
  
  await convex.mutation(api.billing.updateSubscriptionFromStripe, {
    stripeCustomerId: subscription.customer as string,
    stripeSubscriptionId: subscription.id,
    stripePriceId: subscriptionItem?.price.id || "",
    plan: "free",
    seats: quantity,
    status: "canceled",
    currentPeriodStart,
    currentPeriodEnd,
    cancelAtPeriodEnd: true,
  });

  // Track subscription cancelled event
  const teamId = subscription.metadata?.teamId;
  if (teamId) {
    captureServerEvent(teamId, "subscription_cancelled", {
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
    });
  }
}

/**
 * Get subscription ID from invoice line items
 */
function getSubscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  // Try to get subscription ID from the first line item
  const firstLineItem = invoice.lines.data[0];
  if (!firstLineItem) {
    return null;
  }

  const subscription = firstLineItem.subscription;
  if (!subscription) {
    return null;
  }

  return typeof subscription === "string" ? subscription : subscription.id;
}

/**
 * Handle successful invoice payment
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Handle successful invoice payment

  const subscriptionId = getSubscriptionIdFromInvoice(invoice);

  if (!subscriptionId) {
    return;
  }

  // Update subscription status to active
  await convex.mutation(api.billing.updateSubscriptionStatus, {
    stripeSubscriptionId: subscriptionId,
    status: "active",
  });
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // Handle failed invoice payment

  const subscriptionId = getSubscriptionIdFromInvoice(invoice);

  if (!subscriptionId) {
    return;
  }

  // Update subscription status to past_due
  await convex.mutation(api.billing.updateSubscriptionStatus, {
    stripeSubscriptionId: subscriptionId,
    status: "past_due",
  });

  // Track payment failed event
  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id;
  if (customerId) {
    captureServerEvent(customerId, "payment_failed", {
      stripe_subscription_id: subscriptionId,
      amount_due: invoice.amount_due ? invoice.amount_due / 100 : 0,
      currency: invoice.currency,
      attempt_count: invoice.attempt_count,
    });
  }
}
