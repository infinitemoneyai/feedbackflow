# Site Review Viewer Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an iframe-based site viewer to FeedbackFlow so users can browse any URL inside the dashboard, capture screenshots, and submit feedback without installing the widget — with shareable, email-gated review links for external stakeholders.

**Architecture:** Iframe viewer with a Next.js API proxy fallback for sites that block framing. New Convex tables for review links and reviewers. A `submitFromReview` mutation parallels the existing `submitFromWidget` path. External access via magic links with email gate and optional password.

**Tech Stack:** Next.js 15 App Router, Convex (schema + mutations), Clerk auth, PBKDF2 (Web Crypto), html2canvas for screenshots.

**Spec:** `docs/superpowers/specs/2026-03-15-site-review-viewer-design.md`

---

## Chunk 1: Schema & Backend

### Task 1: Schema — Add `reviewLinks` and `reviewers` tables

**Files:**
- Modify: `convex/schema.ts:805` (add before closing brace)

- [ ] **Step 1: Add `reviewLinks` table to schema**

In `convex/schema.ts`, add after the `publicNotes` table (around line 804), before the final `});`:

```typescript
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

  reviewers: defineTable({
    reviewLinkId: v.id("reviewLinks"),
    email: v.string(),
    sessionToken: v.string(),
    firstAccessedAt: v.number(),
    lastAccessedAt: v.number(),
  })
    .index("by_session_token", ["sessionToken"])
    .index("by_review_link", ["reviewLinkId"]),
```

- [ ] **Step 2: Make `widgetId` optional on `feedback` table**

In `convex/schema.ts`, line 162, change:
```typescript
// FROM:
widgetId: v.id("widgets"),
// TO:
widgetId: v.optional(v.id("widgets")),
```

- [ ] **Step 3: Add review fields to `feedback` table**

In `convex/schema.ts`, inside the `feedback` table definition (after `teamId` on line 164), add:
```typescript
    reviewLinkId: v.optional(v.id("reviewLinks")),
    reviewerEmail: v.optional(v.string()),
    source: v.optional(v.union(v.literal("widget"), v.literal("review"))),
```

- [ ] **Step 4: Run `npx convex dev` to validate schema**

Run: `npx convex dev --once`
Expected: Schema pushes successfully with new tables and updated feedback table.

- [ ] **Step 5: Commit**

```bash
git add convex/schema.ts
git commit -m "feat: add reviewLinks and reviewers tables, make widgetId optional on feedback"
```

---

### Task 2: Convex mutations — Review link CRUD

**Files:**
- Create: `lib/review-crypto.ts`
- Create: `convex/reviewLinks.ts`

- [ ] **Step 0: Create shared password utility at `lib/review-crypto.ts`**

This file is importable by both Convex mutations and Next.js API routes since it only uses Web Crypto APIs (no Convex-specific imports).

```typescript
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const hash = await globalThis.crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, "0")).join("");
  const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
  return `${saltHex}:${hashHex}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(b => parseInt(b, 16)));
  const encoder = new TextEncoder();
  const keyMaterial = await globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const hash = await globalThis.crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  const computedHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
  return computedHex === hashHex;
}
```

- [ ] **Step 1: Create `convex/reviewLinks.ts` with `createReviewLink` mutation**

```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { hashPassword, verifyPassword } from "../lib/review-crypto";

function generateSlug(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let slug = "";
  for (let i = 0; i < 10; i++) {
    slug += chars[Math.floor(Math.random() * chars.length)];
  }
  return slug;
}

export const createReviewLink = mutation({
  args: {
    projectId: v.id("projects"),
    siteUrl: v.optional(v.string()),
    password: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  returns: v.object({ slug: v.string(), reviewLinkId: v.id("reviewLinks") }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    const siteUrl = args.siteUrl ?? project.siteUrl;
    if (!siteUrl) throw new Error("No site URL provided and project has no siteUrl set");

    let slug = generateSlug();
    // Ensure uniqueness
    let existing = await ctx.db.query("reviewLinks").withIndex("by_slug", (q) => q.eq("slug", slug)).first();
    while (existing) {
      slug = generateSlug();
      existing = await ctx.db.query("reviewLinks").withIndex("by_slug", (q) => q.eq("slug", slug)).first();
    }

    let passwordHash: string | undefined;
    if (args.password) {
      passwordHash = await hashPassword(args.password);
    }

    const reviewLinkId = await ctx.db.insert("reviewLinks", {
      projectId: args.projectId,
      teamId: project.teamId,
      slug,
      siteUrl,
      passwordHash,
      createdBy: user._id,
      isActive: true,
      createdAt: Date.now(),
      expiresAt: args.expiresAt,
    });

    return { slug, reviewLinkId };
  },
});

export const getReviewLink = query({
  args: { slug: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("reviewLinks"),
      projectId: v.id("projects"),
      teamId: v.id("teams"),
      slug: v.string(),
      siteUrl: v.string(),
      hasPassword: v.boolean(),
      isActive: v.boolean(),
      expiresAt: v.optional(v.number()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query("reviewLinks")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (!link) return null;
    if (!link.isActive) return null;
    if (link.expiresAt && link.expiresAt < Date.now()) return null;

    return {
      _id: link._id,
      projectId: link.projectId,
      teamId: link.teamId,
      slug: link.slug,
      siteUrl: link.siteUrl,
      hasPassword: !!link.passwordHash,
      isActive: link.isActive,
      expiresAt: link.expiresAt,
    };
  },
});

export const getReviewLinksForProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.db
      .query("reviewLinks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

export const deactivateReviewLink = mutation({
  args: { reviewLinkId: v.id("reviewLinks") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.db.patch(args.reviewLinkId, { isActive: false });
  },
});
```

- [ ] **Step 2: Run `npx convex dev` to validate**

Run: `npx convex dev --once`
Expected: Functions deploy successfully.

- [ ] **Step 3: Commit**

```bash
git add convex/reviewLinks.ts
git commit -m "feat: add review link CRUD mutations and queries"
```

---

### Task 3: Convex mutations — Reviewer access & session management

**Files:**
- Create: `convex/reviewers.ts`

- [ ] **Step 1: Create `convex/reviewers.ts`**

```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

function generateSessionToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  for (let i = 0; i < 40; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

export const createReviewerSession = mutation({
  args: {
    reviewLinkId: v.id("reviewLinks"),
    email: v.string(),
  },
  returns: v.object({ sessionToken: v.string(), reviewerId: v.id("reviewers") }),
  handler: async (ctx, args) => {
    const link = await ctx.db.get(args.reviewLinkId);
    if (!link || !link.isActive) throw new Error("Review link not found or inactive");
    if (link.expiresAt && link.expiresAt < Date.now()) throw new Error("Review link expired");

    // Check if reviewer already exists for this link + email
    const existing = await ctx.db
      .query("reviewers")
      .withIndex("by_review_link", (q) => q.eq("reviewLinkId", args.reviewLinkId))
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (existing) {
      // Update session token and last access
      const sessionToken = generateSessionToken();
      await ctx.db.patch(existing._id, {
        sessionToken,
        lastAccessedAt: Date.now(),
      });
      return { sessionToken, reviewerId: existing._id };
    }

    const sessionToken = generateSessionToken();
    const reviewerId = await ctx.db.insert("reviewers", {
      reviewLinkId: args.reviewLinkId,
      email: args.email,
      sessionToken,
      firstAccessedAt: Date.now(),
      lastAccessedAt: Date.now(),
    });

    return { sessionToken, reviewerId };
  },
});

export const validateReviewerSession = query({
  args: { sessionToken: v.string() },
  returns: v.union(
    v.object({
      reviewerId: v.id("reviewers"),
      reviewLinkId: v.id("reviewLinks"),
      email: v.string(),
      siteUrl: v.string(),
      projectId: v.id("projects"),
      teamId: v.id("teams"),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const reviewer = await ctx.db
      .query("reviewers")
      .withIndex("by_session_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();
    if (!reviewer) return null;

    const link = await ctx.db.get(reviewer.reviewLinkId);
    if (!link || !link.isActive) return null;
    if (link.expiresAt && link.expiresAt < Date.now()) return null;

    return {
      reviewerId: reviewer._id,
      reviewLinkId: reviewer.reviewLinkId,
      email: reviewer.email,
      siteUrl: link.siteUrl,
      projectId: link.projectId,
      teamId: link.teamId,
    };
  },
});
```

- [ ] **Step 2: Run `npx convex dev` to validate**

Run: `npx convex dev --once`
Expected: Functions deploy successfully.

- [ ] **Step 3: Commit**

```bash
git add convex/reviewers.ts
git commit -m "feat: add reviewer session creation and validation"
```

---

### Task 4: Convex mutation — `submitFromReview`

**Files:**
- Modify: `convex/feedback.ts:32` (add new mutation after imports, reference `getNextTicketNumber` at line 7)

- [ ] **Step 1: Add `submitFromReview` mutation to `convex/feedback.ts`**

Add after the existing `submitFromWidget` mutation (around line 169):

```typescript
export const submitFromReview = mutation({
  args: {
    projectId: v.id("projects"),
    teamId: v.id("teams"),
    type: v.union(v.literal("bug"), v.literal("feature")),
    title: v.string(),
    description: v.optional(v.string()),
    screenshotStorageId: v.optional(v.id("_storage")),
    url: v.optional(v.string()),
    browserInfo: v.optional(v.string()),
    osInfo: v.optional(v.string()),
    screenWidth: v.optional(v.number()),
    screenHeight: v.optional(v.number()),
    reviewLinkId: v.optional(v.id("reviewLinks")),
    reviewerEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Auth: either Clerk user or review link session (caller validates before calling)
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    // Check team usage limits
    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    const ticketNumber = await getNextTicketNumber(ctx, args.projectId);

    let screenshotUrl: string | undefined;
    if (args.screenshotStorageId) {
      screenshotUrl = await ctx.storage.getUrl(args.screenshotStorageId) ?? undefined;
    }

    // Check team usage limits (same as widget path)
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const usage = await ctx.db
      .query("usageTracking")
      .filter((q) => q.and(
        q.eq(q.field("teamId"), args.teamId),
        q.eq(q.field("month"), monthKey)
      ))
      .first();
    const currentCount = usage?.feedbackCount ?? 0;
    const plan = team.plan ?? "free";
    const limit = plan === "free" ? 25 : Infinity;
    if (currentCount >= limit) {
      throw new Error(
        args.reviewerEmail
          ? "This project has reached its feedback limit. Please contact the project owner."
          : "Monthly feedback limit reached. Upgrade to Pro for unlimited feedback."
      );
    }

    const feedbackId = await ctx.db.insert("feedback", {
      widgetId: undefined,
      projectId: args.projectId,
      teamId: args.teamId,
      ticketNumber,
      type: args.type,
      title: args.title,
      description: args.description ?? "",
      status: "new",
      priority: project.settings?.defaultPriority ?? "medium",
      screenshotUrl,
      metadata: {
        browser: args.browserInfo,
        os: args.osInfo,
        url: args.url,
        screenWidth: args.screenWidth,
        screenHeight: args.screenHeight,
        timestamp: Date.now(),
      },
      reviewLinkId: args.reviewLinkId,
      reviewerEmail: args.reviewerEmail,
      source: "review" as const,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Activity log — details is an object { from?, to?, extra? }, timestamp field is createdAt
    await ctx.db.insert("activityLog", {
      feedbackId,
      action: "created",
      details: { extra: `Submitted via site review${args.reviewerEmail ? ` by ${args.reviewerEmail}` : ""}` },
      createdAt: Date.now(),
    });

    // Update usage tracking
    if (usage) {
      await ctx.db.patch(usage._id, { feedbackCount: currentCount + 1 });
    } else {
      await ctx.db.insert("usageTracking", {
        teamId: args.teamId,
        month: monthKey,
        feedbackCount: 1,
      });
    }

    return { feedbackId, ticketNumber };
  },
});
```

- [ ] **Step 2: Run `npx convex dev` to validate**

Run: `npx convex dev --once`
Expected: Mutation deploys. May need to adjust field names to match exact schema — check that all fields in the insert match the `feedback` table definition.

- [ ] **Step 3: Commit**

```bash
git add convex/feedback.ts
git commit -m "feat: add submitFromReview mutation for site review feedback"
```

---

### Task 5: Proxy API route

**Files:**
- Create: `app/api/proxy/route.ts`

- [ ] **Step 1: Create the proxy API route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

const BLOCKED_PROTOCOLS = ["file:", "ftp:", "data:", "javascript:"];
const MAX_RESPONSE_SIZE = 10 * 1024 * 1024; // 10MB

function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return !BLOCKED_PROTOCOLS.includes(url.protocol) && (url.protocol === "http:" || url.protocol === "https:");
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Auth: Clerk session or review session token cookie
  const { userId } = await auth();
  const reviewSession = request.cookies.get("review_session")?.value;

  if (!userId && !reviewSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const targetUrl = request.nextUrl.searchParams.get("url");
  if (!targetUrl || !isValidUrl(targetUrl)) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": request.headers.get("user-agent") ?? "FeedbackFlow-Proxy/1.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": request.headers.get("accept-language") ?? "en-US,en;q=0.5",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Target site returned ${response.status}` },
        { status: 502 }
      );
    }

    const contentType = response.headers.get("content-type") ?? "text/html";
    const contentLength = parseInt(response.headers.get("content-length") ?? "0", 10);

    if (contentLength > MAX_RESPONSE_SIZE) {
      return NextResponse.json({ error: "Response too large" }, { status: 413 });
    }

    const body = await response.text();

    // Rewrite relative URLs to absolute
    const baseUrl = new URL(targetUrl);
    const rewrittenBody = body
      .replace(/(href|src|action)="\/(?!\/)/g, `$1="${baseUrl.origin}/`)
      .replace(/(href|src|action)='\/(?!\/)/g, `$1='${baseUrl.origin}/`);

    const proxyResponse = new NextResponse(rewrittenBody, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        // Intentionally omit X-Frame-Options and frame-restricting CSP
      },
    });

    return proxyResponse;
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json({ error: "Failed to fetch target site" }, { status: 502 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/proxy/route.ts
git commit -m "feat: add proxy API route for iframe fallback"
```

---

### Task 6: Review submission API route

**Files:**
- Create: `app/api/review/submit/route.ts`

- [ ] **Step 1: Create the review submission API route**

This route handles screenshot upload + feedback creation for both authenticated users and external reviewers. It mirrors `app/api/widget/submit/route.ts` but with review-specific auth.

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const {
      projectId,
      teamId,
      type,
      title,
      description,
      screenshotDataUrl,
      url,
      browserInfo,
      osInfo,
      screenWidth,
      screenHeight,
      reviewLinkId,
      sessionToken,
    } = body;

    if (!projectId || !teamId || !type || !title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Auth: Clerk session or review session token
    const { userId } = await auth();
    let reviewerEmail: string | undefined;

    if (!userId) {
      // External reviewer — validate session token
      if (!sessionToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const session = await convex.query(api.reviewers.validateReviewerSession, { sessionToken });
      if (!session) {
        return NextResponse.json({ error: "Invalid session" }, { status: 401 });
      }
      reviewerEmail = session.email;
    }

    // Upload screenshot if provided
    let screenshotStorageId: string | undefined;
    if (screenshotDataUrl) {
      const base64Data = screenshotDataUrl.split(",")[1];
      const binaryData = Buffer.from(base64Data, "base64");
      const blob = new Blob([binaryData], { type: "image/png" });

      const uploadUrl = await convex.mutation(api.feedback.generateUploadUrl, {});
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "image/png" },
        body: blob,
      });
      const { storageId } = await uploadResponse.json();
      screenshotStorageId = storageId;
    }

    const result = await convex.mutation(api.feedback.submitFromReview, {
      projectId,
      teamId,
      type,
      title,
      description,
      screenshotStorageId,
      url,
      browserInfo,
      osInfo,
      screenWidth: screenWidth ? Number(screenWidth) : undefined,
      screenHeight: screenHeight ? Number(screenHeight) : undefined,
      reviewLinkId,
      reviewerEmail,
    });

    // Fire-and-forget: trigger AI analysis, automations, and notifications
    // (mirrors app/api/widget/submit/route.ts lines 373-420)
    const baseUrl = request.nextUrl.origin;
    const feedbackId = result.feedbackId;

    fetch(`${baseUrl}/api/ai/auto-analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedbackId, projectId }),
    }).catch(() => {});

    fetch(`${baseUrl}/api/automation/trigger`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedbackId, projectId, teamId }),
    }).catch(() => {});

    fetch(`${baseUrl}/api/notifications/trigger-new-feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedbackId, projectId, teamId }),
    }).catch(() => {});

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Review submit error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Submission failed" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/review/submit/route.ts
git commit -m "feat: add review submission API route"
```

---

### Task 7: Review access API route (email gate + password verification)

**Files:**
- Create: `app/api/review/access/route.ts`

- [ ] **Step 1: Create the access gate API route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { verifyPassword } from "@/lib/review-crypto";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { slug, email, password } = await request.json();

    if (!slug || !email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Fetch the review link
    const link = await convex.query(api.reviewLinks.getReviewLink, { slug });
    if (!link) {
      return NextResponse.json({ error: "Review link not found or expired" }, { status: 404 });
    }

    // Verify password if required
    if (link.hasPassword) {
      if (!password) {
        return NextResponse.json({ error: "Password required" }, { status: 401 });
      }
      // We need the full link with hash — use an internal query
      // For now, we'll handle password verification in the Convex mutation
    }

    // Create reviewer session
    const { sessionToken } = await convex.mutation(api.reviewers.createReviewerSession, {
      reviewLinkId: link._id,
      email,
    });

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      siteUrl: link.siteUrl,
      projectId: link.projectId,
      teamId: link.teamId,
      reviewLinkId: link._id,
    });

    const maxAge = link.expiresAt
      ? Math.floor((link.expiresAt - Date.now()) / 1000)
      : 30 * 24 * 60 * 60; // 30 days

    response.cookies.set("review_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Review access error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Access failed" },
      { status: 500 }
    );
  }
}
```

**Note:** Password verification needs refinement — the `getReviewLink` query intentionally strips the hash. Add a separate Convex mutation `verifyReviewLinkPassword` that takes `slug` + `password` and returns true/false. Add this to `convex/reviewLinks.ts`:

```typescript
export const verifyReviewLinkPassword = mutation({
  args: { slug: v.string(), password: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query("reviewLinks")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (!link || !link.passwordHash) return false;
    // verifyPassword is imported from "../lib/review-crypto" at top of file
    return await verifyPassword(args.password, link.passwordHash);
  },
});
```

Then update the access route to call `api.reviewLinks.verifyReviewLinkPassword` before creating the session — if it returns false, return 401.

- [ ] **Step 2: Commit**

```bash
git add app/api/review/access/route.ts convex/reviewLinks.ts
git commit -m "feat: add review access gate API route with password verification"
```

---

## Chunk 2: Frontend — Viewer & Share UI

### Task 8: Site Review Viewer component

**Files:**
- Create: `components/dashboard/site-review/review-viewer.tsx`
- Create: `components/dashboard/site-review/review-toolbar.tsx`
- Create: `components/dashboard/site-review/review-feedback-panel.tsx`
- Create: `components/dashboard/site-review/review-status-bar.tsx`

- [ ] **Step 1: Create the toolbar component**

Create `components/dashboard/site-review/review-toolbar.tsx`:

```tsx
"use client";

import { useState, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, RotateCw, Camera, Share2 } from "lucide-react";

interface ReviewToolbarProps {
  currentUrl: string;
  onNavigate: (url: string) => void;
  onBack: () => void;
  onForward: () => void;
  onRefresh: () => void;
  onScreenshot: () => void;
  onShare: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
}

export function ReviewToolbar({
  currentUrl,
  onNavigate,
  onBack,
  onForward,
  onRefresh,
  onScreenshot,
  onShare,
  canGoBack,
  canGoForward,
}: ReviewToolbarProps): JSX.Element {
  const [urlInput, setUrlInput] = useState(currentUrl);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      let url = urlInput.trim();
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }
      onNavigate(url);
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-background border-b">
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" onClick={onBack} disabled={!canGoBack} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onForward} disabled={!canGoForward} className="h-8 w-8">
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onRefresh} className="h-8 w-8">
          <RotateCw className="h-4 w-4" />
        </Button>
      </div>
      <Input
        value={urlInput}
        onChange={(e) => setUrlInput(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 font-mono text-sm h-8"
        placeholder="Enter URL..."
      />
      <div className="flex gap-1">
        <Button onClick={onScreenshot} size="sm" className="h-8">
          <Camera className="h-4 w-4 mr-1" />
          Screenshot
        </Button>
        <Button variant="outline" onClick={onShare} size="sm" className="h-8">
          <Share2 className="h-4 w-4 mr-1" />
          Share
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create the feedback slide-in panel**

Create `components/dashboard/site-review/review-feedback-panel.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";

interface ReviewFeedbackPanelProps {
  screenshotDataUrl: string | null;
  currentUrl: string;
  onSubmit: (data: {
    type: "bug" | "feature";
    title: string;
    description: string;
    screenshotDataUrl: string | null;
    url: string;
  }) => Promise<void>;
  onClose: () => void;
}

export function ReviewFeedbackPanel({
  screenshotDataUrl,
  currentUrl,
  onSubmit,
  onClose,
}: ReviewFeedbackPanelProps): JSX.Element {
  const [type, setType] = useState<"bug" | "feature">("bug");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (): Promise<void> => {
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        type,
        title: title.trim(),
        description: description.trim(),
        screenshotDataUrl,
        url: currentUrl,
      });
      onClose();
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-80 border-l bg-background flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">New Feedback</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {screenshotDataUrl && (
          <div className="rounded-md border overflow-hidden">
            <img src={screenshotDataUrl} alt="Screenshot" className="w-full" />
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant={type === "bug" ? "default" : "outline"}
            size="sm"
            onClick={() => setType("bug")}
            className="flex-1"
          >
            Bug
          </Button>
          <Button
            variant={type === "feature" ? "default" : "outline"}
            size="sm"
            onClick={() => setType("feature")}
            className="flex-1"
          >
            Feature
          </Button>
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief description..."
          />
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="More details..."
            rows={4}
          />
        </div>
      </div>

      <div className="p-4 border-t">
        <Button
          onClick={handleSubmit}
          disabled={!title.trim() || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "Submitting..." : "Submit Feedback"}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create the status bar**

Create `components/dashboard/site-review/review-status-bar.tsx`:

```tsx
"use client";

interface ReviewStatusBarProps {
  connectionMethod: "iframe" | "proxy" | "loading" | "failed";
  feedbackCount: number;
}

export function ReviewStatusBar({
  connectionMethod,
  feedbackCount,
}: ReviewStatusBarProps): JSX.Element {
  const statusText = {
    iframe: "Loaded via iframe",
    proxy: "Loaded via proxy",
    loading: "Loading...",
    failed: "Failed to load",
  }[connectionMethod];

  const statusColor = {
    iframe: "text-green-500",
    proxy: "text-yellow-500",
    loading: "text-muted-foreground",
    failed: "text-red-500",
  }[connectionMethod];

  return (
    <div className="flex items-center justify-between px-3 py-1 border-t text-xs text-muted-foreground">
      <span className={statusColor}>
        {connectionMethod === "iframe" || connectionMethod === "proxy" ? "✓ " : ""}
        {statusText}
      </span>
      <span>{feedbackCount} feedback item{feedbackCount !== 1 ? "s" : ""} on this page</span>
    </div>
  );
}
```

- [ ] **Step 4: Create the main viewer component**

Create `components/dashboard/site-review/review-viewer.tsx`:

```tsx
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ReviewToolbar } from "./review-toolbar";
import { ReviewFeedbackPanel } from "./review-feedback-panel";
import { ReviewStatusBar } from "./review-status-bar";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ReviewViewerProps {
  projectId: Id<"projects">;
  teamId: Id<"teams">;
  initialUrl: string;
  reviewLinkId?: Id<"reviewLinks">;
  reviewerEmail?: string;
  sessionToken?: string;
}

export function ReviewViewer({
  projectId,
  teamId,
  initialUrl,
  reviewLinkId,
  reviewerEmail,
  sessionToken,
}: ReviewViewerProps): JSX.Element {
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [history, setHistory] = useState<string[]>([initialUrl]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [connectionMethod, setConnectionMethod] = useState<"iframe" | "proxy" | "loading" | "failed">("loading");
  const [showFeedbackPanel, setShowFeedbackPanel] = useState(false);
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Count feedback for current URL
  const feedbackList = useQuery(api.feedback.listFeedback, {
    projectId,
    view: "inbox",
  });
  const feedbackCount = feedbackList?.filter((f: { url?: string }) => f.url === currentUrl).length ?? 0;

  const loadUrl = useCallback((url: string, useProxy = false) => {
    setConnectionMethod("loading");

    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }

    const iframeSrc = useProxy
      ? `/api/proxy?url=${encodeURIComponent(url)}`
      : url;

    if (iframeRef.current) {
      iframeRef.current.src = iframeSrc;
    }

    // Timeout: if iframe hasn't loaded in 5s, try proxy
    if (!useProxy) {
      loadTimeoutRef.current = setTimeout(() => {
        // Try proxy fallback
        loadUrl(url, true);
      }, 5000);
    } else {
      // Proxy timeout — show failure
      loadTimeoutRef.current = setTimeout(() => {
        setConnectionMethod("failed");
      }, 10000);
    }
  }, []);

  const handleIframeLoad = useCallback(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    const src = iframeRef.current?.src ?? "";
    setConnectionMethod(src.startsWith("/api/proxy") ? "proxy" : "iframe");
  }, []);

  const handleIframeError = useCallback(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    // Try proxy if direct load failed
    const src = iframeRef.current?.src ?? "";
    if (!src.startsWith("/api/proxy")) {
      loadUrl(currentUrl, true);
    } else {
      setConnectionMethod("failed");
    }
  }, [currentUrl, loadUrl]);

  useEffect(() => {
    loadUrl(initialUrl);
    return () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    };
  }, [initialUrl, loadUrl]);

  const navigate = (url: string): void => {
    setCurrentUrl(url);
    const newHistory = [...history.slice(0, historyIndex + 1), url];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    loadUrl(url);
  };

  const goBack = (): void => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const url = history[newIndex];
      setCurrentUrl(url);
      loadUrl(url);
    }
  };

  const goForward = (): void => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const url = history[newIndex];
      setCurrentUrl(url);
      loadUrl(url);
    }
  };

  const refresh = (): void => {
    loadUrl(currentUrl);
  };

  const captureScreenshot = async (): Promise<void> => {
    // Use Screen Capture API
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        preferCurrentTab: true,
      } as DisplayMediaStreamOptions);

      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0);

      stream.getTracks().forEach((t) => t.stop());

      const dataUrl = canvas.toDataURL("image/png");
      setScreenshotDataUrl(dataUrl);
      setShowFeedbackPanel(true);
    } catch (error) {
      console.error("Screenshot capture failed:", error);
    }
  };

  const handleSubmitFeedback = async (data: {
    type: "bug" | "feature";
    title: string;
    description: string;
    screenshotDataUrl: string | null;
    url: string;
  }): Promise<void> => {
    const response = await fetch("/api/review/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        teamId,
        type: data.type,
        title: data.title,
        description: data.description,
        screenshotDataUrl: data.screenshotDataUrl,
        url: data.url,
        browserInfo: navigator.userAgent,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        reviewLinkId,
        sessionToken,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error ?? "Submission failed");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ReviewToolbar
        currentUrl={currentUrl}
        onNavigate={navigate}
        onBack={goBack}
        onForward={goForward}
        onRefresh={refresh}
        onScreenshot={captureScreenshot}
        onShare={() => setShowShareModal(true)}
        canGoBack={historyIndex > 0}
        canGoForward={historyIndex < history.length - 1}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {connectionMethod === "failed" ? (
          <div className="flex-1 flex items-center justify-center bg-muted/50">
            <div className="text-center max-w-md space-y-4">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto" />
              <h3 className="text-lg font-semibold">This site can&apos;t be loaded in the viewer</h3>
              <p className="text-muted-foreground text-sm">
                Some sites block embedded viewing. Install the FeedbackFlow widget for full feedback capabilities.
              </p>
              <Button variant="outline" asChild>
                <a href="/dashboard" target="_blank">
                  Go to Widget Setup
                </a>
              </Button>
            </div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            className="flex-1 border-0"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        )}

        {showFeedbackPanel && (
          <ReviewFeedbackPanel
            screenshotDataUrl={screenshotDataUrl}
            currentUrl={currentUrl}
            onSubmit={handleSubmitFeedback}
            onClose={() => {
              setShowFeedbackPanel(false);
              setScreenshotDataUrl(null);
            }}
          />
        )}
      </div>

      <ReviewStatusBar
        connectionMethod={connectionMethod}
        feedbackCount={feedbackCount}
      />
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/site-review/
git commit -m "feat: add site review viewer components (toolbar, feedback panel, status bar, viewer)"
```

---

### Task 9: Share Review Modal

**Files:**
- Create: `components/dashboard/site-review/share-review-modal.tsx`

- [ ] **Step 1: Create the share modal**

```tsx
"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check, Trash2 } from "lucide-react";

interface ShareReviewModalProps {
  projectId: Id<"projects">;
  siteUrl: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareReviewModal({
  projectId,
  siteUrl,
  open,
  onOpenChange,
}: ShareReviewModalProps): JSX.Element {
  const [password, setPassword] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const createLink = useMutation(api.reviewLinks.createReviewLink);
  const deactivateLink = useMutation(api.reviewLinks.deactivateReviewLink);
  const existingLinks = useQuery(api.reviewLinks.getReviewLinksForProject, { projectId });

  const activeLinks = existingLinks?.filter((l) => l.isActive && (!l.expiresAt || l.expiresAt > Date.now())) ?? [];

  const handleCreate = async (): Promise<void> => {
    setIsCreating(true);
    try {
      await createLink({
        projectId,
        siteUrl,
        password: password.trim() || undefined,
      });
      setPassword("");
    } catch (error) {
      console.error("Failed to create review link:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = (slug: string): void => {
    const url = `${window.location.origin}/review/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(slug);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Review Link</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Existing links */}
          {activeLinks.length > 0 && (
            <div className="space-y-2">
              <Label>Active Links</Label>
              {activeLinks.map((link) => (
                <div key={link._id} className="flex items-center gap-2 p-2 rounded-md bg-muted">
                  <code className="text-xs flex-1 truncate">
                    {window.location.origin}/review/{link.slug}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleCopy(link.slug)}
                  >
                    {copied === link.slug ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => deactivateLink({ reviewLinkId: link._id })}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Create new */}
          <div className="space-y-3 pt-2 border-t">
            <Label>Create New Link</Label>
            <div>
              <Label className="text-xs text-muted-foreground">Password (optional)</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave empty for no password"
              />
            </div>
            <Button onClick={handleCreate} disabled={isCreating} className="w-full">
              {isCreating ? "Creating..." : "Generate Review Link"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/site-review/share-review-modal.tsx
git commit -m "feat: add share review modal for creating and managing review links"
```

---

### Task 10: Wire Review View into Dashboard

**Files:**
- Create: `components/dashboard/site-review/review-page.tsx` (component, NOT a file-system route)
- Modify: `components/dashboard/dashboard-layout.tsx`

The dashboard is a single-page app — it does NOT use Next.js file-system routing for views. The `currentView` context controls what renders in the main content area. So we create a component (not a page route) and render it inline when `currentView === "review"`.

- [ ] **Step 1: Create the review page component**

Create `components/dashboard/site-review/review-page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useDashboard } from "@/components/dashboard/dashboard-layout";
import { ReviewViewer } from "./review-viewer";
import { ShareReviewModal } from "./share-review-modal";
import { Skeleton } from "@/components/ui/skeleton";

export function ReviewPage(): JSX.Element {
  const { selectedProjectId, selectedTeamId } = useDashboard();
  const [showShareModal, setShowShareModal] = useState(false);

  const project = useQuery(
    api.projects.getProject,
    selectedProjectId ? { projectId: selectedProjectId } : "skip"
  );

  if (!selectedProjectId || !selectedTeamId) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Select a project to start reviewing
      </div>
    );
  }

  if (project === undefined) {
    return (
      <div className="flex flex-col h-full gap-2 p-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="flex-1 w-full" />
        <Skeleton className="h-6 w-full" />
      </div>
    );
  }

  if (!project?.siteUrl) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center space-y-2">
          <p>No site URL set for this project.</p>
          <p className="text-sm">Add a site URL in project settings to use the reviewer.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ReviewViewer
        projectId={selectedProjectId}
        teamId={selectedTeamId}
        initialUrl={project.siteUrl}
        onShare={() => setShowShareModal(true)}
      />
      <ShareReviewModal
        projectId={selectedProjectId}
        siteUrl={project.siteUrl}
        open={showShareModal}
        onOpenChange={setShowShareModal}
      />
    </>
  );
}
```

- [ ] **Step 2: Add `"review"` to `currentView` type and render `ReviewPage` inline**

In `components/dashboard/dashboard-layout.tsx`, update the `currentView` union type (around line 15-20):

```typescript
// FROM:
currentView: "inbox" | "backlog" | "resolved";
// TO:
currentView: "inbox" | "backlog" | "resolved" | "review";
```

Then in the main content area where views are conditionally rendered, add:
```tsx
{currentView === "review" && <ReviewPage />}
```

Import `ReviewPage` from `./site-review/review-page`.

- [ ] **Step 3: Update `ReviewViewer` to accept `onShare` prop**

In `components/dashboard/site-review/review-viewer.tsx`, add `onShare?: () => void` to the props interface and pass it through to the toolbar instead of managing share modal state internally.

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/site-review/review-page.tsx components/dashboard/dashboard-layout.tsx components/dashboard/site-review/review-viewer.tsx
git commit -m "feat: wire review view into dashboard navigation"
```

---

### Task 11: External Review Page (`/review/[slug]`)

**Files:**
- Create: `app/review/[slug]/page.tsx`
- Create: `app/review/[slug]/layout.tsx`

- [ ] **Step 1: Create the external review layout (no dashboard chrome)**

Create `app/review/[slug]/layout.tsx`:

```tsx
export default function ReviewLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div className="h-screen flex flex-col">
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Create the external review page**

Create `app/review/[slug]/page.tsx`:

```tsx
"use client";

import { useState, useEffect, use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ReviewViewer } from "@/components/dashboard/site-review/review-viewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Id } from "@/convex/_generated/dataModel";

interface ReviewSession {
  siteUrl: string;
  projectId: Id<"projects">;
  teamId: Id<"teams">;
  reviewLinkId: Id<"reviewLinks">;
  sessionToken: string;
}

export default function ExternalReviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): JSX.Element {
  const { slug } = use(params);
  const [session, setSession] = useState<ReviewSession | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reviewLink = useQuery(api.reviewLinks.getReviewLink, { slug });

  // Check for existing session cookie
  useEffect(() => {
    const checkSession = async (): Promise<void> => {
      try {
        const res = await fetch(`/api/review/session?slug=${slug}`);
        if (res.ok) {
          const data = await res.json();
          if (data.valid) {
            setSession(data);
          }
        }
      } catch {
        // No existing session
      }
    };
    checkSession();
  }, [slug]);

  const handleAccess = async (): Promise<void> => {
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/review/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, email: email.trim(), password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Access denied");
        return;
      }

      const data = await res.json();
      setSession({
        siteUrl: data.siteUrl,
        projectId: data.projectId,
        teamId: data.teamId,
        reviewLinkId: data.reviewLinkId,
        sessionToken: data.sessionToken ?? "",
      });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (reviewLink === undefined) {
    return (
      <div className="flex items-center justify-center h-full">
        <Skeleton className="h-64 w-96" />
      </div>
    );
  }

  // Not found or expired
  if (reviewLink === null) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">Review link not found</h2>
          <p className="text-muted-foreground">This link may have expired or been deactivated.</p>
        </div>
      </div>
    );
  }

  // Has session — show viewer
  if (session) {
    return (
      <ReviewViewer
        projectId={session.projectId}
        teamId={session.teamId}
        initialUrl={session.siteUrl}
        reviewLinkId={session.reviewLinkId}
        reviewerEmail={email}
        sessionToken={session.sessionToken}
      />
    );
  }

  // Email gate
  return (
    <div className="flex items-center justify-center h-full bg-muted/50">
      <div className="w-full max-w-sm space-y-6 p-8 bg-background rounded-lg border shadow-sm">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">You&apos;ve been invited to review</h2>
          <p className="text-sm text-muted-foreground">Enter your email to continue</p>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              onKeyDown={(e) => e.key === "Enter" && handleAccess()}
            />
          </div>

          {reviewLink.hasPassword && (
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                onKeyDown={(e) => e.key === "Enter" && handleAccess()}
              />
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button onClick={handleAccess} disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Verifying..." : "Start Reviewing"}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create session check API route**

Create `app/api/review/session/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: NextRequest): Promise<NextResponse> {
  const sessionToken = request.cookies.get("review_session")?.value;
  if (!sessionToken) {
    return NextResponse.json({ valid: false });
  }

  try {
    const session = await convex.query(api.reviewers.validateReviewerSession, {
      sessionToken,
    });

    if (!session) {
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({
      valid: true,
      siteUrl: session.siteUrl,
      projectId: session.projectId,
      teamId: session.teamId,
      reviewLinkId: session.reviewLinkId,
      sessionToken,
    });
  } catch {
    return NextResponse.json({ valid: false });
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add app/review/ app/api/review/session/
git commit -m "feat: add external review page with email gate and session management"
```

---

## Chunk 3: Integration & Polish

### Task 12: Wire "Review Site" into project UI

**Files:**
- Modify: `components/dashboard/dashboard-sidebar.tsx` (add review button per project)
- Modify: `components/dashboard/dashboard-layout.tsx` (add review view type)

- [ ] **Step 1: Read the sidebar and layout files to find exact integration points**

Read `components/dashboard/dashboard-sidebar.tsx` and `components/dashboard/dashboard-layout.tsx` to find where to add the review navigation item and how the view switching works.

- [ ] **Step 2: Add "Review" to the view options in the sidebar**

Add a button/link in the sidebar's project section that sets `currentView` to `"review"`. Follow the existing pattern for inbox/backlog/resolved navigation items.

- [ ] **Step 3: Add review view rendering in the dashboard layout**

In the main content area where views are conditionally rendered, add:
```tsx
{currentView === "review" && <ReviewPage />}
```

Import the `ReviewViewer` and related components.

- [ ] **Step 4: Verify navigation works end-to-end**

Run: `npm run dev`
Navigate to dashboard → select a project with `siteUrl` → click "Review Site" → viewer should load.

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/dashboard-sidebar.tsx components/dashboard/dashboard-layout.tsx
git commit -m "feat: wire review site button into dashboard navigation"
```

---

### Task 13: Handle the `source` field on existing feedback

**Files:**
- Modify: `convex/feedback.ts` (update `submitFromWidget` to set `source: "widget"`)

- [ ] **Step 1: Update `submitFromWidget` to include `source` field**

In `convex/feedback.ts`, inside the `submitFromWidget` mutation's insert call (around line 96-117), add:
```typescript
source: "widget" as const,
```

This ensures all new widget-submitted feedback is tagged. Existing feedback without `source` is implicitly widget-sourced.

- [ ] **Step 2: Commit**

```bash
git add convex/feedback.ts
git commit -m "feat: tag widget-submitted feedback with source field"
```

---

### Task 14: Test the proxy, crypto, and submission flows

**Files:**
- Create: `__tests__/app/api/proxy/proxy.test.ts`
- Create: `__tests__/lib/review-crypto.test.ts`

- [ ] **Step 1: Write proxy URL validation tests**

Create `__tests__/app/api/proxy/proxy.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

// Extract isValidUrl for unit testing
function isValidUrl(urlString: string): boolean {
  const BLOCKED_PROTOCOLS = ["file:", "ftp:", "data:", "javascript:"];
  try {
    const url = new URL(urlString);
    return !BLOCKED_PROTOCOLS.includes(url.protocol) && (url.protocol === "http:" || url.protocol === "https:");
  } catch {
    return false;
  }
}

describe("proxy URL validation", () => {
  it("accepts valid HTTP URLs", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
    expect(isValidUrl("http://localhost:3000")).toBe(true);
    expect(isValidUrl("https://sub.domain.com/path?q=1")).toBe(true);
  });

  it("rejects invalid URLs", () => {
    expect(isValidUrl("not-a-url")).toBe(false);
    expect(isValidUrl("")).toBe(false);
    expect(isValidUrl("file:///etc/passwd")).toBe(false);
    expect(isValidUrl("ftp://server.com")).toBe(false);
    expect(isValidUrl("javascript:alert(1)")).toBe(false);
    expect(isValidUrl("data:text/html,<h1>hi</h1>")).toBe(false);
  });
});
```

- [ ] **Step 2: Write password hashing/verification tests**

Create `__tests__/lib/review-crypto.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/review-crypto";

describe("review-crypto", () => {
  it("hashes and verifies a password correctly", async () => {
    const password = "test-password-123";
    const hash = await hashPassword(password);
    expect(hash).toContain(":");
    expect(await verifyPassword(password, hash)).toBe(true);
  });

  it("rejects incorrect passwords", async () => {
    const hash = await hashPassword("correct-password");
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("produces different hashes for the same password (unique salts)", async () => {
    const hash1 = await hashPassword("same-password");
    const hash2 = await hashPassword("same-password");
    expect(hash1).not.toBe(hash2);
    // But both should verify
    expect(await verifyPassword("same-password", hash1)).toBe(true);
    expect(await verifyPassword("same-password", hash2)).toBe(true);
  });
});
```

- [ ] **Step 3: Run tests**

Run: `npm run test -- __tests__/app/api/proxy/proxy.test.ts __tests__/lib/review-crypto.test.ts`
Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add __tests__/app/api/proxy/ __tests__/lib/
git commit -m "test: add proxy URL validation and password crypto tests"
```

---

### Task 15: Type check and build verification

- [ ] **Step 1: Run TypeScript type check**

Run: `npm run typecheck`
Expected: No type errors. Fix any that arise from the new `source` and optional `widgetId` fields.

- [ ] **Step 2: Run full test suite**

Run: `npm run test`
Expected: All tests pass. Some existing tests may need updates if they reference `widgetId` as required.

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Fix any issues and commit**

```bash
git add -A
git commit -m "fix: resolve type errors and test failures from site review feature"
```

---

### Task 16: Final integration test

- [ ] **Step 1: Manual E2E verification**

Run `npm run dev` and `npx convex dev` in separate terminals. Verify:

1. Dashboard → select project with siteUrl → click "Review Site" → viewer loads
2. Toolbar: back/forward/refresh/URL bar all work
3. Screenshot button captures and opens feedback panel
4. Submit feedback → appears in project inbox with `source: "review"`
5. Share button → create review link → copy link
6. Open `/review/[slug]` in incognito → email gate appears
7. Enter email → viewer loads → submit feedback → tagged with reviewer email
8. Deactivate link → link no longer accessible

- [ ] **Step 2: Commit any fixes**

```bash
git add -A
git commit -m "fix: polish site review feature after integration testing"
```
