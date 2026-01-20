# Changelog

All notable changes to FeedbackFlow will be documented in this file.

## [Unreleased]

### Added

- **Project Initialized** - Created project structure with prd.json, CLAUDE.md, DESIGN.md
- **45 User Stories** - Comprehensive PRD covering all features from foundation to polish
- **Design System** - Retro-modern aesthetic with colors, typography, components documented
- **Ralph Automation** - ralph.sh and prompt.md for automated development
- **FF-001: Project Foundation** - Next.js 15 with App Router, Convex configured, TypeScript strict mode, Tailwind CSS with retro design colors, shadcn/ui base components (Button, Badge, Card, Input), ESLint with Prettier
- **FF-002: Database Schema** - Complete Convex schema with 25+ tables: users, teams, teamMembers, teamInvites, projects, widgets, widgetConfig, feedback, aiAnalysis, conversations, ticketDrafts, comments, activityLog, integrations, exports, exportTemplates, automationRules, webhooks, webhookLogs, apiKeys, storageConfig, notifications, notificationPreferences, subscriptions, usageTracking, restApiKeys, submitterTokens, submitterUpdates, publicNotes. Includes indexes for common queries and search index on feedback.
- **FF-003: Clerk Authentication** - Integrated Clerk for authentication with middleware protecting routes, ClerkProvider with ConvexProviderWithClerk, user sync to Convex on sign-in, sign-in/sign-up pages with retro styling, protected dashboard layout with useStoreUser hook
- **FF-004: Team Management** - Full team CRUD in convex/teams.ts: createTeam (generates unique slug, adds creator as admin, creates free subscription), inviteToTeam (creates invite with token), acceptInvite (validates token and email match), updateMemberRole (admin only, cannot change owner), removeMember (admin or self), getTeam/getMyTeams/getTeamMembers queries, getTeamInvites/cancelInvite for pending invites, updateTeam/deleteTeam mutations
- **FF-005: Landing Page** - Complete marketing landing page with navigation, hero section (headline with highlighted text, CTAs), problem section (3 pain points), features grid (bento-style with 6 features including AI ticket drafting highlight), workflow section (4-step process), exports section (Linear, Notion, JSON), multi-project section with code snippet, open source section, and CTA footer. Fully responsive with retro design aesthetic.
- **FF-006: Dashboard Layout** - Three-panel dashboard layout with responsive navigation:
  - Left sidebar: Team selector dropdown, projects list with feedback counts (using Convex query), Views section (Inbox, Backlog, Resolved), user footer with Clerk UserButton and settings link
  - Main content area: Header with view title, project badge, search input, filter and notification buttons. Mobile menu button for sidebar toggle
  - Right panel: Ticket detail sidebar (desktop only) with placeholder for future ticket view (FF-014), AI actions section, comment input
  - Responsive design: Sidebar collapses to off-canvas drawer on mobile with overlay, hamburger menu in header
  - New components: DashboardLayout, DashboardSidebar, DashboardHeader, TicketDetailPanel with useDashboard context hook
  - New Convex file: convex/projects.ts with getProjects, getProject, createProject, updateProject, deleteProject, getWidgets, createWidget, updateWidget, regenerateWidgetKey
- **FF-007: Project & Widget Management** - Verified complete implementation in convex/projects.ts:
  - createProject mutation with name, description, default settings
  - createWidget mutation generates unique widgetKey (wk_xxxx format)
  - getProjects query returns team's projects with feedbackCount and newFeedbackCount
  - getWidgets query returns project's widgets with config
  - updateProject and deleteProject mutations (deleteProject cleans up widgets and feedback)
  - updateWidget mutation for siteUrl and isActive
  - regenerateWidgetKey mutation invalidates old key (admin only)
- **FF-008: Widget Script Core Structure** - Embeddable feedback widget built with vanilla TypeScript:
  - Builds to single JS file (~13KB minified, well under 50KB target)
  - Bundled with esbuild for optimal size and browser compatibility
  - Initializes via data attributes: `data-widget-key`, `data-position`, `data-primary-color`, etc.
  - Floating button with configurable position (bottom-right, bottom-left, top-right, top-left)
  - Click opens modal overlay with retro design matching FeedbackFlow aesthetic
  - Modal has Screenshot and Record buttons (capture logic in FF-009/FF-010)
  - Close button, backdrop click, and Escape key dismiss modal
  - No external dependencies - all vanilla JS/CSS
  - Programmatic API: `FeedbackFlow.open()`, `FeedbackFlow.close()`, `FeedbackFlow.init(config)`
  - Widget files: `widget/src/index.ts`, `widget.ts`, `styles.ts`, `icons.ts`, `dom.ts`, `types.ts`
- **FF-009: Screenshot Capture & Annotation** - Full screenshot capture with annotation tools:
  - Uses getDisplayMedia API for reliable cross-origin capture
  - Fullscreen annotation UI with retro design aesthetic
  - Annotation tools: Pen (red), Highlighter (semi-transparent yellow), Arrow, Circle/Ellipse
  - Canvas-based drawing with undo support and history management
  - Clear all and Retake screenshot options
  - Image compression for upload (JPEG, max 1920px width, 85% quality)
  - Touch support for tablet/mobile annotation
  - Widget size: ~30KB minified (still well under 50KB target)
  - New files: `capture.ts`, `annotate.ts`, `screenshot-ui.ts`
- **FF-010: Screen Recording with Audio** - Full screen recording with microphone narration:
  - Uses getDisplayMedia API for screen capture + getUserMedia for microphone
  - MediaRecorder API with WebM/VP9 codec for good compression
  - Fixed-position recording indicator with pulsing red dot
  - Live duration timer showing elapsed time and 2-minute max
  - Stop button to end recording, auto-stops at 2 minutes
  - Preview UI with video player and playback controls
  - Shows recording duration and file size in preview
  - Retake and Use Recording action buttons
  - 2.5 Mbps video bitrate for good quality at reasonable size
  - Widget size: ~44KB minified (still under 50KB target)
  - New files: `record.ts`, `record-ui.ts`
- **FF-011: Widget Submission Form & Offline Queue** - Complete feedback submission flow:
  - Submission form appears after screenshot/recording capture
  - Title input with required validation
  - Description textarea for detailed feedback
  - Type selector: Bug Report or Feature Request with icons
  - Optional email field for follow-up
  - Optional name field for identification
  - Preview thumbnail of captured screenshot/recording
  - Loading state with spinner during API submission
  - Success confirmation showing feedback reference ID
  - Error state with retry option
  - Offline queue using localStorage for failed submissions
  - Queue processes on page load and connectivity restore
  - Exponential backoff retry (1s, 2s, 4s, 8s, 16s) up to 5 attempts
  - Custom events: ff:submission-success, ff:submission-error, ff:queue-submission-success
  - Widget size: ~69KB minified
  - New files: `submit-ui.ts`, `offline-queue.ts`
  - Updated icons.ts with bug, lightbulb, check, spinner, mail, user icons
- **FF-012: Widget API Endpoint with Rate Limiting** - Complete feedback submission API:
  - POST /api/widget/submit endpoint receives multipart form data
  - Validates widget key exists and is active via Convex query
  - IP-based rate limiting: 10 submissions per minute per IP
  - Widget-based rate limiting: 100 submissions per day per widget
  - Honeypot field "website" for basic spam detection (bots fill hidden fields)
  - Screenshots uploaded to Convex file storage with generated URLs
  - Videos uploaded to Convex storage (up to 10MB) with external storage placeholder for larger files
  - Feedback record created in database with activity log entry
  - Usage tracking updated for team billing purposes
  - Returns feedback reference ID (FF-XXXXXX format) on success
  - Appropriate HTTP status codes: 201 (success), 400 (bad request), 403 (inactive widget), 404 (invalid key), 429 (rate limited), 500 (server error)
  - Full CORS support with OPTIONS preflight handler
  - Rate limit headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
  - New files: `app/api/widget/submit/route.ts`, `convex/feedback.ts`, `lib/rate-limit.ts`
- **FF-013: Feedback Inbox View** - Complete feedback listing with filtering, sorting, search, and bulk selection:
  - `listFeedback` Convex query with type, status, priority, view, sortBy, and sortOrder filters
  - `searchFeedback` Convex query using full-text search index on title, with fallback description search
  - `getFeedback` query for single feedback details with assignee info
  - `updateFeedback` mutation for status, priority, tags, and assignment updates with activity logging
  - `getTeamMembersForAssignment` query for team member dropdown
  - `FeedbackList` component with real-time updates via Convex subscriptions
  - Filter controls for type (bug/feature), priority, and sort order (date, priority, status)
  - Bulk selection with select all/deselect all and multi-select checkboxes
  - Search integration in dashboard header via shared context
  - Thumbnail display for screenshots, placeholder for items without
  - Media indicators showing screenshot/video icons when present
  - Tags display with overflow handling (+N more)
  - Empty states for inbox, backlog, and resolved views
  - Loading skeleton state while data fetches
  - Matches retro design aesthetic from mockup

---

## Project Milestones

### Milestone 1: Foundation

- [x] FF-001: Project setup (Next.js 15, Convex, Tailwind)
- [x] FF-002: Database schema
- [x] FF-003: Clerk authentication
- [x] FF-004: Team management
- [x] FF-005: Landing page
- [x] FF-006: Dashboard layout

### Milestone 2: Widget Core

- [x] FF-007: Project & widget management
- [x] FF-008: Widget script structure
- [x] FF-009: Screenshot capture
- [x] FF-010: Screen recording with audio
- [x] FF-011: Submission form & offline queue
- [x] FF-012: Widget API endpoint

### Milestone 3: Dashboard Core

- [x] FF-013: Feedback inbox
- [ ] FF-014: Feedback detail view
- [ ] FF-015: Comments & activity log
- [ ] FF-016: Full-text search

### Milestone 4: AI Processing

- [ ] FF-017: API key management
- [ ] FF-018: Auto-categorization
- [ ] FF-019: Solution suggestions
- [ ] FF-020: Ticket drafting (priority)
- [ ] FF-021: AI conversation

### Milestone 5: Exports & Integrations

- [ ] FF-022: Linear integration
- [ ] FF-023: Notion integration
- [ ] FF-024: JSON/prd.json export
- [ ] FF-025: Webhooks
- [ ] FF-026: REST API
- [ ] FF-027: Automation rules

### Milestone 6: Analytics & Notifications

- [ ] FF-028: Analytics dashboard
- [ ] FF-029: Email notifications
- [ ] FF-030: In-app notifications

### Milestone 7: Submitter Portal & Privacy

- [ ] FF-031: Submitter status page
- [ ] FF-032: GDPR compliance

### Milestone 8: Billing & Polish

- [ ] FF-033: Stripe integration
- [ ] FF-034: Usage tracking & limits
- [ ] FF-035: Pricing page
- [ ] FF-036: Widget customization UI
- [ ] FF-037: Installation documentation
- [ ] FF-038: External storage config
- [ ] FF-039: Self-hosting documentation
- [ ] FF-040: Team settings
- [ ] FF-041: User profile & settings
- [ ] FF-042: Export templates
- [ ] FF-043: Unit tests
- [ ] FF-044: E2E tests
- [ ] FF-045: Performance optimization
