import { NextResponse } from "next/server";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { constructWebhookEvent, mapStripeStatus } from "@/lib/stripe";

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
        console.log(`Unhandled event type: ${event.type}`);
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
  console.log("Checkout session completed:", session.id);

  // Get the team ID from metadata
  const teamId = session.metadata?.teamId;
  if (!teamId) {
    console.error("No teamId in checkout session metadata");
    return;
  }

  // The subscription will be created/updated by the subscription webhook
  // We just need to update the customer ID on the subscription
  if (session.customer) {
    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer.id;

    try {
      // Find the subscription for this team and update the customer ID
      const subscription = await convex.query(api.billing.getSubscriptionPublic, {
        teamId: teamId as Id<"teams">,
      });

      if (subscription && !subscription.stripeCustomerId) {
        await convex.mutation(api.billing.updateStripeCustomerId, {
          teamId: teamId as Id<"teams">,
          stripeCustomerId: customerId,
        });
      }
    } catch (error) {
      console.error("Error updating customer ID:", error);
    }
  }
}

/**
 * Handle subscription created or updated
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log("Subscription updated:", subscription.id, subscription.status);

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
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log("Subscription deleted:", subscription.id);

  await convex.mutation(api.billing.cancelSubscriptionFromStripe, {
    stripeSubscriptionId: subscription.id,
  });
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
  console.log("Invoice payment succeeded:", invoice.id);

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
  console.log("Invoice payment failed:", invoice.id);

  const subscriptionId = getSubscriptionIdFromInvoice(invoice);

  if (!subscriptionId) {
    return;
  }

  // Update subscription status to past_due
  await convex.mutation(api.billing.updateSubscriptionStatus, {
    stripeSubscriptionId: subscriptionId,
    status: "past_due",
  });
}
