"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PLANS } from "@/lib/stripe-config";
import { Icon } from "@/components/ui/icon";
import { PageLayout } from "@/components/layout";

function PricingPageContent() {
  const { isSignedIn, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const [seats, setSeats] = useState(1);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);
  const [showNotification, setShowNotification] = useState<
    "success" | "canceled" | null
  >(null);

  // Get user's team and subscription if logged in
  const teams = useQuery(api.teams.getMyTeams, isSignedIn ? {} : "skip");
  const activeTeam = teams?.[0];
  const subscription = useQuery(
    api.billing.getSubscription,
    activeTeam ? { teamId: activeTeam._id as Id<"teams"> } : "skip"
  );

  const isPro =
    subscription?.plan === "pro" && subscription?.status === "active";

  // Handle success/cancel from Stripe redirect
  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    if (success === "true") {
      setShowNotification("success");
    } else if (canceled === "true") {
      setShowNotification("canceled");
    }
  }, [searchParams]);

  // Auto-dismiss notification
  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => setShowNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [showNotification]);

  const handleUpgrade = async () => {
    if (!isSignedIn) {
      window.location.href = "/sign-up?redirect=/pricing";
      return;
    }

    if (!activeTeam) {
      window.location.href = "/dashboard";
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: activeTeam._id,
          seats,
          billingInterval,
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("No checkout URL returned:", data.error);
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    if (!activeTeam) return;

    setLoading(true);
    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: activeTeam._id }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error creating portal session:", error);
    } finally {
      setLoading(false);
    }
  };

  const incrementSeats = () => setSeats((s) => Math.min(s + 1, 100));
  const decrementSeats = () => setSeats((s) => Math.max(s - 1, 1));

  return (
    <PageLayout>
      {/* Notification Banner */}
      {showNotification && (
        <div
          className={`fixed left-1/2 top-4 z-[100] -translate-x-1/2 transform border-2 border-retro-black px-6 py-3 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] ${
            showNotification === "success"
              ? "bg-green-100 text-green-800"
              : "bg-retro-yellow text-retro-black"
          }`}
        >
          <div className="flex items-center gap-3">
            {showNotification === "success" ? (
              <>
                <Icon name="solar:check-circle-linear" size={20} />
                <span className="font-medium">
                  Welcome to Pro! Your subscription is now active.
                </span>
              </>
            ) : (
              <>
                <Icon name="solar:danger-circle-linear" size={20} />
                <span className="font-medium">
                  Checkout was canceled. Feel free to try again when you&apos;re
                  ready.
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Hero */}
        <div className="border-b-2 border-retro-black bg-retro-paper p-8 md:p-16">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-3 rounded border border-retro-blue/30 bg-retro-blue/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-retro-blue">
              <Icon name="solar:tag-price-linear" size={14} />
              Pricing
            </div>
            <h1 className="mb-6 text-4xl font-medium tracking-tighter md:text-6xl lg:text-7xl">
              Pay for Seats.
              <br />
              <span className="text-stone-400">Not for Feedback.</span>
            </h1>
            <p className="text-xl font-light text-stone-600 md:text-2xl">
              Start free. Upgrade when your team grows.
              <br />
              Or self-host for unlimited everything.
            </p>

            {/* Billing Toggle */}
            <div className="mt-10 inline-flex items-center gap-1 rounded-full border-2 border-retro-black bg-white p-1 shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
              <button
                onClick={() => setBillingInterval("monthly")}
                className={`rounded-full px-6 py-2 font-medium transition-all ${
                  billingInterval === "monthly"
                    ? "bg-retro-black text-white"
                    : "text-stone-600 hover:text-retro-black"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingInterval("yearly")}
                className={`relative rounded-full px-6 py-2 font-medium transition-all ${
                  billingInterval === "yearly"
                    ? "bg-retro-black text-white"
                    : "text-stone-600 hover:text-retro-black"
                }`}
              >
                <span className="inline-flex items-center gap-2 whitespace-nowrap">
                  <span>Yearly</span>
                  <span className="rounded-full bg-retro-green px-2 py-0.5 text-xs font-bold leading-none text-retro-black">
                    -17%
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 divide-y-2 divide-retro-black border-b-2 border-retro-black md:grid-cols-2 md:divide-x-2 md:divide-y-0">
          {/* Free Plan */}
          <div className="relative flex flex-col bg-white p-8 md:p-12">
            {!isPro && isSignedIn && (
              <div className="absolute -top-3 left-8 border border-stone-300 bg-stone-100 px-3 py-1 font-mono text-xs uppercase text-stone-600">
                Current Plan
              </div>
            )}

            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-stone-300 bg-stone-100">
                <Icon
                  name="solar:user-linear"
                  size={28}
                  className="text-stone-500"
                />
              </div>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  {PLANS.free.name}
                </h2>
                <p className="text-sm text-stone-500">For solo hackers</p>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-medium tracking-tighter">
                  $0
                </span>
                <span className="text-stone-400">/forever</span>
              </div>
            </div>

            <ul className="mb-8 flex-grow space-y-4">
              {PLANS.free.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Icon
                    name="solar:check-circle-linear"
                    size={20}
                    className="mt-0.5 flex-shrink-0 text-stone-400"
                  />
                  <span className="text-stone-600">{feature}</span>
                </li>
              ))}
            </ul>

            {isSignedIn ? (
              !isPro && (
                <div className="border-2 border-stone-200 bg-stone-50 px-4 py-3 text-center font-mono text-sm text-stone-500">
                  You&apos;re here
                </div>
              )
            ) : (
              <Link
                href="/sign-up"
                className="flex items-center justify-center gap-2 border-2 border-retro-black bg-white px-6 py-4 font-medium text-retro-black transition-all hover:bg-stone-50"
              >
                <span>Start Free</span>
                <Icon name="solar:arrow-right-linear" size={18} />
              </Link>
            )}
          </div>

          {/* Pro Plan */}
          <div
            className={`relative flex flex-col p-8 md:p-12 ${
              isPro ? "bg-retro-yellow/10" : "bg-retro-yellow"
            }`}
          >
            {isPro && (
              <div className="absolute -top-3 left-8 border-2 border-retro-black bg-retro-yellow px-3 py-1 font-mono text-xs font-bold uppercase text-retro-black shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
                Current Plan
              </div>
            )}

            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-retro-black bg-retro-black">
                <Icon
                  name="solar:crown-linear"
                  size={28}
                  className="text-retro-yellow"
                />
              </div>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  {PLANS.pro.name}
                </h2>
                <p className="text-sm text-stone-600">For teams who ship</p>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-medium tracking-tighter">
                  $
                  {billingInterval === "monthly"
                    ? PLANS.pro.pricePerSeat
                    : Math.round((PLANS.pro.pricePerSeatYearly / 12) * 100) /
                      100}
                </span>
                <span className="text-stone-600">
                  /seat/{billingInterval === "monthly" ? "month" : "month"}
                </span>
              </div>
              {billingInterval === "yearly" && (
                <div className="mt-2 text-sm text-stone-600">
                  <span className="line-through">
                    ${PLANS.pro.pricePerSeat * 12}/seat/year
                  </span>
                  <span className="ml-2 font-medium text-retro-green">
                    ${PLANS.pro.pricePerSeatYearly}/seat/year
                  </span>
                </div>
              )}
            </div>

            <ul className="mb-8 flex-grow space-y-4">
              {PLANS.pro.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Icon
                    name="solar:check-circle-bold"
                    size={20}
                    className="mt-0.5 flex-shrink-0 text-retro-black"
                  />
                  <span className="text-stone-700">{feature}</span>
                </li>
              ))}
            </ul>

            {isPro ? (
              <button
                onClick={handleManageBilling}
                disabled={loading}
                className="flex items-center justify-center gap-2 border-2 border-retro-black bg-white px-6 py-4 font-medium text-retro-black transition-all hover:bg-stone-50 disabled:opacity-50"
              >
                {loading ? (
                  <Icon
                    name="solar:refresh-linear"
                    size={20}
                    className="animate-spin"
                  />
                ) : (
                  <>
                    <Icon name="solar:settings-linear" size={18} />
                    <span>Manage Subscription</span>
                  </>
                )}
              </button>
            ) : (
              <>
                {/* Seat Selector */}
                <div className="mb-4 border-2 border-retro-black bg-white p-4 shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-retro-black">
                      Team seats
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={decrementSeats}
                        className="flex h-10 w-10 items-center justify-center border-2 border-retro-black bg-stone-50 transition-colors hover:bg-stone-100 disabled:opacity-50"
                        disabled={seats <= 1}
                      >
                        <Icon name="solar:minus-linear" size={18} />
                      </button>
                      <span className="w-10 text-center font-mono text-xl font-bold">
                        {seats}
                      </span>
                      <button
                        onClick={incrementSeats}
                        className="flex h-10 w-10 items-center justify-center border-2 border-retro-black bg-stone-50 transition-colors hover:bg-stone-100"
                      >
                        <Icon name="solar:add-linear" size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 border-t border-stone-200 pt-3 text-right font-mono text-lg">
                    <span className="text-stone-500">Total: </span>
                    <span className="font-bold text-retro-black">
                      ${billingInterval === "monthly"
                        ? PLANS.pro.pricePerSeat * seats
                        : PLANS.pro.pricePerSeatYearly * seats}
                    </span>
                    <span className="text-stone-500">/{billingInterval === "monthly" ? "mo" : "yr"}</span>
                  </div>
                </div>

                <button
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="flex items-center justify-center gap-3 border-2 border-retro-black bg-retro-black px-6 py-4 font-medium text-white shadow-[4px_4px_0px_0px_#888] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#888] disabled:opacity-50"
                >
                  {loading ? (
                    <Icon
                      name="solar:refresh-linear"
                      size={20}
                      className="animate-spin"
                    />
                  ) : (
                    <>
                      <Icon name="solar:crown-linear" size={20} />
                      <span>Upgrade to Pro</span>
                      <Icon name="solar:arrow-right-linear" size={20} />
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Feature Comparison */}
        <div className="border-b-2 border-retro-black bg-white">
          <div className="flex items-center justify-between border-b-2 border-retro-black p-6 md:p-8">
            <h2 className="text-2xl font-medium tracking-tight">
              Compare Plans
            </h2>
            <div className="rounded-full bg-stone-100 px-3 py-1 font-mono text-xs text-stone-500">
              Feature Matrix
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-retro-black bg-stone-50">
                  <th className="p-4 text-left font-medium text-retro-black md:p-6">
                    Feature
                  </th>
                  <th className="w-32 p-4 text-center font-medium text-stone-500 md:w-40 md:p-6">
                    Free
                  </th>
                  <th className="w-32 p-4 text-center font-medium text-retro-black md:w-40 md:p-6">
                    <div className="flex items-center justify-center gap-2">
                      <Icon
                        name="solar:crown-linear"
                        size={16}
                        className="text-retro-yellow"
                      />
                      Pro
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <FeatureRow feature="Team seats" free="1" pro="Unlimited" />
                <FeatureRow
                  feature="Feedback per month"
                  free="25"
                  pro="Unlimited"
                />
                <FeatureRow
                  feature="Screenshot capture"
                  free={true}
                  pro={true}
                />
                <FeatureRow
                  feature="Screen recording + audio"
                  free={false}
                  pro={true}
                />
                <FeatureRow
                  feature="Annotation tools"
                  free={true}
                  pro={true}
                />
                <FeatureRow
                  feature="Real-time dashboard"
                  free={true}
                  pro={true}
                />
                <FeatureRow
                  feature="AI auto-categorization"
                  free={false}
                  pro={true}
                />
                <FeatureRow
                  feature="AI ticket drafting"
                  free={false}
                  pro={true}
                />
                <FeatureRow
                  feature="AI conversation"
                  free={false}
                  pro={true}
                />
                <FeatureRow
                  feature="Linear integration"
                  free={false}
                  pro={true}
                />
                <FeatureRow
                  feature="Notion integration"
                  free={false}
                  pro={true}
                />
                <FeatureRow feature="JSON export" free={true} pro={true} />
                <FeatureRow feature="REST API" free="Limited" pro="Full" />
                <FeatureRow
                  feature="Webhooks"
                  free={false}
                  pro={true}
                />
                <FeatureRow
                  feature="Automation rules"
                  free={false}
                  pro={true}
                />
                <FeatureRow feature="Support" free="Community" pro="Priority" />
              </tbody>
            </table>
          </div>
        </div>

        {/* Self-Host Section */}
        <div className="grid grid-cols-1 divide-y-2 divide-retro-black border-b-2 border-retro-black md:grid-cols-2 md:divide-x-2 md:divide-y-0">
          <div className="flex flex-col justify-center bg-retro-black p-8 text-white md:p-12">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-retro-yellow bg-retro-yellow/10">
              <Icon
                name="solar:server-square-linear"
                size={32}
                className="text-retro-yellow"
              />
            </div>
            <h2 className="mb-4 text-3xl font-medium tracking-tight">
              Self-Host Option
            </h2>
            <p className="mb-6 text-lg text-stone-400">
              Deploy on your own infrastructure.
              <br />
              <span className="text-white">
                No limits. No fees. No phone-home.
              </span>
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-stone-300">
                <Icon
                  name="solar:arrow-right-linear"
                  size={16}
                  className="text-retro-yellow"
                />
                Docker Compose or Kubernetes
              </div>
              <div className="flex items-center gap-3 text-stone-300">
                <Icon
                  name="solar:arrow-right-linear"
                  size={16}
                  className="text-retro-yellow"
                />
                Your own database and storage
              </div>
              <div className="flex items-center gap-3 text-stone-300">
                <Icon
                  name="solar:arrow-right-linear"
                  size={16}
                  className="text-retro-yellow"
                />
                Full source code access
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center bg-stone-100 p-8 md:p-12">
            <h3 className="mb-4 text-xl font-medium">
              Perfect for teams who need:
            </h3>
            <ul className="mb-8 space-y-4">
              <li className="flex items-start gap-3">
                <Icon
                  name="solar:shield-check-linear"
                  size={20}
                  className="mt-0.5 text-retro-blue"
                />
                <span className="text-stone-600">
                  Complete data sovereignty
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Icon
                  name="solar:lock-linear"
                  size={20}
                  className="mt-0.5 text-retro-blue"
                />
                <span className="text-stone-600">
                  On-premise or private cloud
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Icon
                  name="solar:infinite-linear"
                  size={20}
                  className="mt-0.5 text-retro-blue"
                />
                <span className="text-stone-600">
                  Unlimited everything, forever
                </span>
              </li>
            </ul>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="https://github.com/Mlock/feedbackflow"
                className="flex items-center justify-center gap-2 border-2 border-retro-black bg-white px-6 py-3 font-medium text-retro-black transition-all hover:bg-stone-50"
              >
                <Icon name="mdi:github" size={20} />
                <span>View Source</span>
              </Link>
              <Link
                href="/docs/self-hosting"
                className="flex items-center justify-center gap-2 border-2 border-retro-black bg-retro-black px-6 py-3 font-medium text-white transition-all hover:bg-stone-800"
              >
                <Icon name="solar:book-2-linear" size={20} />
                <span>Self-Host Guide</span>
              </Link>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="border-b-2 border-retro-black bg-retro-paper">
          <div className="border-b-2 border-retro-black p-6 md:p-8">
            <h2 className="text-2xl font-medium tracking-tight">
              Questions? <span className="text-stone-400">We got answers.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 divide-y-2 divide-retro-black md:grid-cols-2 md:divide-x-2 md:divide-y-0">
            <div className="divide-y divide-stone-200">
              <FAQItem
                question="Can I change my plan later?"
                answer="Yes! Upgrade anytime. If you downgrade, you keep Pro features until the end of your billing period."
              />
              <FAQItem
                question="What happens if I exceed the free tier?"
                answer="We won't cut off your feedback mid-month. You'll see a prompt to upgrade, and excess feedback is queued until you upgrade or the month resets."
              />
              <FAQItem
                question="Can I add more seats later?"
                answer="Yes. Add seats anytime through the billing portal. You'll be charged a prorated amount for the remainder of your billing period."
              />
            </div>
            <div className="divide-y divide-stone-200">
              <FAQItem
                question="Do I need my own AI API keys?"
                answer="Yes. You bring your own OpenAI or Anthropic keys. This means no usage limits from us and full control over your AI costs."
              />
              <FAQItem
                question="Is there a free trial for Pro?"
                answer="No trial, but the free tier lets you test all basic features. Pro adds unlimited seats, unlimited feedback, and AI features."
              />
              <FAQItem
                question="Hosted vs self-hosted?"
                answer="Hosted = we manage everything. Self-hosted = you run it on your servers with no limits or fees, but you handle deployment."
              />
            </div>
          </div>
        </div>

        {/* CTA Footer */}
        <div className="flex flex-col items-center gap-8 bg-white p-10 text-center md:p-16">
          <h2 className="text-4xl font-medium tracking-tighter md:text-6xl">
            Stop Losing Feedback
          </h2>
          <p className="max-w-xl text-lg text-stone-500">
            Join teams who have streamlined their feedback workflow. Start free
            today.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              href="/sign-up"
              className="flex items-center justify-center gap-2 border-2 border-retro-black bg-retro-black px-8 py-4 text-lg font-medium text-white shadow-[6px_6px_0px_0px_#F3C952] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0px_0px_#F3C952]"
            >
              <span>Get Started Free</span>
              <Icon name="solar:arrow-right-linear" size={20} />
            </Link>
            <Link
              href="/docs"
              className="flex items-center justify-center gap-2 border-2 border-retro-black bg-white px-8 py-4 text-lg font-medium text-retro-black shadow-[6px_6px_0px_0px_#6B9AC4] transition-all hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0px_0px_#6B9AC4]"
            >
              <Icon name="solar:book-2-linear" size={20} />
              <span>Read Docs</span>
            </Link>
          </div>
        </div>

    </PageLayout>
  );
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-bg-page">
          <Icon
            name="solar:refresh-linear"
            size={32}
            className="animate-spin text-retro-black"
          />
        </div>
      }
    >
      <PricingPageContent />
    </Suspense>
  );
}

function FeatureRow({
  feature,
  free,
  pro,
}: {
  feature: string;
  free: boolean | string;
  pro: boolean | string;
}) {
  const renderValue = (value: boolean | string, isPro: boolean = false) => {
    if (typeof value === "boolean") {
      return value ? (
        <Icon
          name="solar:check-circle-bold"
          size={20}
          className={isPro ? "text-retro-black" : "text-stone-400"}
        />
      ) : (
        <Icon name="solar:close-circle-linear" size={20} className="text-stone-300" />
      );
    }
    return (
      <span
        className={`font-mono text-sm ${isPro ? "font-medium text-retro-black" : "text-stone-500"}`}
      >
        {value}
      </span>
    );
  };

  return (
    <tr className="border-b border-stone-200">
      <td className="p-4 text-sm text-stone-700 md:p-6">{feature}</td>
      <td className="p-4 md:p-6">
        <div className="flex items-center justify-center">{renderValue(free)}</div>
      </td>
      <td className="p-4 md:p-6">
        <div className="flex items-center justify-center">{renderValue(pro, true)}</div>
      </td>
    </tr>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="bg-white p-6">
      <h3 className="mb-2 font-medium text-retro-black">{question}</h3>
      <p className="text-sm leading-relaxed text-stone-600">{answer}</p>
    </div>
  );
}
