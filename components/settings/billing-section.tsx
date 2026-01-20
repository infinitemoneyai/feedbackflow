"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import {
  CreditCard,
  Check,
  Loader2,
  ExternalLink,
  Users,
  MessageSquare,
  Sparkles,
  Crown,
  AlertTriangle,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PLANS } from "@/lib/stripe";
import { format } from "date-fns";

interface BillingSectionProps {
  teamId: Id<"teams">;
}

export function BillingSection({ teamId }: BillingSectionProps) {
  const subscription = useQuery(api.billing.getSubscription, { teamId });
  const usage = useQuery(api.billing.getUsage, { teamId });
  const [loading, setLoading] = useState<"checkout" | "portal" | null>(null);

  const isPro = subscription?.plan === "pro";
  const isActive = subscription?.status === "active";
  const isCanceled = subscription?.cancelAtPeriodEnd;

  const handleUpgrade = async (seats: number = 1) => {
    setLoading("checkout");
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, seats }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
    } finally {
      setLoading(null);
    }
  };

  const handleManageBilling = async () => {
    setLoading("portal");
    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("No portal URL returned:", data.error);
      }
    } catch (error) {
      console.error("Error creating portal session:", error);
    } finally {
      setLoading(null);
    }
  };

  if (!subscription) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded border-2 border-retro-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-retro-yellow bg-retro-yellow/10">
            <CreditCard className="h-6 w-6 text-retro-yellow" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-retro-black">Billing</h2>
            <p className="mt-1 text-sm text-stone-600">
              Manage your subscription and view usage. Upgrade to Pro for
              unlimited feedback and team seats.
            </p>
          </div>
        </div>
      </div>

      {/* Current Plan */}
      <div className="rounded border-2 border-retro-black bg-white shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
        <div className="border-b-2 border-retro-black p-4">
          <h3 className="font-semibold text-retro-black">Current Plan</h3>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded border-2 ${
                  isPro
                    ? "border-retro-yellow bg-retro-yellow"
                    : "border-stone-300 bg-stone-100"
                }`}
              >
                {isPro ? (
                  <Crown className="h-5 w-5 text-retro-black" />
                ) : (
                  <Sparkles className="h-5 w-5 text-stone-500" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-retro-black">
                    {isPro ? "Pro" : "Free"}
                  </span>
                  {isPro && isActive && !isCanceled && (
                    <span className="rounded border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                      Active
                    </span>
                  )}
                  {isPro && isCanceled && (
                    <span className="rounded border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
                      Canceling
                    </span>
                  )}
                  {subscription.status === "past_due" && (
                    <span className="rounded border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                      Past Due
                    </span>
                  )}
                </div>
                <p className="text-sm text-stone-500">
                  {isPro
                    ? `${subscription.seats} seat${subscription.seats > 1 ? "s" : ""} × $${PLANS.pro.pricePerSeat}/month`
                    : "1 seat, 25 feedback/month"}
                </p>
              </div>
            </div>

            {isPro && subscription.stripeCustomerId ? (
              <button
                onClick={handleManageBilling}
                disabled={loading === "portal"}
                className="flex items-center gap-2 rounded border-2 border-retro-black bg-white px-4 py-2 text-sm font-medium text-retro-black transition-all hover:bg-stone-50 disabled:opacity-50"
              >
                {loading === "portal" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                Manage Billing
              </button>
            ) : (
              <button
                onClick={() => handleUpgrade(usage?.memberCount || 1)}
                disabled={loading === "checkout"}
                className="flex items-center gap-2 rounded border-2 border-retro-black bg-retro-yellow px-4 py-2 text-sm font-medium text-retro-black shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(26,26,26,1)] disabled:opacity-50"
              >
                {loading === "checkout" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Crown className="h-4 w-4" />
                )}
                Upgrade to Pro
              </button>
            )}
          </div>

          {/* Period info for Pro */}
          {isPro && subscription.currentPeriodEnd && (
            <div className="mt-4 rounded border border-stone-200 bg-stone-50 p-3">
              <p className="text-sm text-stone-600">
                {isCanceled ? (
                  <>
                    <AlertTriangle className="mr-1 inline h-4 w-4 text-orange-500" />
                    Your subscription will end on{" "}
                    <span className="font-medium">
                      {format(
                        new Date(subscription.currentPeriodEnd),
                        "MMMM d, yyyy"
                      )}
                    </span>
                    . You can reactivate in the billing portal.
                  </>
                ) : (
                  <>
                    Next billing date:{" "}
                    <span className="font-medium">
                      {format(
                        new Date(subscription.currentPeriodEnd),
                        "MMMM d, yyyy"
                      )}
                    </span>
                  </>
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Usage */}
      <div className="rounded border-2 border-retro-black bg-white shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
        <div className="border-b-2 border-retro-black p-4">
          <h3 className="font-semibold text-retro-black">Usage This Month</h3>
        </div>
        <div className="grid gap-4 p-6 md:grid-cols-2">
          {/* Feedback usage */}
          <div className="rounded border border-stone-200 p-4">
            <div className="flex items-center gap-2 text-stone-500">
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm">Feedback</span>
            </div>
            <div className="mt-2">
              {isPro ? (
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-retro-black">
                    {usage?.feedbackCount ?? 0}
                  </span>
                  <span className="text-sm text-stone-500">submissions</span>
                </div>
              ) : (
                <>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-retro-black">
                      {usage?.feedbackCount ?? 0}
                    </span>
                    <span className="text-sm text-stone-500">/ 25</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-stone-200">
                    <div
                      className={`h-full rounded-full transition-all ${
                        (usage?.feedbackCount ?? 0) >= 25
                          ? "bg-retro-red"
                          : (usage?.feedbackCount ?? 0) >= 20
                            ? "bg-retro-peach"
                            : "bg-retro-blue"
                      }`}
                      style={{
                        width: `${Math.min(((usage?.feedbackCount ?? 0) / 25) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  {(usage?.feedbackCount ?? 0) >= 20 && (
                    <p className="mt-2 text-xs text-retro-peach">
                      {(usage?.feedbackCount ?? 0) >= 25
                        ? "Limit reached! Upgrade for unlimited feedback."
                        : "Approaching limit. Upgrade for unlimited feedback."}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Seats usage */}
          <div className="rounded border border-stone-200 p-4">
            <div className="flex items-center gap-2 text-stone-500">
              <Users className="h-4 w-4" />
              <span className="text-sm">Team Seats</span>
            </div>
            <div className="mt-2">
              {isPro ? (
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-retro-black">
                    {usage?.memberCount ?? 0}
                  </span>
                  <span className="text-sm text-stone-500">
                    / {subscription.seats} seats
                  </span>
                </div>
              ) : (
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-retro-black">
                    {usage?.memberCount ?? 0}
                  </span>
                  <span className="text-sm text-stone-500">/ 1 seat</span>
                </div>
              )}
              {!isPro && (usage?.memberCount ?? 0) >= 1 && (
                <p className="mt-2 text-xs text-stone-500">
                  Upgrade to Pro to add more team members.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Plan Comparison */}
      <div className="rounded border-2 border-retro-black bg-white shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
        <div className="border-b-2 border-retro-black p-4">
          <h3 className="font-semibold text-retro-black">Plan Comparison</h3>
        </div>
        <div className="grid gap-6 p-6 md:grid-cols-2">
          {/* Free Plan */}
          <div
            className={`rounded border-2 p-5 ${
              !isPro
                ? "border-retro-black bg-stone-50"
                : "border-stone-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-retro-black">
                {PLANS.free.name}
              </h4>
              {!isPro && (
                <span className="rounded border border-stone-300 bg-white px-2 py-0.5 text-xs font-medium text-stone-600">
                  Current
                </span>
              )}
            </div>
            <p className="mt-1 text-2xl font-bold text-retro-black">
              $0
              <span className="text-sm font-normal text-stone-500">/month</span>
            </p>
            <ul className="mt-4 space-y-2">
              {PLANS.free.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-stone-600">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pro Plan */}
          <div
            className={`rounded border-2 p-5 ${
              isPro
                ? "border-retro-yellow bg-retro-yellow/5"
                : "border-stone-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <h4 className="flex items-center gap-2 font-semibold text-retro-black">
                <Crown className="h-4 w-4 text-retro-yellow" />
                {PLANS.pro.name}
              </h4>
              {isPro && (
                <span className="rounded border border-retro-yellow bg-retro-yellow/20 px-2 py-0.5 text-xs font-medium text-retro-black">
                  Current
                </span>
              )}
            </div>
            <p className="mt-1 text-2xl font-bold text-retro-black">
              ${PLANS.pro.pricePerSeat}
              <span className="text-sm font-normal text-stone-500">
                /seat/month
              </span>
            </p>
            <ul className="mt-4 space-y-2">
              {PLANS.pro.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-retro-yellow" />
                  <span className="text-stone-600">{feature}</span>
                </li>
              ))}
            </ul>
            {!isPro && (
              <button
                onClick={() => handleUpgrade(usage?.memberCount || 1)}
                disabled={loading === "checkout"}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded border-2 border-retro-black bg-retro-yellow px-4 py-2 text-sm font-medium text-retro-black shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(26,26,26,1)] disabled:opacity-50"
              >
                {loading === "checkout" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Crown className="h-4 w-4" />
                    Upgrade to Pro
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Self-host note */}
      <div className="rounded border border-stone-200 bg-stone-50 p-4">
        <p className="text-sm text-stone-600">
          <span className="font-medium">Self-hosting?</span> FeedbackFlow is
          open source. Deploy on your own infrastructure for free with no
          limits.{" "}
          <a
            href="https://github.com/feedbackflow/feedbackflow"
            target="_blank"
            rel="noopener noreferrer"
            className="text-retro-blue hover:underline"
          >
            View on GitHub
          </a>
        </p>
      </div>
    </div>
  );
}
