// @vitest-environment edge-runtime
/// <reference types="vite/client" />
/**
 * Atomic plan-cap enforcement in feedback.submitFromWidget: the cap check
 * and the usage increment share one usage-row read in one transaction, so
 * submissions past the Free-plan cap reject without incrementing.
 */

import { describe, it, expect } from "vitest";
import { convexTest, type TestConvex } from "convex-test";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import schema from "@/convex/schema";
import { FREE_PLAN_FEEDBACK_LIMIT } from "@/convex/billing";

const modules = import.meta.glob("../../convex/**/*.ts");

const WIDGET_KEY = "wk_submit_test";

async function seed(
  t: TestConvex<typeof schema>,
  opts: {
    plan?: "free" | "pro";
    feedbackCount?: number;
    widgetActive?: boolean;
  } = {}
) {
  const { plan = "free", feedbackCount = 0, widgetActive = true } = opts;
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
    await ctx.db.insert("subscriptions", {
      teamId,
      stripeCustomerId: "",
      plan,
      seats: 1,
      status: "active",
      cancelAtPeriodEnd: false,
      createdAt: now,
      updatedAt: now,
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
    const widgetId = await ctx.db.insert("widgets", {
      projectId,
      widgetKey: WIDGET_KEY,
      isActive: widgetActive,
      createdAt: now,
    });
    if (feedbackCount > 0) {
      const date = new Date();
      await ctx.db.insert("usageTracking", {
        teamId,
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        feedbackCount,
        aiCallCount: 0,
        storageUsedBytes: 0,
        createdAt: now,
        updatedAt: now,
      });
    }
    return { teamId, projectId, widgetId };
  });
}

function submission() {
  return {
    widgetKey: WIDGET_KEY,
    type: "bug" as const,
    title: "Broken thing",
    metadata: { timestamp: Date.now() },
  };
}

async function usageCount(
  t: TestConvex<typeof schema>,
  teamId: Id<"teams">
): Promise<number> {
  return t.run(async (ctx) => {
    const usage = await ctx.db
      .query("usageTracking")
      .withIndex("by_team", (q) => q.eq("teamId", teamId))
      .first();
    return usage?.feedbackCount ?? 0;
  });
}

describe("submitFromWidget atomic usage enforcement", () => {
  it("accepts a submission under the cap and increments usage", async () => {
    const t = convexTest(schema, modules);
    const { teamId } = await seed(t);

    const result = await t.mutation(api.feedback.submitFromWidget, submission());

    expect(result.feedbackId).toBeDefined();
    expect(result.feedbackRef).toBe("FF-0001");
    expect(await usageCount(t, teamId)).toBe(1);
  });

  it("rejects at the cap WITHOUT incrementing usage", async () => {
    const t = convexTest(schema, modules);
    const { teamId } = await seed(t, {
      feedbackCount: FREE_PLAN_FEEDBACK_LIMIT,
    });

    await expect(
      t.mutation(api.feedback.submitFromWidget, submission())
    ).rejects.toThrow("Usage limit exceeded");
    expect(await usageCount(t, teamId)).toBe(FREE_PLAN_FEEDBACK_LIMIT);
    const feedbackRows = await t.run(async (ctx) =>
      (await ctx.db.query("feedback").collect()).length
    );
    expect(feedbackRows).toBe(0);
  });

  it("admits exactly one submission at the boundary", async () => {
    const t = convexTest(schema, modules);
    const { teamId } = await seed(t, {
      feedbackCount: FREE_PLAN_FEEDBACK_LIMIT - 1,
    });

    await t.mutation(api.feedback.submitFromWidget, submission());
    expect(await usageCount(t, teamId)).toBe(FREE_PLAN_FEEDBACK_LIMIT);

    await expect(
      t.mutation(api.feedback.submitFromWidget, submission())
    ).rejects.toThrow("Usage limit exceeded");
    expect(await usageCount(t, teamId)).toBe(FREE_PLAN_FEEDBACK_LIMIT);
  });

  it("pro plan submits past the free cap", async () => {
    const t = convexTest(schema, modules);
    const { teamId } = await seed(t, {
      plan: "pro",
      feedbackCount: FREE_PLAN_FEEDBACK_LIMIT + 10,
    });

    await t.mutation(api.feedback.submitFromWidget, submission());
    expect(await usageCount(t, teamId)).toBe(FREE_PLAN_FEEDBACK_LIMIT + 11);
  });

  it("rejects an inactive widget with unchanged wire message", async () => {
    const t = convexTest(schema, modules);
    await seed(t, { widgetActive: false });

    await expect(
      t.mutation(api.feedback.submitFromWidget, submission())
    ).rejects.toThrow("Widget is not active");
  });

  it("rejects an unknown widget key with unchanged wire message", async () => {
    const t = convexTest(schema, modules);
    await seed(t);

    await expect(
      t.mutation(api.feedback.submitFromWidget, {
        ...submission(),
        widgetKey: "wk_nope",
      })
    ).rejects.toThrow("Invalid widget key");
  });
});

describe("canAcceptSubmission advisory gate", () => {
  it("reports ok with allowance and ids for a healthy widget", async () => {
    const t = convexTest(schema, modules);
    const { projectId, teamId } = await seed(t);

    const gate = await t.query(api.feedback.canAcceptSubmission, {
      widgetKey: WIDGET_KEY,
    });

    expect(gate.status).toBe("ok");
    if (gate.status === "ok" || gate.status === "limit_exceeded") {
      expect(gate.projectId).toBe(projectId);
      expect(gate.teamId).toBe(teamId);
      expect(gate.allowance.allowed).toBe(true);
    }
  });

  it("reports invalid_key / inactive / limit_exceeded", async () => {
    const t = convexTest(schema, modules);
    await seed(t, { feedbackCount: FREE_PLAN_FEEDBACK_LIMIT });

    expect(
      (await t.query(api.feedback.canAcceptSubmission, { widgetKey: "wk_no" }))
        .status
    ).toBe("invalid_key");
    expect(
      (
        await t.query(api.feedback.canAcceptSubmission, {
          widgetKey: WIDGET_KEY,
        })
      ).status
    ).toBe("limit_exceeded");
  });
});
