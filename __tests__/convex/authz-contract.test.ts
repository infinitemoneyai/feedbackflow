/**
 * Contract: authorization lives in convex/authz.ts — nowhere else.
 *
 * ctx.auth.getUserIdentity() may appear only in the allowlisted files:
 * the authz module itself, action handlers (no ctx.db, so they cannot use
 * the helpers), and reviewLinks' identity-only presence checks. Everything
 * else must go through requireUser / getAuthUser / requireTeamMember /
 * getTeamMembership. If this test fails, migrate your new code to the
 * authz module instead of widening the allowlist.
 */

import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "fs";
import { join, relative } from "path";

const CONVEX_DIR = join(__dirname, "../../convex");

const ALLOWED = new Set([
  "authz.ts", // the module itself
  "aiActions.ts", // action handlers — no ctx.db
  "webhookActions.ts", // action handler — no ctx.db
  "reviewLinks.ts", // identity-only presence checks (no user lookup)
]);

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (entry === "_generated") return [];
    if (statSync(full).isDirectory()) return walk(full);
    return entry.endsWith(".ts") ? [full] : [];
  });
}

describe("authorization contract", () => {
  it("getUserIdentity appears only in allowlisted files", () => {
    const offenders = walk(CONVEX_DIR)
      .filter((file) => !ALLOWED.has(relative(CONVEX_DIR, file)))
      .filter((file) => readFileSync(file, "utf8").includes("getUserIdentity"))
      .map((file) => relative(CONVEX_DIR, file));

    expect(offenders).toEqual([]);
  });

  it("no user-by-clerk-id auth lookups outside the authz and user-sync modules", () => {
    // by_clerk_id reads for AUTH belong in authz.ts; users.ts owns the
    // Clerk sync; schema declares the index; integrations' *ForApi
    // functions are a known pre-existing trap (client-supplied clerkId).
    const allowed = new Set([
      "authz.ts",
      "users.ts",
      "schema.ts",
      "integrations.ts",
    ]);
    const offenders = walk(CONVEX_DIR)
      .filter((file) => !allowed.has(relative(CONVEX_DIR, file)))
      .filter((file) => readFileSync(file, "utf8").includes("by_clerk_id"))
      .map((file) => relative(CONVEX_DIR, file));

    expect(offenders).toEqual([]);
  });
});
