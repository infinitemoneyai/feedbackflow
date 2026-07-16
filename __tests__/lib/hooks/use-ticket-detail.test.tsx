/**
 * Tests for the ticket-detail data seam at its interface: query wiring with
 * "skip" gating, integration flags, the available-models merge glue, and
 * preferred-model seeding.
 * @see lib/hooks/use-ticket-detail.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { getFunctionName } from "convex/server";
import type { FunctionReference } from "convex/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const mocks = vi.hoisted(() => ({
  // Keyed by getFunctionName(query); values must stay referentially stable —
  // real Convex results are, and the hook's memo/effect wiring relies on it.
  queryResults: {} as Record<string, unknown>,
  actionFns: {} as Record<string, ReturnType<typeof vi.fn>>,
  // Controlled provider lists for the mocked useAvailableModels
  openaiModels: [] as Array<{ id: string; name: string }>,
  anthropicModels: [] as Array<{ id: string; name: string }>,
  availableModelsCalls: [] as Array<{ provider: string; enabled: boolean }>,
}));

vi.mock("convex/react", async () => {
  const { getFunctionName: fnName } = await import("convex/server");
  const stableFn = (ref: unknown) => {
    const name = fnName(ref as FunctionReference<"mutation">);
    return (mocks.actionFns[name] ??= vi.fn(async () => null));
  };
  return {
    useQuery: (query: unknown, args: unknown) =>
      args === "skip"
        ? undefined
        : mocks.queryResults[fnName(query as FunctionReference<"query">)],
    useMutation: stableFn,
    useAction: stableFn,
  };
});

vi.mock("@/lib/use-available-models", () => ({
  useAvailableModels: (
    _teamId: unknown,
    provider: "openai" | "anthropic",
    enabled: boolean
  ) => {
    mocks.availableModelsCalls.push({ provider, enabled });
    return provider === "openai" ? mocks.openaiModels : mocks.anthropicModels;
  },
}));

import { useTicketDetail } from "@/lib/hooks/use-ticket-detail";

const key = (ref: unknown) =>
  getFunctionName(ref as FunctionReference<"query">);

const feedbackId = "fb_1" as Id<"feedback">;

// Stable fixtures (module scope, never recreated between renders)
const feedbackFixture = {
  _id: feedbackId,
  projectId: "proj_1" as Id<"projects">,
  teamId: "team_1" as Id<"teams">,
  title: "Login button is broken",
  description: "Clicking login does nothing",
  type: "bug",
  status: "new",
  priority: "high",
  metadata: { timestamp: 1700000000000 },
  createdAt: 1700000000000,
};
const projectFixture = { _id: "proj_1", teamId: "team_1", name: "Acme", code: "ACM" };
const conversationFixture = [
  { _id: "msg_1", role: "user", content: "Any ideas?", createdAt: 1700000001000 },
];
const aiConfigFixture = {
  hasOpenAI: true,
  hasAnthropic: true,
  preferredProvider: "anthropic",
  preferredModel: "claude-sonnet",
  isConfigured: true,
};
const bothProvidersValid = {
  hasOpenAI: true,
  openAIValid: true,
  hasAnthropic: true,
  anthropicValid: true,
};
const exportsFixture = [{ _id: "exp_1", provider: "linear", status: "success", createdAt: 1 }];
const ticketDraftFixture = { title: "Fix login", description: "…" };
const suggestionsFixture = { summary: "Loose wire", nextSteps: ["solder it"] };

function seedQueries(overrides: Record<string, unknown> = {}) {
  mocks.queryResults = {
    [key(api.feedback.getFeedback)]: feedbackFixture,
    [key(api.projects.getProject)]: projectFixture,
    [key(api.ai.getConversationHistory)]: conversationFixture,
    [key(api.ai.getTeamAiConfig)]: aiConfigFixture,
    [key(api.apiKeys.getAiConfig)]: bothProvidersValid,
    [key(api.integrations.getLinearIntegration)]: { hasApiKey: true, isActive: true, settings: {} },
    [key(api.integrations.getNotionIntegration)]: { hasApiKey: true, isActive: false, settings: {} },
    [key(api.integrations.getExportsByFeedback)]: exportsFixture,
    [key(api.ai.getTicketDraft)]: ticketDraftFixture,
    [key(api.ai.getSolutionSuggestions)]: suggestionsFixture,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.availableModelsCalls.length = 0;
  mocks.openaiModels = [
    { id: "gpt-4o", name: "GPT-4o" },
    { id: "gpt-4o-mini", name: "GPT-4o Mini" },
  ];
  mocks.anthropicModels = [{ id: "claude-sonnet", name: "Claude Sonnet" }];
  seedQueries();
});

describe("useTicketDetail", () => {
  it("skips everything when no feedback is selected", () => {
    const { result } = renderHook(() => useTicketDetail(null));

    expect(result.current.feedback).toBeUndefined();
    expect(result.current.project).toBeUndefined();
    expect(result.current.conversationHistory).toBeUndefined();
    expect(result.current.exports).toBeUndefined();
    expect(result.current.aiConfig).toBeUndefined();
    expect(result.current.hasLinear).toBe(false);
    expect(result.current.hasNotion).toBe(false);
    expect(result.current.availableModels).toEqual([]);
    expect(result.current.selectedModel).toBeNull();
  });

  it("exposes the expected shape: data, flags, models, and actions", () => {
    const { result } = renderHook(() => useTicketDetail(feedbackId));

    // Data passes through with stable references
    expect(result.current.feedback).toBe(feedbackFixture);
    expect(result.current.project).toBe(projectFixture);
    expect(result.current.conversationHistory).toBe(conversationFixture);
    expect(result.current.ticketDraft).toBe(ticketDraftFixture);
    expect(result.current.solutionSuggestions).toBe(suggestionsFixture);
    expect(result.current.exports).toBe(exportsFixture);
    expect(result.current.aiConfig).toBe(aiConfigFixture);
    expect(result.current.apiKeyStatus).toBe(bothProvidersValid);

    // Availability flags fold hasApiKey + isActive
    expect(result.current.hasLinear).toBe(true);
    expect(result.current.hasNotion).toBe(false); // isActive: false

    // Actions are the (stable) convex functions
    expect(result.current.sendConversationMessage).toBeTypeOf("function");
    expect(result.current.updateFeedbackStatus).toBeTypeOf("function");
    expect(result.current.deleteFeedback).toBeTypeOf("function");
    expect(result.current.createExport).toBeTypeOf("function");
    expect(result.current.sendConversationMessage).not.toBe(
      result.current.updateFeedbackStatus
    );
  });

  it("merges both providers' models with provider labels when both keys are valid", () => {
    const { result } = renderHook(() => useTicketDetail(feedbackId));

    expect(result.current.availableModels).toEqual([
      { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI" },
      { id: "claude-sonnet", name: "Claude Sonnet", provider: "Anthropic" },
    ]);
  });

  it("excludes a provider whose key is missing or invalid, and disables its fetch", () => {
    seedQueries({
      [key(api.apiKeys.getAiConfig)]: {
        hasOpenAI: true,
        openAIValid: true,
        hasAnthropic: true,
        anthropicValid: false,
      },
    });
    const { result } = renderHook(() => useTicketDetail(feedbackId));

    expect(result.current.availableModels).toEqual([
      { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI" },
    ]);
    // The invalid provider's live fetch stays disabled
    const anthropicCall = mocks.availableModelsCalls.find(
      (c) => c.provider === "anthropic"
    );
    expect(anthropicCall?.enabled).toBe(false);
  });

  it("keeps availableModels referentially stable across rerenders", () => {
    const { result, rerender } = renderHook(() => useTicketDetail(feedbackId));
    const first = result.current.availableModels;
    rerender();
    expect(result.current.availableModels).toBe(first);
  });

  it("seeds selectedModel from the saved preference when it is in the live list", async () => {
    const { result } = renderHook(() => useTicketDetail(feedbackId));
    await waitFor(() =>
      expect(result.current.selectedModel).toBe("claude-sonnet")
    );
  });

  it("falls back to the first available model when the saved one is gone", async () => {
    seedQueries({
      [key(api.ai.getTeamAiConfig)]: {
        ...aiConfigFixture,
        preferredModel: "model-that-no-longer-exists",
      },
    });
    const { result } = renderHook(() => useTicketDetail(feedbackId));
    await waitFor(() => expect(result.current.selectedModel).toBe("gpt-4o"));
  });

  it("resets an externally-set model that is not in the live list", async () => {
    const { result } = renderHook(() => useTicketDetail(feedbackId));
    await waitFor(() => expect(result.current.selectedModel).not.toBeNull());

    act(() => result.current.setSelectedModel("bogus-model"));
    await waitFor(() => expect(result.current.selectedModel).toBe("gpt-4o"));
  });
});
