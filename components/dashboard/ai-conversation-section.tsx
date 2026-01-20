"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import {
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Send,
  Loader2,
  Trash2,
  Copy,
  MessageSquare,
  FileText,
  Check,
  Bot,
  User,
  AlertCircle,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface AIConversationSectionProps {
  feedbackId: Id<"feedback">;
  teamId: Id<"teams">;
  onCopyToComment?: (content: string) => void;
  onCopyToTicketDraft?: (content: string) => void;
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
function MessageBubble({
  message,
  onCopyToComment,
  onCopyToTicketDraft,
}: {
  message: ConversationMessage;
  onCopyToComment?: (content: string) => void;
  onCopyToTicketDraft?: (content: string) => void;
}) {
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
            ? "bg-retro-lavender text-retro-black"
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
          "max-w-[80%] space-y-1",
          isAssistant ? "" : "items-end text-right"
        )}
      >
        <div
          className={cn(
            "rounded-lg px-3 py-2 text-sm",
            isAssistant
              ? "bg-white border border-stone-200 text-stone-700"
              : "bg-retro-blue/10 border border-retro-blue/20 text-stone-700"
          )}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Actions for assistant messages */}
        {isAssistant && (
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
            {onCopyToComment && (
              <button
                onClick={() => onCopyToComment(message.content)}
                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
                title="Add as comment"
              >
                <MessageSquare className="h-3 w-3" />
                Comment
              </button>
            )}
            {onCopyToTicketDraft && (
              <button
                onClick={() => onCopyToTicketDraft(message.content)}
                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
                title="Add to ticket draft"
              >
                <FileText className="h-3 w-3" />
                Draft
              </button>
            )}
            <span className="text-[10px] text-stone-300">
              {formatTimeAgo(message.createdAt)}
            </span>
          </div>
        )}

        {/* Timestamp for user messages */}
        {!isAssistant && (
          <div className="text-[10px] text-stone-300">
            {formatTimeAgo(message.createdAt)}
          </div>
        )}
      </div>
    </div>
  );
}

// Chat input component
function ChatInput({
  onSend,
  isLoading,
  disabled,
}: {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}) {
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  return (
    <form onSubmit={handleSubmit} className="relative">
      <textarea
        ref={inputRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask AI about this feedback..."
        disabled={isLoading || disabled}
        rows={1}
        className="w-full resize-none rounded border-2 border-stone-200 bg-white py-2.5 pl-3 pr-10 text-sm outline-none transition-colors focus:border-retro-lavender disabled:bg-stone-50 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={!message.trim() || isLoading || disabled}
        className={cn(
          "absolute bottom-2 right-2 rounded p-1.5 transition-colors",
          message.trim() && !isLoading && !disabled
            ? "text-retro-lavender hover:bg-retro-lavender/10"
            : "text-stone-300"
        )}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </button>
    </form>
  );
}

export function AIConversationSection({
  feedbackId,
  teamId,
  onCopyToComment,
  onCopyToTicketDraft,
}: AIConversationSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get AI configuration for the team
  const aiConfig = useQuery(api.ai.getTeamAiConfig, { teamId });

  // Get conversation history
  const conversationHistory = useQuery(api.ai.getConversationHistory, {
    feedbackId,
  });

  // Action to send messages
  const sendMessage = useAction(api.aiActions.sendConversationMessage);

  // Mutation to clear history
  const clearHistory = useMutation(api.ai.clearConversationHistory);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversationHistory?.length]);

  // Handle sending a message
  const handleSendMessage = useCallback(
    async (message: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await sendMessage({
          feedbackId,
          teamId,
          userMessage: message,
        });

        if (!result.success) {
          setError(result.error || "Failed to send message");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send message");
      } finally {
        setIsLoading(false);
      }
    },
    [feedbackId, teamId, sendMessage]
  );

  // Handle clearing conversation history
  const handleClearHistory = useCallback(async () => {
    if (!window.confirm("Are you sure you want to clear the conversation history?")) {
      return;
    }

    try {
      await clearHistory({ feedbackId });
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
  }, [feedbackId, clearHistory]);

  // Check if AI is configured
  if (!aiConfig?.isConfigured) {
    return (
      <div className="rounded border-2 border-dashed border-stone-300 bg-stone-50 p-4">
        <div className="flex items-center gap-2 text-stone-500">
          <MessageCircle className="h-4 w-4" />
          <span className="text-sm font-medium">AI Conversation</span>
        </div>
        <p className="mt-2 text-sm text-stone-500">
          Configure an AI provider in settings to chat about this feedback.
        </p>
      </div>
    );
  }

  const messageCount = conversationHistory?.length || 0;

  return (
    <div className="rounded border-2 border-retro-lavender bg-retro-lavender/10">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-retro-lavender" />
          <h3 className="text-sm font-medium text-retro-black">AI Conversation</h3>
          {messageCount > 0 && (
            <span className="rounded bg-retro-lavender/30 px-1.5 py-0.5 text-[10px] font-medium text-retro-lavender">
              {messageCount} messages
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {messageCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClearHistory();
              }}
              className="rounded p-1 text-stone-400 transition-colors hover:bg-white hover:text-stone-600"
              title="Clear conversation"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-stone-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-stone-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-retro-lavender/30">
          {/* Messages area */}
          <div className="max-h-[350px] min-h-[150px] overflow-y-auto p-4">
            {conversationHistory === undefined ? (
              // Loading state
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-stone-400" />
              </div>
            ) : conversationHistory.length === 0 ? (
              // Empty state
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bot className="mb-2 h-10 w-10 text-retro-lavender/50" />
                <p className="text-sm font-medium text-stone-600">
                  Start a conversation
                </p>
                <p className="mt-1 text-xs text-stone-400">
                  Ask questions about this feedback, get insights, or explore solutions
                </p>
              </div>
            ) : (
              // Messages list
              <div className="space-y-4">
                {conversationHistory.map((message: ConversationMessage) => (
                  <MessageBubble
                    key={message._id}
                    message={message}
                    onCopyToComment={onCopyToComment}
                    onCopyToTicketDraft={onCopyToTicketDraft}
                  />
                ))}
                {isLoading && (
                  <div className="flex gap-2">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-retro-lavender text-retro-black">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2">
                      <Loader2 className="h-4 w-4 animate-spin text-retro-lavender" />
                      <span className="text-sm text-stone-400">Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="mx-4 mb-2 flex items-center gap-2 rounded border border-retro-red/20 bg-retro-red/10 px-3 py-2 text-sm text-retro-red">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Chat input */}
          <div className="border-t border-retro-lavender/30 p-4">
            <ChatInput
              onSend={handleSendMessage}
              isLoading={isLoading}
              disabled={!aiConfig?.isConfigured}
            />
            <p className="mt-2 text-[10px] text-stone-400">
              AI has context of feedback details, screenshot, and metadata. Press Enter to send.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
