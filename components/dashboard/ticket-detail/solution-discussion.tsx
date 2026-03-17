"use client";

import { Icon } from "@/components/ui/icon";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEffect } from "react";

interface ConversationMessage {
  _id: string;
  role: "user" | "assistant";
  content: string;
}

interface AiConfig {
  isConfigured: boolean;
}

interface SolutionDiscussionProps {
  conversationHistory?: ConversationMessage[] | null;
  aiConfig?: AiConfig | null;
  isAiThinking: boolean;
  isSolutionExpanded: boolean;
  onToggle: (expanded: boolean) => void;
}

export function SolutionDiscussion({
  conversationHistory,
  aiConfig,
  isAiThinking,
  isSolutionExpanded,
  onToggle,
}: SolutionDiscussionProps) {
  const hasContent = conversationHistory && conversationHistory.length > 0;
  
  // Auto-collapse when empty, auto-expand when content arrives
  useEffect(() => {
    if (!hasContent && !isAiThinking) {
      onToggle(false);
    } else if (hasContent || isAiThinking) {
      onToggle(true);
    }
  }, [hasContent, isAiThinking, onToggle]);

  return (
    <details
      open={isSolutionExpanded}
      onToggle={(e) => onToggle((e.target as HTMLDetailsElement).open)}
      className="group rounded border-2 border-retro-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] transition-all duration-300 ease-in-out"
    >
      <summary className={`flex cursor-pointer items-center justify-between transition-all duration-200 ${
        hasContent || isAiThinking 
          ? 'p-4 hover:bg-stone-50' 
          : 'p-2 hover:bg-stone-50/50'
      }`}>
        <div className="flex items-center gap-2">
          <Icon 
            name="solar:chat-round-dots-linear" 
            className={`transition-all duration-200 ${
              hasContent || isAiThinking 
                ? 'text-retro-blue' 
                : 'text-stone-400'
            }`}
            size={hasContent || isAiThinking ? 18 : 16} 
          />
          <span className={`font-mono uppercase tracking-wider transition-all duration-200 ${
            hasContent || isAiThinking
              ? 'text-sm font-bold text-retro-blue'
              : 'text-xs font-medium text-stone-500'
          }`}>
            {hasContent || isAiThinking ? 'Solution Discussion' : 'Solution Discussion (Empty)'}
          </span>
          {conversationHistory && conversationHistory.length > 0 && (
            <span className="ml-2 rounded-full bg-retro-blue/10 px-2 py-0.5 text-xs font-medium text-retro-blue">
              {conversationHistory.length}
            </span>
          )}
        </div>
        <Icon
          name="solar:alt-arrow-down-linear"
          size={hasContent || isAiThinking ? 18 : 14}
          className="text-stone-400 transition-transform duration-200 group-open:rotate-180"
        />
      </summary>

      <div className="space-y-3 border-t-2 border-stone-200 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
        {!aiConfig?.isConfigured ? (
          <div className="rounded border-2 border-retro-yellow/30 bg-retro-yellow/10 p-4 text-center">
            <Icon
              name="solar:danger-triangle-linear"
              className="mx-auto mb-2 text-retro-yellow"
              size={32}
            />
            <p className="mb-2 text-sm font-semibold text-stone-700">AI Not Configured</p>
            <p className="mb-3 text-xs text-stone-600">
              Add an OpenAI or Anthropic API key in Settings to use AI features.
            </p>
            <a
              href="/settings?tab=ai"
              className="inline-flex items-center gap-1 rounded border-2 border-retro-black bg-white px-3 py-1.5 text-xs font-medium transition-colors hover:bg-stone-50"
            >
              <Icon name="solar:settings-linear" size={14} />
              Go to Settings
            </a>
          </div>
        ) : conversationHistory && conversationHistory.length > 0 ? (
          conversationHistory.map((message) => (
            <div
              key={message._id}
              className={`flex items-start gap-3 min-w-0 ${
                message.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              {/* Avatar */}
              <div
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                  message.role === "assistant"
                    ? "border border-retro-blue bg-retro-blue/20 text-retro-blue"
                    : "bg-retro-black text-white"
                }`}
              >
                {message.role === "assistant" ? (
                  <Icon name="solar:robot-2-linear" size={16} />
                ) : (
                  <span className="font-mono text-[10px] font-bold">ME</span>
                )}
              </div>

              {/* Message bubble */}
              <div
                className={`min-w-0 flex-1 overflow-hidden rounded-lg border p-3 text-sm ${
                  message.role === "assistant"
                    ? "rounded-tl-none border-stone-200 bg-white shadow-sm"
                    : "rounded-tr-none border-retro-yellow bg-retro-yellow/20"
                }`}
              >
                {message.role === "assistant" ? (
                  <div className="prose prose-sm prose-stone max-w-none overflow-wrap-anywhere break-words leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_*]:break-words [&_code]:break-all [&_code]:rounded [&_code]:border [&_code]:border-stone-200 [&_code]:bg-stone-50 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_code]:font-mono [&_code]:text-stone-700 [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:border-2 [&_pre]:border-retro-black [&_pre]:bg-stone-50 [&_pre]:p-3 [&_pre_code]:border-0 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:break-normal [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1 [&_strong]:font-semibold [&_strong]:text-stone-900 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-stone-900 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-stone-900 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-stone-800">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="break-words whitespace-pre-wrap leading-relaxed">{message.content}</p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center">
            <div className="mb-3 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-stone-200 bg-stone-50">
                <Icon name="solar:chat-line-linear" className="text-stone-400" size={24} />
              </div>
            </div>
            <p className="text-sm text-stone-500">
              No conversation yet. Start discussing the solution below.
            </p>
          </div>
        )}

        {/* AI Thinking indicator */}
        {isAiThinking && (
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-retro-blue bg-retro-blue/20 text-retro-blue">
              <Icon name="solar:robot-2-linear" size={16} />
            </div>
            <div className="flex-1 rounded-bl-lg rounded-br-lg rounded-tr-lg border border-stone-200 bg-white p-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-retro-blue"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-retro-blue"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-retro-blue"
                  style={{ animationDelay: "300ms" }}
                />
                <span className="ml-2 text-xs text-stone-500">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </details>
  );
}
