# Site Review Viewer — Design Spec

## Overview

A built-in website viewer within FeedbackFlow that lets users browse any URL inside the dashboard and create feedback tickets without installing the widget. Supports both internal QA and external stakeholder review via shareable links.

## Problem

Currently, feedback collection requires installing the FeedbackFlow widget on the target site. This creates friction for:
- Internal teams doing QA on staging/production — requires widget deployment
- Client/stakeholder reviews — requires widget installation on the client's site or a separate tool
- Quick one-off reviews of any URL

## Solution

Add a "Review Site" capability within each project. Users click "Review Site" on their project page, the project's `siteUrl` loads in an iframe-based viewer with a browser-like toolbar, and they can screenshot + submit feedback as they browse. External reviewers access the same experience via shareable, email-gated magic links.

## User Flows

### Internal User (QA/Team Review)
1. Navigate to project in dashboard
2. Click "Review Site" button
3. Site loads in viewer at project's `siteUrl`
4. Browse freely — click links, log in, navigate
5. Click "Screenshot" button in toolbar to capture current view
6. Slide-in feedback panel opens: type (bug/feature), title, description, screenshot preview
7. Submit → feedback lands in project inbox → panel closes → continue browsing

### External Reviewer (Client/Stakeholder)
1. Internal user clicks "Share" in the viewer toolbar
2. Generates a magic link (`feedbackflow.cc/review/[slug]`) with optional password
3. Shares link with reviewer
4. Reviewer opens link → email gate page (email required, password if set)
5. Reviewer enters email (+ password) → gets the same viewer experience
6. Reviewer submits feedback → tagged with their email → lands in project inbox

## Page Layout

### Viewer Page (`/dashboard/[teamSlug]/[projectId]/review`)

**Toolbar (top):**
- Back / Forward / Refresh navigation buttons
- URL bar showing current page (editable — user can type a URL to navigate)
- Screenshot button (primary action, purple)
- Share button (secondary)

**Main area:**
- Full-width iframe displaying the target site
- Interactive — user can click links, fill forms, log in

**Status bar (bottom):**
- Connection method indicator: "Loaded via iframe" or "Loaded via proxy"
- Feedback count for current page

**Feedback slide-in panel (triggered by Screenshot):**
- Opens from the right side, site dims behind it
- Screenshot preview of captured view
- Bug / Feature type toggle
- Title input
- Description textarea
- Submit button
- Panel closes on submit, user continues browsing

### External Review Page (`/review/[slug]`)
- Same viewer layout as above
- Preceded by email gate page on first access
- No access to dashboard features — only the viewer and feedback submission

### Fallback State
If the site cannot be loaded via iframe or proxy, display:
> "This site can't be loaded in the viewer. Install the widget for full feedback capabilities."
With a link to widget setup instructions.

## Data Model

### New table: `reviewLinks`
| Field | Type | Description |
|-------|------|-------------|
| `projectId` | `Id<"projects">` | Parent project |
| `teamId` | `Id<"teams">` | Parent team |
| `slug` | `string` | Unique short ID for URL (e.g., `abc123`) |
| `siteUrl` | `string` | The URL to load in the viewer. Defaults to `projects.siteUrl` but can be overridden (e.g., staging URL for a production project) |
| `passwordHash` | `string?` | Optional hash (PBKDF2 via Web Crypto API — bcrypt is not available in Convex runtime) |
| `createdBy` | `Id<"users">` | Creator |
| `isActive` | `boolean` | Can be revoked |
| `createdAt` | `number` | Timestamp |
| `expiresAt` | `number?` | Optional expiration |

**Indexes:**
- `.index("by_slug", ["slug"])` — primary lookup for `/review/[slug]` route
- `.index("by_project", ["projectId"])` — list review links for a project

### New table: `reviewers`
| Field | Type | Description |
|-------|------|-------------|
| `reviewLinkId` | `Id<"reviewLinks">` | Which link they used |
| `email` | `string` | Captured at gate |
| `sessionToken` | `string` | Random token stored in cookie, used to recognize returning reviewers |
| `firstAccessedAt` | `number` | First visit |
| `lastAccessedAt` | `number` | Most recent visit |

**Indexes:**
- `.index("by_session_token", ["sessionToken"])` — validate returning reviewer sessions
- `.index("by_review_link", ["reviewLinkId"])` — list reviewers per link

### Changes to existing `feedback` table
| Field | Type | Description |
|-------|------|-------------|
| `widgetId` | `Id<"widgets">?` | **Changed from required to optional.** Null for review-sourced feedback. |
| `reviewLinkId` | `Id<"reviewLinks">?` | Optional — traces feedback to review session |
| `reviewerEmail` | `string?` | Optional — external reviewer attribution |
| `source` | `"widget" \| "review"` | Distinguishes origin. Existing feedback defaults to `"widget"`. |

**Migration note:** Making `widgetId` optional requires a schema migration. Existing feedback records all have `widgetId` set, so no data backfill is needed — just update the validator from `v.id("widgets")` to `v.optional(v.id("widgets"))`.

## Proxy Architecture

### API Route: `/api/proxy`

**Purpose:** Serve sites that block iframe embedding by stripping frame-blocking headers.

**Iframe failure detection:**
The viewer uses a timeout + `postMessage` handshake to detect blocked iframes:
1. Load URL in iframe
2. Inject a tiny script via `postMessage` that responds with a heartbeat (works only if same-origin or site allows it)
3. If no heartbeat within 3 seconds, assume iframe is blocked
4. Retry through `/api/proxy?url=[encoded-url]`
5. If proxy also fails → show fallback message suggesting widget installation

This approach handles the fact that iframe `load` events fire even on blocked pages.

**Proxy behavior:**
- Accepts `GET /api/proxy?url=https://example.com/page`
- Validates caller is authenticated (Clerk session) or has valid review session token
- Fetches the target page server-side
- Strips `X-Frame-Options` header
- Rewrites `Content-Security-Policy` to allow framing
- Returns content with permissive headers
- Rate-limited per authenticated user or review link to prevent abuse

**URL scope for external reviewers:**
External reviewers (via magic link) are restricted to the `siteUrl` domain specified in the `reviewLink`. The proxy rejects requests for URLs outside that domain. Internal authenticated users can navigate freely.

**Limitations (acknowledged):**
- Some sites with complex CSP, CORS, or cookie requirements may not work even through the proxy
- Login through proxy means cookies are on the proxy domain, not the original site (re-auth required each session)
- Not all sites will work — this is by design, with widget installation as the fallback

## Screenshot Capture

Reuses the existing widget's capture approach:
- `html2canvas` for same-origin content (works when proxied since content is served from our domain)
- Screen Capture API (`getDisplayMedia`) as fallback
- Screenshot stored as Convex storage blob, same pipeline as widget submissions

## Feedback Submission

### New mutation: `api.feedback.submitFromReview`

Separate from `submitFromWidget` because authentication and context differ:

**Authentication:**
- Internal users: Clerk session (same as other dashboard mutations)
- External reviewers: `reviewLinkId` + `sessionToken` (validated against `reviewers` table)

**Mutation behavior:**
- Looks up project via `reviewLinkId` or direct `projectId` (internal users)
- Validates review link is active and not expired (external reviewers)
- Auto-increments ticket number per project (same as widget path)
- Sets `source: "review"`, `widgetId: undefined`
- Sets `reviewerEmail` for external reviewers
- Creates activity log entry
- Triggers notifications, AI analysis, automations, webhooks (same as widget path)

**Billing:**
Review feedback counts against the team's monthly quota (same as widget feedback). If the team hits their limit:
- Internal users see the standard upgrade prompt
- External reviewers see: "This project has reached its feedback limit. Please contact the project owner."

## Sharing & Access Control

- **Magic links** are generated per project, stored in `reviewLinks` table
- **Email gate:** Reviewer must enter email before accessing viewer. Email stored in `reviewers` table.
- **Session persistence:** On first access, a `sessionToken` is generated and stored in an HTTP-only cookie + the `reviewers` table. Returning reviewers are recognized by this cookie without re-entering email. Cookie expires when `reviewLink.expiresAt` is reached (or 30 days if no expiration set).
- **Optional password:** Creator can set a password when generating the link. Password hashed using PBKDF2 via Web Crypto API (compatible with Convex runtime). Reviewer must enter it alongside email on first access.
- **Revocable:** Creator can deactivate a link by setting `isActive: false`
- **Optional expiration:** Links can have an `expiresAt` timestamp
- **Lead capture:** Reviewer emails are captured and associated with the project/team for potential follow-up

## Scope & Non-Goals

**In scope:**
- Iframe viewer with proxy fallback
- Screenshot + feedback form (same as widget UX)
- Free browsing with URL bar (domain-locked for external reviewers)
- Email-gated magic links with optional password
- Feedback flows into existing project inbox
- Review feedback counts against team billing quota

**Not in scope (future considerations):**
- Point-and-click element annotations
- Drawing/markup tools
- Review session analytics (pages visited, time spent)
- Browser extension alternative
- Pre-defined page checklists
