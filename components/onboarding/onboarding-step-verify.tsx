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
          <div className="mb-6 text-center">
            <p className="mb-4 text-stone-600">
              Click the button below to send a test ticket through your widget.
            </p>

            <button
              onClick={handleSendTest}
              disabled={isSending || hasSent}
              className={cn(
                "flex w-full items-center justify-center gap-3 border-2 border-retro-black px-6 py-4 text-lg font-bold transition-all",
                hasSent
                  ? "bg-stone-100 text-stone-500"
                  : "bg-retro-yellow hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]"
              )}
            >
              {isSending ? (
                <>
                  <Icon name="solar:refresh-linear" size={24} className="animate-spin" />
                  Sending...
                </>
              ) : hasSent ? (
                <>
                  <Icon name="solar:hourglass-linear" size={24} className="animate-pulse" />
                  Waiting for ticket...
                </>
              ) : (
                <>
                  <Icon name="solar:play-linear" size={24} />
                  Send Test Feedback
                </>
              )}
            </button>

            {error && (
              <p className="mt-3 text-sm text-red-600">{error}</p>
            )}

            {hasSent && !testFeedbackReceived && (
              <p className="mt-4 text-sm text-stone-500">
                Check your inbox on the left - the ticket should appear any moment...
              </p>
            )}
          </div>

          <div className="border-t border-stone-200 pt-4">
            <a
              href="/docs/troubleshooting"
              target="_blank"
              className="flex items-center justify-center gap-1 text-sm text-stone-500 hover:text-retro-black"
            >
              <Icon name="solar:question-circle-linear" size={16} />
              Having trouble?
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
