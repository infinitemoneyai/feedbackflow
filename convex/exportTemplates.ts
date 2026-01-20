import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Default export templates for each provider
 */
export const DEFAULT_TEMPLATES = {
  linear: {
    name: "Default Linear Template",
    template: `# {{title}}

{{description}}

## Details

- **Type:** {{type}}
- **Priority:** {{priority}}
- **Status:** {{status}}

{{#if reproSteps}}
## Reproduction Steps
{{#each reproSteps}}
{{@index}}. {{this}}
{{/each}}
{{/if}}

{{#if expectedBehavior}}
## Expected Behavior
{{expectedBehavior}}
{{/if}}

{{#if actualBehavior}}
## Actual Behavior
{{actualBehavior}}
{{/if}}

{{#if acceptanceCriteria}}
## Acceptance Criteria
{{#each acceptanceCriteria}}
- [ ] {{this}}
{{/each}}
{{/if}}

## Environment
- URL: {{metadata.url}}
- Browser: {{metadata.browser}}
- OS: {{metadata.os}}
- Screen: {{metadata.screenWidth}}x{{metadata.screenHeight}}

{{#if screenshotUrl}}
## Screenshot
{{screenshotUrl}}
{{/if}}

{{#if recordingUrl}}
## Recording
{{recordingUrl}}
{{/if}}

{{#if tags}}
**Tags:** {{join tags ", "}}
{{/if}}

---
*Submitted by {{submitterName}} ({{submitterEmail}}) via FeedbackFlow*`,
  },
  notion: {
    name: "Default Notion Template",
    template: `# {{title}}

{{description}}

---

## Details

| Property | Value |
|----------|-------|
| Type | {{type}} |
| Priority | {{priority}} |
| Status | {{status}} |
| Submitter | {{submitterName}} |

{{#if reproSteps}}
## Reproduction Steps
{{#each reproSteps}}
{{@index}}. {{this}}
{{/each}}
{{/if}}

{{#if expectedBehavior}}
## Expected Behavior
{{expectedBehavior}}
{{/if}}

{{#if actualBehavior}}
## Actual Behavior
{{actualBehavior}}
{{/if}}

{{#if acceptanceCriteria}}
## Acceptance Criteria
{{#each acceptanceCriteria}}
- [ ] {{this}}
{{/each}}
{{/if}}

## Environment
- **URL:** {{metadata.url}}
- **Browser:** {{metadata.browser}}
- **OS:** {{metadata.os}}
- **Screen Size:** {{metadata.screenWidth}}x{{metadata.screenHeight}}

{{#if screenshotUrl}}
## Attachments
- Screenshot: {{screenshotUrl}}
{{/if}}

{{#if recordingUrl}}
- Recording: {{recordingUrl}}
{{/if}}

{{#if tags}}
---
**Tags:** {{join tags ", "}}
{{/if}}`,
  },
  json: {
    name: "Default JSON Template",
    template: `{
  "id": "{{id}}",
  "title": "{{title}}",
  "description": "{{description}}",
  "type": "{{type}}",
  "priority": {{priorityNumber}},
  "status": "{{status}}",
  "acceptanceCriteria": [
    {{#each acceptanceCriteria}}
    "{{this}}"{{#unless @last}},{{/unless}}
    {{/each}}
  ],
  "tags": [{{#each tags}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}],
  "environment": {
    "url": "{{metadata.url}}",
    "browser": "{{metadata.browser}}",
    "os": "{{metadata.os}}",
    "screenWidth": {{metadata.screenWidth}},
    "screenHeight": {{metadata.screenHeight}}
  },
  "submitter": {
    "name": "{{submitterName}}",
    "email": "{{submitterEmail}}"
  },
  "media": {
    "screenshotUrl": "{{screenshotUrl}}",
    "recordingUrl": "{{recordingUrl}}"
  },
  "createdAt": "{{createdAt}}",
  "passes": false,
  "notes": "{{notes}}"
}`,
  },
};

/**
 * Available template variables documentation
 */
export const TEMPLATE_VARIABLES = [
  { name: "id", description: "Feedback ID (FF-XXXXXX format)", example: "FF-ABC123" },
  { name: "title", description: "Feedback title (or ticket draft title if available)", example: "Login button not working" },
  { name: "description", description: "Full description of the feedback", example: "When I click login..." },
  { name: "type", description: "Type of feedback", example: "bug" },
  { name: "priority", description: "Priority level", example: "high" },
  { name: "priorityNumber", description: "Priority as number (1=critical, 4=low)", example: "2" },
  { name: "status", description: "Current status", example: "new" },
  { name: "tags", description: "Array of tags", example: '["auth", "urgent"]' },
  { name: "submitterName", description: "Name of submitter", example: "John Doe" },
  { name: "submitterEmail", description: "Email of submitter", example: "john@example.com" },
  { name: "screenshotUrl", description: "URL to screenshot if available", example: "https://..." },
  { name: "recordingUrl", description: "URL to recording if available", example: "https://..." },
  { name: "metadata.url", description: "URL where feedback was submitted", example: "https://app.com/dashboard" },
  { name: "metadata.browser", description: "User's browser", example: "Chrome 120" },
  { name: "metadata.os", description: "User's operating system", example: "macOS 14.0" },
  { name: "metadata.screenWidth", description: "Screen width in pixels", example: "1920" },
  { name: "metadata.screenHeight", description: "Screen height in pixels", example: "1080" },
  { name: "acceptanceCriteria", description: "Array of acceptance criteria (from ticket draft or generated)", example: '["Fix is implemented"]' },
  { name: "reproSteps", description: "Array of reproduction steps (from ticket draft)", example: '["Click login", "Enter password"]' },
  { name: "expectedBehavior", description: "Expected behavior (from ticket draft)", example: "Should redirect to dashboard" },
  { name: "actualBehavior", description: "Actual behavior (from ticket draft)", example: "Shows error message" },
  { name: "createdAt", description: "ISO timestamp of when feedback was created", example: "2024-01-15T10:30:00Z" },
  { name: "notes", description: "Combined notes with all context", example: "Full markdown notes..." },
];

/**
 * Get all export templates for a project
 */
export const getExportTemplates = query({
  args: {
    projectId: v.id("projects"),
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

    // Get project to verify team membership
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return [];
    }

    // Check team membership
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), project.teamId))
      .first();

    if (!membership) {
      return [];
    }

    // Get all templates for the project
    const templates = await ctx.db
      .query("exportTemplates")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    return templates;
  },
});

/**
 * Get export template for a specific provider
 */
export const getExportTemplate = query({
  args: {
    projectId: v.id("projects"),
    provider: v.union(v.literal("linear"), v.literal("notion"), v.literal("json")),
  },
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

    // Get project to verify team membership
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return null;
    }

    // Check team membership
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), project.teamId))
      .first();

    if (!membership) {
      return null;
    }

    // Get template for the provider
    const template = await ctx.db
      .query("exportTemplates")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("provider"), args.provider))
      .first();

    // Return the template or default
    if (template) {
      return template;
    }

    // Return default template structure (not saved yet)
    const defaultTemplate = DEFAULT_TEMPLATES[args.provider];
    return {
      _id: null,
      projectId: args.projectId,
      provider: args.provider,
      name: defaultTemplate.name,
      template: defaultTemplate.template,
      isDefault: true,
      createdAt: 0,
      updatedAt: 0,
    };
  },
});

/**
 * Create or update an export template
 */
export const saveExportTemplate = mutation({
  args: {
    projectId: v.id("projects"),
    provider: v.union(v.literal("linear"), v.literal("notion"), v.literal("json")),
    name: v.string(),
    template: v.string(),
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

    // Get project to verify team membership
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check team membership (must be admin)
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), project.teamId))
      .first();

    if (!membership || membership.role !== "admin") {
      throw new Error("Only admins can modify export templates");
    }

    const now = Date.now();

    // Check if template already exists
    const existing = await ctx.db
      .query("exportTemplates")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("provider"), args.provider))
      .first();

    if (existing) {
      // Update existing template
      await ctx.db.patch(existing._id, {
        name: args.name,
        template: args.template,
        isDefault: false,
        updatedAt: now,
      });
      return { id: existing._id, updated: true };
    } else {
      // Create new template
      const id = await ctx.db.insert("exportTemplates", {
        projectId: args.projectId,
        provider: args.provider,
        name: args.name,
        template: args.template,
        isDefault: false,
        createdAt: now,
        updatedAt: now,
      });
      return { id, updated: false };
    }
  },
});

/**
 * Reset an export template to default
 */
export const resetExportTemplate = mutation({
  args: {
    projectId: v.id("projects"),
    provider: v.union(v.literal("linear"), v.literal("notion"), v.literal("json")),
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

    // Get project to verify team membership
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check team membership (must be admin)
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), project.teamId))
      .first();

    if (!membership || membership.role !== "admin") {
      throw new Error("Only admins can modify export templates");
    }

    // Delete existing custom template (will fall back to default)
    const existing = await ctx.db
      .query("exportTemplates")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("provider"), args.provider))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    return { success: true };
  },
});

/**
 * Delete an export template
 */
export const deleteExportTemplate = mutation({
  args: {
    templateId: v.id("exportTemplates"),
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

    // Get template
    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    // Get project to verify team membership
    const project = await ctx.db.get(template.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check team membership (must be admin)
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), project.teamId))
      .first();

    if (!membership || membership.role !== "admin") {
      throw new Error("Only admins can delete export templates");
    }

    await ctx.db.delete(args.templateId);
    return { success: true };
  },
});

/**
 * Get available template variables
 */
export const getTemplateVariables = query({
  args: {},
  handler: async () => {
    return TEMPLATE_VARIABLES;
  },
});
