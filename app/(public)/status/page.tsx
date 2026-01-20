"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Bug,
  Lightbulb,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Send,
  Image as ImageIcon,
  Download,
  Trash2,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";

// Types for public feedback status
interface PublicNote {
  _id: Id<"publicNotes">;
  content: string;
  createdAt: number;
}

interface SubmitterUpdate {
  _id: Id<"submitterUpdates">;
  content: string;
  createdAt: number;
}

/**
 * Format relative time
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  } else {
    return "just now";
  }
}

/**
 * Format date
 */
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Status timeline item
 */
function StatusTimelineItem({
  label,
  description,
  isActive,
  isComplete,
  isLast,
}: {
  label: string;
  description: string;
  isActive: boolean;
  isComplete: boolean;
  isLast: boolean;
}) {
  return (
    <div className="flex gap-4">
      {/* Timeline line and dot */}
      <div className="flex flex-col items-center">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
            isComplete
              ? "border-green-500 bg-green-500 text-white"
              : isActive
              ? "border-retro-blue bg-retro-blue text-white"
              : "border-stone-300 bg-white text-stone-400"
          }`}
        >
          {isComplete ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <Clock className="h-4 w-4" />
          )}
        </div>
        {!isLast && (
          <div
            className={`w-0.5 flex-1 ${
              isComplete ? "bg-green-500" : "bg-stone-200"
            }`}
          />
        )}
      </div>

      {/* Content */}
      <div className={`pb-6 ${isLast ? "pb-0" : ""}`}>
        <p
          className={`font-medium ${
            isActive ? "text-retro-blue" : isComplete ? "text-green-600" : "text-stone-400"
          }`}
        >
          {label}
        </p>
        <p className="mt-1 text-sm text-stone-500">{description}</p>
      </div>
    </div>
  );
}

function StatusPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [additionalContext, setAdditionalContext] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showScreenshot, setShowScreenshot] = useState(false);
  const [showGdprSection, setShowGdprSection] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [gdprMessage, setGdprMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Validate token and get status
  const tokenValidation = useQuery(
    api.submitterPortal.validateToken,
    token ? { token } : "skip"
  );

  const feedbackStatus = useQuery(
    api.submitterPortal.getPublicFeedbackStatus,
    token ? { token } : "skip"
  );

  const addUpdateMutation = useMutation(api.submitterPortal.addSubmitterUpdate);

  // GDPR data queries
  const canDeleteData = useQuery(
    api.submitterPortal.canDeleteData,
    token ? { token } : "skip"
  );

  // Handle exporting data
  const handleExportData = async () => {
    if (!token) return;

    setIsExporting(true);
    setGdprMessage(null);

    try {
      const response = await fetch(`/api/submitter/export-data?token=${token}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to export data");
      }

      const data = await response.json();

      // Create and download the file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `feedbackflow_data_export_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setGdprMessage({
        type: "success",
        text: "Your data has been exported successfully.",
      });
    } catch (error) {
      setGdprMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to export data",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Handle deleting data
  const handleDeleteData = async () => {
    if (!token) return;

    setIsDeleting(true);
    setGdprMessage(null);

    try {
      const response = await fetch("/api/submitter/delete-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, confirmDeletion: true }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete data");
      }

      const result = await response.json();

      setShowDeleteConfirm(false);
      setGdprMessage({
        type: "success",
        text: result.message || "Your personal data has been deleted.",
      });
    } catch (error) {
      setGdprMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to delete data",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle submitting additional context
  const handleSubmitContext = async () => {
    if (!token || !additionalContext.trim()) return;

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      await addUpdateMutation({
        token,
        content: additionalContext.trim(),
      });
      setAdditionalContext("");
      setSubmitMessage({
        type: "success",
        text: "Your update has been submitted successfully.",
      });
    } catch (error) {
      setSubmitMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to submit update",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine status step
  const statusSteps = [
    {
      key: "new",
      label: "Received",
      description: "Your feedback has been received",
    },
    {
      key: "triaging",
      label: "Under Review",
      description: "Our team is reviewing your feedback",
    },
    {
      key: "drafted",
      label: "In Progress",
      description: "We're working on a solution",
    },
    {
      key: "exported",
      label: "In Development",
      description: "Added to our development queue",
    },
    {
      key: "resolved",
      label: "Resolved",
      description: "Your feedback has been addressed",
    },
  ];

  const currentStepIndex = feedbackStatus
    ? statusSteps.findIndex((s) => s.key === feedbackStatus.status)
    : -1;

  // Invalid or missing token
  if (!token) {
    return (
      <div className="min-h-screen bg-retro-paper flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="rounded border-2 border-retro-black bg-white shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
            <div className="border-b-2 border-retro-black bg-stone-50 px-6 py-4">
              <h1 className="text-lg font-semibold text-retro-black">
                Invalid Link
              </h1>
            </div>
            <div className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                  <AlertCircle className="h-8 w-8 text-retro-red" />
                </div>
              </div>
              <p className="text-stone-600 mb-6">
                This link is invalid or has expired. Please request a new link to
                view your feedback status.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded border-2 border-retro-black bg-retro-black px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (tokenValidation === undefined || feedbackStatus === undefined) {
    return (
      <div className="min-h-screen bg-retro-paper flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
      </div>
    );
  }

  // Token validation failed
  if (!tokenValidation?.valid || !feedbackStatus) {
    return (
      <div className="min-h-screen bg-retro-paper flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="rounded border-2 border-retro-black bg-white shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
            <div className="border-b-2 border-retro-black bg-stone-50 px-6 py-4">
              <h1 className="text-lg font-semibold text-retro-black">
                Link Expired
              </h1>
            </div>
            <div className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
              <p className="text-stone-600 mb-6">
                {tokenValidation?.error ||
                  "This link has expired. Please request a new link to view your feedback status."}
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded border-2 border-retro-black bg-retro-black px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-retro-paper py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-retro-black transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to FeedbackFlow
          </Link>
        </div>

        {/* Main Card */}
        <div className="rounded border-2 border-retro-black bg-white shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
          {/* Header */}
          <div className="border-b-2 border-retro-black bg-stone-50 px-6 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${
                    feedbackStatus.type === "bug"
                      ? "border-retro-red bg-retro-red/10 text-retro-red"
                      : "border-retro-blue bg-retro-blue/10 text-retro-blue"
                  }`}
                >
                  {feedbackStatus.type === "bug" ? (
                    <Bug className="h-5 w-5" />
                  ) : (
                    <Lightbulb className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-retro-black">
                    {feedbackStatus.title}
                  </h1>
                  <p className="text-sm text-stone-500 mt-0.5">
                    {feedbackStatus.projectName} &bull; Submitted{" "}
                    {formatRelativeTime(feedbackStatus.createdAt)}
                  </p>
                </div>
              </div>
              <span
                className={`shrink-0 rounded px-2 py-1 text-xs font-bold uppercase tracking-wider ${
                  feedbackStatus.type === "bug"
                    ? "bg-retro-red/10 text-retro-red border border-retro-red/20"
                    : "bg-retro-blue/10 text-retro-blue border border-retro-blue/20"
                }`}
              >
                {feedbackStatus.type === "bug" ? "Bug Report" : "Feature Request"}
              </span>
            </div>
          </div>

          {/* Status Section */}
          <div className="p-6 border-b-2 border-retro-black">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400 mb-4">
              Status
            </h2>

            {/* Current Status Banner */}
            <div
              className={`rounded border-2 p-4 mb-6 ${
                feedbackStatus.status === "resolved"
                  ? "border-green-500 bg-green-50"
                  : "border-retro-blue bg-retro-blue/10"
              }`}
            >
              <div className="flex items-center gap-3">
                {feedbackStatus.status === "resolved" ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <Clock className="h-6 w-6 text-retro-blue" />
                )}
                <div>
                  <p
                    className={`font-semibold ${
                      feedbackStatus.status === "resolved"
                        ? "text-green-600"
                        : "text-retro-blue"
                    }`}
                  >
                    {feedbackStatus.statusLabel}
                  </p>
                  <p className="text-sm text-stone-600">
                    {feedbackStatus.statusDescription}
                  </p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="pl-1">
              {statusSteps.map((step, index) => (
                <StatusTimelineItem
                  key={step.key}
                  label={step.label}
                  description={step.description}
                  isActive={index === currentStepIndex}
                  isComplete={index < currentStepIndex}
                  isLast={index === statusSteps.length - 1}
                />
              ))}
            </div>

            {feedbackStatus.resolvedAt && (
              <p className="text-sm text-stone-500 mt-4 pt-4 border-t border-stone-200">
                Resolved on {formatDate(feedbackStatus.resolvedAt)}
              </p>
            )}
          </div>

          {/* Screenshot Preview */}
          {feedbackStatus.screenshotUrl && (
            <div className="p-6 border-b-2 border-retro-black">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400 mb-4">
                Your Screenshot
              </h2>
              <button
                onClick={() => setShowScreenshot(!showScreenshot)}
                className="flex items-center gap-2 text-sm text-retro-blue hover:underline"
              >
                <ImageIcon className="h-4 w-4" />
                {showScreenshot ? "Hide screenshot" : "View screenshot"}
              </button>
              {showScreenshot && (
                <div className="mt-4 rounded border-2 border-stone-200 overflow-hidden">
                  <img
                    src={feedbackStatus.screenshotUrl}
                    alt="Feedback screenshot"
                    className="w-full"
                  />
                </div>
              )}
            </div>
          )}

          {/* Public Notes / Resolution Updates */}
          {feedbackStatus.publicNotes.length > 0 && (
            <div className="p-6 border-b-2 border-retro-black">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400 mb-4">
                Updates from the Team
              </h2>
              <div className="space-y-4">
                {feedbackStatus.publicNotes.map((note: PublicNote) => (
                  <div
                    key={note._id}
                    className="rounded border-2 border-retro-lavender bg-retro-lavender/10 p-4"
                  >
                    <p className="text-stone-700">{note.content}</p>
                    <p className="text-xs text-stone-400 mt-2">
                      {formatRelativeTime(note.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submitter's Previous Updates */}
          {feedbackStatus.submitterUpdates.length > 0 && (
            <div className="p-6 border-b-2 border-retro-black">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400 mb-4">
                Your Additional Context
              </h2>
              <div className="space-y-4">
                {feedbackStatus.submitterUpdates.map((update: SubmitterUpdate) => (
                  <div
                    key={update._id}
                    className="rounded border border-stone-200 bg-stone-50 p-4"
                  >
                    <p className="text-stone-700">{update.content}</p>
                    <p className="text-xs text-stone-400 mt-2">
                      {formatRelativeTime(update.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Additional Context */}
          {feedbackStatus.status !== "resolved" && (
            <div className="p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400 mb-4">
                Add Additional Context
              </h2>
              <p className="text-sm text-stone-500 mb-4">
                Have more details to share? Add them here and our team will be
                notified.
              </p>

              {submitMessage && (
                <div
                  className={`rounded border p-3 mb-4 ${
                    submitMessage.type === "success"
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-retro-red bg-red-50 text-retro-red"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {submitMessage.type === "success" ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <p className="text-sm">{submitMessage.text}</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <textarea
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="Add any additional context, reproduction steps, or details that might help..."
                  className="w-full rounded border-2 border-stone-200 bg-stone-50 px-4 py-3 text-sm focus:border-retro-black focus:outline-none resize-none"
                  rows={4}
                />
                <button
                  onClick={handleSubmitContext}
                  disabled={isSubmitting || !additionalContext.trim()}
                  className="inline-flex items-center gap-2 rounded border-2 border-retro-black bg-retro-black px-4 py-2.5 text-sm font-medium text-white transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-[2px_2px_0px_0px_#888] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[2px_2px_0px_0px_#888]"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Submit Update
                </button>
              </div>
            </div>
          )}
        </div>

        {/* GDPR Data Rights Section */}
        <div className="mt-6 rounded border-2 border-stone-200 bg-white">
          <button
            onClick={() => setShowGdprSection(!showGdprSection)}
            className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-stone-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-stone-400" />
              <span className="font-medium text-stone-700">Your Data Rights</span>
            </div>
            <span className="text-sm text-stone-400">
              {showGdprSection ? "Hide" : "Show"}
            </span>
          </button>

          {showGdprSection && (
            <div className="border-t border-stone-200 p-6">
              <p className="text-sm text-stone-600 mb-4">
                Under GDPR and similar privacy regulations, you have the right to access,
                export, and request deletion of your personal data.
              </p>

              {gdprMessage && (
                <div
                  className={`rounded border p-3 mb-4 ${
                    gdprMessage.type === "success"
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-retro-red bg-red-50 text-retro-red"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {gdprMessage.type === "success" ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <p className="text-sm">{gdprMessage.text}</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {/* Export Data */}
                <div className="rounded border border-stone-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-stone-800">Export Your Data</h3>
                      <p className="text-sm text-stone-500 mt-1">
                        Download a JSON file containing all data associated with this feedback.
                      </p>
                    </div>
                    <button
                      onClick={handleExportData}
                      disabled={isExporting}
                      className="inline-flex items-center gap-2 rounded border-2 border-retro-blue bg-white px-4 py-2 text-sm font-medium text-retro-blue hover:bg-retro-blue/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isExporting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      Export
                    </button>
                  </div>
                </div>

                {/* Delete Data */}
                <div className="rounded border border-stone-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-stone-800">Delete Your Personal Data</h3>
                      <p className="text-sm text-stone-500 mt-1">
                        Remove your email and name from this feedback. The anonymized feedback
                        record will be retained.
                      </p>
                    </div>
                    {canDeleteData?.canDelete ? (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="inline-flex items-center gap-2 rounded border-2 border-retro-red bg-white px-4 py-2 text-sm font-medium text-retro-red hover:bg-retro-red/10"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    ) : (
                      <span className="text-sm text-stone-400 italic">
                        {canDeleteData?.reason || "Already deleted"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Delete Confirmation Dialog */}
              {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                  <div className="w-full max-w-md rounded border-2 border-retro-black bg-white shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
                    <div className="border-b-2 border-retro-black bg-retro-red/10 px-6 py-4">
                      <h2 className="text-lg font-semibold text-retro-red">
                        Confirm Data Deletion
                      </h2>
                    </div>
                    <div className="p-6">
                      <p className="text-stone-600 mb-4">
                        Are you sure you want to delete your personal data? This action will:
                      </p>
                      <ul className="list-disc list-inside text-sm text-stone-600 space-y-1 mb-6">
                        <li>Remove your email address from this feedback</li>
                        <li>Remove your name from this feedback</li>
                        <li>Delete any additional context you&apos;ve provided</li>
                        <li>Invalidate this status link</li>
                      </ul>
                      <p className="text-sm text-stone-500 mb-6">
                        <strong>Note:</strong> The anonymized feedback record will be retained
                        for historical purposes.
                      </p>
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="rounded border-2 border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleDeleteData}
                          disabled={isDeleting}
                          className="inline-flex items-center gap-2 rounded border-2 border-retro-red bg-retro-red px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
                        >
                          {isDeleting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          Yes, Delete My Data
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-stone-400">
          Powered by{" "}
          <Link href="/" className="text-retro-blue hover:underline">
            FeedbackFlow
          </Link>{" "}
          &bull; Privacy-first feedback collection
        </p>
      </div>
    </div>
  );
}

export default function StatusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-retro-paper flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
        </div>
      }
    >
      <StatusPageContent />
    </Suspense>
  );
}
