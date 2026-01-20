import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

type Position = "bottom-right" | "bottom-left" | "top-right" | "top-left";

const DEFAULT_CONFIG = {
  position: "bottom-right" as Position,
  buttonText: "Send Feedback",
  primaryColor: "#1a1a1a",
  backgroundColor: "#ffffff",
  textColor: "#1a1a1a",
};

/**
 * Get widget config by widget ID
 */
export const getWidgetConfig = query({
  args: { widgetId: v.id("widgets") },
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

    const widget = await ctx.db.get(args.widgetId);
    if (!widget) {
      return null;
    }

    const project = await ctx.db.get(widget.projectId);
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

    const config = await ctx.db
      .query("widgetConfig")
      .withIndex("by_widget", (q) => q.eq("widgetId", args.widgetId))
      .first();

    if (!config) {
      // Return default config if none exists
      return {
        widgetId: args.widgetId,
        ...DEFAULT_CONFIG,
        logoUrl: undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }

    return config;
  },
});

/**
 * Get widget config by widget key (public, for widget script)
 */
export const getWidgetConfigByKey = query({
  args: { widgetKey: v.string() },
  handler: async (ctx, args) => {
    const widget = await ctx.db
      .query("widgets")
      .withIndex("by_widget_key", (q) => q.eq("widgetKey", args.widgetKey))
      .first();

    if (!widget || !widget.isActive) {
      return null;
    }

    const config = await ctx.db
      .query("widgetConfig")
      .withIndex("by_widget", (q) => q.eq("widgetId", widget._id))
      .first();

    if (!config) {
      return {
        widgetId: widget._id,
        ...DEFAULT_CONFIG,
        logoUrl: undefined,
      };
    }

    return {
      widgetId: config.widgetId,
      position: config.position,
      buttonText: config.buttonText,
      primaryColor: config.primaryColor,
      backgroundColor: config.backgroundColor,
      textColor: config.textColor,
      logoUrl: config.logoUrl,
    };
  },
});

/**
 * Save or update widget config
 */
export const saveWidgetConfig = mutation({
  args: {
    widgetId: v.id("widgets"),
    position: v.union(
      v.literal("bottom-right"),
      v.literal("bottom-left"),
      v.literal("top-right"),
      v.literal("top-left")
    ),
    buttonText: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
    backgroundColor: v.optional(v.string()),
    textColor: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
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

    // Check if config exists
    const existingConfig = await ctx.db
      .query("widgetConfig")
      .withIndex("by_widget", (q) => q.eq("widgetId", args.widgetId))
      .first();

    const now = Date.now();

    if (existingConfig) {
      // Update existing config
      await ctx.db.patch(existingConfig._id, {
        position: args.position,
        buttonText: args.buttonText,
        primaryColor: args.primaryColor,
        backgroundColor: args.backgroundColor,
        textColor: args.textColor,
        logoUrl: args.logoUrl,
        updatedAt: now,
      });
      return { id: existingConfig._id, updated: true };
    } else {
      // Create new config
      const id = await ctx.db.insert("widgetConfig", {
        widgetId: args.widgetId,
        position: args.position,
        buttonText: args.buttonText,
        primaryColor: args.primaryColor,
        backgroundColor: args.backgroundColor,
        textColor: args.textColor,
        logoUrl: args.logoUrl,
        createdAt: now,
        updatedAt: now,
      });
      return { id, updated: false };
    }
  },
});

/**
 * Reset widget config to defaults
 */
export const resetWidgetConfig = mutation({
  args: { widgetId: v.id("widgets") },
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

    // Check if config exists
    const existingConfig = await ctx.db
      .query("widgetConfig")
      .withIndex("by_widget", (q) => q.eq("widgetId", args.widgetId))
      .first();

    const now = Date.now();

    if (existingConfig) {
      // Reset to defaults
      await ctx.db.patch(existingConfig._id, {
        position: DEFAULT_CONFIG.position,
        buttonText: DEFAULT_CONFIG.buttonText,
        primaryColor: DEFAULT_CONFIG.primaryColor,
        backgroundColor: DEFAULT_CONFIG.backgroundColor,
        textColor: DEFAULT_CONFIG.textColor,
        logoUrl: undefined,
        updatedAt: now,
      });
      return { success: true };
    } else {
      // Create with defaults
      await ctx.db.insert("widgetConfig", {
        widgetId: args.widgetId,
        position: DEFAULT_CONFIG.position,
        buttonText: DEFAULT_CONFIG.buttonText,
        primaryColor: DEFAULT_CONFIG.primaryColor,
        backgroundColor: DEFAULT_CONFIG.backgroundColor,
        textColor: DEFAULT_CONFIG.textColor,
        createdAt: now,
        updatedAt: now,
      });
      return { success: true };
    }
  },
});

/**
 * Upload logo and update widget config
 */
export const uploadLogo = mutation({
  args: {
    widgetId: v.id("widgets"),
    storageId: v.id("_storage"),
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

    // Get the URL for the uploaded file
    const logoUrl = await ctx.storage.getUrl(args.storageId);
    if (!logoUrl) {
      throw new Error("Failed to get logo URL");
    }

    // Update or create config with logo URL
    const existingConfig = await ctx.db
      .query("widgetConfig")
      .withIndex("by_widget", (q) => q.eq("widgetId", args.widgetId))
      .first();

    const now = Date.now();

    if (existingConfig) {
      await ctx.db.patch(existingConfig._id, {
        logoUrl,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("widgetConfig", {
        widgetId: args.widgetId,
        position: DEFAULT_CONFIG.position,
        buttonText: DEFAULT_CONFIG.buttonText,
        primaryColor: DEFAULT_CONFIG.primaryColor,
        backgroundColor: DEFAULT_CONFIG.backgroundColor,
        textColor: DEFAULT_CONFIG.textColor,
        logoUrl,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { logoUrl };
  },
});

/**
 * Generate upload URL for logo
 */
export const generateLogoUploadUrl = mutation({
  args: { widgetId: v.id("widgets") },
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

    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Remove logo from widget config
 */
export const removeLogo = mutation({
  args: { widgetId: v.id("widgets") },
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

    const existingConfig = await ctx.db
      .query("widgetConfig")
      .withIndex("by_widget", (q) => q.eq("widgetId", args.widgetId))
      .first();

    if (existingConfig) {
      await ctx.db.patch(existingConfig._id, {
        logoUrl: undefined,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});
