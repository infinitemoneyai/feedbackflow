// @vitest-environment edge-runtime
/// <reference types="vite/client" />
/**
 * Automation-rule exports run with NO user session: the internal
 * runAutomation action reads integration config via an internal query and
 * calls the lib adapters directly (issue #49 — the old self-HTTP hop died
 * on the integration routes' Clerk auth).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { convexTest } from "convex-test";
import { api, internal } from "@/convex/_generated/api";
import schema from "@/convex/schema";

const createLinearIssueMock = vi.fn();

vi.mock("@/lib/integrations/linear", () => ({
  createLinearIssue: (...args: unknown[]) => createLinearIssueMock(...args),
  formatFeedbackForLinear: () => "formatted description",
  mapPriorityToLinear: () => 2,
}));

vi.mock("@/lib/integrations/notion", () => ({
  createNotionPage: vi.fn(),
}));

const modules = import.meta.glob("../../convex/**/*.ts");

async function seed(
  t: ReturnType<typeof convexTest>,
  opts: { withIntegration?: boolean } = {}
) {
  const { withIntegration = true } = opts;
  return t.run(async (ctx) => {
    const now = Date.now();
    const ownerId = await ctx.db.insert("users", {
      clerkId: "clerk_owner",
      email: "owner@example.com",
      createdAt: now,
    });
    const teamId = await ctx.db.insert("teams", {
      name: "Team",
      slug: "team",
      ownerId,
      createdAt: now,
    });
    const projectId = await ctx.db.insert("projects", {
      teamId,
      name: "Project",
      code: "PRJ",
      settings: {
        defaultPriority: "medium",
        autoTriage: true,
        notifyOnNew: true,
      },
      createdAt: now,
    });
    const feedbackId = await ctx.db.insert("feedback", {
      projectId,
      teamId,
      type: "bug",
      title: "Broken thing",
      status: "new",
      priority: "high",
      tags: [],
      metadata: { timestamp: now },
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("automationRules", {
      projectId,
      name: "Export bugs to Linear",
      isEnabled: true,
      trigger: "new_feedback",
      conditions: [],
      action: "export_linear",
      createdAt: now,
      updatedAt: now,
    });
    if (withIntegration) {
      await ctx.db.insert("integrations", {
        teamId,
        provider: "linear",
        accessToken: `encrypted:${btoa("lin_api_key")}`,
        settings: { linearTeamId: "LIN-TEAM-1" },
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }
    return { feedbackId };
  });
}

async function automationLogEntries(t: ReturnType<typeof convexTest>) {
  return t.run(async (ctx) => {
    const entries = await ctx.db.query("activityLog").collect();
    return entries
      .filter((entry) => entry.action === "automation_executed")
      .map((entry) => entry.details?.extra ?? "");
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  createLinearIssueMock.mockResolvedValue({
    id: "lin_1",
    identifier: "ENG-42",
    title: "Broken thing",
    url: "https://linear.app/team/issue/ENG-42",
  });
});

describe("automation export without a user session (#49)", () => {
  it("creates the Linear issue via the adapter and logs success", async () => {
    const t = convexTest(schema, modules);
    const { feedbackId } = await seed(t);

    const result = await t.action(internal.sideEffects.runAutomation, {
      feedbackId,
      trigger: "new_feedback",
    });

    expect(result.executed).toBe(1);
    expect(createLinearIssueMock).toHaveBeenCalledWith(
      "lin_api_key", // decrypted from the stored integration
      expect.objectContaining({
        teamId: "LIN-TEAM-1",
        title: "Broken thing",
        description: "formatted description",
        priority: 2,
      })
    );

    const logs = await automationLogEntries(t);
    expect(logs.some((l) => l.includes("success") && l.includes("ENG-42"))).toBe(
      true
    );
  });

  it("logs a failed execution when the integration is not configured", async () => {
    const t = convexTest(schema, modules);
    const { feedbackId } = await seed(t, { withIntegration: false });

    const result = await t.action(internal.sideEffects.runAutomation, {
      feedbackId,
      trigger: "new_feedback",
    });

    expect(result.executed).toBe(0);
    expect(createLinearIssueMock).not.toHaveBeenCalled();

    const logs = await automationLogEntries(t);
    expect(
      logs.some(
        (l) => l.includes("failed") && l.includes("not configured")
      )
    ).toBe(true);
  });
});
