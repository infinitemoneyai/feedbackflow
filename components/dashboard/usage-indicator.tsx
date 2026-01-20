"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { AlertTriangle, Crown, Sparkles } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface UsageIndicatorProps {
  teamId: Id<"teams">;
}

export function UsageIndicator({ teamId }: UsageIndicatorProps) {
  const subscription = useQuery(api.billing.getSubscription, { teamId });
  const usage = useQuery(api.billing.getUsage, { teamId });

  if (!subscription || !usage) {
    return null;
  }

  const isPro = subscription.plan === "pro" && subscription.status === "active";
  const limit = 25;
  const currentCount = usage.feedbackCount;
  const percentUsed = isPro ? 0 : Math.min((currentCount / limit) * 100, 100);
  const isNearLimit = !isPro && percentUsed >= 80;
  const isAtLimit = !isPro && currentCount >= limit;

  return (
    <div className="border-t-2 border-retro-black bg-white p-4">
      <div className="space-y-2">
        {/* Plan indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isPro ? (
              <Crown className="h-4 w-4 text-retro-yellow" />
            ) : (
              <Sparkles className="h-4 w-4 text-stone-400" />
            )}
            <span className="text-xs font-medium text-stone-600">
              {isPro ? "Pro Plan" : "Free Plan"}
            </span>
          </div>
          {!isPro && (
            <Link
              href="/settings?tab=billing"
              className="text-xs font-medium text-retro-blue hover:underline"
            >
              Upgrade
            </Link>
          )}
        </div>

        {/* Usage bar for free plan */}
        {!isPro && (
          <>
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500">
                {currentCount} / {limit} feedback
              </span>
              <span
                className={cn(
                  "font-medium",
                  isAtLimit
                    ? "text-retro-red"
                    : isNearLimit
                      ? "text-retro-peach"
                      : "text-stone-500"
                )}
              >
                {Math.round(percentUsed)}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  isAtLimit
                    ? "bg-retro-red"
                    : isNearLimit
                      ? "bg-retro-peach"
                      : "bg-retro-blue"
                )}
                style={{ width: `${percentUsed}%` }}
              />
            </div>

            {/* Warning message */}
            {isNearLimit && !isAtLimit && (
              <div className="flex items-start gap-2 rounded border border-retro-peach/50 bg-retro-peach/10 p-2">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-retro-peach" />
                <p className="text-xs text-retro-peach">
                  Approaching limit.{" "}
                  <Link
                    href="/settings?tab=billing"
                    className="font-medium underline"
                  >
                    Upgrade for unlimited
                  </Link>
                </p>
              </div>
            )}

            {/* At limit message */}
            {isAtLimit && (
              <div className="flex items-start gap-2 rounded border border-retro-red/50 bg-retro-red/10 p-2">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-retro-red" />
                <p className="text-xs text-retro-red">
                  Limit reached!{" "}
                  <Link
                    href="/settings?tab=billing"
                    className="font-medium underline"
                  >
                    Upgrade now
                  </Link>
                </p>
              </div>
            )}
          </>
        )}

        {/* Pro plan shows unlimited */}
        {isPro && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-500">
              {currentCount} feedback this month
            </span>
            <span className="font-medium text-green-600">Unlimited</span>
          </div>
        )}
      </div>
    </div>
  );
}
