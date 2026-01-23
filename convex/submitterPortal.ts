import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Generate a secure random token for magic links
 */
function generateToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Create or refresh a magic link token for a submitter
 * Returns the token to be sent via email
 */
export const createMagicLinkToken = mutation({
  args: {
    feedbackId: v.id("feedback"),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Get the feedback
    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) {
      throw new Error("Feedback not found");
    }

    // Verify the email matches the submitter
    if (!feedback.submitterEmail || feedback.submitterEmail.toLowerCase() !== args.email.toLowerCase()) {
      throw new Error("Email does not match the feedback submitter");
    }

    // Check for existing token
    const existingToken = await ctx.db
      .query("submitterTokens")
      .withIndex("by_feedback", (q) => q.eq("feedbackId", args.feedbackId))
      .filter((q) => q.eq(q.field("email"), args.email.toLowerCase()))
      .first();

    // Token expires in 7 days
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const token = generateToken();

    if (existingToken) {
      // Update existing token
      await ctx.db.patch(existingToken._id, {
        token,
        expiresAt,
      });
    } else {
      // Create new token
      await ctx.db.insert("submitterTokens", {
        feedbackId: args.feedbackId,
        email: args.email.toLowerCase(),
        token,
        expiresAt,
        createdAt: Date.now(),
      });
    }

    return { token };
  },
});

/**
 * Validate a magic link token and get feedback info
 * This is a public query - no auth required
 */
export const validateToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const tokenRecord = await ctx.db
      .query("submitterTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!tokenRecord) {
      return { valid: false, error: "Invalid token" };
    }

    if (tokenRecord.expiresAt < Date.now()) {
      return { valid: false, error: "Token has expired" };
    }

    // Get feedback data
    const feedback = await ctx.db.get(tokenRecord.feedbackId);
    if (!feedback) {
      return { valid: false, error: "Feedback not found" };
    }

    // Get project name
    const project = await ctx.db.get(feedback.projectId);

    return {
      valid: true,
      feedbackId: feedback._id,
      email: tokenRecord.email,
      projectName: project?.name,
    };
  },
});

/**
 * Get public feedback status for submitters
 * Only returns limited, public-safe information
 */
export const getPublicFeedbackStatus = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate token first
    const tokenRecord = await ctx.db
      .query("submitterTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!tokenRecord || tokenRecord.expiresAt < Date.now()) {
      return null;
    }

    // Get feedback
    const feedback = await ctx.db.get(tokenRecord.feedbackId);
    if (!feedback) {
      return null;
    }

    // Get project name
    const project = await ctx.db.get(feedback.projectId);

    // Get public notes (resolution notes visible to submitters)
    const publicNotes = await ctx.db
      .query("publicNotes")
      .withIndex("by_feedback", (q) => q.eq("feedbackId", feedback._id))
      .collect();

    // Get submitter updates
    const submitterUpdates = await ctx.db
      .query("submitterUpdates")
      .withIndex("by_feedback", (q) => q.eq("feedbackId", feedback._id))
      .collect();

    // Map status to user-friendly labels
    const statusLabels: Record<string, { label: string; description: string }> = {
      new: { label: "Received", description: "Your feedback has been received and is waiting to be reviewed." },
      triaging: { label: "Under Review", description: "Our team is reviewing your feedback." },
      drafted: { label: "In Progress", description: "We're working on a solution for your feedback." },
      exported: { label: "In Development", description: "Your feedback has been added to our development queue." },
      resolved: { label: "Resolved", description: "Your feedback has been addressed." },
    };

    const statusInfo = statusLabels[feedback.status] || statusLabels.new;

    return {
      feedbackId: feedback._id,
      title: feedback.title,
      type: feedback.type,
      status: feedback.status,
      statusLabel: statusInfo.label,
      statusDescription: statusInfo.description,
      createdAt: feedback.createdAt,
      resolvedAt: feedback.resolvedAt,
      projectName: project?.name || "Unknown Project",
      // Screenshot for reference (submitter's own screenshot)
      screenshotUrl: feedback.screenshotUrl,
      // Public resolution notes from team
      publicNotes: publicNotes.map((note) => ({
        _id: note._id,
        content: note.content,
        createdAt: note.createdAt,
      })),
      // Submitter's additional context
      submitterUpdates: submitterUpdates.map((update) => ({
        _id: update._id,
        content: update.content,
        createdAt: update.createdAt,
      })),
    };
  },
});

/**
 * Add additional context from submitter
 */
export const addSubmitterUpdate = mutation({
  args: {
    token: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.content.trim()) {
      throw new Error("Content cannot be empty");
    }

    // Validate token
    const tokenRecord = await ctx.db
      .query("submitterTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!tokenRecord || tokenRecord.expiresAt < Date.now()) {
      throw new Error("Invalid or expired token");
    }

    // Check feedback exists
    const feedback = await ctx.db.get(tokenRecord.feedbackId);
    if (!feedback) {
      throw new Error("Feedback not found");
    }

    // Create submitter update
    const updateId = await ctx.db.insert("submitterUpdates", {
      feedbackId: tokenRecord.feedbackId,
      content: args.content.trim(),
      createdAt: Date.now(),
    });

    // Create activity log entry (system action, no userId)
    await ctx.db.insert("activityLog", {
      feedbackId: tokenRecord.feedbackId,
      action: "commented",
      details: {
        extra: `Submitter added additional context: ${args.content.length > 50 ? args.content.substring(0, 50) + "..." : args.content}`,
      },
      createdAt: Date.now(),
    });

    return { updateId };
  },
});

/**
 * Add a public note (resolution note visible to submitter)
 * Only team members can add public notes
 */
export const addPublicNote = mutation({
  args: {
    feedbackId: v.id("feedback"),
    content: v.string(),
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

    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) {
      throw new Error("Feedback not found");
    }

    // Check if user is a member of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), feedback.teamId))
      .first();

    if (!membership) {
      throw new Error("You are not a member of this team");
    }

    if (!args.content.trim()) {
      throw new Error("Content cannot be empty");
    }

    // Create public note
    const noteId = await ctx.db.insert("publicNotes", {
      feedbackId: args.feedbackId,
      userId: user._id,
      content: args.content.trim(),
      createdAt: Date.now(),
    });

    return { noteId };
  },
});

/**
 * Get public notes for a feedback item (team view)
 */
export const getPublicNotes = query({
  args: {
    feedbackId: v.id("feedback"),
  },
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

    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) {
      return [];
    }

    // Check if user is a member of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), feedback.teamId))
      .first();

    if (!membership) {
      return [];
    }

    const publicNotes = await ctx.db
      .query("publicNotes")
      .withIndex("by_feedback", (q) => q.eq("feedbackId", args.feedbackId))
      .collect();

    // Get user details for each note
    const notesWithUsers = await Promise.all(
      publicNotes.map(async (note) => {
        const noteUser = await ctx.db.get(note.userId);
        return {
          _id: note._id,
          content: note.content,
          createdAt: note.createdAt,
          user: noteUser
            ? {
                _id: noteUser._id,
                name: noteUser.name,
                email: noteUser.email,
                avatar: noteUser.avatar,
              }
            : null,
        };
      })
    );

    return notesWithUsers;
  },
});

/**
 * Get submitter updates for a feedback item (team view)
 */
export const getSubmitterUpdates = query({
  args: {
    feedbackId: v.id("feedback"),
  },
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

    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) {
      return [];
    }

    // Check if user is a member of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), feedback.teamId))
      .first();

    if (!membership) {
      return [];
    }

    const updates = await ctx.db
      .query("submitterUpdates")
      .withIndex("by_feedback", (q) => q.eq("feedbackId", args.feedbackId))
      .collect();

    return updates;
  },
});

/**
 * Delete a public note
 */
export const deletePublicNote = mutation({
  args: {
    noteId: v.id("publicNotes"),
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

    const note = await ctx.db.get(args.noteId);
    if (!note) {
      throw new Error("Note not found");
    }

    const feedback = await ctx.db.get(note.feedbackId);
    if (!feedback) {
      throw new Error("Feedback not found");
    }

    // Check if user is a member of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), feedback.teamId))
      .first();

    if (!membership) {
      throw new Error("You are not a member of this team");
    }

    // Only the author or an admin can delete
    if (note.userId !== user._id && membership.role !== "admin") {
      throw new Error("You can only delete your own notes");
    }

    await ctx.db.delete(args.noteId);

    return { success: true };
  },
});

/**
 * Request a magic link to be sent via email
 * This creates the token and returns it for the API to send
 */
export const requestMagicLink = mutation({
  args: {
    feedbackId: v.id("feedback"),
  },
  handler: async (ctx, args) => {
    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) {
      throw new Error("Feedback not found");
    }

    if (!feedback.submitterEmail) {
      throw new Error("No email address associated with this feedback");
    }

    // Generate token
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const token = generateToken();

    // Check for existing token
    const existingToken = await ctx.db
      .query("submitterTokens")
      .withIndex("by_feedback", (q) => q.eq("feedbackId", args.feedbackId))
      .filter((q) => q.eq(q.field("email"), feedback.submitterEmail!.toLowerCase()))
      .first();

    if (existingToken) {
      await ctx.db.patch(existingToken._id, {
        token,
        expiresAt,
      });
    } else {
      await ctx.db.insert("submitterTokens", {
        feedbackId: args.feedbackId,
        email: feedback.submitterEmail.toLowerCase(),
        token,
        expiresAt,
        createdAt: Date.now(),
      });
    }

    return {
      token,
      email: feedback.submitterEmail,
      feedbackTitle: feedback.title,
    };
  },
});

/**
 * Check if submitter has email (to show/hide status link)
 */
export const hasSubmitterEmail = query({
  args: {
    feedbackId: v.id("feedback"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return false;
    }

    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) {
      return false;
    }

    // Check if user is a member of the team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), feedback.teamId))
      .first();

    if (!membership) {
      return false;
    }

    return !!feedback.submitterEmail;
  },
});

// ============================================================================
// GDPR COMPLIANCE FUNCTIONS
// ============================================================================

/**
 * Export all data for a submitter (GDPR data portability)
 * Submitter can access their own data via magic link token
 */
export const exportSubmitterData = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate token
    const tokenRecord = await ctx.db
      .query("submitterTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!tokenRecord || tokenRecord.expiresAt < Date.now()) {
      return { success: false, error: "Invalid or expired token" };
    }

    // Get feedback
    const feedback = await ctx.db.get(tokenRecord.feedbackId);
    if (!feedback) {
      return { success: false, error: "Feedback not found" };
    }

    // Get project name
    const project = await ctx.db.get(feedback.projectId);

    // Get public notes
    const publicNotes = await ctx.db
      .query("publicNotes")
      .withIndex("by_feedback", (q) => q.eq("feedbackId", feedback._id))
      .collect();

    // Get submitter updates
    const submitterUpdates = await ctx.db
      .query("submitterUpdates")
      .withIndex("by_feedback", (q) => q.eq("feedbackId", feedback._id))
      .collect();

    // Build export data (only submitter-related information)
    const exportData = {
      exportedAt: new Date().toISOString(),
      gdprExport: true,
      dataSubject: {
        email: tokenRecord.email,
        name: feedback.submitterName || null,
      },
      feedback: {
        id: feedback._id,
        ticketNumber: feedback.ticketNumber || null,
        title: feedback.title,
        description: feedback.description,
        type: feedback.type,
        status: feedback.status,
        createdAt: new Date(feedback.createdAt).toISOString(),
        resolvedAt: feedback.resolvedAt ? new Date(feedback.resolvedAt).toISOString() : null,
        projectName: project?.name || "Unknown",
      },
      media: {
        screenshotUrl: feedback.screenshotUrl || null,
        recordingUrl: feedback.recordingUrl || null,
        recordingDuration: feedback.recordingDuration || null,
      },
      metadata: {
        browser: feedback.metadata?.browser || null,
        os: feedback.metadata?.os || null,
        url: feedback.metadata?.url || null,
        screenSize: feedback.metadata?.screenWidth && feedback.metadata?.screenHeight
          ? `${feedback.metadata.screenWidth}x${feedback.metadata.screenHeight}`
          : null,
        submittedAt: feedback.metadata?.timestamp || null,
      },
      submitterUpdates: submitterUpdates.map((update) => ({
        content: update.content,
        createdAt: new Date(update.createdAt).toISOString(),
      })),
      publicNotes: publicNotes.map((note) => ({
        content: note.content,
        createdAt: new Date(note.createdAt).toISOString(),
      })),
    };

    return {
      success: true,
      data: exportData,
    };
  },
});

/**
 * Request deletion of submitter's personal data (GDPR right to erasure)
 * Anonymizes the feedback but keeps it for historical records
 */
export const requestDataDeletion = mutation({
  args: {
    token: v.string(),
    confirmDeletion: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (!args.confirmDeletion) {
      throw new Error("You must confirm the deletion request");
    }

    // Validate token
    const tokenRecord = await ctx.db
      .query("submitterTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!tokenRecord || tokenRecord.expiresAt < Date.now()) {
      throw new Error("Invalid or expired token");
    }

    // Get feedback
    const feedback = await ctx.db.get(tokenRecord.feedbackId);
    if (!feedback) {
      throw new Error("Feedback not found");
    }

    // Store the email before deletion for activity log
    const submitterEmail = feedback.submitterEmail;

    // Anonymize the feedback - remove PII but keep the feedback itself
    await ctx.db.patch(feedback._id, {
      submitterEmail: undefined,
      submitterName: undefined,
      // Keep: title, description, type, status, metadata (browser/os info)
      // These are not personally identifiable
    });

    // Delete submitter updates (contains user-written content that may have PII)
    const submitterUpdates = await ctx.db
      .query("submitterUpdates")
      .withIndex("by_feedback", (q) => q.eq("feedbackId", feedback._id))
      .collect();

    for (const update of submitterUpdates) {
      await ctx.db.delete(update._id);
    }

    // Delete all magic link tokens for this feedback
    const tokens = await ctx.db
      .query("submitterTokens")
      .withIndex("by_feedback", (q) => q.eq("feedbackId", feedback._id))
      .collect();

    for (const token of tokens) {
      await ctx.db.delete(token._id);
    }

    // Create activity log entry for audit trail
    await ctx.db.insert("activityLog", {
      feedbackId: feedback._id,
      action: "exported",
      details: {
        to: "gdpr_deletion",
        extra: `Submitter PII removed via GDPR deletion request. Original email: ${submitterEmail ? "[REDACTED]" : "none"}`,
      },
      createdAt: Date.now(),
    });

    return {
      success: true,
      message: "Your personal data has been deleted. The anonymized feedback record has been retained for historical purposes.",
    };
  },
});

/**
 * Check if submitter data can still be deleted (for UI)
 */
export const canDeleteData = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate token
    const tokenRecord = await ctx.db
      .query("submitterTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!tokenRecord || tokenRecord.expiresAt < Date.now()) {
      return { canDelete: false, reason: "Invalid or expired token" };
    }

    // Get feedback
    const feedback = await ctx.db.get(tokenRecord.feedbackId);
    if (!feedback) {
      return { canDelete: false, reason: "Feedback not found" };
    }

    // Check if data is already deleted
    if (!feedback.submitterEmail && !feedback.submitterName) {
      return { canDelete: false, reason: "Personal data has already been deleted" };
    }

    return { canDelete: true };
  },
});
