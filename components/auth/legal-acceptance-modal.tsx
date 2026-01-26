"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Icon } from "@/components/ui/icon";
import Link from "next/link";

const TERMS_VERSION = "2026-01-26";
const PRIVACY_VERSION = "2026-01-26";

interface LegalAcceptanceModalProps {
  onAccept: () => void;
}

export function LegalAcceptanceModal({ onAccept }: LegalAcceptanceModalProps) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const acceptLegalTerms = useMutation(api.users.acceptLegalTerms);

  const handleAccept = async () => {
    if (!termsAccepted || !privacyAccepted) {
      return;
    }

    setIsSubmitting(true);
    try {
      await acceptLegalTerms({
        termsVersion: TERMS_VERSION,
        privacyVersion: PRIVACY_VERSION,
      });
      onAccept();
    } catch (error) {
      console.error("Failed to accept legal terms:", error);
      alert("Failed to accept legal terms. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const allAccepted = termsAccepted && privacyAccepted;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded border-2 border-retro-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-retro-blue bg-retro-blue/10">
            <Icon name="solar:document-text-linear" size={20} className="text-retro-blue" />
          </div>
          <h2 className="text-2xl font-bold text-retro-black">
            Accept Legal Terms
          </h2>
        </div>

        <p className="mb-6 text-stone-600">
          Before you can start using FeedbackFlow, please review and accept our
          legal terms.
        </p>

        <div className="mb-6 space-y-4">
          {/* Terms of Service */}
          <label className="flex cursor-pointer items-start gap-3 rounded border-2 border-stone-200 bg-stone-50 p-4 transition-colors hover:border-retro-black">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-1 h-5 w-5 cursor-pointer rounded border-2 border-stone-300 text-retro-black focus:ring-2 focus:ring-retro-black focus:ring-offset-2"
            />
            <div className="flex-1">
              <p className="text-sm text-stone-700">
                I have read and agree to the{" "}
                <Link
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-retro-blue hover:underline"
                >
                  Terms of Service
                </Link>
              </p>
            </div>
          </label>

          {/* Privacy Policy */}
          <label className="flex cursor-pointer items-start gap-3 rounded border-2 border-stone-200 bg-stone-50 p-4 transition-colors hover:border-retro-black">
            <input
              type="checkbox"
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
              className="mt-1 h-5 w-5 cursor-pointer rounded border-2 border-stone-300 text-retro-black focus:ring-2 focus:ring-retro-black focus:ring-offset-2"
            />
            <div className="flex-1">
              <p className="text-sm text-stone-700">
                I have read and agree to the{" "}
                <Link
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-retro-blue hover:underline"
                >
                  Privacy Policy
                </Link>
              </p>
            </div>
          </label>
        </div>

        <button
          onClick={handleAccept}
          disabled={!allAccepted || isSubmitting}
          className="w-full rounded border-2 border-retro-black bg-retro-black px-4 py-3 font-medium text-white transition-all hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-retro-black"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Icon name="svg-spinners:90-ring-with-bg" size={20} />
              Accepting...
            </span>
          ) : (
            "Accept and Continue"
          )}
        </button>

        <p className="mt-4 text-center text-xs text-stone-500">
          You must accept both documents to use FeedbackFlow
        </p>
      </div>
    </div>
  );
}
