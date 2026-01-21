import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { createCheckoutSession, getOrCreateCustomer } from "@/lib/stripe";

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { teamId, seats = 1, billingInterval = "monthly" } = body;

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const subscription = await convex.query(api.billing.getSubscriptionPublic, {
      teamId: teamId as Id<"teams">,
    });

    let stripeCustomerId = subscription?.stripeCustomerId;

    if (!stripeCustomerId) {
      // Use user's name or email for Stripe customer
      const customerName = user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}`
        : user.emailAddresses[0]?.emailAddress || "Team Member";
      
      const customer = await getOrCreateCustomer({
        email: user.emailAddresses[0]?.emailAddress || "",
        name: customerName,
        teamId,
      });
      stripeCustomerId = customer.id;

      // Update the subscription with the customer ID using internal mutation
      try {
        await convex.mutation(api.billing.updateStripeCustomerIdPublic, {
          teamId: teamId as Id<"teams">,
          stripeCustomerId,
        });
      } catch (error) {
        console.error("Failed to update customer ID in Convex:", error);
        // Continue anyway - the webhook will handle it
      }
    }

    // Create checkout session
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get("origin") || "";
    const session = await createCheckoutSession({
      teamId,
      customerId: stripeCustomerId,
      seats,
      billingInterval,
      successUrl: `${baseUrl}/settings?tab=billing&success=true`,
      cancelUrl: `${baseUrl}/settings?tab=billing&canceled=true`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "No checkout URL returned from Stripe" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create checkout session";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
