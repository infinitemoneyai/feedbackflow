# FeedbackFlow

## Overview

A feedback collection system with an embeddable website widget for screenshot capture, screen recording with audio narration, and annotation. Features a central dashboard for processing feedback with AI-powered triage, ticket drafting, and export to Linear, Notion, or JSON (prd.json format for AI workflows).

**Open source** with self-host option, or use hosted version with seat-based pricing.

## Tech Stack

| Layer    | Technology           | Notes                                     |
| -------- | -------------------- | ----------------------------------------- |
| Frontend | Next.js 15           | App Router, React 19                      |
| Backend  | Convex               | Real-time, serverless                     |
| Auth     | Clerk                | User accounts + teams                     |
| Payments | Stripe               | Seat-based pricing                        |
| Email    | Resend               | Transactional + notifications             |
| AI       | OpenAI/Anthropic     | User-provided API keys                    |
| Storage  | Convex + S3/R2/GCS   | Screenshots in Convex, videos in external |
| UI       | Tailwind + shadcn/ui | Retro design system                       |

---

## Project Structure

```
feedbackflow/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Authenticated routes
│   │   │   ├── dashboard/      # Main dashboard
│   │   │   ├── settings/       # User/team settings
│   │   │   └── api/            # API routes
│   │   ├── (public)/           # Public routes
│   │   │   ├── page.tsx        # Landing page
│   │   │   ├── pricing/        # Pricing page
│   │   │   ├── docs/           # Documentation
│   │   │   └── status/[id]/    # Submitter status page
│   │   └── api/
│   │       ├── widget/         # Widget submission endpoint
│   │       ├── webhooks/       # Stripe, integrations
│   │       └── v1/             # REST API
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── dashboard/          # Dashboard-specific
│   │   ├── feedback/           # Feedback display/editing
│   │   ├── widget/             # Widget preview/config
│   │   └── landing/            # Landing page sections
│   ├── lib/
│   │   ├── ai/                 # AI service wrappers
│   │   ├── integrations/       # Linear, Notion clients
│   │   ├── storage/            # S3/R2/GCS handlers
│   │   └── utils/              # Utilities
│   └── convex/                 # Convex backend
│       ├── schema.ts           # Database schema
│       ├── users.ts            # User operations
│       ├── teams.ts            # Team operations
│       ├── projects.ts         # Project operations
│       ├── widgets.ts          # Widget operations
│       ├── feedback.ts         # Feedback CRUD
│       ├── ai.ts               # AI processing
│       ├── exports.ts          # Export operations
│       └── notifications.ts    # Notification handling
├── widget/                     # Embeddable widget source
│   ├── src/
│   │   ├── index.ts            # Entry point
│   │   ├── capture.ts          # Screenshot/recording
│   │   ├── annotate.ts         # Annotation tools
│   │   ├── ui.ts               # Widget UI
│   │   └── submit.ts           # Submission + offline queue
│   └── dist/                   # Built widget script
├── e2e/                        # Playwright E2E tests
├── __tests__/                  # Vitest unit tests
├── prd.json                    # User stories
├── CLAUDE.md                   # This file
├── DESIGN.md                   # Design system
└── CHANGELOG.md                # What's been built
```

---

## Commands

```bash
# Development
npm run dev                 # Start Next.js
npx convex dev              # Start Convex (separate terminal)
npm run widget:dev          # Watch widget source

# Testing
npm run test                # Vitest unit tests
npm run test:watch          # Vitest watch mode
npm run test:e2e            # Playwright E2E
npm run test:coverage       # Coverage report

# Build
npm run build               # Production build
npm run widget:build        # Build widget script
npm run typecheck           # TypeScript check
npm run lint                # ESLint

# Deploy
vercel                      # Preview deployment
vercel --prod               # Production deployment
```

---

## Code Style

### Naming

- **Files**: kebab-case (`feedback-detail.tsx`)
- **Components**: PascalCase (`FeedbackDetail`)
- **Functions**: camelCase (`getFeedbackById`)
- **Constants**: SCREAMING_SNAKE (`API_BASE_URL`)
- **Types**: PascalCase (`Feedback`, `FeedbackStatus`)

### Imports

```typescript
// 1. External packages
import { useState } from "react";
import { useQuery } from "convex/react";

// 2. Internal absolute (@/)
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";

// 3. Relative
import { formatDate } from "./utils";
```

### Component Structure

```typescript
// 1. Imports
// 2. Types
// 3. Constants
// 4. Component
// 5. Helpers (if small)
```

---

## Database Schema Overview

### Core Tables

```typescript
// Users & Teams
users; // Clerk-synced user data
teams; // Workspaces/organizations
teamMembers; // User-team relationships with roles

// Projects & Widgets
projects; // Feedback collection projects
widgets; // Embeddable widget instances
widgetConfig; // Widget customization (colors, position)

// Feedback
feedback; // Main feedback entries
aiAnalysis; // AI-generated analysis per feedback
conversations; // AI chat history
comments; // Team comments on feedback
activityLog; // Audit trail

// Integrations & Exports
integrations; // Linear, Notion credentials
exports; // Export history
automationRules; // Auto-export rules
webhookLogs; // Webhook delivery tracking
exportTemplates; // Custom export formatting

// Settings
apiKeys; // User AI API keys (encrypted)
storageConfig; // External storage credentials
notifications; // User notifications

// Billing
usageTracking; // Monthly feedback counts
subscriptions; // Stripe subscription data
```

### Feedback Status Flow

```
new → triaging → drafted → exported → resolved
```

---

## Widget Development

The widget is a standalone JavaScript file that can be embedded on any website.

### Building

```bash
npm run widget:build
```

Outputs to `widget/dist/feedbackflow.js`

### Embedding

```html
<script
  src="https://cdn.feedbackflow.dev/widget.js"
  data-widget-key="wk_xxxxx"
  data-position="bottom-right"
></script>
```

### Widget Features

- Screenshot capture (html2canvas)
- Screen recording with audio (getDisplayMedia)
- Annotation tools (pen, highlighter, shapes)
- Offline queue (localStorage)
- Configurable styling

---

## AI Integration

Users provide their own API keys. The system supports both OpenAI and Anthropic.

### Features

1. **Auto-categorization** - Analyze feedback, suggest type/priority/tags
2. **Solution suggestions** - Propose fixes or investigation steps
3. **Ticket drafting** - Generate formatted tickets (priority feature)
4. **Conversation** - Chat about the feedback

### Implementation

```typescript
// src/lib/ai/index.ts
export async function analyzeFeeback(feedback: Feedback, apiKey: string) {
  // Use vision API for screenshot analysis
  // Return categorization, suggestions
}

export async function draftTicket(feedback: Feedback, apiKey: string) {
  // Generate formatted ticket
  // Return title, description, acceptance criteria
}
```

---

## Integrations

### Linear

- OAuth or API key auth
- Creates issues with labels
- Attaches media
- Syncs status (optional)

### Notion

- OAuth connection
- Creates pages in selected database
- Maps properties
- Embeds screenshots

### JSON (prd.json format)

```json
{
  "id": "FF-001",
  "title": "User reported bug",
  "acceptanceCriteria": ["AI-generated criteria", "Based on feedback content"],
  "priority": 1,
  "notes": "Original feedback description"
}
```

---

## Testing

### Unit Tests (Vitest)

- Location: `__tests__/` or colocated
- Focus: Convex mutations/queries, utilities, AI wrappers
- Coverage target: 80%+

### E2E Tests (Playwright)

- Location: `e2e/`
- Focus: Critical user journeys
- Mock external services

### Before Committing

```bash
npm run typecheck
npm run lint
npm run test
```

---

## Environment Variables

```bash
# Convex
CONVEX_DEPLOYMENT=xxx
NEXT_PUBLIC_CONVEX_URL=xxx

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxx
CLERK_SECRET_KEY=sk_xxx

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Resend
RESEND_API_KEY=re_xxx

# Storage (optional, for external video storage)
S3_BUCKET=xxx
S3_REGION=xxx
S3_ACCESS_KEY=xxx
S3_SECRET_KEY=xxx

# Encryption key for storing user API keys
ENCRYPTION_KEY=xxx
```

---

## Security Considerations

- User API keys encrypted at rest (AES-256)
- Widget keys are public, API keys are secret
- Rate limiting on widget endpoint
- HMAC signatures on webhooks
- No credentials in client bundle
- GDPR compliance (data export/deletion)

---

## Billing Model

| Tier | Seats     | Feedback/month | Price         |
| ---- | --------- | -------------- | ------------- |
| Free | 1         | 25             | $0            |
| Pro  | Unlimited | Unlimited      | $X/seat/month |

Self-host option: Free, unlimited, bring your own infrastructure.

---

## Key Design Decisions

1. **Widget is lightweight** - No AI client-side, minimal dependencies
2. **AI uses user keys** - We don't pay for AI, users bring their own
3. **Hybrid storage** - Convex for screenshots (simple), external for videos (flexible)
4. **Open source first** - Self-host friendly, no artificial limits
5. **prd.json export** - Designed to feed into AI dev workflows

---

## Current Status

See `prd.json` for implementation progress.
See `CHANGELOG.md` for what's been built.
