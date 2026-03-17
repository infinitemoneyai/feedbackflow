import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Generate a random 40-character alphanumeric session token
 */
function generateSessionToken(): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(40));
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join("");
}

/**
 * Create or update a reviewer session for a review link
 */
export const createReviewerSession = mutation({
  args: {
    reviewLinkId: v.id("reviewLinks"),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate the review link is active and not expired
    const link = await ctx.db.get(args.reviewLinkId);
    if (!link) {
      throw new Error("Review link not found");
    }
    if (!link.isActive) {
      throw new Error("Review link is no longer active");
    }
    if (link.expiresAt && link.expiresAt < Date.now()) {
      throw new Error("Review link has expired");
    }

    const sessionToken = generateSessionToken();

    // Check for existing reviewer by email for this link
    const existingReviewers = await ctx.db
      .query("reviewers")
      .withIndex("by_review_link", (q) =>
        q.eq("reviewLinkId", args.reviewLinkId)
      )
      .collect();

    const existingReviewer = existingReviewers.find(
      (r) => r.email === args.email
    );

    if (existingReviewer) {
      // Update existing reviewer with new session token
      await ctx.db.patch(existingReviewer._id, {
        sessionToken,
        lastAccessedAt: Date.now(),
      });
      return { sessionToken, reviewerId: existingReviewer._id };
    }

    // Create new reviewer
    const reviewerId = await ctx.db.insert("reviewers", {
      reviewLinkId: args.reviewLinkId,
      email: args.email,
      sessionToken,
      firstAccessedAt: Date.now(),
      lastAccessedAt: Date.now(),
    });

    return { sessionToken, reviewerId };
  },
});

/**
 * Validate a reviewer session token and return reviewer + link info
 */
export const validateReviewerSession = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const reviewer = await ctx.db
      .query("reviewers")
      .withIndex("by_session_token", (q) =>
        q.eq("sessionToken", args.sessionToken)
      )
      .first();

    if (!reviewer) {
      return null;
    }

    // Validate the linked review link is still active and not expired
    const link = await ctx.db.get(reviewer.reviewLinkId);
    if (!link) {
      return null;
    }
    if (!link.isActive) {
      return null;
    }
    if (link.expiresAt && link.expiresAt < Date.now()) {
      return null;
    }

    return {
      reviewerId: reviewer._id,
      email: reviewer.email,
      reviewLinkId: reviewer.reviewLinkId,
      siteUrl: link.siteUrl,
      projectId: link.projectId,
      teamId: link.teamId,
    };
  },
});
