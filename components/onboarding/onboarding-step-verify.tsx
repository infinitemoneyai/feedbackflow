"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

interface OnboardingStepVerifyProps {
  projectId: Id<"projects">;
}

export function OnboardingStepVerify({ projectId }: OnboardingStepVerifyProps) {
  const [isSending, setIsSending] = useState(false);
  const [hasSent, setHasSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasConfirmed, setHasConfirmed] = useState(false);

  const sendTestFeedback = useMutation(api.onboarding.sendTestFeedback);
  const completeStep = useMutation(api.onboarding.completeStep);

  // Watch for new feedback in real-time
  const feedback = useQuery(api.feedback.listFeedback, {
    projectId,
    status: "new",
  });

  const testFeedbackReceived = feedback && feedback.length > 0 && hasSent;

  const handleSendTest = async () => {
    setIsSending(true);
    setError(null);

    try {
      await sendTestFeedback({ projectId });
      setHasSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send test feedback");
    } finally {
      setIsSending(false);
    }
  };

  const handleSkip = async () => {
    setHasConfirmed(true);
    await completeStep({ step: 5 });
  };

  const handleContinue = async () => {
    await completeStep({ step: 5 });
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center border-2 border-retro-black transition-colors",
            testFeedbackReceived ? "bg-green-400" : "bg-retro-lavender"
          )}
        >
          <Icon
            name={testFeedbackReceived ? "solar:check-circle-linear" : "solar:test-tube-linear"}
            size={24}
          />
        </div>
        <div>
          <h2 className="text-xl font-bold text-retro-black">Verify install</h2>
          <p className="text-sm text-stone-600">Let&apos;s make sure tickets are coming in</p>
        </div>
      </div>

      {!testFeedbackReceived ? (
        <>
          <div className="mb-6">
            <div className="mb-4 rounded border-2 border-stone-200 bg-stone-50 p-4">
              <h3 className="mb-2 flex items-center gap-2 font-bold text-stone-700">
                <Icon name="solar:info-circle-linear" size={20} />
                How to verify your installation
              </h3>
              <ol className="space-y-2 text-sm text-stone-600">
                <li className="flex gap-2">
                  <span className="font-bold">1.</span>
                  <span>Open your website where you installed the widget</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">2.</span>
                  <span>Look for the feedback button (bottom-right by default)</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">3.</span>
                  <span>Click it and submit a test message</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">4.</span>
                  <span>Check your dashboard - it should appear within seconds</span>
                </li>
              </ol>
            </div>

            <div className="mb-4 text-center">
              <p className="mb-2 text-sm font-medium text-stone-700">
                Or send a simulated test ticket:
              </p>
            <button
              onClick={handleSendTest}
              disabled={isSending || hasSent}
              className={cn(
                  "flex w-full items-center justify-center gap-3 border-2 border-retro-black px-6 py-3 font-bold transition-all",
                hasSent
                  ? "bg-stone-100 text-stone-500"
                    : "bg-retro-lavender hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]"
              )}
            >
              {isSending ? (
                <>
                    <Icon name="solar:refresh-linear" size={20} className="animate-spin" />
                  Sending...
                </>
              ) : hasSent ? (
                <>
                    <Icon name="solar:hourglass-linear" size={20} className="animate-pulse" />
                  Waiting for ticket...
                </>
              ) : (
                <>
                    <Icon name="solar:play-linear" size={20} />
                    Send Simulated Test
                </>
              )}
            </button>
              <p className="mt-2 text-xs text-stone-500">
                This creates a test ticket server-side (doesn&apos;t verify widget installation)
              </p>
            </div>

            {error && (
              <p className="mt-3 text-center text-sm text-red-600">{error}</p>
            )}

            {hasSent && !testFeedbackReceived && (
              <p className="mt-4 text-center text-sm text-stone-500">
                Check your dashboard - the ticket should appear any moment...
              </p>
            )}
          </div>

          <div className="flex gap-3 border-t border-stone-200 pt-4">
            <button
              onClick={handleSkip}
              disabled={hasConfirmed}
              className="flex flex-1 items-center justify-center gap-2 border-2 border-retro-black bg-white px-6 py-3 font-bold uppercase tracking-wide transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]"
            >
              I&apos;ve tested it
              <Icon name="solar:check-circle-linear" size={20} />
            </button>
            <a
              href="/docs/installation"
              target="_blank"
              className="flex items-center justify-center gap-1 border-2 border-retro-black bg-stone-100 px-4 py-3 text-sm font-medium transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]"
            >
              <Icon name="solar:question-circle-linear" size={16} />
              Help
            </a>
          </div>
        </>
      ) : (
        <>
          {/* Success state */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border-4 border-green-500 bg-green-100">
              <Icon name="solar:check-circle-bold" size={40} className="text-green-600" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-green-700">It&apos;s working!</h3>
            <p className="text-stone-600">
              Your first ticket just arrived. You&apos;re all set to start collecting feedback.
            </p>
          </div>

          <button
            onClick={handleContinue}
            className="flex w-full items-center justify-center gap-2 border-2 border-retro-black bg-retro-yellow px-6 py-3 font-bold uppercase tracking-wide transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]"
          >
            Continue
            <Icon name="solar:arrow-right-linear" size={20} />
          </button>
        </>
      )}
    </div>
  );
}
