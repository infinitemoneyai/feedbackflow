import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { hashPassword, verifyPassword } from "../lib/review-crypto";

/**
 * Generate a random 10-character alphanumeric slug
 */
function generateSlug(): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join("");
}

/**
 * Create a new review link for a project
 */
export const createReviewLink = mutation({
  args: {
    projectId: v.id("projects"),
    siteUrl: v.optional(v.string()),
    password: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Look up user by clerkId
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) {
      throw new Error("User not found");
    }

    // Get the project
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Use project.siteUrl as default if args.siteUrl not provided
    const siteUrl = args.siteUrl || project.siteUrl;
    if (!siteUrl) {
      throw new Error(
        "Site URL is required. Provide one or set it on the project."
      );
    }

    // Generate a unique slug
    let slug = generateSlug();
    let existing = await ctx.db
      .query("reviewLinks")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    while (existing) {
      slug = generateSlug();
      existing = await ctx.db
        .query("reviewLinks")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first();
    }

    // Hash password if provided
    let passwordHash: string | undefined;
    if (args.password) {
      passwordHash = await hashPassword(args.password);
    }

    const reviewLinkId = await ctx.db.insert("reviewLinks", {
      projectId: args.projectId,
      teamId: project.teamId,
      slug,
      siteUrl,
      passwordHash,
      createdBy: user._id,
      isActive: true,
      createdAt: Date.now(),
      expiresAt: args.expiresAt,
    });

    return { reviewLinkId, slug };
  },
});

/**
 * Get a review link by slug (public query)
 * Returns null if inactive or expired.
 * Strips passwordHash, returns hasPassword boolean instead.
 */
export const getReviewLink = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query("reviewLinks")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!link) {
      return null;
    }

    if (!link.isActive) {
      return null;
    }

    if (link.expiresAt && link.expiresAt < Date.now()) {
      return null;
    }

    // Strip passwordHash, return hasPassword boolean
    const { passwordHash, ...rest } = link;
    return {
      ...rest,
      hasPassword: !!passwordHash,
    };
  },
});

/**
 * Get all review links for a project (auth required)
 */
export const getReviewLinksForProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const links = await ctx.db
      .query("reviewLinks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    return links.map((link) => {
      const { passwordHash, ...rest } = link;
      return {
        ...rest,
        hasPassword: !!passwordHash,
      };
    });
  },
});

/**
 * Deactivate a review link (auth required)
 */
export const deactivateReviewLink = mutation({
  args: { reviewLinkId: v.id("reviewLinks") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    await ctx.db.patch(args.reviewLinkId, { isActive: false });
  },
});

/**
 * Verify a review link password
 */
export const verifyReviewLinkPassword = mutation({
  args: {
    slug: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query("reviewLinks")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!link || !link.passwordHash) {
      return false;
    }

    return await verifyPassword(args.password, link.passwordHash);
  },
});
