import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * GDPR Compliance Functions for Admin Operations
 * Handles data export and deletion for teams and projects
 */

/**
 * Export all team data (admin only)
 * Returns comprehensive JSON export for GDPR data portability
 */
export const exportTeamData = query({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { success: false, error: "Unauthenticated" };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Check if user is admin of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), args.teamId))
      .first();

    if (!membership || membership.role !== "admin") {
      return { success: false, error: "Only admins can export team data" };
    }

    // Get team info
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      return { success: false, error: "Team not found" };
    }

    // Get team members
    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    const teamMembers = await Promise.all(
      memberships.map(async (m) => {
        const memberUser = await ctx.db.get(m.userId);
        return {
          userId: m.userId,
          email: memberUser?.email,
          name: memberUser?.name,
          role: m.role,
          joinedAt: new Date(m.joinedAt).toISOString(),
        };
      })
    );

    // Get projects
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    const projectsData = projects.map((p) => ({
      id: p._id,
      name: p.name,
      description: p.description,
      settings: p.settings,
      createdAt: new Date(p.createdAt).toISOString(),
    }));

    // Get all feedback for the team
    const feedback = await ctx.db
      .query("feedback")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    const feedbackData = feedback.map((f) => ({
      id: f._id,
      referenceId: f.referenceId,
      projectId: f.projectId,
      title: f.title,
      description: f.description,
      type: f.type,
      status: f.status,
      priority: f.priority,
      tags: f.tags,
      submitterEmail: f.submitterEmail ? "[REDACTED FOR PRIVACY]" : null,
      submitterName: f.submitterName ? "[REDACTED FOR PRIVACY]" : null,
      screenshotUrl: f.screenshotUrl,
      recordingUrl: f.recordingUrl,
      metadata: f.metadata,
      createdAt: new Date(f.createdAt).toISOString(),
      resolvedAt: f.resolvedAt ? new Date(f.resolvedAt).toISOString() : null,
    }));

    // Get widgets
    const widgets = await ctx.db
      .query("widgets")
      .filter((q) => {
        // Filter widgets by projects that belong to this team
        const projectIds = projects.map((p) => p._id);
        return projectIds.length > 0
          ? q.or(...projectIds.map((pid) => q.eq(q.field("projectId"), pid)))
          : q.eq(q.field("projectId"), "" as Id<"projects">); // No match if no projects
      })
      .collect();

    const widgetsData = widgets.map((w) => ({
      id: w._id,
      projectId: w.projectId,
      widgetKey: `${w.widgetKey.substring(0, 8)}...`, // Partial key for security
      siteUrl: w.siteUrl,
      isActive: w.isActive,
      createdAt: new Date(w.createdAt).toISOString(),
    }));

    // Get integrations (exclude encrypted keys)
    const integrations = await ctx.db
      .query("integrations")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    const integrationsData = integrations.map((i) => ({
      id: i._id,
      provider: i.provider,
      isActive: i.isActive,
      settings: i.settings, // Settings don't contain keys
      createdAt: new Date(i.createdAt).toISOString(),
    }));

    // Get subscription
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .first();

    const subscriptionData = subscription
      ? {
          plan: subscription.plan,
          seats: subscription.seats,
          status: subscription.status,
          createdAt: new Date(subscription.createdAt).toISOString(),
        }
      : null;

    // Get usage tracking
    const usageRecords = await ctx.db
      .query("usageTracking")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    const usageData = usageRecords.map((u) => ({
      month: u.month,
      feedbackCount: u.feedbackCount,
      aiCallCount: u.aiCallCount,
    }));

    // Build comprehensive export
    const exportData = {
      exportedAt: new Date().toISOString(),
      gdprExport: true,
      exportType: "team_data",
      team: {
        id: team._id,
        name: team.name,
        slug: team.slug,
        createdAt: new Date(team.createdAt).toISOString(),
      },
      members: teamMembers,
      projects: projectsData,
      feedback: feedbackData,
      widgets: widgetsData,
      integrations: integrationsData,
      subscription: subscriptionData,
      usage: usageData,
      _note:
        "Submitter email and name fields have been redacted for privacy. API keys and encrypted credentials are not included in this export.",
    };

    return {
      success: true,
      data: exportData,
    };
  },
});

/**
 * Delete all data for a project (admin only)
 * Cascades delete to all related records
 */
export const deleteProjectData = mutation({
  args: {
    projectId: v.id("projects"),
    confirmDeletion: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (!args.confirmDeletion) {
      throw new Error("You must confirm the deletion request");
    }

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

    // Get the project
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
      throw new Error("Only admins can delete project data");
    }

    // Get all feedback for the project
    const feedback = await ctx.db
      .query("feedback")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const deletedCounts = {
      feedback: 0,
      aiAnalysis: 0,
      conversations: 0,
      comments: 0,
      activityLog: 0,
      exports: 0,
      ticketDrafts: 0,
      solutionSuggestions: 0,
      submitterTokens: 0,
      submitterUpdates: 0,
      publicNotes: 0,
      widgets: 0,
      automationRules: 0,
      exportTemplates: 0,
    };

    // Delete all feedback-related records
    for (const fb of feedback) {
      // Delete AI analysis
      const aiAnalyses = await ctx.db
        .query("aiAnalysis")
        .withIndex("by_feedback", (q) => q.eq("feedbackId", fb._id))
        .collect();
      for (const a of aiAnalyses) {
        await ctx.db.delete(a._id);
        deletedCounts.aiAnalysis++;
      }

      // Delete conversations
      const conversations = await ctx.db
        .query("conversations")
        .withIndex("by_feedback", (q) => q.eq("feedbackId", fb._id))
        .collect();
      for (const c of conversations) {
        await ctx.db.delete(c._id);
        deletedCounts.conversations++;
      }

      // Delete comments
      const comments = await ctx.db
        .query("comments")
        .withIndex("by_feedback", (q) => q.eq("feedbackId", fb._id))
        .collect();
      for (const c of comments) {
        await ctx.db.delete(c._id);
        deletedCounts.comments++;
      }

      // Delete activity log
      const activities = await ctx.db
        .query("activityLog")
        .withIndex("by_feedback", (q) => q.eq("feedbackId", fb._id))
        .collect();
      for (const a of activities) {
        await ctx.db.delete(a._id);
        deletedCounts.activityLog++;
      }

      // Delete exports
      const exports = await ctx.db
        .query("exports")
        .withIndex("by_feedback", (q) => q.eq("feedbackId", fb._id))
        .collect();
      for (const e of exports) {
        await ctx.db.delete(e._id);
        deletedCounts.exports++;
      }

      // Delete ticket drafts
      const ticketDrafts = await ctx.db
        .query("ticketDrafts")
        .withIndex("by_feedback", (q) => q.eq("feedbackId", fb._id))
        .collect();
      for (const t of ticketDrafts) {
        await ctx.db.delete(t._id);
        deletedCounts.ticketDrafts++;
      }

      // Delete solution suggestions
      const solutions = await ctx.db
        .query("solutionSuggestions")
        .withIndex("by_feedback", (q) => q.eq("feedbackId", fb._id))
        .collect();
      for (const s of solutions) {
        await ctx.db.delete(s._id);
        deletedCounts.solutionSuggestions++;
      }

      // Delete submitter tokens
      const tokens = await ctx.db
        .query("submitterTokens")
        .withIndex("by_feedback", (q) => q.eq("feedbackId", fb._id))
        .collect();
      for (const t of tokens) {
        await ctx.db.delete(t._id);
        deletedCounts.submitterTokens++;
      }

      // Delete submitter updates
      const updates = await ctx.db
        .query("submitterUpdates")
        .withIndex("by_feedback", (q) => q.eq("feedbackId", fb._id))
        .collect();
      for (const u of updates) {
        await ctx.db.delete(u._id);
        deletedCounts.submitterUpdates++;
      }

      // Delete public notes
      const notes = await ctx.db
        .query("publicNotes")
        .withIndex("by_feedback", (q) => q.eq("feedbackId", fb._id))
        .collect();
      for (const n of notes) {
        await ctx.db.delete(n._id);
        deletedCounts.publicNotes++;
      }

      // Delete the feedback itself
      await ctx.db.delete(fb._id);
      deletedCounts.feedback++;
    }

    // Delete widgets for the project
    const widgets = await ctx.db
      .query("widgets")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    for (const w of widgets) {
      // Delete widget config if exists
      const config = await ctx.db
        .query("widgetConfig")
        .withIndex("by_widget", (q) => q.eq("widgetId", w._id))
        .first();
      if (config) {
        await ctx.db.delete(config._id);
      }
      await ctx.db.delete(w._id);
      deletedCounts.widgets++;
    }

    // Delete automation rules for the project
    const rules = await ctx.db
      .query("automationRules")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    for (const r of rules) {
      await ctx.db.delete(r._id);
      deletedCounts.automationRules++;
    }

    // Delete export templates for the project
    const templates = await ctx.db
      .query("exportTemplates")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    for (const t of templates) {
      await ctx.db.delete(t._id);
      deletedCounts.exportTemplates++;
    }

    // Finally, delete the project
    await ctx.db.delete(args.projectId);

    return {
      success: true,
      message: `Project "${project.name}" and all associated data have been permanently deleted.`,
      deletedCounts,
    };
  },
});

/**
 * Delete all data for a team (owner only)
 * This is a destructive operation that removes all team data
 */
export const deleteTeamData = mutation({
  args: {
    teamId: v.id("teams"),
    confirmDeletion: v.boolean(),
    confirmTeamName: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.confirmDeletion) {
      throw new Error("You must confirm the deletion request");
    }

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

    // Get the team
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    // Only owner can delete the entire team
    if (team.ownerId !== user._id) {
      throw new Error("Only the team owner can delete all team data");
    }

    // Confirm team name matches
    if (args.confirmTeamName !== team.name) {
      throw new Error("Team name confirmation does not match");
    }

    const deletedCounts = {
      projects: 0,
      feedback: 0,
      widgets: 0,
      integrations: 0,
      webhooks: 0,
      apiKeys: 0,
      teamMembers: 0,
      teamInvites: 0,
    };

    // Get all projects for the team
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    // Delete each project (this cascades to feedback, widgets, etc.)
    for (const project of projects) {
      // Get all feedback for the project
      const feedback = await ctx.db
        .query("feedback")
        .withIndex("by_project", (q) => q.eq("projectId", project._id))
        .collect();

      for (const fb of feedback) {
        // Delete all feedback-related records
        const aiAnalyses = await ctx.db
          .query("aiAnalysis")
          .withIndex("by_feedback", (q) => q.eq("feedbackId", fb._id))
          .collect();
        for (const a of aiAnalyses) await ctx.db.delete(a._id);

        const conversations = await ctx.db
          .query("conversations")
          .withIndex("by_feedback", (q) => q.eq("feedbackId", fb._id))
          .collect();
        for (const c of conversations) await ctx.db.delete(c._id);

        const comments = await ctx.db
          .query("comments")
          .withIndex("by_feedback", (q) => q.eq("feedbackId", fb._id))
          .collect();
        for (const c of comments) await ctx.db.delete(c._id);

        const activities = await ctx.db
          .query("activityLog")
          .withIndex("by_feedback", (q) => q.eq("feedbackId", fb._id))
          .collect();
        for (const a of activities) await ctx.db.delete(a._id);

        const exports = await ctx.db
          .query("exports")
          .withIndex("by_feedback", (q) => q.eq("feedbackId", fb._id))
          .collect();
        for (const e of exports) await ctx.db.delete(e._id);

        const ticketDrafts = await ctx.db
          .query("ticketDrafts")
          .withIndex("by_feedback", (q) => q.eq("feedbackId", fb._id))
          .collect();
        for (const t of ticketDrafts) await ctx.db.delete(t._id);

        const solutions = await ctx.db
          .query("solutionSuggestions")
          .withIndex("by_feedback", (q) => q.eq("feedbackId", fb._id))
          .collect();
        for (const s of solutions) await ctx.db.delete(s._id);

        const tokens = await ctx.db
          .query("submitterTokens")
          .withIndex("by_feedback", (q) => q.eq("feedbackId", fb._id))
          .collect();
        for (const t of tokens) await ctx.db.delete(t._id);

        const updates = await ctx.db
          .query("submitterUpdates")
          .withIndex("by_feedback", (q) => q.eq("feedbackId", fb._id))
          .collect();
        for (const u of updates) await ctx.db.delete(u._id);

        const notes = await ctx.db
          .query("publicNotes")
          .withIndex("by_feedback", (q) => q.eq("feedbackId", fb._id))
          .collect();
        for (const n of notes) await ctx.db.delete(n._id);

        await ctx.db.delete(fb._id);
        deletedCounts.feedback++;
      }

      // Delete widgets
      const widgets = await ctx.db
        .query("widgets")
        .withIndex("by_project", (q) => q.eq("projectId", project._id))
        .collect();
      for (const w of widgets) {
        const config = await ctx.db
          .query("widgetConfig")
          .withIndex("by_widget", (q) => q.eq("widgetId", w._id))
          .first();
        if (config) await ctx.db.delete(config._id);
        await ctx.db.delete(w._id);
        deletedCounts.widgets++;
      }

      // Delete automation rules
      const rules = await ctx.db
        .query("automationRules")
        .withIndex("by_project", (q) => q.eq("projectId", project._id))
        .collect();
      for (const r of rules) await ctx.db.delete(r._id);

      // Delete export templates
      const templates = await ctx.db
        .query("exportTemplates")
        .withIndex("by_project", (q) => q.eq("projectId", project._id))
        .collect();
      for (const t of templates) await ctx.db.delete(t._id);

      // Delete the project
      await ctx.db.delete(project._id);
      deletedCounts.projects++;
    }

    // Delete integrations
    const integrations = await ctx.db
      .query("integrations")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();
    for (const i of integrations) {
      await ctx.db.delete(i._id);
      deletedCounts.integrations++;
    }

    // Delete webhooks and their logs
    const webhooks = await ctx.db
      .query("webhooks")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();
    for (const w of webhooks) {
      const logs = await ctx.db
        .query("webhookLogs")
        .withIndex("by_webhook", (q) => q.eq("webhookId", w._id))
        .collect();
      for (const l of logs) await ctx.db.delete(l._id);
      await ctx.db.delete(w._id);
      deletedCounts.webhooks++;
    }

    // Delete API keys
    const apiKeys = await ctx.db
      .query("apiKeys")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();
    for (const k of apiKeys) {
      await ctx.db.delete(k._id);
      deletedCounts.apiKeys++;
    }

    // Delete REST API keys
    const restApiKeys = await ctx.db
      .query("restApiKeys")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();
    for (const k of restApiKeys) {
      await ctx.db.delete(k._id);
    }

    // Delete storage config
    const storageConfig = await ctx.db
      .query("storageConfig")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .first();
    if (storageConfig) {
      await ctx.db.delete(storageConfig._id);
    }

    // Delete usage tracking
    const usageRecords = await ctx.db
      .query("usageTracking")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();
    for (const u of usageRecords) {
      await ctx.db.delete(u._id);
    }

    // Delete team invites
    const invites = await ctx.db
      .query("teamInvites")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();
    for (const i of invites) {
      await ctx.db.delete(i._id);
      deletedCounts.teamInvites++;
    }

    // Delete team memberships
    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();
    for (const m of memberships) {
      await ctx.db.delete(m._id);
      deletedCounts.teamMembers++;
    }

    // Mark subscription as cancelled (keep for billing audit)
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .first();
    if (subscription) {
      await ctx.db.patch(subscription._id, {
        status: "cancelled",
        updatedAt: Date.now(),
      });
    }

    // Finally, delete the team
    await ctx.db.delete(args.teamId);

    return {
      success: true,
      message: `Team "${team.name}" and all associated data have been permanently deleted.`,
      deletedCounts,
    };
  },
});
