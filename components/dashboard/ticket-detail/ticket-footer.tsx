"use client";

import { Icon } from "@/components/ui/icon";

interface Export {
  createdAt: number;
}

interface Feedback {
  status: string;
  resolvedAt?: number;
}

// Footer for resolved/exported tickets
interface ResolvedFooterProps {
  feedback: Feedback;
  exports?: Export[] | null;
  onClose: () => void;
}

export function ResolvedFooter({ feedback, exports, onClose }: ResolvedFooterProps) {
  const formatDateTime = (timestamp: number) => {
    try {
      return new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(timestamp));
    } catch {
      return new Date(timestamp).toLocaleString();
    }
  };

  return (
    <div className="z-20 border-t-2 border-retro-black bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Icon name="solar:check-circle-linear" size={16} className="text-stone-500" />
            <span className="text-sm font-medium text-stone-700">
              {feedback.status === "resolved"
                ? "This ticket is resolved"
                : "This ticket has been exported"}
            </span>
          </div>
          <div className="mt-1 text-xs text-stone-500">
            {feedback.status === "resolved"
              ? feedback.resolvedAt
                ? `Resolved ${formatDateTime(feedback.resolvedAt)}`
                : "Resolved"
              : exports && exports.length > 0
                ? `Exported ${formatDateTime(Math.max(...exports.map((e) => e.createdAt)))}`
                : "Exported"}
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded border-2 border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// Footer for backlog view (routing)
interface BacklogFooterProps {
  selectedRoutingDestination: "linear" | "notion" | "prd" | null;
  isRouting: boolean;
  hasLinear: boolean;
  hasNotion: boolean;
  onSelectDestination: (destination: "linear" | "notion" | "prd" | null) => void;
  onRoute: () => void;
  onDownloadPrd: () => void;
}

export function BacklogFooter({
  selectedRoutingDestination,
  isRouting,
  hasLinear,
  hasNotion,
  onSelectDestination,
  onRoute,
  onDownloadPrd,
}: BacklogFooterProps) {
  return (
    <div className="z-20 space-y-3 border-t-2 border-retro-black bg-white p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-stone-400">
          Route this ticket to:
        </span>
      </div>

      {/* Routing destination options */}
      <div className="space-y-2">
        {hasLinear && (
          <button
            onClick={() =>
              onSelectDestination(selectedRoutingDestination === "linear" ? null : "linear")
            }
            className={`flex w-full items-center gap-3 rounded border-2 p-3 text-left transition-all ${
              selectedRoutingDestination === "linear"
                ? "border-purple-400 bg-purple-50"
                : "border-stone-200 bg-white hover:border-stone-300"
            }`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                selectedRoutingDestination === "linear"
                  ? "border-purple-400 bg-purple-100"
                  : "border-stone-300 bg-stone-50"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                className={`h-4 w-4 ${
                  selectedRoutingDestination === "linear" ? "text-purple-600" : "text-stone-500"
                }`}
                fill="currentColor"
              >
                <path d="M21.41 8.64v6.72h-5.76v-3.36h2.88V8.64a1.44 1.44 0 0 0-1.44-1.44H8.64a1.44 1.44 0 0 0-1.44 1.44V12h2.88v3.36H4.32V8.64A4.32 4.32 0 0 1 8.64 4.32h8.45a4.32 4.32 0 0 1 4.32 4.32z" />
                <path d="M17.09 15.36v-3.36H7.2v3.36a1.44 1.44 0 0 0 1.44 1.44h8.45a4.32 4.32 0 0 1-4.32 4.32H4.32a4.32 4.32 0 0 1 4.32-4.32h8.45z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-stone-700">Linear</div>
              <div className="text-xs text-stone-500">Create issue in Linear</div>
            </div>
            {selectedRoutingDestination === "linear" && (
              <Icon name="solar:check-circle-bold" size={20} className="text-purple-600" />
            )}
          </button>
        )}

        {hasNotion && (
          <button
            onClick={() =>
              onSelectDestination(selectedRoutingDestination === "notion" ? null : "notion")
            }
            className={`flex w-full items-center gap-3 rounded border-2 p-3 text-left transition-all ${
              selectedRoutingDestination === "notion"
                ? "border-stone-400 bg-stone-50"
                : "border-stone-200 bg-white hover:border-stone-300"
            }`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                selectedRoutingDestination === "notion"
                  ? "border-stone-500 bg-stone-100"
                  : "border-stone-300 bg-stone-50"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                className={`h-4 w-4 ${
                  selectedRoutingDestination === "notion" ? "text-stone-700" : "text-stone-500"
                }`}
                fill="currentColor"
              >
                <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.98-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.84-.046.933-.56.933-1.167V6.354c0-.606-.233-.933-.746-.886l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.746 0-.933-.234-1.494-.933l-4.577-7.186v6.952l1.448.327s0 .84-1.168.84l-3.22.186c-.094-.187 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.454-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.513.28-.886.747-.933zM2.1 1.408l13.028-.887c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.933.653.933 1.213v15.063c0 .933-.327 1.493-1.494 1.586L5.79 23.086c-.886.047-1.306-.093-1.773-.7L.944 18.107c-.56-.746-.793-1.306-.793-1.96V2.529c0-.653.327-1.214 1.166-1.12z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-stone-700">Notion</div>
              <div className="text-xs text-stone-500">Create page in Notion</div>
            </div>
            {selectedRoutingDestination === "notion" && (
              <Icon name="solar:check-circle-bold" size={20} className="text-stone-600" />
            )}
          </button>
        )}

        <button
          onClick={() =>
            onSelectDestination(selectedRoutingDestination === "prd" ? null : "prd")
          }
          className={`flex w-full items-center gap-3 rounded border-2 p-3 text-left transition-all ${
            selectedRoutingDestination === "prd"
              ? "border-emerald-400 bg-emerald-50"
              : "border-stone-200 bg-white hover:border-stone-300"
          }`}
        >
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
              selectedRoutingDestination === "prd"
                ? "border-emerald-400 bg-emerald-100"
                : "border-stone-300 bg-stone-50"
            }`}
          >
            <Icon
              name="solar:document-text-linear"
              size={16}
              className={selectedRoutingDestination === "prd" ? "text-emerald-600" : "text-stone-500"}
            />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-stone-700">Add to prd.json</div>
            <div className="text-xs text-stone-500">Download as PRD JSON file</div>
          </div>
          {selectedRoutingDestination === "prd" && (
            <Icon name="solar:check-circle-bold" size={20} className="text-emerald-600" />
          )}
        </button>
      </div>

      {/* Action button */}
      {selectedRoutingDestination === "prd" ? (
        <button
          onClick={onDownloadPrd}
          disabled={isRouting}
          className="group flex w-full items-center justify-center gap-2 border-2 border-emerald-600 bg-emerald-600 p-3 text-white shadow-[4px_4px_0px_0px_rgba(5,150,105,0.3)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0"
        >
          {isRouting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span className="font-medium">Downloading...</span>
            </>
          ) : (
            <>
              <Icon name="solar:download-linear" size={18} />
              <span className="font-medium">Download PRD JSON</span>
            </>
          )}
        </button>
      ) : selectedRoutingDestination ? (
        <button
          onClick={onRoute}
          disabled={isRouting}
          className="group flex w-full items-center justify-center gap-2 border-2 border-retro-black bg-retro-black p-3 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:border-retro-blue hover:bg-retro-blue hover:shadow-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0"
        >
          {isRouting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span className="font-medium">Routing...</span>
            </>
          ) : (
            <>
              <Icon name="solar:arrow-right-up-linear" size={18} />
              <span className="font-medium">Route Ticket and Resolve</span>
            </>
          )}
        </button>
      ) : (
        <div className="rounded border-2 border-stone-200 bg-stone-50 p-3 text-center text-xs text-stone-500">
          Select a destination above to route this ticket
        </div>
      )}
    </div>
  );
}

// Footer for inbox view (solution input)
interface InboxFooterProps {
  inputMode: "write" | "chat";
  messageInput: string;
  isAiThinking: boolean;
  aiConfig?: { isConfigured: boolean } | null;
  selectedModel: string | null;
  availableModels: Array<{ id: string; name: string; provider: string }>;
  apiKeyStatus?: {
    hasOpenAI: boolean;
    openAIValid: boolean;
    hasAnthropic: boolean;
    anthropicValid: boolean;
  } | null;
  conversationHistory?: any[] | null;
  onInputModeChange: (mode: "write" | "chat") => void;
  onMessageChange: (message: string) => void;
  onModelChange: (model: string) => void;
  onSendMessage: () => void;
  onDraftTicket: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

const OPENAI_MODELS = [
  { id: "gpt-4o", name: "GPT-4o" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini" },
  { id: "gpt-4-turbo", name: "GPT-4 Turbo" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
];

const ANTHROPIC_MODELS = [
  { id: "claude-opus-4-20250514", name: "Claude Opus 4" },
  { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4" },
  { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet" },
  { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku" },
  { id: "claude-3-opus-20240229", name: "Claude 3 Opus" },
];

export function InboxFooter({
  inputMode,
  messageInput,
  isAiThinking,
  aiConfig,
  selectedModel,
  availableModels,
  apiKeyStatus,
  conversationHistory,
  onInputModeChange,
  onMessageChange,
  onModelChange,
  onSendMessage,
  onDraftTicket,
  onKeyDown,
}: InboxFooterProps) {
  return (
    <div className="z-20 space-y-3 border-t-2 border-retro-black bg-white p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
      {/* Mode Toggle */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-stone-400">
          How should we fix this?
        </span>
        <div className="ml-auto flex rounded border-2 border-stone-200 bg-stone-50">
          <button
            onClick={() => onInputModeChange("write")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
              inputMode === "write"
                ? "bg-retro-black text-white"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            <Icon name="solar:pen-linear" size={14} />
            Write
          </button>
          <button
            onClick={() => aiConfig?.isConfigured && onInputModeChange("chat")}
            disabled={!aiConfig?.isConfigured}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
              inputMode === "chat"
                ? "bg-retro-blue text-white"
                : "text-stone-600 hover:bg-stone-100"
            } disabled:cursor-not-allowed disabled:opacity-50`}
            title={!aiConfig?.isConfigured ? "Configure AI in Settings first" : ""}
          >
            <Icon name="solar:chat-round-dots-linear" size={14} />
            Chat with AI
          </button>
        </div>
      </div>

      {/* Model Selector - Only show in chat mode */}
      {inputMode === "chat" && aiConfig?.isConfigured && availableModels.length > 0 && (
        <div className="flex items-center gap-2">
          <Icon name="solar:cpu-linear" size={14} className="text-stone-400" />
          <span className="text-xs font-medium text-stone-600">Model:</span>
          <select
            value={selectedModel || aiConfig.preferredModel || ""}
            onChange={(e) => onModelChange(e.target.value)}
            className="flex-1 rounded border-2 border-stone-200 bg-white px-2 py-1.5 text-xs font-medium text-stone-700 outline-none transition-colors hover:border-stone-300 focus:border-retro-blue"
          >
            {/* Group by provider if multiple providers available */}
            {apiKeyStatus?.hasOpenAI && apiKeyStatus?.openAIValid && (
              <optgroup label="OpenAI">
                {OPENAI_MODELS.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </optgroup>
            )}
            {apiKeyStatus?.hasAnthropic && apiKeyStatus?.anthropicValid && (
              <optgroup label="Anthropic">
                {ANTHROPIC_MODELS.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
      )}

      {/* Input Area */}
      <div className="relative">
        <textarea
          placeholder={
            inputMode === "write"
              ? "Describe the solution and how to implement it..."
              : "Ask AI about the issue or discuss the solution..."
          }
          value={messageInput}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyDown={onKeyDown}
          rows={4}
          className="w-full resize-none rounded border-2 border-stone-200 bg-stone-50 p-3 text-sm outline-none transition-colors focus:border-retro-blue"
        />
        {inputMode === "chat" && (
          <button
            onClick={onSendMessage}
            disabled={!messageInput.trim() || isAiThinking}
            className="absolute bottom-3 right-2 rounded border-2 border-retro-blue bg-retro-blue p-2 text-white transition-all hover:translate-x-[1px] hover:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-50"
            title="Send message (Enter)"
          >
            <Icon name="solar:arrow-right-linear" size={16} />
          </button>
        )}
      </div>

      {/* Draft Ticket Button */}
      <button
        onClick={onDraftTicket}
        disabled={
          !messageInput.trim() && (!conversationHistory || conversationHistory.length === 0)
        }
        className="group flex w-full items-center justify-center gap-2 border-2 border-retro-black bg-retro-black p-3 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:border-retro-blue hover:bg-retro-blue hover:shadow-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0"
        title="Generate a ticket from the solution"
      >
        <Icon name="solar:document-text-linear" size={18} />
        <span className="font-medium">Draft Ticket</span>
      </button>
    </div>
  );
}
