import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get onboarding state for current user
 */
export const getOnboardingState = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return null;
    }

    return {
      step: user.onboardingStep,
      completedAt: user.onboardingCompletedAt,
      isComplete: user.onboardingStep === undefined || user.onboardingStep >= 8,
    };
  },
});

/**
 * Start onboarding for a new user
 */
export const startOnboarding = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Only start if not already started
    if (user.onboardingStep === undefined) {
      await ctx.db.patch(user._id, {
        onboardingStep: 1,
      });
    }

    return { step: user.onboardingStep ?? 1 };
  },
});

/**
 * Complete a step and advance to next
 */
export const completeStep = mutation({
  args: {
    step: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Validate step progression
    const currentStep = user.onboardingStep ?? 1;
    if (args.step !== currentStep) {
      throw new Error(`Invalid step. Expected ${currentStep}, got ${args.step}`);
    }

    const nextStep = args.step + 1;

    // If completing step 7, mark onboarding as complete
    if (nextStep > 7) {
      await ctx.db.patch(user._id, {
        onboardingStep: undefined,
        onboardingCompletedAt: Date.now(),
      });
      return { step: undefined, isComplete: true };
    }

    await ctx.db.patch(user._id, {
      onboardingStep: nextStep,
    });

    return { step: nextStep, isComplete: false };
  },
});

/**
 * Skip optional steps (6 and 7 only, after verification)
 */
export const skipToComplete = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Can only skip from step 6 or 7
    const currentStep = user.onboardingStep ?? 1;
    if (currentStep < 6) {
      throw new Error("Cannot skip required steps");
    }

    await ctx.db.patch(user._id, {
      onboardingStep: undefined,
      onboardingCompletedAt: Date.now(),
    });

    return { isComplete: true };
  },
});

/**
 * Create team during onboarding (step 1)
 */
export const createOnboardingTeam = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Generate slug
    const baseSlug = args.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50);

    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const existing = await ctx.db
        .query("teams")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first();
      if (!existing) break;
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    // Create team
    const teamId = await ctx.db.insert("teams", {
      name: args.name,
      slug,
      ownerId: user._id,
      createdAt: Date.now(),
    });

    // Add user as admin
    await ctx.db.insert("teamMembers", {
      userId: user._id,
      teamId,
      role: "admin",
      joinedAt: Date.now(),
    });

    // Create free subscription
    await ctx.db.insert("subscriptions", {
      teamId,
      stripeCustomerId: "",
      plan: "free",
      seats: 1,
      status: "active",
      cancelAtPeriodEnd: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Advance to step 2
    await ctx.db.patch(user._id, {
      onboardingStep: 2,
    });

    return { teamId, step: 2 };
  },
});

/**
 * Create project during onboarding (step 3)
 */
export const createOnboardingProject = mutation({
  args: {
    teamId: v.id("teams"),
    name: v.string(),
    siteUrl: v.string(),
    projectType: v.union(
      v.literal("web_app"),
      v.literal("marketing_site"),
      v.literal("mobile_app"),
      v.literal("other")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Verify team membership
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), args.teamId))
      .first();

    if (!membership) {
      throw new Error("Not a team member");
    }

    // Create project
    const projectId = await ctx.db.insert("projects", {
      teamId: args.teamId,
      name: args.name,
      siteUrl: args.siteUrl,
      projectType: args.projectType,
      settings: {
        defaultPriority: "medium",
        autoTriage: true,
        notifyOnNew: true,
      },
      createdAt: Date.now(),
    });

    // Create widget
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let widgetKey = "wk_";
    for (let i = 0; i < 24; i++) {
      widgetKey += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const widgetId = await ctx.db.insert("widgets", {
      projectId,
      widgetKey,
      siteUrl: args.siteUrl,
      isActive: true,
      createdAt: Date.now(),
    });

    // Advance to step 4
    await ctx.db.patch(user._id, {
      onboardingStep: 4,
    });

    return { projectId, widgetId, widgetKey, step: 4 };
  },
});

/**
 * Send test feedback (step 5)
 */
export const sendTestFeedback = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Get widget for project
    const widget = await ctx.db
      .query("widgets")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .first();

    if (!widget) {
      throw new Error("Widget not found");
    }

    // Create test feedback
    const feedbackId = await ctx.db.insert("feedback", {
      widgetId: widget._id,
      projectId: args.projectId,
      teamId: project.teamId,
      type: "bug",
      title: "Test Feedback - Widget Successfully Connected!",
      description: "This is a test ticket to verify your FeedbackFlow widget is working correctly. You can archive or delete this ticket once you've confirmed everything is set up.",
      status: "new",
      priority: "low",
      tags: ["test", "onboarding"],
      submitterEmail: user.email,
      submitterName: user.name || "Test User",
      metadata: {
        browser: "FeedbackFlow Test",
        os: "Onboarding Verification",
        url: project.siteUrl || "https://example.com",
        timestamp: Date.now(),
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { feedbackId, success: true };
  },
});
