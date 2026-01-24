"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icon";

interface DemoSignupCtaProps {
  onTryAgain: () => void;
}

export function DemoSignupCta({ onTryAgain }: DemoSignupCtaProps) {
  return (
    <div className="space-y-6">
      {/* Main CTA Card */}
      <div className="overflow-hidden border-2 border-retro-black bg-retro-yellow shadow-retro-lg">
        <div className="p-8 text-center md:p-12">
          <h2 className="mb-4 text-2xl font-medium tracking-tight md:text-3xl">
            That was one ticket. <br />
            <span className="text-retro-black/60">Imagine this for every bug report.</span>
          </h2>

          <p className="mx-auto mb-8 max-w-xl text-lg text-retro-black/70">
            Stop translating &ldquo;it&apos;s broken&rdquo; into tickets. Let your users report
            issues directly, and let AI structure them for your dev pipeline.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/sign-up"
              className="ff-cta-sheen group flex items-center justify-center gap-3 border-2 border-retro-black bg-retro-black px-8 py-4 text-lg font-medium text-white shadow-[4px_4px_0px_0px_#fff] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-retro-blue hover:text-retro-black hover:shadow-[2px_2px_0px_0px_#fff]"
            >
              <span>Start Free</span>
              <Icon
                name="solar:arrow-right-linear"
                size={20}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
            <button
              onClick={onTryAgain}
              className="flex items-center justify-center gap-2 border-2 border-retro-black bg-white px-6 py-4 text-lg font-medium text-retro-black transition-all hover:bg-stone-50"
            >
              <Icon name="solar:refresh-linear" size={20} />
              Try Again
            </button>
          </div>

          {/* Free Tier Info */}
          <div className="mt-8 inline-flex items-center gap-2 rounded border border-retro-black/20 bg-white/50 px-4 py-2 text-sm">
            <Icon name="solar:gift-linear" size={18} className="text-retro-black" />
            <span>
              <strong>Free tier:</strong> 25 feedback/month, 1 team seat. No credit card required.
            </span>
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="grid gap-4 md:grid-cols-3">
        <FeatureCard
          icon="solar:widget-5-linear"
          title="One-Line Install"
          description="Add the widget to any site with a single script tag. Works everywhere."
        />
        <FeatureCard
          icon="solar:magic-stick-3-linear"
          title="AI-Powered Triage"
          description="Automatic categorization, priority assignment, and reproduction steps."
        />
        <FeatureCard
          icon="solar:link-linear"
          title="Export Anywhere"
          description="Send tickets to Linear, Notion, or your AI agent via JSON/webhooks."
        />
      </div>

      {/* Social Proof */}
      <div className="rounded border border-stone-200 bg-stone-50 p-6 text-center">
        <p className="mb-4 font-mono text-xs uppercase tracking-widest text-stone-400">
          Built for people who ship
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-stone-500">
          <span className="flex items-center gap-2">
            <Icon name="solar:check-circle-linear" size={16} className="text-green-500" />
            Open Source
          </span>
          <span className="flex items-center gap-2">
            <Icon name="solar:check-circle-linear" size={16} className="text-green-500" />
            Self-Hostable
          </span>
          <span className="flex items-center gap-2">
            <Icon name="solar:check-circle-linear" size={16} className="text-green-500" />
            GDPR Compliant
          </span>
          <span className="flex items-center gap-2">
            <Icon name="solar:check-circle-linear" size={16} className="text-green-500" />
            No Vendor Lock-in
          </span>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="border-2 border-retro-black bg-white p-6 shadow-retro transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded border border-stone-200 bg-stone-50">
        <Icon name={icon} size={24} className="text-retro-black" />
      </div>
      <h3 className="mb-2 font-medium">{title}</h3>
      <p className="text-sm text-stone-500">{description}</p>
    </div>
  );
}
