// @vitest-environment edge-runtime
/// <reference types="vite/client" />
/**
 * Display Mode round-trips through the backend: an owner's save is what
 * installed widgets receive from the public config query (ADR-0001).
 */

import { describe, it, expect } from "vitest";
import { convexTest } from "convex-test";
import { api } from "@/convex/_generated/api";
import schema from "@/convex/schema";

const modules = import.meta.glob("../../convex/**/*.ts");

const OWNER = { subject: "clerk_owner", issuer: "test" };
const WIDGET_KEY = "wk_mode_test";

async function seed(t: ReturnType<typeof convexTest>) {
  return t.run(async (ctx) => {
    const now = Date.now();
    const ownerId = await ctx.db.insert("users", {
      clerkId: OWNER.subject,
      email: "owner@example.com",
      createdAt: now,
    });
    const teamId = await ctx.db.insert("teams", {
      name: "Team",
      slug: "team",
      ownerId,
      createdAt: now,
    });
    await ctx.db.insert("teamMembers", {
      userId: ownerId,
      teamId,
      role: "admin",
      joinedAt: now,
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
      isActive: true,
      createdAt: now,
    });
    return { widgetId };
  });
}

describe("Display Mode backend round-trip", () => {
  it("defaults to always-visible before any save", async () => {
    const t = convexTest(schema, modules);
    await seed(t);

    const config = await t.query(api.widgetConfig.getWidgetConfigByKey, {
      widgetKey: WIDGET_KEY,
    });
    expect(config?.displayMode).toBe("always-visible");
  });

  it("owner saves auto-hide; installed widgets fetch auto-hide", async () => {
    const t = convexTest(schema, modules);
    const { widgetId } = await seed(t);

    await t.withIdentity(OWNER).mutation(api.widgetConfig.saveWidgetConfig, {
      widgetId,
      position: "bottom-right",
      displayMode: "auto-hide",
    });

    const config = await t.query(api.widgetConfig.getWidgetConfigByKey, {
      widgetKey: WIDGET_KEY,
    });
    expect(config?.displayMode).toBe("auto-hide");
  });
});
