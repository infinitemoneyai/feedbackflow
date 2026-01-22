import { v } from "convex/values";
import { mutation, query, MutationCtx } from "./_generated/server";

/**
 * Generate a unique widget key
 */
function generateWidgetKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "wk_";
  for (let i = 0; i < 24; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

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
 * Create a new project
 */
export const createProject = mutation({
  args: {
    teamId: v.id("teams"),
    name: v.string(),
    code: v.optional(v.string()),
    description: v.optional(v.string()),
    siteUrl: v.optional(v.string()),
    projectType: v.optional(
      v.union(
        v.literal("web_app"),
        v.literal("marketing_site"),
        v.literal("mobile_app"),
        v.literal("other")
      )
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    // Get the user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is a member of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), args.teamId))
      .first();

    if (!membership) {
      throw new Error("You are not a member of this team");
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

    // Create the project
    const projectId = await ctx.db.insert("projects", {
      teamId: args.teamId,
      name: args.name,
      code,
      description: args.description,
      siteUrl: args.siteUrl,
      projectType: args.projectType,
      settings: {
        defaultPriority: "medium",
        autoTriage: true,
        notifyOnNew: true,
      },
      createdAt: Date.now(),
    });

    // Create a default widget for the project
    const widgetKey = generateWidgetKey();
    await ctx.db.insert("widgets", {
      projectId,
      widgetKey,
      siteUrl: args.siteUrl,
      isActive: true,
      createdAt: Date.now(),
    });

    return { projectId, code };
  },
});

/**
 * Get all projects for a team with feedback counts
 */
export const getProjects = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return [];
    }

    // Check if user is a member
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), args.teamId))
      .first();

    if (!membership) {
      return [];
    }

    // Get all projects for the team
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    // Get feedback counts for each project
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const allFeedback = await ctx.db
          .query("feedback")
          .withIndex("by_project", (q) => q.eq("projectId", project._id))
          .collect();

        const newCount = allFeedback.filter((f) => f.status === "new").length;
        const totalCount = allFeedback.length;

        return {
          ...project,
          feedbackCount: totalCount,
          newFeedbackCount: newCount,
        };
      })
    );

    return projectsWithCounts;
  },
});

/**
 * Get a single project by ID
 */
export const getProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
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

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return null;
    }

    // Check if user is a member of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), project.teamId))
      .first();

    if (!membership) {
      return null;
    }

    return project;
  },
});

/**
 * Get a project by ID (no auth required - for internal use)
 */
export const getProjectInternal = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.projectId);
  },
});

/**
 * Update a project
 */
export const updateProject = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    settings: v.optional(
      v.object({
        defaultPriority: v.optional(
          v.union(
            v.literal("low"),
            v.literal("medium"),
            v.literal("high"),
            v.literal("critical")
          )
        ),
        autoTriage: v.optional(v.boolean()),
        notifyOnNew: v.optional(v.boolean()),
      })
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

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check if user is a member of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), project.teamId))
      .first();

    if (!membership) {
      throw new Error("You are not a member of this team");
    }

    // Build update object
    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.settings !== undefined) {
      updates.settings = {
        ...project.settings,
        ...args.settings,
      };
    }

    await ctx.db.patch(args.projectId, updates);

    return { success: true };
  },
});

/**
 * Delete a project and all associated data
 */
export const deleteProject = mutation({
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

    // Check if user is admin of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), project.teamId))
      .first();

    if (!membership || membership.role !== "admin") {
      throw new Error("Only admins can delete projects");
    }

    // Delete all widgets for this project
    const widgets = await ctx.db
      .query("widgets")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    for (const widget of widgets) {
      // Delete widget configs
      const configs = await ctx.db
        .query("widgetConfig")
        .withIndex("by_widget", (q) => q.eq("widgetId", widget._id))
        .collect();
      for (const config of configs) {
        await ctx.db.delete(config._id);
      }
      await ctx.db.delete(widget._id);
    }

    // Delete all feedback for this project
    const feedbackList = await ctx.db
      .query("feedback")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    for (const feedback of feedbackList) {
      await ctx.db.delete(feedback._id);
    }

    // Delete the project
    await ctx.db.delete(args.projectId);

    return { success: true };
  },
});

/**
 * Get widgets for a project
 */
export const getWidgets = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return [];
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return [];
    }

    // Check if user is a member of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), project.teamId))
      .first();

    if (!membership) {
      return [];
    }

    const widgets = await ctx.db
      .query("widgets")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Get configs for each widget
    const widgetsWithConfig = await Promise.all(
      widgets.map(async (widget) => {
        const config = await ctx.db
          .query("widgetConfig")
          .withIndex("by_widget", (q) => q.eq("widgetId", widget._id))
          .first();

        return {
          ...widget,
          config,
        };
      })
    );

    return widgetsWithConfig;
  },
});

/**
 * Create a new widget for a project
 */
export const createWidget = mutation({
  args: {
    projectId: v.id("projects"),
    siteUrl: v.optional(v.string()),
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

    // Check if user is a member of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), project.teamId))
      .first();

    if (!membership) {
      throw new Error("You are not a member of this team");
    }

    const widgetKey = generateWidgetKey();
    const widgetId = await ctx.db.insert("widgets", {
      projectId: args.projectId,
      widgetKey,
      siteUrl: args.siteUrl,
      isActive: true,
      createdAt: Date.now(),
    });

    return { widgetId, widgetKey };
  },
});

/**
 * Update a widget
 */
export const updateWidget = mutation({
  args: {
    widgetId: v.id("widgets"),
    siteUrl: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
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

    const widget = await ctx.db.get(args.widgetId);
    if (!widget) {
      throw new Error("Widget not found");
    }

    const project = await ctx.db.get(widget.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check if user is a member of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), project.teamId))
      .first();

    if (!membership) {
      throw new Error("You are not a member of this team");
    }

    // Build update object
    const updates: Record<string, unknown> = {};
    if (args.siteUrl !== undefined) updates.siteUrl = args.siteUrl;
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    await ctx.db.patch(args.widgetId, updates);

    return { success: true };
  },
});

/**
 * Regenerate widget key (invalidates old key)
 */
export const regenerateWidgetKey = mutation({
  args: {
    widgetId: v.id("widgets"),
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

    const widget = await ctx.db.get(args.widgetId);
    if (!widget) {
      throw new Error("Widget not found");
    }

    const project = await ctx.db.get(widget.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check if user is admin of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), project.teamId))
      .first();

    if (!membership || membership.role !== "admin") {
      throw new Error("Only admins can regenerate widget keys");
    }

    const newWidgetKey = generateWidgetKey();
    await ctx.db.patch(args.widgetId, { widgetKey: newWidgetKey });

    return { widgetKey: newWidgetKey };
  },
});
