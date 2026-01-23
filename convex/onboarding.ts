import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Generate a project code from the project name
 * Takes first letters of words, max 4 chars
 */
function generateProjectCode(name: string): string {
  // Remove special characters and split into words
  const words = name
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 0);

  if (words.length === 0) {
    return "PROJ";
  }

  // Take first letter of each word, up to 4 chars
  let code = words.map((w) => w[0]).join("").slice(0, 4);

  // If too short, pad with more letters from first word
  if (code.length < 2 && words[0].length >= 2) {
    code = words[0].slice(0, 2);
  }

  return code;
}

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

    // isComplete is true ONLY if onboardingCompletedAt is set
    // This distinguishes between "never started" (undefined step, no completedAt)
    // and "actually completed" (undefined step, has completedAt)
    const isComplete = user.onboardingCompletedAt !== undefined;
    
    // needsOnboarding: user has no step set AND hasn't completed onboarding
    // This catches new users who haven't started yet
    const needsOnboarding = user.onboardingStep === undefined && !isComplete;
    
    return {
      step: user.onboardingStep,
      completedAt: user.onboardingCompletedAt,
      isComplete,
      needsOnboarding,
      data: user.onboardingData,
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
    code: v.optional(v.string()),
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

    // Generate or validate project code
    let code = args.code?.toUpperCase().trim() || generateProjectCode(args.name);

    // Validate code format (2-4 uppercase alphanumeric characters)
    if (!/^[A-Z0-9]{2,4}$/.test(code)) {
      throw new Error("Project code must be 2-4 uppercase letters or numbers");
    }

    // Check if code is unique within team
    const existingProject = await ctx.db
      .query("projects")
      .withIndex("by_team_and_code", (q) =>
        q.eq("teamId", args.teamId).eq("code", code)
      )
      .first();

    if (existingProject) {
      // Try appending a number
      let counter = 2;
      let uniqueCode = code;
      while (counter <= 99) {
        // Truncate code if needed to fit number
        const baseCode = code.slice(0, 3);
        uniqueCode = `${baseCode}${counter}`;
        
        const exists = await ctx.db
          .query("projects")
          .withIndex("by_team_and_code", (q) =>
            q.eq("teamId", args.teamId).eq("code", uniqueCode)
          )
          .first();
        
        if (!exists) {
          code = uniqueCode;
          break;
        }
        counter++;
      }
      
      if (counter > 99) {
        throw new Error(`Project code "${code}" is already in use. Please choose a different code.`);
      }
    }

    // Create project
    const projectId = await ctx.db.insert("projects", {
      teamId: args.teamId,
      name: args.name,
      code,
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

    return { projectId, widgetId, widgetKey, code, step: 4 };
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

    // Get all feedback for this project to determine next ticket number
    const allFeedback = await ctx.db
      .query("feedback")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    let maxTicketNumber = 0;
    for (const feedback of allFeedback) {
      if (feedback.ticketNumber && feedback.ticketNumber > maxTicketNumber) {
        maxTicketNumber = feedback.ticketNumber;
      }
    }
    const ticketNumber = maxTicketNumber + 1;

    // Create test feedback
    const feedbackId = await ctx.db.insert("feedback", {
      widgetId: widget._id,
      projectId: args.projectId,
      teamId: project.teamId,
      ticketNumber,
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

/**
 * Set onboarding data (key-value store for temporary onboarding state)
 */
export const setOnboardingData = mutation({
  args: {
    key: v.string(),
    value: v.string(),
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

    // Update the onboarding data
    await ctx.db.patch(user._id, {
      onboardingData: {
        ...user.onboardingData,
        [args.key]: args.value,
      },
    });

    return { success: true };
  },
});

/**
 * Go to a specific onboarding step (for navigation)
 */
export const goToStep = mutation({
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

    // Validate step range (1-7)
    if (args.step < 1 || args.step > 7) {
      throw new Error("Invalid step number");
    }

    // Only allow going back to completed steps (can't skip ahead)
    const currentStep = user.onboardingStep ?? 8;
    if (args.step >= currentStep) {
      throw new Error("Cannot skip ahead to incomplete steps");
    }

    // Update the onboarding step
    await ctx.db.patch(user._id, {
      onboardingStep: args.step,
    });

    return { success: true };
  },
});
