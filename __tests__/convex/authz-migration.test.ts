// @vitest-environment edge-runtime
/// <reference types="vite/client" />
/**
 * Proof tests for the batch-A authorization sweep: real Convex functions,
 * called through their public interface with convex-test identities,
 * enforce membership and role via requireTeamMember/getTeamMembership.
 */

import { describe, it, expect } from "vitest";
import { convexTest } from "convex-test";
import { api } from "@/convex/_generated/api";
import schema from "@/convex/schema";

const modules = import.meta.glob("../../convex/**/*.ts");

const ADMIN = { subject: "clerk_admin", issuer: "test" };
const MEMBER = { subject: "clerk_member", issuer: "test" };
const OUTSIDER = { subject: "clerk_outsider", issuer: "test" };

async function seed(t: ReturnType<typeof convexTest>) {
  return t.run(async (ctx) => {
    const now = Date.now();
    const adminId = await ctx.db.insert("users", {
      clerkId: ADMIN.subject,
      email: "admin@example.com",
      createdAt: now,
    });
    const memberId = await ctx.db.insert("users", {
      clerkId: MEMBER.subject,
      email: "member@example.com",
      createdAt: now,
    });
    await ctx.db.insert("users", {
      clerkId: OUTSIDER.subject,
      email: "outsider@example.com",
      createdAt: now,
    });
    const teamId = await ctx.db.insert("teams", {
      name: "Team",
      slug: "team",
      ownerId: adminId,
      createdAt: now,
    });
    await ctx.db.insert("teamMembers", {
      userId: adminId,
      teamId,
      role: "admin",
      joinedAt: now,
    });
    await ctx.db.insert("teamMembers", {
      userId: memberId,
      teamId,
      role: "member",
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
    const feedbackId = await ctx.db.insert("feedback", {
      projectId,
      teamId,
      type: "bug",
      title: "Broken button",
      description: "It does not click",
      status: "new",
      priority: "medium",
      tags: [],
      metadata: { timestamp: now },
      createdAt: now,
      updatedAt: now,
    });
    return { teamId, projectId, feedbackId };
  });
}

describe("authorization through migrated functions", () => {
  it("a member cannot perform admin-gated operations", async () => {
    const t = convexTest(schema, modules);
    const { teamId } = await seed(t);

    await expect(
      t
        .withIdentity(MEMBER)
        .mutation(api.teams.updateTeam, { teamId, name: "Renamed" })
    ).rejects.toThrow("Only admins can update team settings");
  });

  it("an admin can perform admin-gated operations", async () => {
    const t = convexTest(schema, modules);
    const { teamId } = await seed(t);

    const result = await t
      .withIdentity(ADMIN)
      .mutation(api.teams.updateTeam, { teamId, name: "Renamed" });

    expect(result.success).toBe(true);
  });

  it("a non-member cannot read another team's data (soft-fail queries)", async () => {
    const t = convexTest(schema, modules);
    const { teamId, projectId, feedbackId } = await seed(t);

    const outside = t.withIdentity(OUTSIDER);
    expect(await outside.query(api.projects.getProjects, { teamId })).toEqual(
      []
    );
    expect(
      await outside.query(api.feedback.getFeedback, { feedbackId })
    ).toBeNull();
    expect(
      await outside.query(api.feedback.listFeedback, { projectId })
    ).toEqual([]);
    expect(await outside.query(api.teams.getTeam, { teamId })).toBeNull();
  });

  it("a non-member cannot mutate another team's feedback", async () => {
    const t = convexTest(schema, modules);
    const { feedbackId } = await seed(t);

    await expect(
      t.withIdentity(OUTSIDER).mutation(api.feedback.updateFeedback, {
        feedbackId,
        status: "resolved",
      })
    ).rejects.toThrow("Not a member of this team");
  });

  it("a member can read their own team's data", async () => {
    const t = convexTest(schema, modules);
    const { teamId, projectId } = await seed(t);

    const asMember = t.withIdentity(MEMBER);
    expect(
      await asMember.query(api.projects.getProjects, { teamId })
    ).toHaveLength(1);
    const list = await asMember.query(api.feedback.listFeedback, {
      projectId,
    });
    expect(list).toHaveLength(1);
  });
});
