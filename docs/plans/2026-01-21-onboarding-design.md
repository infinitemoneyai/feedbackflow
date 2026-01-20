# Onboarding Flow Design

## Overview

Blocking onboarding flow for new FeedbackFlow users. Users must complete core setup before accessing the dashboard.

## Flow Summary

```
Sign up (Clerk)
    → /onboarding
        → Step 1: Team Name [full-page]
        → Step 2: How It Works [full-page, animated]
        → Step 3: Create Project [full-page]
        → Redirect to /dashboard with modal
            → Step 4: Install Script [modal]
            → Step 5: Verify Install [modal, real-time]
            → Step 6: Invite Teammate [modal]
            → Step 7: Upgrade Prompt [modal]
        → Modal closes, dashboard revealed
```

## Design Decisions

- **Blocking**: Users must complete steps 1-5 before accessing dashboard
- **Skip allowed**: Only after verification (step 5) - invite and upgrade can be skipped
- **Minimal data collection**: Just team name to reduce friction
- **Test mode verification**: User clicks "Send Test Feedback" to verify install works
- **Hybrid layout**: Full-page for intro steps, modal over dashboard for install/verify

---

## Step Details

### Step 1: Team Name (Full-Page)

- Clean centered card with retro styling (thick border, offset shadow)
- Heading: "Let's set up your workspace"
- Single input: "What's your team or company name?"
- Placeholder: "Acme Inc."
- Button: "Continue"
- Creates team in Convex, auto-adds user as admin with free subscription

### Step 2: How It Works (Full-Page, Animated)

4 animated panels, auto-advance every 4 seconds (click/arrow to advance manually):

1. **"Your users click the feedback button"** - Widget appearing in corner, pulsing
2. **"They capture screenshots and describe issues"** - Widget expanding, screenshot being taken
3. **"Tickets land in your inbox instantly"** - Ticket sliding into dashboard inbox
4. **"Export to Linear, Notion, or your tools"** - Export buttons with checkmark animation

- Progress dots at bottom
- Button: "Got it, let's go" (appears on last panel)

### Step 3: Create Project (Full-Page)

- Centered card, same retro styling
- Heading: "Create your first project"
- Fields:
  - **Project name**: Text input, e.g., "My App"
  - **Site URL**: URL input, e.g., "https://myapp.com"
  - **Type**: Radio/pill selector
    - Web app
    - Marketing site
    - Mobile app
    - Other
- Button: "Create Project"
- Creates project + widget in Convex, redirects to `/dashboard` with modal

### Step 4: Install Script (Modal)

- Modal centered over dashboard (dashboard visible but dimmed)
- Heading: "Install the feedback widget"
- Subheading: "Add this snippet to your site"

**Tailored instructions based on project type:**
- **Web app / Marketing site**: `<script>` tag with widget key
- **Mobile app**: "Coming soon" with docs link, or SDK snippet
- **Other**: Generic script tag

- Code block with copy button (retro styled)
- Expandable sections: "Using Next.js?" / "Using React?"
- Button: "I've installed it"

### Step 5: Verify Install (Modal)

- Heading: "Verify install"
- Subheading: "Let's make sure tickets are coming in"
- Large button: "Send Test Feedback" (retro yellow, prominent)

**On click:**
1. Fires test feedback via widget key
2. Dashboard behind modal shows test ticket sliding into inbox (real-time via Convex)
3. Success: Green checkmark animation, "It's working! Your first ticket just arrived."
4. Button changes to: "Continue"

**Failure state:**
- After 10s with no ticket: "Having trouble?" link to docs/support

### Step 6: Invite Teammate (Modal)

- Heading: "Invite your team"
- Subheading: "Collaboration makes feedback better"
- Email input with "Send invite" button
- List of pending invites below input
- Skip link: "I'll do this later" (allowed since verification passed)
- Button: "Continue" or "Skip for now"

### Step 7: Upgrade Prompt (Modal)

- Heading: "Unlock the full power"
- Side-by-side comparison:

| Free | Pro |
|------|-----|
| 1 seat | Unlimited seats |
| 25 feedback/month | Unlimited feedback |
| Basic features | AI triage |
| | Linear & Notion export |
| | Custom webhooks |
| | Priority support |

- Price: "$12/seat/month"
- Primary button: "Upgrade to Pro" → Stripe checkout
- Secondary link: "Start with Free" → closes modal, reveals dashboard

---

## Technical Implementation

### Data Model Changes

```typescript
// convex/schema.ts

// Add to users table
onboardingStep: v.optional(v.number()), // 0-7, undefined = not started
onboardingCompletedAt: v.optional(v.number()), // timestamp when finished

// Add to teams table
onboardingProjectId: v.optional(v.id("projects")), // first project created during onboarding
```

### New Convex Mutations

```typescript
// convex/onboarding.ts

startOnboarding()
// Sets onboardingStep to 1, called after Clerk signup

completeOnboardingStep(step: number)
// Validates current step, advances to next
// Returns new step number

sendTestFeedback(projectId: Id<"projects">)
// Generates test ticket for verification
// Uses internal mutation to bypass widget validation
```

### Route Protection

```typescript
// In auth layout or middleware

const user = await getUser();

if (user && user.onboardingStep !== undefined && user.onboardingStep < 7) {
  if (user.onboardingStep < 4) {
    // Steps 1-3: Full-page onboarding
    redirect('/onboarding');
  }
  // Steps 4-7: Dashboard with modal (handled in DashboardLayout)
}
```

### Component Structure

```
/app/onboarding/page.tsx              - Full-page onboarding container
/components/onboarding/
  ├── onboarding-progress.tsx         - Progress dots indicator
  ├── onboarding-step-team.tsx        - Step 1: Team name
  ├── onboarding-step-walkthrough.tsx - Step 2: Animated panels
  ├── onboarding-step-project.tsx     - Step 3: Create project
  ├── onboarding-modal.tsx            - Modal wrapper for steps 4-7
  ├── onboarding-step-install.tsx     - Step 4: Script install
  ├── onboarding-step-verify.tsx      - Step 5: Test feedback
  ├── onboarding-step-invite.tsx      - Step 6: Invite teammate
  └── onboarding-step-upgrade.tsx     - Step 7: Pro pitch
```

### Dashboard Integration

```typescript
// components/dashboard/dashboard-layout.tsx

const user = useQuery(api.users.getCurrentUser);

// Show onboarding modal for steps 4-7
const showOnboardingModal = user?.onboardingStep !== undefined
  && user.onboardingStep >= 4
  && user.onboardingStep < 8;

return (
  <div className="...">
    <DashboardSidebar />
    <main>{children}</main>
    <TicketDetailPanel />

    {showOnboardingModal && (
      <OnboardingModal step={user.onboardingStep} />
    )}
  </div>
);
```

---

## Visual Design

### Full-Page Steps (1-3)

- Outer background: `bg-[#e8e6e1]`
- Centered card: `max-w-lg`, thick border, offset shadow
- Progress indicator: Row of dots at top
- Retro yellow accent on primary buttons

### Animated Walkthrough (Step 2)

- Each panel: Illustration area (top 60%) + text (bottom 40%)
- CSS/SVG animations (not video):
  - Panel 1: Widget button pulses, then expands
  - Panel 2: Screenshot frame draws in, cursor clicks
  - Panel 3: Ticket card slides from right into inbox list
  - Panel 4: Export buttons get checkmarks one by one
- Transitions: Slide left with fade (300ms ease)
- Auto-advance: 4 seconds per panel, pauses on hover

### Modal Steps (4-7)

- Modal: `max-w-xl`, retro border/shadow
- Backdrop: Dashboard at 40% opacity with blur
- Entry: Scale from 95% + fade in (200ms)
- Step transitions: Content crossfade

### Verification Success Animation

- Modal briefly flashes green border
- Subtle confetti burst (1 second)
- Checkmark draws with stroke animation
- Dashboard ticket highlight pulse

### Micro-interactions

- Buttons: Hover lifts shadow (`translate-x-[-2px] translate-y-[-2px]`)
- Inputs: Focus adds retro-blue border
- Copy button: "Copied!" tooltip for 2 seconds

---

## Edge Cases

### Returning User (Incomplete Onboarding)
- User closes browser mid-onboarding
- On return: Check `onboardingStep`, resume from that step
- Full-page steps: Redirect to `/onboarding`
- Modal steps: Show modal on dashboard load

### User Already Has Teams
- Check if user has any teams on signup
- If yes (invited to existing team): Skip to step 4 or mark complete
- If no: Start from step 1

### Test Feedback Fails
- Widget not installed or misconfigured
- After 10 seconds: Show troubleshooting link
- Allow retry with "Try Again" button
- Provide "Skip verification" only for edge cases (hidden, requires confirm)

### Mobile Responsiveness
- Full-page steps: Single column, card takes full width with padding
- Modal steps: Modal becomes near-fullscreen on mobile
- Walkthrough: Panels stack vertically, swipe gesture support
