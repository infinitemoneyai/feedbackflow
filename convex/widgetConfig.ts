import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getTeamMembership, requireTeamMember } from "./authz";
import {
  DEFAULT_WIDGET_CONFIG,
  widgetConfigFields,
} from "./widgetConfigShape";

/**
 * Get widget config by widget ID
 */
export const getWidgetConfig = query({
  args: { widgetId: v.id("widgets") },
  handler: async (ctx, args) => {
    const widget = await ctx.db.get(args.widgetId);
    if (!widget) {
      return null;
    }

    const project = await ctx.db.get(widget.projectId);
    if (!project) {
      return null;
    }

    const member = await getTeamMembership(ctx, project.teamId);
    if (!member) {
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
        ...DEFAULT_WIDGET_CONFIG,
        logoUrl: undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }

    return {
      ...config,
      displayMode: config.displayMode ?? DEFAULT_WIDGET_CONFIG.displayMode,
    };
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
        ...DEFAULT_WIDGET_CONFIG,
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
      displayMode: config.displayMode ?? DEFAULT_WIDGET_CONFIG.displayMode,
    };
  },
});

/**
 * Save or update widget config
 */
export const saveWidgetConfig = mutation({
  args: {
    widgetId: v.id("widgets"),
    ...widgetConfigFields,
  },
  handler: async (ctx, args) => {
    const widget = await ctx.db.get(args.widgetId);
    if (!widget) {
      throw new Error("Widget not found");
    }

    const project = await ctx.db.get(widget.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    await requireTeamMember(ctx, project.teamId);

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
        displayMode: args.displayMode,
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
        displayMode: args.displayMode,
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
    const widget = await ctx.db.get(args.widgetId);
    if (!widget) {
      throw new Error("Widget not found");
    }

    const project = await ctx.db.get(widget.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    await requireTeamMember(ctx, project.teamId);

    // Check if config exists
    const existingConfig = await ctx.db
      .query("widgetConfig")
      .withIndex("by_widget", (q) => q.eq("widgetId", args.widgetId))
      .first();

    const now = Date.now();

    if (existingConfig) {
      // Reset to defaults
      await ctx.db.patch(existingConfig._id, {
        ...DEFAULT_WIDGET_CONFIG,
        logoUrl: undefined,
        updatedAt: now,
      });
      return { success: true };
    } else {
      // Create with defaults
      await ctx.db.insert("widgetConfig", {
        widgetId: args.widgetId,
        ...DEFAULT_WIDGET_CONFIG,
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
    const widget = await ctx.db.get(args.widgetId);
    if (!widget) {
      throw new Error("Widget not found");
    }

    const project = await ctx.db.get(widget.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    await requireTeamMember(ctx, project.teamId);

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
        ...DEFAULT_WIDGET_CONFIG,
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
    const widget = await ctx.db.get(args.widgetId);
    if (!widget) {
      throw new Error("Widget not found");
    }

    const project = await ctx.db.get(widget.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    await requireTeamMember(ctx, project.teamId);

    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Remove logo from widget config
 */
export const removeLogo = mutation({
  args: { widgetId: v.id("widgets") },
  handler: async (ctx, args) => {
    const widget = await ctx.db.get(args.widgetId);
    if (!widget) {
      throw new Error("Widget not found");
    }

    const project = await ctx.db.get(widget.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    await requireTeamMember(ctx, project.teamId);

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
