/**
 * Smoke test: the panel is pure presentation over the useTicketDetail seam.
 * With the hook mocked to a fixture, the main states render — loaded ticket
 * (title visible), loading, and not-found.
 * @see components/dashboard/ticket-detail-panel.tsx
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Id } from "@/convex/_generated/dataModel";

const mocks = vi.hoisted(() => ({
  dashboard: {} as Record<string, unknown>,
  ticketDetail: {} as Record<string, unknown>,
}));

vi.mock("@/lib/hooks/use-ticket-detail", () => ({
  useTicketDetail: () => mocks.ticketDetail,
}));

vi.mock("@/components/dashboard/dashboard-layout", () => ({
  useDashboard: () => mocks.dashboard,
}));

// DraftTicketModal wires its own convex/react hooks (out of scope here, and
// there is no ConvexProvider in the test tree) — stub it out.
vi.mock("@/components/dashboard/draft-ticket-modal", () => ({
  DraftTicketModal: () => null,
}));

import { TicketDetailPanel } from "@/components/dashboard/ticket-detail-panel";

const feedbackId = "fb_smoke_1" as Id<"feedback">;

// Referentially stable, like real Convex results
const feedbackFixture = {
  _id: feedbackId,
  projectId: "proj_1",
  teamId: "team_1",
  title: "Login button is broken",
  description: "Clicking login does nothing on Safari.",
  type: "bug",
  status: "new",
  priority: "high",
  tags: ["auth"],
  metadata: { browser: "Safari", os: "macOS", timestamp: 1700000000000 },
  submitterName: "Ada",
  submitterEmail: "ada@example.com",
  createdAt: 1700000000000,
  ticketNumber: 12,
};

function seamFixture(overrides: Record<string, unknown> = {}) {
  return {
    feedback: feedbackFixture,
    project: { _id: "proj_1", teamId: "team_1", name: "Acme", code: "ACM" },
    conversationHistory: [],
    ticketDraft: null,
    solutionSuggestions: null,
    exports: [],
    aiConfig: {
      hasOpenAI: true,
      hasAnthropic: false,
      preferredProvider: "openai",
      preferredModel: "gpt-4o",
      isConfigured: true,
    },
    apiKeyStatus: {
      hasOpenAI: true,
      openAIValid: true,
      hasAnthropic: false,
      anthropicValid: false,
    },
    linearIntegration: null,
    notionIntegration: null,
    hasLinear: false,
    hasNotion: false,
    availableModels: [{ id: "gpt-4o", name: "GPT-4o", provider: "OpenAI" }],
    selectedModel: "gpt-4o",
    setSelectedModel: vi.fn(),
    sendConversationMessage: vi.fn(async () => ({ success: true })),
    updateFeedbackStatus: vi.fn(async () => null),
    deleteFeedback: vi.fn(async () => null),
    createExport: vi.fn(async () => null),
    ...overrides,
  };
}

beforeEach(() => {
  mocks.dashboard = {
    selectedFeedbackId: feedbackId,
    setSelectedFeedbackId: vi.fn(),
    currentView: "inbox",
  };
  mocks.ticketDetail = seamFixture();
});

describe("TicketDetailPanel", () => {
  it("renders the loaded ticket with its title visible", () => {
    render(<TicketDetailPanel />);

    expect(screen.getByText("Login button is broken")).toBeTruthy();
    expect(
      screen.getByText("Clicking login does nothing on Safari.")
    ).toBeTruthy();
    // Header shows the project-code ticket number
    expect(screen.getByText("#ACM-12")).toBeTruthy();
  });

  it("renders the loading state while feedback is undefined", () => {
    mocks.ticketDetail = seamFixture({ feedback: undefined, project: undefined });

    render(<TicketDetailPanel />);

    expect(screen.getByText("Loading feedback...")).toBeTruthy();
    expect(screen.queryByText("Login button is broken")).toBeNull();
  });

  it("renders the not-found state when feedback is null", () => {
    mocks.ticketDetail = seamFixture({ feedback: null });

    render(<TicketDetailPanel />);

    expect(screen.getByText("Feedback not found")).toBeTruthy();
  });
});
