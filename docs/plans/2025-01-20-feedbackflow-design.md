# FeedbackFlow - Design Document

**Date:** 2025-01-20
**Status:** Approved

## Overview

FeedbackFlow is a feedback collection system with two main components:

1. **Embeddable Widget** - Lightweight JavaScript that captures screenshots and screen recordings with audio narration
2. **Central Dashboard** - Web app for processing feedback with AI-powered triage and export integrations

## Goals

- Turn messy feedback into actionable tickets automatically
- Support screenshot capture and screen recording with audio
- AI-powered ticket drafting (priority feature)
- Export to Linear, Notion, or JSON (prd.json format for AI workflows)
- Open source with self-host option, plus hosted version with seat-based pricing

## Non-Goals (v1)

- Mobile app
- Browser extension (widget only for now)
- Video editing features
- Real-time collaboration (async comments only)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FEEDBACK FLOW                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐         ┌──────────────────────────────────┐ │
│  │   WIDGET     │         │          DASHBOARD               │ │
│  │  (embed.js)  │         │                                  │ │
│  │              │  POST   │  ┌─────────┐  ┌───────────────┐  │ │
│  │ • Screenshot │ ──────► │  │ Convex  │  │ AI Processing │  │ │
│  │ • Recording  │         │  │   DB    │  │ (user keys)   │  │ │
│  │ • Bug/Feature│         │  └─────────┘  └───────────────┘  │ │
│  │ • Widget ID  │         │                                  │ │
│  └──────────────┘         │  ┌─────────────────────────────┐ │ │
│                           │  │         EXPORTS             │ │ │
│                           │  │  Linear │ Notion │ JSON/PRD │ │ │
│                           │  │  Webhooks │ API Access      │ │ │
│                           │  └─────────────────────────────┘ │ │
│                           └──────────────────────────────────┘ │
│                                                                 │
│  STORAGE                                                        │
│  ├── Screenshots → Convex File Storage                         │
│  └── Videos → Configurable (S3/R2/GCS)                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer    | Technology           | Rationale                          |
| -------- | -------------------- | ---------------------------------- |
| Frontend | Next.js 15           | App Router, React 19, great DX     |
| Backend  | Convex               | Real-time, serverless, type-safe   |
| Auth     | Clerk                | Easy team support, well-documented |
| Payments | Stripe               | Industry standard, good DX         |
| Email    | Resend               | Simple API, good deliverability    |
| AI       | OpenAI/Anthropic     | User-provided keys, no cost to us  |
| Storage  | Convex + S3/R2/GCS   | Hybrid for flexibility             |
| UI       | Tailwind + shadcn/ui | Fast development, customizable     |

---

## User Flows

### Widget Flow

1. User clicks widget button on their site
2. Chooses screenshot or recording
3. If recording: captures screen + microphone for narration
4. Stops recording (max 2 minutes)
5. Fills in description, tags as bug or feature
6. Optionally provides email for follow-up
7. Submits → goes to dashboard
8. If offline: queued in localStorage, retried on connectivity

### Dashboard Flow

1. Team member sees new feedback in inbox
2. Views details: screenshot/video, description, metadata
3. AI auto-categorizes and suggests solutions
4. User can chat with AI about the issue
5. Clicks "Draft Ticket" → AI generates formatted ticket
6. Reviews/edits draft
7. Exports to Linear, Notion, or JSON
8. Marks as resolved

### Submitter Flow (if email provided)

1. Receives magic link email
2. Clicks link → sees status page
3. Can view status (new/in progress/resolved)
4. Can add additional context
5. Gets notified when resolved (optional)

---

## Data Model

### Core Entities

- **users** - Clerk-synced, profile info
- **teams** - Workspaces/organizations
- **teamMembers** - User-team with role (admin/member)
- **projects** - Feedback collection projects
- **widgets** - Embeddable instances with unique keys
- **feedback** - Main feedback entries

### Feedback Schema

```typescript
{
  widgetId: Id<"widgets">,
  projectId: Id<"projects">,
  teamId: Id<"teams">,
  type: "bug" | "feature",
  title: string,
  description: string,
  screenshotUrl?: string,
  recordingUrl?: string,
  recordingDuration?: number,
  status: "new" | "triaging" | "drafted" | "exported" | "resolved",
  priority: "low" | "medium" | "high" | "critical",
  tags: string[],
  submitterEmail?: string,
  submitterName?: string,
  assigneeId?: Id<"users">,
  metadata: {
    browser: string,
    os: string,
    url: string,
    timestamp: number
  },
  createdAt: number
}
```

---

## AI Features

Users provide their own OpenAI or Anthropic API keys. Features (priority order):

1. **Ticket Drafting** (priority) - Generate formatted tickets with title, description, repro steps, acceptance criteria
2. **Auto-Categorization** - Suggest type, priority, tags based on content + screenshot analysis
3. **Solution Suggestions** - Propose fixes or investigation steps (rubber ducky)
4. **Conversation** - Chat about the issue to explore deeper

---

## Integrations

### Linear

- OAuth or API key
- Creates issues with labels
- Attaches media
- Optional status sync

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
  "acceptanceCriteria": ["AI-generated criteria"],
  "priority": 1,
  "notes": "Original description"
}
```

### Webhooks

- Configurable URL + secret
- Events: new_feedback, status_change, exported
- HMAC signature
- Retry with backoff

### REST API

- Bearer token auth
- CRUD for feedback
- Pagination, filtering, sorting

---

## Pricing Model (n8n style)

| Tier      | Seats     | Feedback/month | Price         |
| --------- | --------- | -------------- | ------------- |
| Free      | 1         | 25             | $0            |
| Pro       | Unlimited | Unlimited      | $X/seat/month |
| Self-Host | Unlimited | Unlimited      | Free          |

---

## Security Considerations

- User API keys encrypted at rest (AES-256)
- Widget keys are public, API keys are secret
- Rate limiting: 10/min per IP, 100/day per widget
- Honeypot fields for spam
- HMAC signatures on webhooks
- GDPR: data export + deletion for submitters

---

## Milestones

1. **Foundation** - Project setup, schema, auth, landing page, dashboard layout
2. **Widget Core** - Screenshot, recording, submission, offline queue
3. **Dashboard Core** - Inbox, detail view, comments, search
4. **AI Processing** - Categorization, suggestions, ticket drafting, conversation
5. **Exports** - Linear, Notion, JSON, webhooks, API, automation rules
6. **Analytics & Notifications** - Dashboard, email, in-app
7. **Submitter Portal & Privacy** - Status page, GDPR
8. **Billing & Polish** - Stripe, usage limits, customization, docs, tests

---

## Open Questions (Resolved)

- [x] Auth model → Full accounts with teams, API keys per project
- [x] AI keys location → Dashboard/backend, not widget
- [x] Recording approach → Browser-native getDisplayMedia + audio
- [x] Storage → Hybrid (Convex for screenshots, configurable for videos)
- [x] AI features → All four, ticket drafting priority
- [x] Export approach → Manual + automation rules, webhooks, API
- [x] Team roles → Simple 2-role (admin/member)
- [x] Pricing → Seat-based, 25/month free tier, n8n model
