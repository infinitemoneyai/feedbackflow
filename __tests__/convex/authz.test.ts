// @vitest-environment edge-runtime
/// <reference types="vite/client" />
/**
 * Exhaustive tests for requireTeamMember — the one authorization module
 * (identity → user → team membership → role) all Convex functions use.
 * First convex-test suite in the repo.
 * @see convex/authz.ts
 */

import { describe, it, expect } from "vitest";
import { convexTest } from "convex-test";
import type { Id } from "@/convex/_generated/dataModel";
import schema from "@/convex/schema";
import { getTeamMembership, requireTeamMember } from "@/convex/authz";

const modules = import.meta.glob("../../convex/**/*.ts");

const CLERK_ID = "user_clerk_1";
const OTHER_CLERK_ID = "user_clerk_2";

async function seed(t: ReturnType<typeof convexTest>) {
  return t.run(async (ctx) => {
    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      clerkId: CLERK_ID,
      email: "member@example.com",
      name: "Member",
      createdAt: now,
    });
    const teamId = await ctx.db.insert("teams", {
      name: "Team",
      slug: "team",
      ownerId: userId,
      createdAt: now,
    });
    const otherTeamId = await ctx.db.insert("teams", {
      name: "Other",
      slug: "other",
      ownerId: userId,
      createdAt: now,
    });
    const membershipId = await ctx.db.insert("teamMembers", {
      userId,
      teamId,
      role: "member",
      joinedAt: now,
    });
    return { userId, teamId, otherTeamId, membershipId };
  });
}

/** Run requireTeamMember inside a test ctx with a chosen identity. */
function runWithIdentity(
  t: ReturnType<typeof convexTest>,
  clerkId: string | null,
  teamId: Id<"teams">,
  options?: { role?: "admin" }
) {
  return t.run(async (ctx) => {
    const authCtx = {
      ...ctx,
      auth: {
        getUserIdentity: async () =>
          clerkId ? { subject: clerkId, issuer: "test" } : null,
      },
    };
    return requireTeamMember(
      authCtx as unknown as Parameters<typeof requireTeamMember>[0],
      teamId,
      options
    );
  });
}

describe("requireTeamMember", () => {
  it("throws Unauthenticated when there is no identity", async () => {
    const t = convexTest(schema, modules);
    const { teamId } = await seed(t);

    await expect(runWithIdentity(t, null, teamId)).rejects.toThrow(
      "Unauthenticated"
    );
  });

  it("throws when the identity has no user row (pre-sync race)", async () => {
    const t = convexTest(schema, modules);
    const { teamId } = await seed(t);

    await expect(
      runWithIdentity(t, "user_clerk_unsynced", teamId)
    ).rejects.toThrow("User not found");
  });

  it("throws when the user is not a member of the team", async () => {
    const t = convexTest(schema, modules);
    const { otherTeamId } = await seed(t);

    await expect(runWithIdentity(t, CLERK_ID, otherTeamId)).rejects.toThrow(
      "Not a member of this team"
    );
  });

  it("throws when another team's member reaches into this team", async () => {
    const t = convexTest(schema, modules);
    const { teamId, otherTeamId } = await seed(t);
    await t.run(async (ctx) => {
      const now = Date.now();
      const outsiderId = await ctx.db.insert("users", {
        clerkId: OTHER_CLERK_ID,
        email: "outsider@example.com",
        name: "Outsider",
        createdAt: now,
      });
      await ctx.db.insert("teamMembers", {
        userId: outsiderId,
        teamId: otherTeamId,
        role: "admin",
      joinedAt: now,
      });
    });

    await expect(runWithIdentity(t, OTHER_CLERK_ID, teamId)).rejects.toThrow(
      "Not a member of this team"
    );
  });

  it("returns the user and membership for a member", async () => {
    const t = convexTest(schema, modules);
    const { teamId, userId, membershipId } = await seed(t);

    const result = await runWithIdentity(t, CLERK_ID, teamId);

    expect(result.user._id).toBe(userId);
    expect(result.membership._id).toBe(membershipId);
    expect(result.membership.role).toBe("member");
  });

  it("rejects a member when admin role is required", async () => {
    const t = convexTest(schema, modules);
    const { teamId } = await seed(t);

    await expect(
      runWithIdentity(t, CLERK_ID, teamId, { role: "admin" })
    ).rejects.toThrow("Admin access required");
  });

  it("admits an admin when admin role is required", async () => {
    const t = convexTest(schema, modules);
    const { teamId, membershipId } = await seed(t);
    await t.run(async (ctx) => {
      await ctx.db.patch(membershipId, { role: "admin" });
    });

    const result = await runWithIdentity(t, CLERK_ID, teamId, {
      role: "admin",
    });

    expect(result.membership.role).toBe("admin");
  });
});

describe("getTeamMembership (query soft-fail companion)", () => {
  function run(
    t: ReturnType<typeof convexTest>,
    clerkId: string | null,
    teamId: Id<"teams">
  ) {
    return t.run(async (ctx) => {
      const authCtx = {
        ...ctx,
        auth: {
          getUserIdentity: async () =>
            clerkId ? { subject: clerkId, issuer: "test" } : null,
        },
      };
      return getTeamMembership(
        authCtx as unknown as Parameters<typeof getTeamMembership>[0],
        teamId
      );
    });
  }

  it("returns null instead of throwing for unauthenticated / unsynced / non-member", async () => {
    const t = convexTest(schema, modules);
    const { teamId, otherTeamId } = await seed(t);

    expect(await run(t, null, teamId)).toBeNull();
    expect(await run(t, "user_clerk_unsynced", teamId)).toBeNull();
    expect(await run(t, CLERK_ID, otherTeamId)).toBeNull();
  });

  it("returns the user and membership for a member", async () => {
    const t = convexTest(schema, modules);
    const { teamId, userId } = await seed(t);

    const result = await run(t, CLERK_ID, teamId);

    expect(result?.user._id).toBe(userId);
    expect(result?.membership.role).toBe("member");
  });
});
