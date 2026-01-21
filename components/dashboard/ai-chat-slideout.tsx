"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import {
  X,
  Send,
  Loader2,
  Trash2,
  Copy,
  Check,
  Bot,
  User,
  AlertCircle,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface AIChatSlideoutProps {
  feedbackId: Id<"feedback">;
  teamId: Id<"teams">;
  isOpen: boolean;
  onClose: () => void;
}

interface ConversationMessage {
  _id: Id<"conversations">;
  role: "user" | "assistant";
  content: string;
  provider?: "openai" | "anthropic";
  model?: string;
  createdAt: number;
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

// Message bubble component
function MessageBubble({ message }: { message: ConversationMessage }) {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.role === "assistant";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div
      className={cn(
        "group flex gap-2",
        isAssistant ? "flex-row" : "flex-row-reverse"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full",
          isAssistant
            ? "bg-purple-100 text-purple-600"
            : "bg-retro-blue text-white"
        )}
      >
        {isAssistant ? (
          <Bot className="h-4 w-4" />
        ) : (
          <User className="h-4 w-4" />
        )}
      </div>

      {/* Message content */}
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-3 py-2",
          isAssistant
            ? "bg-stone-100 text-stone-800"
            : "bg-retro-blue text-white"
        )}
      >
        <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {message.content}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span
            className={cn(
              "text-xs",
              isAssistant ? "text-stone-400" : "text-blue-100"
            )}
          >
            {formatTimeAgo(message.createdAt)}
          </span>
          {isAssistant && (
            <button
              onClick={handleCopy}
              className="opacity-0 transition-opacity group-hover:opacity-100"
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3 text-stone-400 hover:text-stone-600" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function AIChatSlideout({
  feedbackId,
  teamId,
  isOpen,
  onClose,
}: AIChatSlideoutProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Get AI configuration
  const aiConfig = useQuery(api.ai.getTeamAiConfig, { teamId });

  // Get conversation messages
  const messages = useQuery(
    api.ai.getConversationMessages,
    isOpen ? { feedbackId } : "skip"
  );

  // Send message action
  const sendMessage = useAction(api.aiActions.sendConversationMessage);

  // Clear conversation mutation
  const clearConversation = useMutation(api.ai.clearConversation);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSend = useCallback(async () => {
    if (!message.trim() || isSending) return;

    setIsSending(true);
    setSendError(null);

    try {
      const result = await sendMessage({
        feedbackId,
        teamId,
        message: message.trim(),
      });

      if (!result.success) {
        setSendError(result.error || "Failed to send message");
      } else {
        setMessage("");
      }
    } catch (error) {
      setSendError(error instanceof Error ? error.message : "Failed to send message");
    } finally {
      setIsSending(false);
    }
  }, [message, isSending, feedbackId, teamId, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearConversation = useCallback(async () => {
    if (!confirm("Clear this conversation? This cannot be undone.")) return;

    try {
      await clearConversation({ feedbackId });
    } catch (error) {
      console.error("Failed to clear conversation:", error);
    }
  }, [feedbackId, clearConversation]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Slideout panel */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l-2 border-retro-black bg-retro-paper shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-retro-black bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
              <Bot className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <h2 className="font-semibold text-retro-black">AI Assistant</h2>
              <p className="text-xs text-stone-500">Discuss this issue</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages && messages.length > 0 && (
              <button
                onClick={handleClearConversation}
                className="rounded p-1.5 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600"
                title="Clear conversation"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-retro-black"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4">
          {!aiConfig?.provider ? (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <AlertCircle className="mb-3 h-12 w-12 text-stone-300" />
              <h3 className="mb-2 font-medium text-stone-600">AI Not Configured</h3>
              <p className="text-sm text-stone-500">
                Configure an AI provider in settings to use this feature.
              </p>
            </div>
          ) : !messages || messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                <Bot className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="mb-2 font-medium text-retro-black">Start a Conversation</h3>
              <p className="text-sm text-stone-500">
                Ask questions about this issue, brainstorm solutions, or get implementation
                guidance.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg: ConversationMessage) => (
                <MessageBubble key={msg._id} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        {aiConfig?.provider && (
          <div className="border-t-2 border-retro-black bg-white p-4">
            {sendError && (
              <div className="mb-2 flex items-start gap-2 rounded bg-red-50 p-2 text-xs text-red-600">
                <AlertCircle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                <span>{sendError}</span>
              </div>
            )}
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about this issue..."
                disabled={isSending}
                rows={3}
                className="flex-1 resize-none rounded border-2 border-stone-200 bg-stone-50 px-3 py-2 text-sm outline-none transition-colors focus:border-retro-blue disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!message.trim() || isSending}
                className="flex h-full items-center justify-center rounded border-2 border-retro-black bg-retro-black px-4 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.25)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.25)]"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="mt-2 text-xs text-stone-400">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        )}
      </div>
    </>
  );
}
