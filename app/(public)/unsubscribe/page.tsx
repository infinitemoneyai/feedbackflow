"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Mail, CheckCircle, AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "confirming" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const userData = useQuery(
    api.notifications.getUserByUnsubscribeToken,
    token ? { token } : "skip"
  );
  const unsubscribeMutation = useMutation(api.notifications.unsubscribeByToken);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Invalid or missing unsubscribe token");
      return;
    }

    if (userData === undefined) {
      // Still loading
      return;
    }

    if (userData === null) {
      setStatus("error");
      setErrorMessage("Invalid unsubscribe link. The token may have expired or been used.");
      return;
    }

    if (userData.emailEnabled === false) {
      setStatus("success");
      return;
    }

    setStatus("confirming");
  }, [token, userData]);

  const handleUnsubscribe = async () => {
    if (!token) return;

    setStatus("loading");

    try {
      await unsubscribeMutation({ token });
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to unsubscribe. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen bg-retro-paper flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="rounded border-2 border-retro-black bg-white shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
          {/* Header */}
          <div className="border-b-2 border-retro-black bg-stone-50 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-retro-black bg-white">
                <Mail className="h-5 w-5" />
              </div>
              <h1 className="text-lg font-semibold text-retro-black">
                Email Preferences
              </h1>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {status === "loading" && (
              <div className="flex flex-col items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
                <p className="mt-4 text-sm text-stone-500">Loading...</p>
              </div>
            )}

            {status === "confirming" && userData && (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-stone-600">
                    You are about to unsubscribe from email notifications for:
                  </p>
                  <p className="mt-2 font-medium text-retro-black">
                    {userData.email}
                  </p>
                </div>

                <div className="rounded border border-stone-200 bg-stone-50 p-4">
                  <p className="text-sm text-stone-600">
                    After unsubscribing, you will no longer receive:
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-stone-500">
                    <li>• New feedback notifications</li>
                    <li>• Assignment notifications</li>
                    <li>• Comment and mention alerts</li>
                    <li>• Export status updates</li>
                    <li>• Daily/weekly digest emails</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <Link
                    href="/"
                    className="flex-1 rounded border-2 border-retro-black bg-white px-4 py-2.5 text-center text-sm font-medium transition-colors hover:bg-stone-50"
                  >
                    Cancel
                  </Link>
                  <button
                    onClick={handleUnsubscribe}
                    className="flex-1 rounded border-2 border-retro-red bg-retro-red px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-red-600"
                  >
                    Unsubscribe
                  </button>
                </div>

                <p className="text-center text-xs text-stone-400">
                  You can re-enable notifications anytime in your{" "}
                  <Link href="/settings" className="text-retro-blue hover:underline">
                    account settings
                  </Link>
                  .
                </p>
              </div>
            )}

            {status === "success" && (
              <div className="space-y-6 text-center">
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-retro-black">
                    Successfully Unsubscribed
                  </h2>
                  <p className="mt-2 text-sm text-stone-600">
                    You have been unsubscribed from FeedbackFlow email notifications.
                  </p>
                </div>

                <div className="rounded border border-stone-200 bg-stone-50 p-4">
                  <p className="text-sm text-stone-500">
                    Changed your mind? You can re-enable notifications anytime in your
                    account settings.
                  </p>
                </div>

                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded border-2 border-retro-black bg-retro-black px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Link>
              </div>
            )}

            {status === "error" && (
              <div className="space-y-6 text-center">
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                    <AlertCircle className="h-8 w-8 text-retro-red" />
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-retro-black">
                    Unable to Unsubscribe
                  </h2>
                  <p className="mt-2 text-sm text-stone-600">
                    {errorMessage}
                  </p>
                </div>

                <div className="rounded border border-stone-200 bg-stone-50 p-4">
                  <p className="text-sm text-stone-500">
                    If you continue to have issues, please{" "}
                    <a
                      href="mailto:support@feedbackflow.dev"
                      className="text-retro-blue hover:underline"
                    >
                      contact support
                    </a>
                    .
                  </p>
                </div>

                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded border-2 border-retro-black bg-retro-black px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="mt-4 text-center text-xs text-stone-400">
          FeedbackFlow • Privacy-first feedback collection
        </p>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-retro-paper flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
        </div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  );
}
