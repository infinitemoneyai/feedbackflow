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
- [ ] FF-008: Widget script structure
- [ ] FF-009: Screenshot capture
- [ ] FF-010: Screen recording with audio
- [ ] FF-011: Submission form & offline queue
- [ ] FF-012: Widget API endpoint

### Milestone 3: Dashboard Core

- [ ] FF-013: Feedback inbox
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
