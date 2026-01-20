# Onboarding Flow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a blocking 7-step onboarding flow for new FeedbackFlow users.

**Architecture:** Steps 1-3 are full-page views at `/onboarding`. After step 3, user redirects to `/dashboard` where steps 4-7 appear as a modal overlay. Onboarding state is stored on the user record in Convex.

**Tech Stack:** Next.js 15, Convex, Tailwind CSS, Framer Motion for animations

---

## Task 1: Schema Changes

**Files:**
- Modify: `convex/schema.ts:16-26`

**Step 1: Add onboarding fields to users table**

Add two new fields to the `users` table definition:

```typescript
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
})
  .index("by_clerk_id", ["clerkId"])
  .index("by_email", ["email"]),
```

**Step 2: Add siteUrl and projectType to projects table**

Modify the `projects` table to include URL and type:

```typescript
projects: defineTable({
  teamId: v.id("teams"),
  name: v.string(),
  description: v.optional(v.string()),
  siteUrl: v.optional(v.string()),
  projectType: v.optional(v.union(
    v.literal("web_app"),
    v.literal("marketing_site"),
    v.literal("mobile_app"),
    v.literal("other")
  )),
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
  .index("by_team_and_name", ["teamId", "name"]),
```

**Step 3: Run Convex to verify schema**

Run: `npx convex dev`
Expected: Schema updates successfully

**Step 4: Commit**

```bash
git add convex/schema.ts
git commit -m "feat(onboarding): add onboarding fields to schema"
```

---

## Task 2: Onboarding Convex Mutations

**Files:**
- Create: `convex/onboarding.ts`
- Modify: `convex/users.ts:8-42`

**Step 1: Create onboarding.ts with mutations**

```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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

    return {
      step: user.onboardingStep,
      completedAt: user.onboardingCompletedAt,
      isComplete: user.onboardingStep === undefined || user.onboardingStep >= 8,
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

    // Create project
    const projectId = await ctx.db.insert("projects", {
      teamId: args.teamId,
      name: args.name,
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

    return { projectId, widgetId, widgetKey, step: 4 };
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

    // Create test feedback
    const feedbackId = await ctx.db.insert("feedback", {
      widgetId: widget._id,
      projectId: args.projectId,
      teamId: project.teamId,
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
```

**Step 2: Update upsertUser to initialize onboarding for new users**

In `convex/users.ts`, modify the `upsertUser` mutation to check if this is a first-time user:

```typescript
export const upsertUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        name: args.name,
        avatar: args.avatar,
      });
      return existingUser._id;
    }

    // Check if user has any team memberships via invite
    const existingMember = await ctx.db
      .query("teamMembers")
      .filter((q) => {
        // We can't check by userId yet since user doesn't exist
        // Instead, check if there are pending invites for this email
        return q.eq(true, false); // This will be handled separately
      })
      .first();

    // Check for pending invites
    const pendingInvite = await ctx.db
      .query("teamInvites")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .filter((q) => q.gt(q.field("expiresAt"), Date.now()))
      .first();

    // Create new user
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      avatar: args.avatar,
      createdAt: Date.now(),
      // Start onboarding only if no pending invites (they'll join existing team)
      onboardingStep: pendingInvite ? undefined : 1,
    });

    return userId;
  },
});
```

**Step 3: Verify Convex compiles**

Run: `npx convex dev`
Expected: No errors

**Step 4: Commit**

```bash
git add convex/onboarding.ts convex/users.ts
git commit -m "feat(onboarding): add onboarding mutations"
```

---

## Task 3: Onboarding Page Route

**Files:**
- Create: `app/onboarding/page.tsx`
- Create: `app/onboarding/layout.tsx`

**Step 1: Create onboarding layout**

```typescript
// app/onboarding/layout.tsx
import { ReactNode } from "react";

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#e8e6e1]">
      {children}
    </div>
  );
}
```

**Step 2: Create onboarding page**

```typescript
// app/onboarding/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { OnboardingStepTeam } from "@/components/onboarding/onboarding-step-team";
import { OnboardingStepWalkthrough } from "@/components/onboarding/onboarding-step-walkthrough";
import { OnboardingStepProject } from "@/components/onboarding/onboarding-step-project";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { Id } from "@/convex/_generated/dataModel";

export default function OnboardingPage() {
  const router = useRouter();
  const onboardingState = useQuery(api.onboarding.getOnboardingState);
  const startOnboarding = useMutation(api.onboarding.startOnboarding);

  const [teamId, setTeamId] = useState<Id<"teams"> | null>(null);

  useEffect(() => {
    // Start onboarding if not started
    if (onboardingState && onboardingState.step === undefined && !onboardingState.isComplete) {
      startOnboarding();
    }
  }, [onboardingState, startOnboarding]);

  useEffect(() => {
    // Redirect to dashboard if onboarding complete or on step 4+
    if (onboardingState?.isComplete) {
      router.push("/dashboard");
    } else if (onboardingState?.step && onboardingState.step >= 4) {
      router.push("/dashboard");
    }
  }, [onboardingState, router]);

  if (!onboardingState) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse font-mono text-sm text-stone-500">Loading...</div>
      </div>
    );
  }

  const currentStep = onboardingState.step ?? 1;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <OnboardingProgress currentStep={currentStep} totalSteps={7} />

      <div className="mt-8 w-full max-w-lg">
        {currentStep === 1 && (
          <OnboardingStepTeam onComplete={(id) => setTeamId(id)} />
        )}
        {currentStep === 2 && <OnboardingStepWalkthrough />}
        {currentStep === 3 && teamId && (
          <OnboardingStepProject teamId={teamId} />
        )}
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add app/onboarding/
git commit -m "feat(onboarding): add onboarding page route"
```

---

## Task 4: Onboarding Progress Component

**Files:**
- Create: `components/onboarding/onboarding-progress.tsx`

**Step 1: Create progress indicator**

```typescript
// components/onboarding/onboarding-progress.tsx
"use client";

import { cn } from "@/lib/utils";

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function OnboardingProgress({ currentStep, totalSteps }: OnboardingProgressProps) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div
          key={step}
          className={cn(
            "h-2.5 w-2.5 rounded-full border-2 border-retro-black transition-all duration-300",
            step === currentStep
              ? "scale-125 bg-retro-yellow"
              : step < currentStep
                ? "bg-retro-black"
                : "bg-transparent"
          )}
        />
      ))}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/onboarding/onboarding-progress.tsx
git commit -m "feat(onboarding): add progress indicator component"
```

---

## Task 5: Step 1 - Team Name Component

**Files:**
- Create: `components/onboarding/onboarding-step-team.tsx`

**Step 1: Create team name step**

```typescript
// components/onboarding/onboarding-step-team.tsx
"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Icon } from "@/components/ui/icon";

interface OnboardingStepTeamProps {
  onComplete: (teamId: Id<"teams">) => void;
}

export function OnboardingStepTeam({ onComplete }: OnboardingStepTeamProps) {
  const [teamName, setTeamName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTeam = useMutation(api.onboarding.createOnboardingTeam);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await createTeam({ name: teamName.trim() });
      onComplete(result.teamId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create team");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border-2 border-retro-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center border-2 border-retro-black bg-retro-yellow">
          <Icon name="solar:buildings-2-linear" size={24} />
        </div>
        <h1 className="text-2xl font-bold text-retro-black">
          Let&apos;s set up your workspace
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="teamName"
            className="mb-2 block font-mono text-sm uppercase tracking-wider text-stone-600"
          >
            What&apos;s your team or company name?
          </label>
          <input
            id="teamName"
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Acme Inc."
            className="w-full border-2 border-retro-black bg-stone-50 px-4 py-3 text-lg transition-shadow focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0px_0px_rgba(107,154,196,1)]"
            autoFocus
            disabled={isLoading}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={!teamName.trim() || isLoading}
          className="flex w-full items-center justify-center gap-2 border-2 border-retro-black bg-retro-yellow px-6 py-3 font-bold uppercase tracking-wide transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          {isLoading ? (
            <>
              <Icon name="solar:refresh-linear" size={20} className="animate-spin" />
              Creating...
            </>
          ) : (
            <>
              Continue
              <Icon name="solar:arrow-right-linear" size={20} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/onboarding/onboarding-step-team.tsx
git commit -m "feat(onboarding): add step 1 team name component"
```

---

## Task 6: Step 2 - Animated Walkthrough Component

**Files:**
- Create: `components/onboarding/onboarding-step-walkthrough.tsx`

**Step 1: Create walkthrough step with animations**

```typescript
// components/onboarding/onboarding-step-walkthrough.tsx
"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const slides = [
  {
    title: "Your users click the feedback button",
    description: "A sleek widget appears in the corner of your site, ready to capture feedback.",
    icon: "solar:cursor-linear",
    color: "bg-retro-blue",
  },
  {
    title: "They capture screenshots and describe issues",
    description: "Users can annotate screenshots, record their screen, and explain the problem.",
    icon: "solar:camera-linear",
    color: "bg-retro-lavender",
  },
  {
    title: "Tickets land in your inbox instantly",
    description: "Every piece of feedback flows into your dashboard in real-time.",
    icon: "solar:inbox-linear",
    color: "bg-retro-yellow",
  },
  {
    title: "Export to Linear, Notion, or your tools",
    description: "One click exports formatted tickets to your project management tools.",
    icon: "solar:export-linear",
    color: "bg-retro-pink",
  },
];

export function OnboardingStepWalkthrough() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const completeStep = useMutation(api.onboarding.completeStep);

  // Auto-advance slides
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev < slides.length - 1 ? prev + 1 : prev));
    }, 4000);

    return () => clearInterval(timer);
  }, [isPaused]);

  const handleContinue = async () => {
    await completeStep({ step: 2 });
  };

  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <div
      className="border-2 border-retro-black bg-white shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slide content */}
      <div className="relative h-64 overflow-hidden">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center p-8 transition-all duration-500",
              slide.color,
              index === currentSlide
                ? "translate-x-0 opacity-100"
                : index < currentSlide
                  ? "-translate-x-full opacity-0"
                  : "translate-x-full opacity-0"
            )}
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center border-2 border-retro-black bg-white">
              <Icon name={slide.icon} size={32} />
            </div>
            <div
              className={cn(
                "h-2 w-2 rounded-full bg-retro-black",
                index === currentSlide && "animate-ping"
              )}
            />
          </div>
        ))}
      </div>

      {/* Text content */}
      <div className="border-t-2 border-retro-black p-8">
        <h2 className="mb-2 text-xl font-bold text-retro-black">
          {slides[currentSlide].title}
        </h2>
        <p className="mb-6 text-stone-600">
          {slides[currentSlide].description}
        </p>

        {/* Progress dots */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={cn(
                "h-2 w-2 rounded-full border border-retro-black transition-all",
                index === currentSlide ? "w-6 bg-retro-black" : "bg-transparent hover:bg-stone-200"
              )}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
            disabled={currentSlide === 0}
            className="flex items-center gap-1 text-sm text-stone-500 transition-colors hover:text-retro-black disabled:opacity-30"
          >
            <Icon name="solar:arrow-left-linear" size={16} />
            Back
          </button>

          {isLastSlide ? (
            <button
              onClick={handleContinue}
              className="flex items-center gap-2 border-2 border-retro-black bg-retro-yellow px-6 py-2 font-bold uppercase tracking-wide transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]"
            >
              Got it, let&apos;s go
              <Icon name="solar:arrow-right-linear" size={18} />
            </button>
          ) : (
            <button
              onClick={() => setCurrentSlide((prev) => prev + 1)}
              className="flex items-center gap-1 text-sm text-stone-500 transition-colors hover:text-retro-black"
            >
              Next
              <Icon name="solar:arrow-right-linear" size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/onboarding/onboarding-step-walkthrough.tsx
git commit -m "feat(onboarding): add step 2 animated walkthrough"
```

---

## Task 7: Step 3 - Create Project Component

**Files:**
- Create: `components/onboarding/onboarding-step-project.tsx`

**Step 1: Create project step**

```typescript
// components/onboarding/onboarding-step-project.tsx
"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type ProjectType = "web_app" | "marketing_site" | "mobile_app" | "other";

const projectTypes: { value: ProjectType; label: string; icon: string }[] = [
  { value: "web_app", label: "Web App", icon: "solar:window-frame-linear" },
  { value: "marketing_site", label: "Marketing Site", icon: "solar:global-linear" },
  { value: "mobile_app", label: "Mobile App", icon: "solar:smartphone-linear" },
  { value: "other", label: "Other", icon: "solar:widget-linear" },
];

interface OnboardingStepProjectProps {
  teamId: Id<"teams">;
}

export function OnboardingStepProject({ teamId }: OnboardingStepProjectProps) {
  const router = useRouter();
  const [projectName, setProjectName] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [projectType, setProjectType] = useState<ProjectType>("web_app");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProject = useMutation(api.onboarding.createOnboardingProject);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !siteUrl.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Ensure URL has protocol
      let formattedUrl = siteUrl.trim();
      if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
        formattedUrl = `https://${formattedUrl}`;
      }

      await createProject({
        teamId,
        name: projectName.trim(),
        siteUrl: formattedUrl,
        projectType,
      });

      // Redirect to dashboard where modal will take over
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
      setIsLoading(false);
    }
  };

  return (
    <div className="border-2 border-retro-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center border-2 border-retro-black bg-retro-lavender">
          <Icon name="solar:folder-with-files-linear" size={24} />
        </div>
        <h1 className="text-2xl font-bold text-retro-black">
          Create your first project
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Name */}
        <div>
          <label
            htmlFor="projectName"
            className="mb-2 block font-mono text-sm uppercase tracking-wider text-stone-600"
          >
            Project Name
          </label>
          <input
            id="projectName"
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="My App"
            className="w-full border-2 border-retro-black bg-stone-50 px-4 py-3 transition-shadow focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0px_0px_rgba(107,154,196,1)]"
            autoFocus
            disabled={isLoading}
          />
        </div>

        {/* Site URL */}
        <div>
          <label
            htmlFor="siteUrl"
            className="mb-2 block font-mono text-sm uppercase tracking-wider text-stone-600"
          >
            Site URL
          </label>
          <input
            id="siteUrl"
            type="text"
            value={siteUrl}
            onChange={(e) => setSiteUrl(e.target.value)}
            placeholder="https://myapp.com"
            className="w-full border-2 border-retro-black bg-stone-50 px-4 py-3 transition-shadow focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0px_0px_rgba(107,154,196,1)]"
            disabled={isLoading}
          />
        </div>

        {/* Project Type */}
        <div>
          <label className="mb-2 block font-mono text-sm uppercase tracking-wider text-stone-600">
            Project Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            {projectTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setProjectType(type.value)}
                disabled={isLoading}
                className={cn(
                  "flex items-center gap-2 border-2 px-4 py-3 transition-all",
                  projectType === type.value
                    ? "border-retro-black bg-retro-yellow shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]"
                    : "border-stone-200 bg-white hover:border-retro-black"
                )}
              >
                <Icon name={type.icon} size={20} />
                <span className="text-sm font-medium">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={!projectName.trim() || !siteUrl.trim() || isLoading}
          className="flex w-full items-center justify-center gap-2 border-2 border-retro-black bg-retro-yellow px-6 py-3 font-bold uppercase tracking-wide transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          {isLoading ? (
            <>
              <Icon name="solar:refresh-linear" size={20} className="animate-spin" />
              Creating...
            </>
          ) : (
            <>
              Create Project
              <Icon name="solar:arrow-right-linear" size={20} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/onboarding/onboarding-step-project.tsx
git commit -m "feat(onboarding): add step 3 create project component"
```

---

## Task 8: Onboarding Modal Wrapper

**Files:**
- Create: `components/onboarding/onboarding-modal.tsx`

**Step 1: Create modal wrapper for steps 4-7**

```typescript
// components/onboarding/onboarding-modal.tsx
"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { OnboardingProgress } from "./onboarding-progress";
import { OnboardingStepInstall } from "./onboarding-step-install";
import { OnboardingStepVerify } from "./onboarding-step-verify";
import { OnboardingStepInvite } from "./onboarding-step-invite";
import { OnboardingStepUpgrade } from "./onboarding-step-upgrade";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";

interface OnboardingModalProps {
  teamId: Id<"teams">;
  projectId: Id<"projects">;
  widgetKey: string;
}

export function OnboardingModal({ teamId, projectId, widgetKey }: OnboardingModalProps) {
  const onboardingState = useQuery(api.onboarding.getOnboardingState);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!onboardingState || onboardingState.isComplete) {
    return null;
  }

  const step = onboardingState.step ?? 4;

  // Only show modal for steps 4-7
  if (step < 4 || step > 7) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
          isVisible ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={cn(
            "w-full max-w-xl transform transition-all duration-300",
            isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
          )}
        >
          {/* Progress */}
          <div className="mb-4 flex justify-center">
            <OnboardingProgress currentStep={step} totalSteps={7} />
          </div>

          {/* Content */}
          <div className="border-2 border-retro-black bg-white shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]">
            {step === 4 && <OnboardingStepInstall widgetKey={widgetKey} projectId={projectId} />}
            {step === 5 && <OnboardingStepVerify projectId={projectId} />}
            {step === 6 && <OnboardingStepInvite teamId={teamId} />}
            {step === 7 && <OnboardingStepUpgrade teamId={teamId} />}
          </div>
        </div>
      </div>
    </>
  );
}
```

**Step 2: Commit**

```bash
git add components/onboarding/onboarding-modal.tsx
git commit -m "feat(onboarding): add modal wrapper for steps 4-7"
```

---

## Task 9: Step 4 - Install Script Component

**Files:**
- Create: `components/onboarding/onboarding-step-install.tsx`

**Step 1: Create install script step**

```typescript
// components/onboarding/onboarding-step-install.tsx
"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

interface OnboardingStepInstallProps {
  widgetKey: string;
  projectId: Id<"projects">;
}

export function OnboardingStepInstall({ widgetKey, projectId }: OnboardingStepInstallProps) {
  const [copied, setCopied] = useState(false);
  const [showFramework, setShowFramework] = useState<string | null>(null);
  const completeStep = useMutation(api.onboarding.completeStep);

  const project = useQuery(api.projects.getProject, { projectId });

  const scriptSnippet = `<script
  src="https://cdn.feedbackflow.dev/widget.js"
  data-widget-key="${widgetKey}"
  async
></script>`;

  const nextjsSnippet = `// In your layout.tsx or _app.tsx
import Script from 'next/script'

<Script
  src="https://cdn.feedbackflow.dev/widget.js"
  data-widget-key="${widgetKey}"
  strategy="lazyOnload"
/>`;

  const reactSnippet = `// In your index.html or App component
useEffect(() => {
  const script = document.createElement('script');
  script.src = 'https://cdn.feedbackflow.dev/widget.js';
  script.dataset.widgetKey = '${widgetKey}';
  script.async = true;
  document.body.appendChild(script);
}, []);`;

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContinue = async () => {
    await completeStep({ step: 4 });
  };

  const isMobileApp = project?.projectType === "mobile_app";

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center border-2 border-retro-black bg-retro-blue">
          <Icon name="solar:code-linear" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-retro-black">Install the feedback widget</h2>
          <p className="text-sm text-stone-600">Add this snippet to your site</p>
        </div>
      </div>

      {isMobileApp ? (
        <div className="mb-6 rounded border-2 border-dashed border-stone-300 bg-stone-50 p-6 text-center">
          <Icon name="solar:smartphone-linear" size={32} className="mx-auto mb-3 text-stone-400" />
          <p className="mb-2 font-medium text-stone-600">Mobile SDK coming soon</p>
          <p className="text-sm text-stone-500">
            For now, you can skip this step and test with our web widget.
          </p>
        </div>
      ) : (
        <>
          {/* Main snippet */}
          <div className="mb-4">
            <div className="flex items-center justify-between border-2 border-retro-black border-b-0 bg-stone-100 px-4 py-2">
              <span className="font-mono text-xs uppercase tracking-wider text-stone-600">HTML</span>
              <button
                onClick={() => handleCopy(scriptSnippet)}
                className="flex items-center gap-1 text-sm text-stone-600 transition-colors hover:text-retro-black"
              >
                <Icon name={copied ? "solar:check-circle-linear" : "solar:copy-linear"} size={16} />
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre className="overflow-x-auto border-2 border-retro-black bg-stone-900 p-4 text-sm text-green-400">
              <code>{scriptSnippet}</code>
            </pre>
          </div>

          {/* Framework hints */}
          <div className="mb-6 space-y-2">
            <button
              onClick={() => setShowFramework(showFramework === "nextjs" ? null : "nextjs")}
              className="flex w-full items-center justify-between text-sm text-stone-600 hover:text-retro-black"
            >
              <span>Using Next.js?</span>
              <Icon
                name="solar:alt-arrow-down-linear"
                size={16}
                className={cn("transition-transform", showFramework === "nextjs" && "rotate-180")}
              />
            </button>
            {showFramework === "nextjs" && (
              <pre className="overflow-x-auto rounded border border-stone-200 bg-stone-50 p-3 text-xs text-stone-700">
                <code>{nextjsSnippet}</code>
              </pre>
            )}

            <button
              onClick={() => setShowFramework(showFramework === "react" ? null : "react")}
              className="flex w-full items-center justify-between text-sm text-stone-600 hover:text-retro-black"
            >
              <span>Using React?</span>
              <Icon
                name="solar:alt-arrow-down-linear"
                size={16}
                className={cn("transition-transform", showFramework === "react" && "rotate-180")}
              />
            </button>
            {showFramework === "react" && (
              <pre className="overflow-x-auto rounded border border-stone-200 bg-stone-50 p-3 text-xs text-stone-700">
                <code>{reactSnippet}</code>
              </pre>
            )}
          </div>
        </>
      )}

      <button
        onClick={handleContinue}
        className="flex w-full items-center justify-center gap-2 border-2 border-retro-black bg-retro-yellow px-6 py-3 font-bold uppercase tracking-wide transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]"
      >
        I&apos;ve installed it
        <Icon name="solar:arrow-right-linear" size={20} />
      </button>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/onboarding/onboarding-step-install.tsx
git commit -m "feat(onboarding): add step 4 install script component"
```

---

## Task 10: Step 5 - Verify Install Component

**Files:**
- Create: `components/onboarding/onboarding-step-verify.tsx`

**Step 1: Create verify step with real-time feedback**

```typescript
// components/onboarding/onboarding-step-verify.tsx
"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

interface OnboardingStepVerifyProps {
  projectId: Id<"projects">;
}

export function OnboardingStepVerify({ projectId }: OnboardingStepVerifyProps) {
  const [isSending, setIsSending] = useState(false);
  const [hasSent, setHasSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendTestFeedback = useMutation(api.onboarding.sendTestFeedback);
  const completeStep = useMutation(api.onboarding.completeStep);

  // Watch for new feedback in real-time
  const feedback = useQuery(api.feedback.getFeedback, {
    projectId,
    status: "new",
    limit: 1,
  });

  const testFeedbackReceived = feedback && feedback.length > 0 && hasSent;

  const handleSendTest = async () => {
    setIsSending(true);
    setError(null);

    try {
      await sendTestFeedback({ projectId });
      setHasSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send test feedback");
    } finally {
      setIsSending(false);
    }
  };

  const handleContinue = async () => {
    await completeStep({ step: 5 });
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center border-2 border-retro-black transition-colors",
            testFeedbackReceived ? "bg-green-400" : "bg-retro-lavender"
          )}
        >
          <Icon
            name={testFeedbackReceived ? "solar:check-circle-linear" : "solar:test-tube-linear"}
            size={24}
          />
        </div>
        <div>
          <h2 className="text-xl font-bold text-retro-black">Verify install</h2>
          <p className="text-sm text-stone-600">Let&apos;s make sure tickets are coming in</p>
        </div>
      </div>

      {!testFeedbackReceived ? (
        <>
          <div className="mb-6 text-center">
            <p className="mb-4 text-stone-600">
              Click the button below to send a test ticket through your widget.
            </p>

            <button
              onClick={handleSendTest}
              disabled={isSending || hasSent}
              className={cn(
                "flex w-full items-center justify-center gap-3 border-2 border-retro-black px-6 py-4 text-lg font-bold transition-all",
                hasSent
                  ? "bg-stone-100 text-stone-500"
                  : "bg-retro-yellow hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]"
              )}
            >
              {isSending ? (
                <>
                  <Icon name="solar:refresh-linear" size={24} className="animate-spin" />
                  Sending...
                </>
              ) : hasSent ? (
                <>
                  <Icon name="solar:hourglass-linear" size={24} className="animate-pulse" />
                  Waiting for ticket...
                </>
              ) : (
                <>
                  <Icon name="solar:play-linear" size={24} />
                  Send Test Feedback
                </>
              )}
            </button>

            {error && (
              <p className="mt-3 text-sm text-red-600">{error}</p>
            )}

            {hasSent && !testFeedbackReceived && (
              <p className="mt-4 text-sm text-stone-500">
                Check your inbox on the left - the ticket should appear any moment...
              </p>
            )}
          </div>

          <div className="border-t border-stone-200 pt-4">
            <a
              href="/docs/troubleshooting"
              target="_blank"
              className="flex items-center justify-center gap-1 text-sm text-stone-500 hover:text-retro-black"
            >
              <Icon name="solar:question-circle-linear" size={16} />
              Having trouble?
            </a>
          </div>
        </>
      ) : (
        <>
          {/* Success state */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border-4 border-green-500 bg-green-100">
              <Icon name="solar:check-circle-bold" size={40} className="text-green-600" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-green-700">It&apos;s working!</h3>
            <p className="text-stone-600">
              Your first ticket just arrived. You&apos;re all set to start collecting feedback.
            </p>
          </div>

          <button
            onClick={handleContinue}
            className="flex w-full items-center justify-center gap-2 border-2 border-retro-black bg-retro-yellow px-6 py-3 font-bold uppercase tracking-wide transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]"
          >
            Continue
            <Icon name="solar:arrow-right-linear" size={20} />
          </button>
        </>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/onboarding/onboarding-step-verify.tsx
git commit -m "feat(onboarding): add step 5 verify install component"
```

---

## Task 11: Step 6 - Invite Teammate Component

**Files:**
- Create: `components/onboarding/onboarding-step-invite.tsx`

**Step 1: Create invite step**

```typescript
// components/onboarding/onboarding-step-invite.tsx
"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Icon } from "@/components/ui/icon";

interface OnboardingStepInviteProps {
  teamId: Id<"teams">;
}

export function OnboardingStepInvite({ teamId }: OnboardingStepInviteProps) {
  const [email, setEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);

  const inviteToTeam = useMutation(api.teams.inviteToTeam);
  const completeStep = useMutation(api.onboarding.completeStep);
  const skipToComplete = useMutation(api.onboarding.skipToComplete);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsInviting(true);
    setError(null);

    try {
      await inviteToTeam({
        teamId,
        email: email.trim(),
        role: "member",
      });
      setInvitedEmails([...invitedEmails, email.trim()]);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setIsInviting(false);
    }
  };

  const handleContinue = async () => {
    await completeStep({ step: 6 });
  };

  const handleSkip = async () => {
    await completeStep({ step: 6 });
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center border-2 border-retro-black bg-retro-pink">
          <Icon name="solar:users-group-rounded-linear" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-retro-black">Invite your team</h2>
          <p className="text-sm text-stone-600">Collaboration makes feedback better</p>
        </div>
      </div>

      <form onSubmit={handleInvite} className="mb-6">
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@company.com"
            className="flex-1 border-2 border-retro-black bg-stone-50 px-4 py-3 transition-shadow focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0px_0px_rgba(107,154,196,1)]"
            disabled={isInviting}
          />
          <button
            type="submit"
            disabled={!email.trim() || isInviting}
            className="flex items-center gap-2 border-2 border-retro-black bg-white px-4 py-3 font-medium transition-all hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isInviting ? (
              <Icon name="solar:refresh-linear" size={18} className="animate-spin" />
            ) : (
              <Icon name="solar:letter-linear" size={18} />
            )}
            Invite
          </button>
        </div>

        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </form>

      {/* Invited list */}
      {invitedEmails.length > 0 && (
        <div className="mb-6 space-y-2">
          <p className="font-mono text-xs uppercase tracking-wider text-stone-500">Invited</p>
          {invitedEmails.map((invitedEmail) => (
            <div
              key={invitedEmail}
              className="flex items-center gap-2 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm"
            >
              <Icon name="solar:check-circle-linear" size={16} className="text-green-600" />
              <span className="text-stone-700">{invitedEmail}</span>
              <span className="text-stone-500">- Invite sent</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          onClick={handleSkip}
          className="text-sm text-stone-500 transition-colors hover:text-retro-black"
        >
          I&apos;ll do this later
        </button>

        <button
          onClick={handleContinue}
          className="flex items-center gap-2 border-2 border-retro-black bg-retro-yellow px-6 py-3 font-bold uppercase tracking-wide transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]"
        >
          Continue
          <Icon name="solar:arrow-right-linear" size={20} />
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/onboarding/onboarding-step-invite.tsx
git commit -m "feat(onboarding): add step 6 invite teammate component"
```

---

## Task 12: Step 7 - Upgrade Prompt Component

**Files:**
- Create: `components/onboarding/onboarding-step-upgrade.tsx`

**Step 1: Create upgrade prompt step**

```typescript
// components/onboarding/onboarding-step-upgrade.tsx
"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Icon } from "@/components/ui/icon";
import { PLANS } from "@/lib/stripe-config";
import { cn } from "@/lib/utils";

interface OnboardingStepUpgradeProps {
  teamId: Id<"teams">;
}

export function OnboardingStepUpgrade({ teamId }: OnboardingStepUpgradeProps) {
  const [isLoading, setIsLoading] = useState(false);
  const skipToComplete = useMutation(api.onboarding.skipToComplete);

  const handleUpgrade = async () => {
    setIsLoading(true);
    // Redirect to billing/upgrade page
    window.location.href = `/settings/billing?upgrade=true`;
  };

  const handleStartFree = async () => {
    await skipToComplete();
  };

  return (
    <div className="p-8">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border-2 border-retro-black bg-retro-yellow">
          <Icon name="solar:crown-linear" size={28} />
        </div>
        <h2 className="text-2xl font-bold text-retro-black">Unlock the full power</h2>
      </div>

      {/* Comparison */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        {/* Free */}
        <div className="border-2 border-stone-200 bg-stone-50 p-4">
          <h3 className="mb-2 font-bold text-stone-600">Free</h3>
          <p className="mb-4 text-2xl font-bold text-stone-400">$0</p>
          <ul className="space-y-2 text-sm text-stone-500">
            {PLANS.free.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2">
                <Icon name="solar:minus-circle-linear" size={16} className="mt-0.5 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Pro */}
        <div className="border-2 border-retro-blue bg-white p-4 shadow-[4px_4px_0px_0px_rgba(107,154,196,1)]">
          <h3 className="mb-2 font-bold text-retro-black">Pro</h3>
          <p className="mb-4">
            <span className="text-2xl font-bold text-retro-black">${PLANS.pro.pricePerSeat}</span>
            <span className="text-sm text-stone-500">/seat/mo</span>
          </p>
          <ul className="space-y-2 text-sm text-stone-700">
            {PLANS.pro.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2">
                <Icon name="solar:check-circle-linear" size={16} className="mt-0.5 shrink-0 text-retro-blue" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={handleUpgrade}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 border-2 border-retro-black bg-retro-yellow px-6 py-3 font-bold uppercase tracking-wide transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] disabled:opacity-50"
        >
          {isLoading ? (
            <Icon name="solar:refresh-linear" size={20} className="animate-spin" />
          ) : (
            <>
              Upgrade to Pro
              <Icon name="solar:arrow-right-linear" size={20} />
            </>
          )}
        </button>

        <button
          onClick={handleStartFree}
          className="w-full py-2 text-center text-sm text-stone-500 transition-colors hover:text-retro-black"
        >
          Start with Free
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/onboarding/onboarding-step-upgrade.tsx
git commit -m "feat(onboarding): add step 7 upgrade prompt component"
```

---

## Task 13: Dashboard Layout Integration

**Files:**
- Modify: `components/dashboard/dashboard-layout.tsx`

**Step 1: Add onboarding modal to dashboard**

Update the dashboard layout to show the onboarding modal when appropriate:

```typescript
// components/dashboard/dashboard-layout.tsx
"use client";

import { useState, createContext, useContext, ReactNode, useEffect } from "react";
import { useQuery } from "convex/react";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardHeader } from "./dashboard-header";
import { TicketDetailPanel } from "./ticket-detail-panel";
import { OnboardingModal } from "../onboarding/onboarding-modal";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";

interface DashboardContextType {
  selectedTeamId: Id<"teams"> | null;
  setSelectedTeamId: (id: Id<"teams"> | null) => void;
  selectedProjectId: Id<"projects"> | null;
  setSelectedProjectId: (id: Id<"projects"> | null) => void;
  selectedFeedbackId: Id<"feedback"> | null;
  setSelectedFeedbackId: (id: Id<"feedback"> | null) => void;
  currentView: "inbox" | "backlog" | "resolved";
  setCurrentView: (view: "inbox" | "backlog" | "resolved") => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<Id<"teams"> | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<Id<"projects"> | null>(null);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<Id<"feedback"> | null>(null);
  const [currentView, setCurrentView] = useState<"inbox" | "backlog" | "resolved">("inbox");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Get onboarding state
  const onboardingState = useQuery(api.onboarding.getOnboardingState);
  const teams = useQuery(api.teams.getMyTeams);

  // Get first team and project for onboarding modal
  const firstTeam = teams?.[0];
  const projects = useQuery(
    api.projects.getProjects,
    firstTeam ? { teamId: firstTeam._id } : "skip"
  );
  const firstProject = projects?.[0];

  // Get widget key for first project
  const widgets = useQuery(
    api.projects.getWidgets,
    firstProject ? { projectId: firstProject._id } : "skip"
  );
  const widgetKey = widgets?.[0]?.widgetKey;

  // Show onboarding modal for steps 4-7
  const showOnboardingModal =
    onboardingState &&
    !onboardingState.isComplete &&
    onboardingState.step !== undefined &&
    onboardingState.step >= 4 &&
    onboardingState.step <= 7 &&
    firstTeam &&
    firstProject &&
    widgetKey;

  return (
    <DashboardContext.Provider
      value={{
        selectedTeamId,
        setSelectedTeamId,
        selectedProjectId,
        setSelectedProjectId,
        selectedFeedbackId,
        setSelectedFeedbackId,
        currentView,
        setCurrentView,
        sidebarOpen,
        setSidebarOpen,
        searchQuery,
        setSearchQuery,
      }}
    >
      {/* Outer wrapper with retro background */}
      <div className="flex h-screen flex-col bg-[#e8e6e1] p-2 font-sans antialiased overflow-hidden">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main application shell with retro border and shadow */}
        <div className="mx-auto flex w-full max-w-[1800px] flex-1 flex-col overflow-hidden border-2 border-retro-black bg-retro-paper shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] md:flex-row">
          {/* Left sidebar */}
          <DashboardSidebar />

          {/* Main content area */}
          <main className="flex min-w-0 flex-1 flex-col bg-stone-100">
            <DashboardHeader />
            <div className="flex-1 overflow-y-auto p-4">{children}</div>
          </main>

          {/* Right sidebar for ticket detail (desktop only) */}
          <TicketDetailPanel />
        </div>
      </div>

      {/* Onboarding modal for steps 4-7 */}
      {showOnboardingModal && (
        <OnboardingModal
          teamId={firstTeam._id}
          projectId={firstProject._id}
          widgetKey={widgetKey}
        />
      )}
    </DashboardContext.Provider>
  );
}
```

**Step 2: Commit**

```bash
git add components/dashboard/dashboard-layout.tsx
git commit -m "feat(onboarding): integrate onboarding modal into dashboard"
```

---

## Task 14: Auth Layout Redirect

**Files:**
- Modify: `app/(auth)/layout.tsx`

**Step 1: Add onboarding redirect logic**

```typescript
// app/(auth)/layout.tsx
"use client";

import { useStoreUser } from "@/lib/hooks/use-store-user";
import { useQuery } from "convex/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { api } from "@/convex/_generated/api";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded } = useStoreUser();
  const router = useRouter();
  const pathname = usePathname();

  // Get onboarding state
  const onboardingState = useQuery(
    api.onboarding.getOnboardingState,
    user ? {} : "skip"
  );

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    }
  }, [isLoaded, user, router]);

  // Redirect to onboarding if needed (steps 1-3)
  useEffect(() => {
    if (!onboardingState) return;

    const step = onboardingState.step;
    const isComplete = onboardingState.isComplete;

    // If onboarding is in steps 1-3 and we're not on /onboarding, redirect
    if (!isComplete && step !== undefined && step >= 1 && step <= 3) {
      if (pathname !== "/onboarding") {
        router.push("/onboarding");
      }
    }
  }, [onboardingState, pathname, router]);

  // Show loading while checking auth
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-retro-paper">
        <div className="animate-pulse font-mono text-sm text-stone-500">
          Loading...
        </div>
      </div>
    );
  }

  // User is authenticated, render children
  return <>{children}</>;
}
```

**Step 2: Commit**

```bash
git add app/(auth)/layout.tsx
git commit -m "feat(onboarding): add redirect logic to auth layout"
```

---

## Task 15: Add Feedback Query for Verification

**Files:**
- Modify: `convex/feedback.ts` (add getFeedback query if needed)

**Step 1: Add or verify getFeedback query exists**

Ensure there's a query to get feedback by project and status:

```typescript
// Add to convex/feedback.ts if not exists

/**
 * Get feedback for a project with filters
 */
export const getFeedback = query({
  args: {
    projectId: v.id("projects"),
    status: v.optional(v.union(
      v.literal("new"),
      v.literal("triaging"),
      v.literal("drafted"),
      v.literal("exported"),
      v.literal("resolved")
    )),
    limit: v.optional(v.number()),
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

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return [];
    }

    // Check membership
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("teamId"), project.teamId))
      .first();

    if (!membership) {
      return [];
    }

    let query = ctx.db
      .query("feedback")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId));

    const allFeedback = await query.collect();

    let filtered = allFeedback;
    if (args.status) {
      filtered = allFeedback.filter((f) => f.status === args.status);
    }

    // Sort by createdAt descending
    filtered.sort((a, b) => b.createdAt - a.createdAt);

    if (args.limit) {
      filtered = filtered.slice(0, args.limit);
    }

    return filtered;
  },
});
```

**Step 2: Commit**

```bash
git add convex/feedback.ts
git commit -m "feat(onboarding): add getFeedback query for verification"
```

---

## Task 16: Update Middleware for Onboarding Route

**Files:**
- Modify: `middleware.ts`

**Step 1: Add /onboarding to public routes**

Wait - actually /onboarding should be protected (requires auth). The current middleware should work. Just verify it's not blocking onboarding.

If middleware blocks /onboarding, update the public routes check or handle it in the auth layout.

**Step 2: Verify middleware doesn't block onboarding**

The current middleware uses Clerk's `auth.protect()` which will redirect unauthenticated users to sign-in. The onboarding page is within the auth flow, so it should work.

**Step 3: Commit (if changes needed)**

```bash
git add middleware.ts
git commit -m "feat(onboarding): ensure onboarding route is accessible"
```

---

## Task 17: Create Index Exports

**Files:**
- Create: `components/onboarding/index.ts`

**Step 1: Create barrel export**

```typescript
// components/onboarding/index.ts
export { OnboardingProgress } from "./onboarding-progress";
export { OnboardingStepTeam } from "./onboarding-step-team";
export { OnboardingStepWalkthrough } from "./onboarding-step-walkthrough";
export { OnboardingStepProject } from "./onboarding-step-project";
export { OnboardingModal } from "./onboarding-modal";
export { OnboardingStepInstall } from "./onboarding-step-install";
export { OnboardingStepVerify } from "./onboarding-step-verify";
export { OnboardingStepInvite } from "./onboarding-step-invite";
export { OnboardingStepUpgrade } from "./onboarding-step-upgrade";
```

**Step 2: Commit**

```bash
git add components/onboarding/index.ts
git commit -m "feat(onboarding): add barrel exports"
```

---

## Task 18: Update Changelog

**Files:**
- Modify: `CHANGELOG.md`

**Step 1: Add onboarding feature to changelog**

```markdown
## [Unreleased]

### Added
- **Onboarding Flow** - Blocking 7-step onboarding for new users
  - Step 1: Team name entry
  - Step 2: Animated product walkthrough
  - Step 3: Create first project (name, URL, type)
  - Step 4: Widget install instructions (modal)
  - Step 5: Verify install with test feedback (modal)
  - Step 6: Invite teammates (modal, skippable)
  - Step 7: Upgrade prompt (modal, skippable)
```

**Step 2: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: add onboarding feature to changelog"
```

---

## Task 19: Test and Verify

**Step 1: Run dev server**

```bash
npm run dev
```

**Step 2: Run Convex**

```bash
npx convex dev
```

**Step 3: Test flow manually**

1. Sign out of any existing account
2. Create new account via Clerk
3. Verify redirect to /onboarding
4. Complete step 1 (team name)
5. View step 2 (walkthrough)
6. Complete step 3 (create project)
7. Verify redirect to dashboard with modal
8. Complete step 4 (install)
9. Complete step 5 (verify - click test button)
10. Complete step 6 (invite or skip)
11. Complete step 7 (upgrade or skip)
12. Verify modal closes and dashboard is usable

**Step 4: Fix any issues found**

**Step 5: Final commit**

```bash
git add .
git commit -m "feat(onboarding): complete onboarding implementation"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Schema changes | `convex/schema.ts` |
| 2 | Onboarding mutations | `convex/onboarding.ts`, `convex/users.ts` |
| 3 | Onboarding page route | `app/onboarding/` |
| 4 | Progress component | `components/onboarding/onboarding-progress.tsx` |
| 5 | Step 1: Team name | `components/onboarding/onboarding-step-team.tsx` |
| 6 | Step 2: Walkthrough | `components/onboarding/onboarding-step-walkthrough.tsx` |
| 7 | Step 3: Create project | `components/onboarding/onboarding-step-project.tsx` |
| 8 | Modal wrapper | `components/onboarding/onboarding-modal.tsx` |
| 9 | Step 4: Install | `components/onboarding/onboarding-step-install.tsx` |
| 10 | Step 5: Verify | `components/onboarding/onboarding-step-verify.tsx` |
| 11 | Step 6: Invite | `components/onboarding/onboarding-step-invite.tsx` |
| 12 | Step 7: Upgrade | `components/onboarding/onboarding-step-upgrade.tsx` |
| 13 | Dashboard integration | `components/dashboard/dashboard-layout.tsx` |
| 14 | Auth redirect | `app/(auth)/layout.tsx` |
| 15 | Feedback query | `convex/feedback.ts` |
| 16 | Middleware check | `middleware.ts` |
| 17 | Index exports | `components/onboarding/index.ts` |
| 18 | Changelog | `CHANGELOG.md` |
| 19 | Test & verify | Manual testing |
