"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Send,
  ChevronDown,
  ChevronUp,
  Link2,
  Plus,
  Trash2,
  Loader2,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types from Convex queries
interface SubmitterUpdate {
  _id: Id<"submitterUpdates">;
  feedbackId: Id<"feedback">;
  content: string;
  createdAt: number;
}

interface PublicNote {
  _id: Id<"publicNotes">;
  content: string;
  createdAt: number;
  user: {
    _id: Id<"users">;
    name?: string;
    email: string;
    avatar?: string;
  } | null;
}

interface SubmitterPortalSectionProps {
  feedbackId: Id<"feedback">;
  hasSubmitterEmail: boolean;
  submitterEmail?: string;
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

export function SubmitterPortalSection({
  feedbackId,
  hasSubmitterEmail,
  submitterEmail,
}: SubmitterPortalSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSendingLink, setIsSendingLink] = useState(false);
  const [sendLinkMessage, setSendLinkMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Queries
  const publicNotes = useQuery(api.submitterPortal.getPublicNotes, { feedbackId });
  const submitterUpdates = useQuery(api.submitterPortal.getSubmitterUpdates, { feedbackId });

  // Mutations
  const addPublicNote = useMutation(api.submitterPortal.addPublicNote);
  const deletePublicNote = useMutation(api.submitterPortal.deletePublicNote);

  // Handle sending status link
  const handleSendStatusLink = async () => {
    if (!hasSubmitterEmail) return;

    setIsSendingLink(true);
    setSendLinkMessage(null);

    try {
      const response = await fetch("/api/submitter/send-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send link");
      }

      setSendLinkMessage({
        type: "success",
        text: `Status link sent to ${submitterEmail}`,
      });
    } catch (error) {
      setSendLinkMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to send link",
      });
    } finally {
      setIsSendingLink(false);
    }
  };

  // Handle adding a public note
  const handleAddPublicNote = async () => {
    if (!newNoteContent.trim()) return;

    setIsAddingNote(true);
    try {
      await addPublicNote({
        feedbackId,
        content: newNoteContent.trim(),
      });
      setNewNoteContent("");
    } catch (error) {
      console.error("Failed to add note:", error);
    } finally {
      setIsAddingNote(false);
    }
  };

  // Handle deleting a public note
  const handleDeleteNote = async (noteId: Id<"publicNotes">) => {
    try {
      await deletePublicNote({ noteId });
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  };

  return (
    <div className="rounded border-2 border-retro-peach/30 bg-retro-peach/5">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-3 text-left"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-retro-peach/50 bg-retro-peach/20">
            <Link2 className="h-3.5 w-3.5 text-retro-peach" />
          </div>
          <span className="font-medium text-retro-black">Submitter Portal</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-stone-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-stone-400" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-retro-peach/30 p-4 space-y-4">
          {/* Send Status Link Section */}
          {hasSubmitterEmail ? (
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-retro-black mb-1">
                  Send Status Link
                </h4>
                <p className="text-xs text-stone-500">
                  Send a magic link to the submitter so they can check the status
                  of their feedback.
                </p>
              </div>

              {sendLinkMessage && (
                <div
                  className={cn(
                    "rounded border p-2 text-xs",
                    sendLinkMessage.type === "success"
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-retro-red bg-red-50 text-retro-red"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {sendLinkMessage.type === "success" ? (
                      <CheckCircle className="h-3.5 w-3.5" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5" />
                    )}
                    {sendLinkMessage.text}
                  </div>
                </div>
              )}

              <button
                onClick={handleSendStatusLink}
                disabled={isSendingLink}
                className="flex items-center gap-2 rounded border-2 border-retro-black bg-white px-3 py-2 text-sm font-medium transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none shadow-[2px_2px_0px_0px_#888] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSendingLink ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send Status Link to {submitterEmail}
              </button>
            </div>
          ) : (
            <div className="rounded border border-stone-200 bg-stone-50 p-3 text-xs text-stone-500">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>
                  No email address was provided when this feedback was submitted.
                  Status updates cannot be sent to the submitter.
                </p>
              </div>
            </div>
          )}

          {/* Submitter Updates Section */}
          {submitterUpdates && submitterUpdates.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-retro-black flex items-center gap-2">
                <User className="h-4 w-4" />
                Additional Context from Submitter
              </h4>
              <div className="space-y-2">
                {submitterUpdates.map((update: SubmitterUpdate) => (
                  <div
                    key={update._id}
                    className="rounded border border-stone-200 bg-white p-3"
                  >
                    <p className="text-sm text-stone-700">{update.content}</p>
                    <p className="text-[10px] text-stone-400 mt-2">
                      {formatRelativeTime(update.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Public Notes Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-retro-black flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Public Notes
              <span className="text-[10px] text-stone-400 font-normal">
                (visible to submitter)
              </span>
            </h4>

            {/* Existing notes */}
            {publicNotes && publicNotes.length > 0 && (
              <div className="space-y-2">
                {publicNotes.map((note: PublicNote) => (
                  <div
                    key={note._id}
                    className="group rounded border border-retro-lavender/50 bg-retro-lavender/10 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-stone-700 flex-1">{note.content}</p>
                      <button
                        onClick={() => handleDeleteNote(note._id)}
                        className="opacity-0 group-hover:opacity-100 rounded p-1 text-stone-400 hover:text-retro-red hover:bg-red-50 transition-all"
                        title="Delete note"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-[10px] text-stone-400 mt-2">
                      {note.user?.name || note.user?.email || "Unknown"} &bull;{" "}
                      {formatRelativeTime(note.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Add new note */}
            <div className="space-y-2">
              <textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Add a public note (will be visible to the submitter)..."
                className="w-full rounded border-2 border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-retro-black focus:outline-none resize-none"
                rows={3}
              />
              <button
                onClick={handleAddPublicNote}
                disabled={isAddingNote || !newNoteContent.trim()}
                className="flex items-center gap-2 rounded border border-retro-lavender bg-retro-lavender/20 px-3 py-1.5 text-xs font-medium text-retro-black transition-colors hover:bg-retro-lavender/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAddingNote ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                Add Public Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
