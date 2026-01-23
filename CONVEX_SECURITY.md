# Convex Security Guide for FeedbackFlow

This document outlines the security architecture and best practices for FeedbackFlow's Convex backend.

## Table of Contents

- [Security Architecture Overview](#security-architecture-overview)
- [Authentication Patterns](#authentication-patterns)
- [Authorization Patterns](#authorization-patterns)
- [Public Endpoints](#public-endpoints)
- [Rate Limiting](#rate-limiting)
- [Data Isolation](#data-isolation)
- [Security Checklist](#security-checklist)
- [Common Vulnerabilities](#common-vulnerabilities)

---

## Security Architecture Overview

FeedbackFlow uses a **multi-layered security approach**:

1. **Clerk Authentication** - User identity management
2. **Team-based Authorization** - Role-based access control (admin/member)
3. **API Key Authentication** - For REST API and widget submissions
4. **Token-based Access** - For submitter portal (magic links)
5. **Rate Limiting** - At API route level (Next.js middleware)

### Security Layers

```
┌─────────────────────────────────────────────────────────┐
│ 1. Next.js Middleware (Clerk Auth + Rate Limiting)     │
├─────────────────────────────────────────────────────────┤
│ 2. API Routes (Input Validation + Auth Checks)         │
├─────────────────────────────────────────────────────────┤
│ 3. Convex Functions (Authorization + Data Validation)  │
├─────────────────────────────────────────────────────────┤
│ 4. Database (Team Isolation + Indexes)                 │
└─────────────────────────────────────────────────────────┘
```

---

## Authentication Patterns

### 1. Clerk Authentication (Dashboard Users)

**Pattern used in:** All dashboard queries/mutations

```typescript
// Standard pattern in convex/apiKeys.ts, convex/projects.ts, etc.
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
```

**✅ This is secure** - Clerk handles JWT validation automatically.

### 2. API Key Authentication (REST API)

**Pattern used in:** `convex/restApiKeys.ts`

```typescript
// API routes validate keys via validateApiKeyPublic query
export const validateApiKeyPublic = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const keyPrefix = args.key.slice(0, 8);
    const potentialKeys = await ctx.db
      .query("restApiKeys")
      .withIndex("by_key_prefix", (q) => q.eq("keyPrefix", keyPrefix))
      .collect();

    for (const apiKey of potentialKeys) {
      if (verifyKey(args.key, apiKey.keyHash)) {
        // Check active status and expiration
        if (!apiKey.isActive) return { valid: false, error: "Revoked" };
        if (apiKey.expiresAt && apiKey.expiresAt < Date.now()) {
          return { valid: false, error: "Expired" };
        }
        
        return {
          valid: true,
          teamId: apiKey.teamId,
          permissions: apiKey.permissions,
        };
      }
    }
    return { valid: false, error: "Invalid" };
  },
});
```

**✅ Secure features:**
- Keys are hashed (SHA-256) before storage
- Only prefix stored for lookup
- Supports expiration
- Supports revocation
- Permission-based access control

### 3. Widget Key Authentication

**Pattern used in:** `convex/feedback.ts` - `submitFromWidget`

```typescript
// Widget submissions validate widget key
const widget = await ctx.db
  .query("widgets")
  .withIndex("by_widget_key", (q) => q.eq("widgetKey", args.widgetKey))
  .first();

if (!widget) {
  throw new Error("Invalid widget key");
}

if (!widget.isActive) {
  throw new Error("Widget is not active");
}
```

**⚠️ Security considerations:**
- Widget keys are **not** secret (embedded in public JavaScript)
- Rate limiting must be enforced at API route level
- Honeypot field helps prevent spam
- Consider adding domain restrictions (CORS)

### 4. Token Authentication (Submitter Portal)

**Pattern used in:** `convex/submitterPortal.ts`

```typescript
// Magic link tokens for submitter access
const tokenRecord = await ctx.db
  .query("submitterTokens")
  .withIndex("by_token", (q) => q.eq("token", args.token))
  .first();

if (!tokenRecord || tokenRecord.expiresAt < Date.now()) {
  return null;
}
```

**✅ Secure features:**
- Tokens expire (default 30 days)
- One token per feedback item
- Limited scope (only their own feedback)

---

## Authorization Patterns

### Team Membership Verification

**Standard pattern across all protected queries/mutations:**

```typescript
// 1. Get authenticated user (see above)
const user = await ctx.db
  .query("users")
  .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
  .first();

// 2. Verify team membership
const membership = await ctx.db
  .query("teamMembers")
  .withIndex("by_user", (q) => q.eq("userId", user._id))
  .filter((q) => q.eq(q.field("teamId"), args.teamId))
  .first();

if (!membership) {
  throw new Error("Not a member of this team");
}

// 3. Check role if admin-only action
if (membership.role !== "admin") {
  throw new Error("Only admins can perform this action");
}
```

**Used in:**
- `convex/apiKeys.ts` - API key management (admin only)
- `convex/projects.ts` - Project deletion (admin only)
- `convex/teams.ts` - Team settings (admin only)
- `convex/integrations.ts` - Integration management (admin only)
- `convex/webhooks.ts` - Webhook configuration (admin only)

### Resource Ownership Verification

**Pattern for accessing specific resources:**

```typescript
// Example from convex/feedback.ts
const feedback = await ctx.db.get(args.feedbackId);
if (!feedback) {
  throw new Error("Feedback not found");
}

// Verify user has access via team membership
const membership = await ctx.db
  .query("teamMembers")
  .withIndex("by_user", (q) => q.eq("userId", user._id))
  .filter((q) => q.eq(q.field("teamId"), feedback.teamId))
  .first();

if (!membership) {
  throw new Error("Access denied");
}
```

---

## Public Endpoints

These endpoints are accessible **without authentication**. Each has specific security measures:

### 1. Widget Submission (`convex/feedback.ts`)

```typescript
export const submitFromWidget = mutation({
  args: {
    widgetKey: v.string(),
    // ... other args
  },
  handler: async (ctx, args) => {
    // Validates widget key and active status
    // No user authentication required
  },
});
```

**Security measures:**
- ✅ Widget key validation
- ✅ Active status check
- ✅ Rate limiting (API route level)
- ✅ Honeypot field (API route level)
- ⚠️ **MUST** enforce rate limiting in API route
- ⚠️ Consider CORS restrictions

### 2. Submitter Portal (`convex/submitterPortal.ts`)

```typescript
export const getPublicFeedbackStatus = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    // Returns limited, public-safe information
    // Only shows status, public notes, no internal data
  },
});
```

**Security measures:**
- ✅ Token validation with expiration
- ✅ Limited data exposure (no internal comments)
- ✅ One token per feedback item
- ✅ No team/user information exposed

### 3. API Key Validation (`convex/restApiKeys.ts`)

```typescript
export const validateApiKeyPublic = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    // Validates API key and returns permissions
  },
});
```

**Security measures:**
- ✅ Hash verification (constant-time comparison)
- ✅ Expiration check
- ✅ Active status check
- ✅ Permission-based access

---

## Rate Limiting

### Current Implementation

Rate limiting is implemented at the **API route level** using `lib/rate-limit.ts`:

```typescript
// In-memory rate limiting (development)
// For production, use @upstash/ratelimit with Redis
```

**⚠️ CRITICAL for Production:**

1. **Replace in-memory rate limiting with Redis-based solution**

```bash
npm install @upstash/ratelimit @upstash/redis
```

2. **Update `lib/rate-limit.ts`:**

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const widgetRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per minute
  analytics: true,
});

export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requests per minute
  analytics: true,
});
```

3. **Apply to API routes:**

```typescript
// app/api/widget/submit/route.ts
import { widgetRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  // Rate limit by IP
  const ip = req.headers.get("x-forwarded-for") || "anonymous";
  const { success } = await widgetRateLimit.limit(ip);
  
  if (!success) {
    return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
  }
  
  // ... rest of handler
}
```

### Rate Limit Recommendations

| Endpoint | Limit | Window | Notes |
|----------|-------|--------|-------|
| Widget submissions | 10 | 1 minute | Per IP address |
| REST API | 100 | 1 minute | Per API key |
| Submitter portal | 20 | 1 minute | Per token |
| Dashboard API | 1000 | 1 minute | Per user |

---

## Data Isolation

### Team-Based Isolation

**All data is isolated by team:**

```typescript
// ✅ GOOD - Always filter by team
const feedback = await ctx.db
  .query("feedback")
  .withIndex("by_team", (q) => q.eq("teamId", userTeamId))
  .collect();

// ❌ BAD - Never query without team filter
const allFeedback = await ctx.db
  .query("feedback")
  .collect(); // Exposes all teams' data!
```

### Indexes for Security

**Critical indexes in `convex/schema.ts`:**

```typescript
feedback: defineTable({ /* ... */ })
  .index("by_team", ["teamId"])           // ✅ Required for isolation
  .index("by_project", ["projectId"])     // ✅ Project-level queries
  .index("by_widget", ["widgetId"])       // ✅ Widget submissions

projects: defineTable({ /* ... */ })
  .index("by_team", ["teamId"])           // ✅ Required for isolation

teamMembers: defineTable({ /* ... */ })
  .index("by_user", ["userId"])           // ✅ User's teams
  .index("by_team", ["teamId"])           // ✅ Team's members
  .index("by_user_and_team", ["userId", "teamId"]) // ✅ Membership check
```

**⚠️ Never query without using team-based indexes!**

---

## Security Checklist

### Before Going Public

- [ ] **Authentication**
  - [ ] Verify all dashboard queries/mutations check `ctx.auth.getUserIdentity()`
  - [ ] Verify all admin actions check `membership.role === "admin"`
  - [ ] Test with unauthenticated requests (should fail)

- [ ] **Rate Limiting**
  - [ ] Replace in-memory rate limiting with Redis (Upstash)
  - [ ] Configure appropriate limits for each endpoint
  - [ ] Test rate limit enforcement
  - [ ] Add monitoring/alerts for rate limit hits

- [ ] **Public Endpoints**
  - [ ] Widget submission: Rate limited + honeypot
  - [ ] Submitter portal: Token expiration working
  - [ ] API key validation: Hash verification secure
  - [ ] Test each public endpoint for abuse

- [ ] **Data Isolation**
  - [ ] Audit all queries for team-based filtering
  - [ ] Verify no cross-team data leakage
  - [ ] Test with multiple teams
  - [ ] Check all indexes are used correctly

- [ ] **Environment Variables**
  - [ ] `CLERK_ISSUER_URL` configured in Convex environment
  - [ ] `CLERK_SECRET_KEY` set (for webhooks)
  - [ ] Stripe webhook secret configured
  - [ ] All secrets use Convex environment variables (not hardcoded)

- [ ] **API Key Storage**
  - [ ] Consider upgrading from base64 to AES-256-GCM encryption
  - [ ] Implement key rotation policy
  - [ ] Add audit logging for key access

- [ ] **Monitoring**
  - [ ] Set up error tracking (Sentry, etc.)
  - [ ] Monitor rate limit hits
  - [ ] Alert on authentication failures
  - [ ] Track API key usage

---

## Common Vulnerabilities

### ❌ Vulnerability 1: Missing Team Check

```typescript
// ❌ BAD - No team verification
export const getFeedback = query({
  args: { feedbackId: v.id("feedback") },
  handler: async (ctx, args) => {
    const feedback = await ctx.db.get(args.feedbackId);
    return feedback; // Exposes any team's data!
  },
});

// ✅ GOOD - Verify team membership
export const getFeedback = query({
  args: { feedbackId: v.id("feedback") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    
    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) throw new Error("Not found");
    
    // Verify user is member of feedback's team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), feedback.teamId))
      .first();
    
    if (!membership) throw new Error("Access denied");
    
    return feedback;
  },
});
```

### ❌ Vulnerability 2: Insufficient Rate Limiting

```typescript
// ❌ BAD - In-memory rate limiting (doesn't scale)
const rateLimitMap = new Map(); // Lost on server restart!

// ✅ GOOD - Redis-based rate limiting
import { Ratelimit } from "@upstash/ratelimit";
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"),
});
```

### ❌ Vulnerability 3: Exposing Internal Data

```typescript
// ❌ BAD - Exposing internal comments to submitters
export const getPublicFeedback = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const feedback = await ctx.db.get(feedbackId);
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_feedback", (q) => q.eq("feedbackId", feedbackId))
      .collect();
    
    return { feedback, comments }; // Exposes internal team discussions!
  },
});

// ✅ GOOD - Only expose public notes
export const getPublicFeedback = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const feedback = await ctx.db.get(feedbackId);
    const publicNotes = await ctx.db
      .query("publicNotes") // Separate table for public data
      .withIndex("by_feedback", (q) => q.eq("feedbackId", feedbackId))
      .collect();
    
    return {
      status: feedback.status,
      publicNotes, // Only public-safe information
    };
  },
});
```

### ❌ Vulnerability 4: Missing Admin Check

```typescript
// ❌ BAD - Any team member can delete projects
export const deleteProject = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    // ... verify team membership ...
    await ctx.db.delete(args.projectId); // Any member can delete!
  },
});

// ✅ GOOD - Only admins can delete
export const deleteProject = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    // ... verify team membership ...
    
    if (membership.role !== "admin") {
      throw new Error("Only admins can delete projects");
    }
    
    await ctx.db.delete(args.projectId);
  },
});
```

---

## Testing Security

### Manual Security Tests

1. **Test unauthenticated access:**
   ```bash
   # Should fail
   curl https://your-app.convex.cloud/api/query \
     -d '{"path":"projects:list","args":{"teamId":"..."}}'
   ```

2. **Test cross-team access:**
   - Create two teams
   - Try to access Team A's data while logged in as Team B user
   - Should fail with "Access denied"

3. **Test rate limiting:**
   ```bash
   # Should return 429 after limit
   for i in {1..20}; do
     curl -X POST https://your-app.com/api/widget/submit \
       -d '{"widgetKey":"...","title":"test"}'
   done
   ```

4. **Test admin-only actions:**
   - Log in as non-admin member
   - Try to delete project, manage API keys, etc.
   - Should fail with "Only admins can..."

### Automated Security Tests

Add to your test suite:

```typescript
// __tests__/security/auth.test.ts
describe("Authentication", () => {
  it("should reject unauthenticated requests", async () => {
    // Test without Clerk session
  });
  
  it("should reject cross-team access", async () => {
    // Test Team A user accessing Team B data
  });
  
  it("should enforce admin-only actions", async () => {
    // Test non-admin trying admin actions
  });
});
```

---

## Production Deployment

### Environment Variables (Convex)

Set these via `npx convex env set`:

```bash
# Required
npx convex env set CLERK_ISSUER_URL https://your-app.clerk.accounts.dev
npx convex env set CLERK_SECRET_KEY sk_live_...

# Optional (if using system-wide AI)
npx convex env set OPENAI_API_KEY sk-proj-...
npx convex env set ANTHROPIC_API_KEY sk-ant-...
```

### Monitoring Setup

1. **Error Tracking:**
   - Set up Sentry or similar
   - Monitor authentication failures
   - Track rate limit violations

2. **Logging:**
   - Log all admin actions
   - Log API key usage
   - Log failed authentication attempts

3. **Alerts:**
   - Alert on unusual rate limit hits
   - Alert on repeated auth failures
   - Alert on cross-team access attempts

---

## Support

For security issues:
- **Private disclosure:** security@feedbackflow.cc
- **Public issues:** https://github.com/infinitemoneyai/feedbackflow/issues
- **Documentation:** https://docs.convex.dev/auth

---

**Last Updated:** January 22, 2026  
**Version:** 1.0.0
