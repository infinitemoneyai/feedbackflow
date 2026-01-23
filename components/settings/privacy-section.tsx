"use client";

import { useState, useSyncExternalStore } from "react";
import { Eye, EyeOff, Shield } from "lucide-react";
import {
  hasOptedOut,
  optInAnalytics,
  optOutAnalytics,
} from "@/lib/posthog-provider";

// Use useSyncExternalStore for hydration-safe mounting detection
const emptySubscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function PrivacySection() {
  const mounted = useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(() => !hasOptedOut());

  const handleToggle = () => {
    if (analyticsEnabled) {
      optOutAnalytics();
      setAnalyticsEnabled(false);
    } else {
      optInAnalytics();
      setAnalyticsEnabled(true);
    }
  };

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <div className="rounded border-2 border-retro-black bg-white shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
      {/* Header */}
      <div className="flex items-center gap-3 border-b-2 border-retro-black bg-stone-50 px-6 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-stone-600 bg-stone-100">
          <Shield className="h-5 w-5 text-stone-600" />
        </div>
        <div>
          <h3 className="font-semibold text-retro-black">Privacy</h3>
          <p className="text-xs text-stone-500">
            Control your data and analytics preferences
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {analyticsEnabled ? (
                <Eye className="h-4 w-4 text-stone-500" />
              ) : (
                <EyeOff className="h-4 w-4 text-stone-500" />
              )}
              <span className="font-medium text-retro-black">
                Product Analytics
              </span>
            </div>
            <p className="mt-1 text-sm text-stone-600">
              Help us improve FeedbackFlow by sharing anonymous usage data. We
              use{" "}
              <a
                href="https://posthog.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-retro-blue hover:underline"
              >
                PostHog
              </a>{" "}
              for privacy-respecting analytics.
            </p>
            <ul className="mt-2 space-y-1 text-xs text-stone-500">
              <li>• No personal data is collected</li>
              <li>• Respects Do Not Track browser setting</li>
              <li>• No cookies used</li>
              <li>• You can opt out at any time</li>
            </ul>
          </div>

          <button
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none ${
              analyticsEnabled
                ? "border-retro-black bg-retro-blue"
                : "border-stone-300 bg-stone-200"
            }`}
            role="switch"
            aria-checked={analyticsEnabled}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                analyticsEnabled
                  ? "translate-x-5 border-retro-black"
                  : "translate-x-0.5 border-stone-300"
              } mt-0.5 border`}
            />
          </button>
        </div>

        <div className="mt-4 rounded border border-stone-200 bg-stone-50 p-3">
          <p className="text-xs text-stone-600">
            <span className="font-medium">Current status:</span>{" "}
            {analyticsEnabled ? (
              <span className="text-green-600">
                Analytics enabled — thank you for helping us improve!
              </span>
            ) : (
              <span className="text-stone-500">
                Analytics disabled — no usage data is being collected
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
