/**
 * Tests for the bulk-export engine at its interface: per-item status flow,
 * exact request assembly, and the loop surviving individual item failures.
 * @see lib/hooks/use-bulk-export.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import type { Id } from "@/convex/_generated/dataModel";

const { createExport, updateFeedbackStatus, downloadJsonMock } = vi.hoisted(() => ({
  createExport: vi.fn(),
  updateFeedbackStatus: vi.fn(),
  downloadJsonMock: vi.fn(),
}));

vi.mock("@/convex/_generated/api", () => ({
  api: {
    integrations: { createExport: "integrations:createExport" },
    feedback: { updateFeedbackStatus: "feedback:updateFeedbackStatus" },
  },
}));

vi.mock("convex/react", () => ({
  useMutation: (ref: string) =>
    ref === "integrations:createExport" ? createExport : updateFeedbackStatus,
}));

vi.mock("@/lib/exports/json", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/exports/json")>();
  return { ...actual, downloadJson: downloadJsonMock };
});

import { useBulkExport, type BulkExportItem } from "@/lib/hooks/use-bulk-export";

const project = {
  teamId: "team1" as Id<"teams">,
  name: "My Proj",
  description: "A test project",
};

const linearIntegration = { settings: { linearTeamId: "lt1" } };
const notionIntegration = { settings: { notionDatabaseId: "db1" } };

function makeItem(n: number): BulkExportItem {
  return {
    _id: `fb${n}` as Id<"feedback">,
    type: "bug",
    title: `Bug ${n}`,
    description: "It breaks",
    priority: "high",
    status: "drafted",
    tags: ["widget"],
    submitterName: "Sam",
    submitterEmail: "sam@example.com",
    createdAt: 1000 + n,
    metadata: { url: "https://app.example.com" },
  };
}

function linearIssue(n: number) {
  return {
    id: `iss${n}`,
    url: `https://linear.app/iss${n}`,
    identifier: `ENG-${n}`,
    title: `Bug ${n}`,
  };
}

const expectedFeedbackPayload = (n: number) => ({
  title: `Bug ${n}`,
  description: "It breaks",
  type: "bug",
  priority: "high",
  metadata: { url: "https://app.example.com" },
  submitterName: "Sam",
  submitterEmail: "sam@example.com",
  tags: ["widget"],
});

const fetchMock = vi.fn();

function renderBulkExport(
  overrides: Partial<Parameters<typeof useBulkExport>[0]> = {}
) {
  const onExportComplete = vi.fn();
  const rendered = renderHook(() =>
    useBulkExport({
      project,
      linearIntegration,
      notionIntegration,
      onExportComplete,
      resultResetMs: 10_000,
      ...overrides,
    })
  );
  return { ...rendered, onExportComplete };
}

beforeEach(() => {
  createExport.mockResolvedValue(null);
  updateFeedbackStatus.mockResolvedValue(null);
  vi.stubGlobal("fetch", fetchMock);
});

describe("useBulkExport — linear", () => {
  it("walks items pending → exporting → success and reports the result", async () => {
    const deferred: Array<(value: unknown) => void> = [];
    fetchMock.mockImplementation(
      () => new Promise((resolve) => deferred.push(resolve))
    );

    const { result, onExportComplete } = renderBulkExport();

    let exportPromise: Promise<void>;
    act(() => {
      exportPromise = result.current.startExport("linear", [makeItem(1), makeItem(2)]);
    });

    // First item in flight, second still queued
    await waitFor(() =>
      expect(result.current.itemStatuses).toEqual({
        fb1: "exporting",
        fb2: "pending",
      })
    );
    expect(result.current.isExporting).toBe(true);

    await act(async () => {
      deferred[0]({ json: async () => ({ issue: linearIssue(1) }) });
    });
    await waitFor(() => expect(deferred.length).toBe(2));
    await act(async () => {
      deferred[1]({ json: async () => ({ issue: linearIssue(2) }) });
      await exportPromise;
    });

    // Exact request assembly preserved
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [endpoint, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(endpoint).toBe("/api/integrations/linear");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(init.body as string)).toEqual({
      action: "createIssue",
      apiKey: "stored",
      teamId: "team1",
      feedback: expectedFeedbackPayload(1),
      linearTeamId: "lt1",
    });

    // Export records with interpreted response fields
    expect(createExport).toHaveBeenCalledTimes(2);
    expect(createExport).toHaveBeenCalledWith({
      feedbackId: "fb1",
      provider: "linear",
      externalId: "iss1",
      externalUrl: "https://linear.app/iss1",
      exportedData: { identifier: "ENG-1", title: "Bug 1" },
      status: "success",
    });

    // Status transition to "exported" for each item
    expect(updateFeedbackStatus).toHaveBeenCalledTimes(2);
    expect(updateFeedbackStatus).toHaveBeenCalledWith({
      feedbackId: "fb1",
      status: "exported",
    });
    expect(updateFeedbackStatus).toHaveBeenCalledWith({
      feedbackId: "fb2",
      status: "exported",
    });

    expect(result.current.itemStatuses).toEqual({
      fb1: "success",
      fb2: "success",
    });
    expect(result.current.isExporting).toBe(false);
    expect(result.current.result).toEqual({
      success: true,
      count: 2,
      provider: "linear",
      error: undefined,
    });
    expect(onExportComplete).toHaveBeenCalledTimes(1);
  });

  it("a failed item does not abort the loop (partial failure)", async () => {
    fetchMock.mockImplementation(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(init.body as string);
      if (body.feedback.title === "Bug 2") {
        throw new Error("network down");
      }
      const n = body.feedback.title === "Bug 1" ? 1 : 3;
      return { json: async () => ({ issue: linearIssue(n) }) };
    });

    const { result, onExportComplete } = renderBulkExport();

    await act(async () => {
      await result.current.startExport("linear", [
        makeItem(1),
        makeItem(2),
        makeItem(3),
      ]);
    });

    // All three attempted despite item 2 throwing
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result.current.itemStatuses).toEqual({
      fb1: "success",
      fb2: "error",
      fb3: "success",
    });

    expect(createExport).toHaveBeenCalledTimes(2);

    // Current behavior: after a partial success, ALL selected items are
    // moved to "exported" — including the failed one.
    expect(updateFeedbackStatus).toHaveBeenCalledTimes(3);
    expect(updateFeedbackStatus).toHaveBeenCalledWith({
      feedbackId: "fb2",
      status: "exported",
    });

    expect(result.current.result).toEqual({
      success: true,
      count: 2,
      provider: "linear",
      error: "1 failed",
    });
    expect(onExportComplete).toHaveBeenCalledTimes(1);
  });

  it("reports failure with joined errors when every item fails", async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({ error: "boom" }),
    });

    const { result, onExportComplete } = renderBulkExport();

    await act(async () => {
      await result.current.startExport("linear", [makeItem(1), makeItem(2)]);
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current.itemStatuses).toEqual({
      fb1: "error",
      fb2: "error",
    });
    expect(createExport).not.toHaveBeenCalled();
    expect(updateFeedbackStatus).not.toHaveBeenCalled();
    expect(result.current.result).toEqual({
      success: false,
      count: 0,
      error: "Bug 1: boom; Bug 2: boom",
    });
    expect(onExportComplete).not.toHaveBeenCalled();
  });

  it("fails fast when the integration is not configured", async () => {
    const { result, onExportComplete } = renderBulkExport({
      linearIntegration: null,
    });

    await act(async () => {
      await result.current.startExport("linear", [makeItem(1)]);
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.result).toEqual({
      success: false,
      count: 0,
      error:
        "Linear integration not properly configured. Please configure it in Settings.",
    });
    expect(onExportComplete).not.toHaveBeenCalled();
  });

  it("auto-clears the result after the reset delay", async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({ issue: linearIssue(1) }),
    });

    const { result } = renderBulkExport({ resultResetMs: 20 });

    await act(async () => {
      await result.current.startExport("linear", [makeItem(1)]);
    });
    expect(result.current.result).not.toBeNull();

    await waitFor(() => expect(result.current.result).toBeNull());
  });
});

describe("useBulkExport — notion", () => {
  it("assembles createPage requests and interprets the page response", async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({
        page: { id: "pg1", url: "https://notion.so/pg1", title: "Bug 1" },
      }),
    });

    const { result } = renderBulkExport();

    await act(async () => {
      await result.current.startExport("notion", [makeItem(1)]);
    });

    const [endpoint, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(endpoint).toBe("/api/integrations/notion");
    expect(JSON.parse(init.body as string)).toEqual({
      action: "createPage",
      apiKey: "stored",
      teamId: "team1",
      feedback: expectedFeedbackPayload(1),
      databaseId: "db1",
    });

    expect(createExport).toHaveBeenCalledWith({
      feedbackId: "fb1",
      provider: "notion",
      externalId: "pg1",
      externalUrl: "https://notion.so/pg1",
      exportedData: { title: "Bug 1" },
      status: "success",
    });
    expect(result.current.result).toEqual({
      success: true,
      count: 1,
      provider: "notion",
      error: undefined,
    });
  });
});

describe("useBulkExport — json", () => {
  it("downloads the PRD, records exports, and resolves each item", async () => {
    const { result, onExportComplete } = renderBulkExport();

    await act(async () => {
      await result.current.startExport("json", [makeItem(1), makeItem(2)]);
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(downloadJsonMock).toHaveBeenCalledTimes(1);
    expect(downloadJsonMock).toHaveBeenCalledWith(
      expect.any(String),
      "my-proj-feedback-export.json"
    );

    expect(createExport).toHaveBeenCalledTimes(2);
    expect(createExport).toHaveBeenCalledWith({
      feedbackId: "fb1",
      provider: "json",
      exportedData: { bulkExport: true, projectName: "My Proj" },
      status: "success",
    });

    // JSON exports move items to "resolved" (not "exported")
    expect(updateFeedbackStatus).toHaveBeenCalledTimes(2);
    expect(updateFeedbackStatus).toHaveBeenCalledWith({
      feedbackId: "fb1",
      status: "resolved",
    });

    expect(result.current.itemStatuses).toEqual({
      fb1: "success",
      fb2: "success",
    });
    expect(result.current.result).toEqual({
      success: true,
      count: 2,
      provider: "json",
    });
    expect(onExportComplete).toHaveBeenCalledTimes(1);
  });
});
