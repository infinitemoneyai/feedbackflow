import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// ============================================================================
// FeedbackFlow Database Schema
// ============================================================================

export default defineSchema({
  // ==========================================================================
  // Users & Teams
  // ==========================================================================

  /**
   * Users table - synced from Clerk
   */
  users: defineTable({
    // Clerk user ID
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
    createdAt: v.number(),
    // Onboarding state (1-7, undefined = complete/returning user)
    onboardingStep: v.optional(v.number()),
    onboardingCompletedAt: v.optional(v.number()),
    // Onboarding data (key-value store for temporary onboarding state)
    onboardingData: v.optional(v.object({
      pendingInvites: v.optional(v.string()),
    })),
    // Legal acceptance
    termsAcceptedAt: v.optional(v.number()),
    termsVersion: v.optional(v.string()),
    privacyAcceptedAt: v.optional(v.number()),
    privacyVersion: v.optional(v.string()),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  /**
   * Teams/workspaces
   */
  teams: defineTable({
    name: v.string(),
    slug: v.string(),
    ownerId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_owner", ["ownerId"]),

  /**
   * Team membership with roles
   */
  teamMembers: defineTable({
    userId: v.id("users"),
    teamId: v.id("teams"),
    role: v.union(v.literal("admin"), v.literal("member")),
    joinedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_team", ["teamId"])
    .index("by_user_and_team", ["userId", "teamId"]),

  /**
   * Team invitations
   */
  teamInvites: defineTable({
    teamId: v.id("teams"),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("member")),
    invitedBy: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_team", ["teamId"])
    .index("by_email", ["email"])
    .index("by_token", ["token"]),

  // ==========================================================================
  // Projects & Widgets
  // ==========================================================================

  /**
   * Projects - feedback collection containers
   */
  projects: defineTable({
    teamId: v.id("teams"),
    name: v.string(),
    code: v.optional(v.string()), // 2-4 char uppercase code for ticket numbering (e.g., "FF")
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
    createdAt: v.number(),
  })
    .index("by_team", ["teamId"])
    .index("by_team_and_name", ["teamId", "name"])
    .index("by_team_and_code", ["teamId", "code"]),

  /**
   * Widgets - embeddable instances
   */
  widgets: defineTable({
    projectId: v.id("projects"),
    widgetKey: v.string(), // Public key for embedding
    siteUrl: v.optional(v.string()), // Allowed site URL
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_widget_key", ["widgetKey"]),

  /**
   * Widget configuration
   */
  widgetConfig: defineTable({
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
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_widget", ["widgetId"]),

  // ==========================================================================
  // Feedback
  // ==========================================================================

  /**
   * Main feedback table
   */
  feedback: defineTable({
    widgetId: v.optional(v.id("widgets")),
    projectId: v.id("projects"),
    teamId: v.id("teams"),
    reviewLinkId: v.optional(v.id("reviewLinks")),
    reviewerEmail: v.optional(v.string()),
    source: v.optional(v.union(v.literal("widget"), v.literal("review"))),

    // Ticket numbering
    ticketNumber: v.optional(v.number()), // Sequential per project: 1, 2, 3...

    // Type and content
    type: v.union(v.literal("bug"), v.literal("feature")),
    title: v.string(),
    description: v.optional(v.string()),

    // Media
    screenshotUrl: v.optional(v.string()),
    screenshotStorageId: v.optional(v.id("_storage")),
    recordingUrl: v.optional(v.string()),
    recordingStorageId: v.optional(v.id("_storage")),
    recordingDuration: v.optional(v.number()), // in seconds

    // Status and priority
    status: v.union(
      v.literal("new"),
      v.literal("triaging"),
      v.literal("drafted"),
      v.literal("exported"),
      v.literal("resolved")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    tags: v.array(v.string()),

    // Submitter info (optional)
    submitterEmail: v.optional(v.string()),
    submitterName: v.optional(v.string()),

    // Assignment
    assigneeId: v.optional(v.id("users")),

    // Metadata from submission
    metadata: v.object({
      browser: v.optional(v.string()),
      os: v.optional(v.string()),
      url: v.optional(v.string()),
      screenWidth: v.optional(v.number()),
      screenHeight: v.optional(v.number()),
      userAgent: v.optional(v.string()),
      timestamp: v.number(),
    }),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_project", ["projectId"])
    .index("by_team", ["teamId"])
    .index("by_widget", ["widgetId"])
    .index("by_status", ["projectId", "status"])
    .index("by_priority", ["projectId", "priority"])
    .index("by_type", ["projectId", "type"])
    .index("by_assignee", ["assigneeId"])
    .index("by_created_at", ["projectId", "createdAt"])
    .searchIndex("search_content", {
      searchField: "title",
      filterFields: ["projectId", "status", "type", "priority"],
    }),

  // ==========================================================================
  // AI & Conversations
  // ==========================================================================

  /**
   * AI analysis results for feedback
   */
  aiAnalysis: defineTable({
    feedbackId: v.id("feedback"),

    // Categorization
    suggestedType: v.optional(v.union(v.literal("bug"), v.literal("feature"))),
    typeConfidence: v.optional(v.number()),
    suggestedPriority: v.optional(
      v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("critical")
      )
    ),
    priorityConfidence: v.optional(v.number()),
    suggestedTags: v.array(v.string()),

    // Analysis
    summary: v.optional(v.string()),
    affectedComponent: v.optional(v.string()),
    potentialCauses: v.array(v.string()),
    suggestedSolutions: v.array(v.string()),

    // Metadata
    provider: v.union(v.literal("openai"), v.literal("anthropic")),
    model: v.string(),
    createdAt: v.number(),
  }).index("by_feedback", ["feedbackId"]),

  /**
   * AI conversation messages
   */
  conversations: defineTable({
    feedbackId: v.id("feedback"),
    userId: v.id("users"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    provider: v.optional(v.union(v.literal("openai"), v.literal("anthropic"))),
    model: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_feedback", ["feedbackId"])
    .index("by_feedback_and_created", ["feedbackId", "createdAt"]),

  /**
   * AI solution suggestions for feedback
   */
  solutionSuggestions: defineTable({
    feedbackId: v.id("feedback"),

    // Suggestions array
    suggestions: v.array(
      v.object({
        title: v.string(),
        description: v.string(),
        type: v.union(
          v.literal("investigation"),
          v.literal("fix"),
          v.literal("workaround"),
          v.literal("implementation"),
          v.literal("consideration")
        ),
        effort: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
        impact: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
      })
    ),

    // Summary and next steps
    summary: v.string(),
    nextSteps: v.array(v.string()),

    // Metadata
    provider: v.union(v.literal("openai"), v.literal("anthropic")),
    model: v.string(),
    createdAt: v.number(),
  }).index("by_feedback", ["feedbackId"]),

  /**
   * Drafted tickets from AI
   */
  ticketDrafts: defineTable({
    feedbackId: v.id("feedback"),
    userId: v.id("users"),
    title: v.string(),
    description: v.string(),
    acceptanceCriteria: v.array(v.string()),
    reproSteps: v.optional(v.array(v.string())),
    expectedBehavior: v.optional(v.string()),
    actualBehavior: v.optional(v.string()),
    provider: v.union(v.literal("openai"), v.literal("anthropic")),
    model: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_feedback", ["feedbackId"])
    .index("by_user", ["userId"]),

  // ==========================================================================
  // Comments & Activity
  // ==========================================================================

  /**
   * Team comments on feedback
   */
  comments: defineTable({
    feedbackId: v.id("feedback"),
    userId: v.id("users"),
    content: v.string(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_feedback", ["feedbackId"])
    .index("by_feedback_and_created", ["feedbackId", "createdAt"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["feedbackId"],
    }),

  /**
   * Activity log (audit trail)
   */
  activityLog: defineTable({
    feedbackId: v.id("feedback"),
    userId: v.optional(v.id("users")), // null for system actions
    action: v.union(
      v.literal("created"),
      v.literal("status_changed"),
      v.literal("priority_changed"),
      v.literal("assigned"),
      v.literal("unassigned"),
      v.literal("tagged"),
      v.literal("exported"),
      v.literal("commented"),
      v.literal("ai_analyzed"),
      v.literal("ticket_drafted"),
      v.literal("automation_executed")
    ),
    details: v.optional(
      v.object({
        from: v.optional(v.string()),
        to: v.optional(v.string()),
        extra: v.optional(v.string()),
      })
    ),
    createdAt: v.number(),
  })
    .index("by_feedback", ["feedbackId"])
    .index("by_feedback_and_created", ["feedbackId", "createdAt"]),

  // ==========================================================================
  // Integrations & Exports
  // ==========================================================================

  /**
   * External integrations (Linear, Notion)
   */
  integrations: defineTable({
    teamId: v.id("teams"),
    provider: v.union(v.literal("linear"), v.literal("notion")),

    // Encrypted credentials
    accessToken: v.string(), // Encrypted
    refreshToken: v.optional(v.string()), // Encrypted

    // Provider-specific settings
    settings: v.optional(
      v.object({
        // Linear
        linearTeamId: v.optional(v.string()),
        linearProjectId: v.optional(v.string()),
        linearLabelIds: v.optional(v.array(v.string())),
        // Notion
        notionDatabaseId: v.optional(v.string()),
        notionPropertyMapping: v.optional(v.any()),
      })
    ),

    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_team", ["teamId"])
    .index("by_team_and_provider", ["teamId", "provider"]),

  /**
   * Export history
   */
  exports: defineTable({
    feedbackId: v.id("feedback"),
    userId: v.optional(v.id("users")), // Optional for automation-created exports
    provider: v.union(
      v.literal("linear"),
      v.literal("notion"),
      v.literal("json")
    ),

    // External reference
    externalId: v.optional(v.string()), // Linear issue ID, Notion page ID
    externalUrl: v.optional(v.string()),

    // Export data snapshot
    exportedData: v.optional(v.any()),

    status: v.union(v.literal("success"), v.literal("failed")),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_feedback", ["feedbackId"])
    .index("by_user", ["userId"]),

  /**
   * Export templates
   */
  exportTemplates: defineTable({
    projectId: v.id("projects"),
    provider: v.union(
      v.literal("linear"),
      v.literal("notion"),
      v.literal("json")
    ),
    name: v.string(),
    template: v.string(), // Template with {{variables}}
    isDefault: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_project_and_provider", ["projectId", "provider"]),

  /**
   * Automation rules
   */
  automationRules: defineTable({
    projectId: v.id("projects"),
    name: v.string(),
    isEnabled: v.boolean(),

    // Trigger
    trigger: v.union(
      v.literal("new_feedback"),
      v.literal("status_changed"),
      v.literal("priority_changed")
    ),

    // Conditions
    conditions: v.array(
      v.object({
        field: v.union(
          v.literal("type"),
          v.literal("priority"),
          v.literal("status"),
          v.literal("tags")
        ),
        operator: v.union(
          v.literal("equals"),
          v.literal("not_equals"),
          v.literal("contains")
        ),
        value: v.string(),
      })
    ),

    // Action
    action: v.union(
      v.literal("export_linear"),
      v.literal("export_notion"),
      v.literal("send_webhook"),
      v.literal("assign_user"),
      v.literal("set_priority"),
      v.literal("add_tag")
    ),
    actionConfig: v.optional(
      v.object({
        targetUserId: v.optional(v.id("users")),
        priority: v.optional(v.string()),
        tag: v.optional(v.string()),
        webhookId: v.optional(v.id("webhooks")),
      })
    ),

    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_project", ["projectId"]),

  /**
   * Webhooks configuration
   */
  webhooks: defineTable({
    teamId: v.id("teams"),
    url: v.string(),
    secret: v.string(), // For HMAC signature
    events: v.array(
      v.union(
        v.literal("new_feedback"),
        v.literal("status_changed"),
        v.literal("exported")
      )
    ),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_team", ["teamId"]),

  /**
   * Webhook delivery logs
   */
  webhookLogs: defineTable({
    webhookId: v.id("webhooks"),
    feedbackId: v.optional(v.id("feedback")),
    event: v.string(),
    payload: v.any(),
    responseStatus: v.optional(v.number()),
    responseBody: v.optional(v.string()),
    attempt: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("success"),
      v.literal("failed")
    ),
    error: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_webhook", ["webhookId"])
    .index("by_feedback", ["feedbackId"]),

  // ==========================================================================
  // Settings & Configuration
  // ==========================================================================

  /**
   * User API keys (for AI providers)
   */
  apiKeys: defineTable({
    userId: v.id("users"),
    teamId: v.id("teams"),
    provider: v.union(v.literal("openai"), v.literal("anthropic")),
    encryptedKey: v.string(), // AES-256 encrypted
    keyHint: v.string(), // Last 4 chars for display
    model: v.optional(v.string()), // Preferred model
    isValid: v.boolean(),
    lastValidatedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_team", ["teamId"])
    .index("by_team_and_provider", ["teamId", "provider"]),

  /**
   * External storage configuration
   */
  storageConfig: defineTable({
    teamId: v.id("teams"),
    provider: v.union(v.literal("s3"), v.literal("r2"), v.literal("gcs")),

    // Encrypted credentials
    credentials: v.string(), // Encrypted JSON

    // Configuration
    bucket: v.string(),
    region: v.optional(v.string()),
    endpoint: v.optional(v.string()), // For S3-compatible

    isActive: v.boolean(),
    lastTestedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_team", ["teamId"]),

  // ==========================================================================
  // Notifications
  // ==========================================================================

  /**
   * User notifications
   */
  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("new_feedback"),
      v.literal("assignment"),
      v.literal("comment"),
      v.literal("mention"),
      v.literal("export_complete"),
      v.literal("export_failed")
    ),
    title: v.string(),
    body: v.optional(v.string()),
    feedbackId: v.optional(v.id("feedback")),
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_read", ["userId", "isRead"])
    .index("by_user_and_created", ["userId", "createdAt"]),

  /**
   * User notification preferences
   */
  notificationPreferences: defineTable({
    userId: v.id("users"),
    emailEnabled: v.boolean(),
    emailFrequency: v.union(
      v.literal("instant"),
      v.literal("daily"),
      v.literal("weekly")
    ),
    inAppEnabled: v.boolean(),
    events: v.object({
      newFeedback: v.boolean(),
      assignment: v.boolean(),
      comments: v.boolean(),
      mentions: v.boolean(),
      exports: v.boolean(),
    }),
    // Token for unsubscribe links in emails
    unsubscribeToken: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_unsubscribe_token", ["unsubscribeToken"]),

  /**
   * Email digest queue - stores notifications to be sent in digests
   */
  emailDigestQueue: defineTable({
    userId: v.id("users"),
    notificationType: v.union(
      v.literal("new_feedback"),
      v.literal("assignment"),
      v.literal("comment"),
      v.literal("mention"),
      v.literal("export_complete"),
      v.literal("export_failed")
    ),
    feedbackId: v.optional(v.id("feedback")),
    title: v.string(),
    body: v.optional(v.string()),
    projectName: v.optional(v.string()),
    metadata: v.optional(
      v.object({
        feedbackTitle: v.optional(v.string()),
        actorName: v.optional(v.string()),
        commentPreview: v.optional(v.string()),
      })
    ),
    createdAt: v.number(),
    // Indicates if this has been included in a digest
    sentAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_sent", ["userId", "sentAt"]),

  // ==========================================================================
  // Billing & Usage
  // ==========================================================================

  /**
   * Team subscriptions (Stripe)
   */
  subscriptions: defineTable({
    teamId: v.id("teams"),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
    plan: v.union(v.literal("free"), v.literal("pro")),
    seats: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("past_due"),
      v.literal("trialing")
    ),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_team", ["teamId"])
    .index("by_stripe_customer", ["stripeCustomerId"])
    .index("by_stripe_subscription", ["stripeSubscriptionId"]),

  /**
   * Usage tracking per team per month
   */
  usageTracking: defineTable({
    teamId: v.id("teams"),
    year: v.number(),
    month: v.number(), // 1-12
    feedbackCount: v.number(),
    aiCallCount: v.number(),
    storageUsedBytes: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_team", ["teamId"])
    .index("by_team_and_period", ["teamId", "year", "month"]),

  // ==========================================================================
  // API Access
  // ==========================================================================

  /**
   * REST API keys for external access
   */
  restApiKeys: defineTable({
    teamId: v.id("teams"),
    userId: v.id("users"), // Who created it
    name: v.string(),
    keyHash: v.string(), // SHA-256 hash of the key
    keyPrefix: v.string(), // First 8 chars for identification
    permissions: v.array(
      v.union(
        v.literal("read:feedback"),
        v.literal("write:feedback"),
        v.literal("read:projects"),
        v.literal("write:projects")
      )
    ),
    lastUsedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_team", ["teamId"])
    .index("by_key_prefix", ["keyPrefix"]),

  // ==========================================================================
  // Submitter Portal
  // ==========================================================================

  /**
   * Magic links for submitter status access
   */
  submitterTokens: defineTable({
    feedbackId: v.id("feedback"),
    email: v.string(),
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_feedback", ["feedbackId"])
    .index("by_token", ["token"])
    .index("by_email", ["email"]),

  /**
   * Submitter updates (additional context from submitter)
   */
  submitterUpdates: defineTable({
    feedbackId: v.id("feedback"),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_feedback", ["feedbackId"]),

  /**
   * Public resolution notes (visible to submitters)
   */
  publicNotes: defineTable({
    feedbackId: v.id("feedback"),
    userId: v.id("users"),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_feedback", ["feedbackId"]),

  // ==========================================================================
  // Site Review
  // ==========================================================================

  /**
   * Review links for external site review access
   */
  reviewLinks: defineTable({
    projectId: v.id("projects"),
    teamId: v.id("teams"),
    slug: v.string(),
    siteUrl: v.string(),
    passwordHash: v.optional(v.string()),
    createdBy: v.id("users"),
    isActive: v.boolean(),
    createdAt: v.number(),
    expiresAt: v.optional(v.number()),
  })
    .index("by_slug", ["slug"])
    .index("by_project", ["projectId"]),

  /**
   * Reviewers who accessed review links
   */
  reviewers: defineTable({
    reviewLinkId: v.id("reviewLinks"),
    email: v.string(),
    sessionToken: v.string(),
    firstAccessedAt: v.number(),
    lastAccessedAt: v.number(),
  })
    .index("by_session_token", ["sessionToken"])
    .index("by_review_link", ["reviewLinkId"]),
});
