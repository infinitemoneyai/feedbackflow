"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PLANS } from "@/lib/stripe";
import {
  Check,
  X,
  Crown,
  Github,
  ArrowRight,
  Loader2,
  Minus,
  Plus,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PricingPage() {
  const { isSignedIn, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const [seats, setSeats] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showNotification, setShowNotification] = useState<"success" | "canceled" | null>(null);

  // Get user's team and subscription if logged in
  const teams = useQuery(
    api.teams.getMyTeams,
    isSignedIn ? {} : "skip"
  );
  const activeTeam = teams?.[0];
  const subscription = useQuery(
    api.billing.getSubscription,
    activeTeam ? { teamId: activeTeam._id as Id<"teams"> } : "skip"
  );

  const isPro = subscription?.plan === "pro" && subscription?.status === "active";

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
    <div className="min-h-screen bg-bg-page">
      {/* Notification Banner */}
      {showNotification && (
        <div
          className={`fixed left-1/2 top-4 z-50 -translate-x-1/2 transform rounded border-2 border-retro-black px-6 py-3 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] ${
            showNotification === "success"
              ? "bg-green-100 text-green-800"
              : "bg-retro-yellow text-retro-black"
          }`}
        >
          <div className="flex items-center gap-3">
            {showNotification === "success" ? (
              <>
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">
                  Welcome to Pro! Your subscription is now active.
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">
                  Checkout was canceled. Feel free to try again when you&apos;re ready.
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="border-b-2 border-retro-black bg-retro-paper">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link
            href="/"
            className="font-mono text-xl font-bold tracking-tight text-retro-black"
          >
            FeedbackFlow
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/docs"
              className="text-sm text-stone-600 transition-colors hover:text-retro-black"
            >
              Docs
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium text-retro-black"
            >
              Pricing
            </Link>
            <Link
              href="https://github.com/feedbackflow/feedbackflow"
              className="text-sm text-stone-600 transition-colors hover:text-retro-black"
            >
              GitHub
            </Link>
            {isLoaded && isSignedIn ? (
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  className="border-2 border-retro-black bg-white text-retro-black hover:bg-stone-50"
                >
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/sign-in">
                <Button
                  variant="outline"
                  className="border-2 border-retro-black bg-white text-retro-black hover:bg-stone-50"
                >
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b-2 border-retro-black bg-retro-paper">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center">
          <h1 className="mb-4 text-4xl font-medium tracking-tighter text-retro-black md:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-stone-600">
            Start free. Upgrade when you need more. Self-host for unlimited.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="border-b-2 border-retro-black bg-white">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <div className="grid gap-8 md:grid-cols-2">
            {/* Free Plan */}
            <div
              className={`relative rounded border-2 p-8 ${
                !isPro && isSignedIn
                  ? "border-retro-black bg-stone-50 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]"
                  : "border-stone-200 bg-white"
              }`}
            >
              {!isPro && isSignedIn && (
                <div className="absolute -top-3 left-6 rounded border border-stone-300 bg-white px-3 py-1 text-xs font-medium text-stone-600">
                  Current Plan
                </div>
              )}
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded border-2 border-stone-300 bg-stone-100">
                  <Sparkles className="h-6 w-6 text-stone-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-retro-black">
                    {PLANS.free.name}
                  </h2>
                  <p className="text-sm text-stone-500">Perfect for trying out</p>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-retro-black">$0</span>
                  <span className="text-stone-500">/month</span>
                </div>
              </div>

              <ul className="mb-8 space-y-4">
                {PLANS.free.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-stone-400" />
                    <span className="text-stone-600">{feature}</span>
                  </li>
                ))}
              </ul>

              {isSignedIn ? (
                !isPro && (
                  <div className="rounded border border-stone-200 bg-stone-100 px-4 py-3 text-center text-sm text-stone-600">
                    You&apos;re on the Free plan
                  </div>
                )
              ) : (
                <Link href="/sign-up">
                  <Button className="w-full border-2 border-retro-black bg-white py-6 text-retro-black hover:bg-stone-50">
                    Get Started Free
                  </Button>
                </Link>
              )}
            </div>

            {/* Pro Plan */}
            <div
              className={`relative rounded border-2 p-8 ${
                isPro
                  ? "border-retro-yellow bg-retro-yellow/5 shadow-[4px_4px_0px_0px_#F3C952]"
                  : "border-retro-black bg-white shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]"
              }`}
            >
              {isPro && (
                <div className="absolute -top-3 left-6 rounded border border-retro-yellow bg-retro-yellow px-3 py-1 text-xs font-medium text-retro-black">
                  Current Plan
                </div>
              )}
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded border-2 border-retro-yellow bg-retro-yellow">
                  <Crown className="h-6 w-6 text-retro-black" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-retro-black">
                    {PLANS.pro.name}
                  </h2>
                  <p className="text-sm text-stone-500">For growing teams</p>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-retro-black">
                    ${PLANS.pro.pricePerSeat}
                  </span>
                  <span className="text-stone-500">/seat/month</span>
                </div>
              </div>

              <ul className="mb-8 space-y-4">
                {PLANS.pro.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-retro-yellow" />
                    <span className="text-stone-600">{feature}</span>
                  </li>
                ))}
              </ul>

              {isPro ? (
                <button
                  onClick={handleManageBilling}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded border-2 border-retro-black bg-white py-3 font-medium text-retro-black transition-colors hover:bg-stone-50 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Manage Subscription"
                  )}
                </button>
              ) : (
                <>
                  {/* Seat Selector */}
                  <div className="mb-4 rounded border border-stone-200 bg-stone-50 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-stone-700">
                        Team seats
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={decrementSeats}
                          className="flex h-8 w-8 items-center justify-center rounded border border-stone-300 bg-white transition-colors hover:bg-stone-100 disabled:opacity-50"
                          disabled={seats <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center font-mono text-lg font-semibold">
                          {seats}
                        </span>
                        <button
                          onClick={incrementSeats}
                          className="flex h-8 w-8 items-center justify-center rounded border border-stone-300 bg-white transition-colors hover:bg-stone-100"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 text-right text-sm text-stone-500">
                      ${PLANS.pro.pricePerSeat * seats}/month total
                    </div>
                  </div>

                  <button
                    onClick={handleUpgrade}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded border-2 border-retro-black bg-retro-yellow py-3 font-medium text-retro-black shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(26,26,26,1)] disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Crown className="h-5 w-5" />
                        Upgrade to Pro
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="border-b-2 border-retro-black bg-retro-paper">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="mb-8 text-center text-2xl font-semibold tracking-tight text-retro-black">
            Compare plans
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-2 border-retro-black bg-white">
              <thead>
                <tr className="border-b-2 border-retro-black bg-stone-50">
                  <th className="p-4 text-left font-semibold text-retro-black">
                    Feature
                  </th>
                  <th className="w-32 p-4 text-center font-semibold text-retro-black">
                    Free
                  </th>
                  <th className="w-32 p-4 text-center font-semibold text-retro-black">
                    <div className="flex items-center justify-center gap-1">
                      <Crown className="h-4 w-4 text-retro-yellow" />
                      Pro
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <FeatureRow
                  feature="Team seats"
                  free="1"
                  pro="Unlimited"
                />
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
                  feature="Screen recording with audio"
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
                  feature="Basic analytics"
                  free={true}
                  pro={true}
                />
                <FeatureRow
                  feature="Advanced analytics"
                  free={false}
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
                <FeatureRow
                  feature="JSON export"
                  free={true}
                  pro={true}
                />
                <FeatureRow
                  feature="REST API access"
                  free="Limited"
                  pro="Full"
                />
                <FeatureRow
                  feature="Custom webhooks"
                  free={false}
                  pro={true}
                />
                <FeatureRow
                  feature="Automation rules"
                  free={false}
                  pro={true}
                />
                <FeatureRow
                  feature="Support"
                  free="Community"
                  pro="Priority"
                />
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Self-Host Section */}
      <section className="border-b-2 border-retro-black bg-retro-yellow">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <div className="flex flex-col items-center text-center">
            <Github className="mb-6 h-12 w-12 text-retro-black" />
            <h2 className="mb-4 text-2xl font-semibold tracking-tight text-retro-black md:text-3xl">
              Prefer to self-host?
            </h2>
            <p className="mb-6 max-w-xl text-stone-700">
              FeedbackFlow is open source. Deploy on your own infrastructure for
              free with no limits. No phone-home, no artificial restrictions.
              Your data stays yours.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="https://github.com/feedbackflow/feedbackflow">
                <Button className="border-2 border-retro-black bg-retro-black px-6 py-3 text-white shadow-[4px_4px_0px_0px_#888] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#888]">
                  <Github className="mr-2 h-5 w-5" />
                  View on GitHub
                </Button>
              </Link>
              <Link href="/docs/self-host">
                <Button
                  variant="outline"
                  className="border-2 border-retro-black bg-white px-6 py-3 text-retro-black hover:bg-stone-50"
                >
                  Self-Hosting Guide
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="border-b-2 border-retro-black bg-white">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h2 className="mb-8 text-center text-2xl font-semibold tracking-tight text-retro-black">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            <FAQItem
              question="Can I change my plan later?"
              answer="Yes! You can upgrade to Pro at any time. If you downgrade, you'll keep Pro features until the end of your billing period."
            />
            <FAQItem
              question="What happens if I exceed the free tier limits?"
              answer="You'll see a friendly prompt to upgrade. We won't cut off your feedback collection mid-month. Any feedback beyond the limit will be queued until you upgrade or the month resets."
            />
            <FAQItem
              question="Can I add more seats to my Pro plan?"
              answer="Yes, you can add seats at any time through the billing portal. You'll be charged a prorated amount for the remainder of your billing period."
            />
            <FAQItem
              question="Do I need to provide my own AI API keys?"
              answer="Yes. FeedbackFlow uses your own OpenAI or Anthropic API keys for AI features. This means no usage limits from us and full control over your AI costs."
            />
            <FAQItem
              question="Is there a free trial for Pro?"
              answer="We don't offer a trial, but the free tier lets you test all basic features. The main Pro benefits are unlimited seats, unlimited feedback, and AI features."
            />
            <FAQItem
              question="What's the difference between hosted and self-hosted?"
              answer="Hosted is managed by us—no infrastructure to maintain. Self-hosted runs on your servers with no limits or fees, but you handle deployment and updates."
            />
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="bg-retro-black">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <div className="flex flex-col items-center text-center">
            <h2 className="mb-4 text-2xl font-semibold tracking-tight text-white md:text-3xl">
              Ready to capture better feedback?
            </h2>
            <p className="mb-8 max-w-lg text-stone-400">
              Join teams who have streamlined their feedback workflow. Start free
              today.
            </p>
            <Link href="/sign-up">
              <Button className="border-2 border-retro-yellow bg-retro-yellow px-8 py-4 text-retro-black shadow-[4px_4px_0px_0px_#888] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#888]">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer Links */}
        <div className="border-t border-stone-800">
          <div className="mx-auto max-w-5xl px-4 py-8">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <div className="flex items-center gap-6">
                <span className="font-mono text-sm text-stone-500">
                  FeedbackFlow
                </span>
                <Link
                  href="/docs"
                  className="text-sm text-stone-500 hover:text-stone-300"
                >
                  Docs
                </Link>
                <Link
                  href="/pricing"
                  className="text-sm text-stone-500 hover:text-stone-300"
                >
                  Pricing
                </Link>
                <Link
                  href="https://github.com/feedbackflow/feedbackflow"
                  className="text-sm text-stone-500 hover:text-stone-300"
                >
                  GitHub
                </Link>
              </div>
              <p className="font-mono text-xs text-stone-600">
                Open source under MIT License
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
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
  const renderValue = (value: boolean | string) => {
    if (typeof value === "boolean") {
      return value ? (
        <Check className="mx-auto h-5 w-5 text-green-500" />
      ) : (
        <X className="mx-auto h-5 w-5 text-stone-300" />
      );
    }
    return <span className="text-sm text-stone-600">{value}</span>;
  };

  return (
    <tr className="border-b border-stone-200">
      <td className="p-4 text-sm text-stone-700">{feature}</td>
      <td className="p-4 text-center">{renderValue(free)}</td>
      <td className="p-4 text-center">{renderValue(pro)}</td>
    </tr>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="rounded border-2 border-stone-200 bg-white p-5">
      <h3 className="mb-2 font-medium text-retro-black">{question}</h3>
      <p className="text-sm text-stone-600">{answer}</p>
    </div>
  );
}
