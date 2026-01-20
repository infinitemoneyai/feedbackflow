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
    const { teamId, seats = 1 } = body;

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      );
    }

    // Get team info
    const team = await convex.query(api.teams.getTeam, {
      teamId: teamId as Id<"teams">,
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Get or create Stripe customer
    const subscription = await convex.query(api.billing.getSubscriptionPublic, {
      teamId: teamId as Id<"teams">,
    });

    let stripeCustomerId = subscription?.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await getOrCreateCustomer({
        email: user.emailAddresses[0]?.emailAddress || "",
        name: team.name,
        teamId,
      });
      stripeCustomerId = customer.id;

      // Update the subscription with the customer ID
      await convex.mutation(api.billing.updateStripeCustomerId, {
        teamId: teamId as Id<"teams">,
        stripeCustomerId,
      });
    }

    // Create checkout session
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get("origin") || "";
    const session = await createCheckoutSession({
      teamId,
      customerId: stripeCustomerId,
      seats,
      successUrl: `${baseUrl}/settings?tab=billing&success=true`,
      cancelUrl: `${baseUrl}/settings?tab=billing&canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
