# FeedbackFlow - Ralph Development Prompt

You are implementing FeedbackFlow, a feedback collection system with an embeddable widget for screenshot/screen recording capture and a central dashboard for processing feedback with AI assistance.

## Your Mission

1. Read `prd.json` to understand the user stories
2. Find the FIRST story where `passes: false`
3. Implement that story completely
4. Run tests and typecheck to verify
5. Update `prd.json` to set `passes: true` for the completed story
6. Update `CHANGELOG.md` with what you built
7. Commit your changes

## Key Files

- `prd.json` - User stories with acceptance criteria
- `CLAUDE.md` - Project conventions and structure
- `DESIGN.md` - Design system and component reference
- `CHANGELOG.md` - Track what's been built

## Tech Stack

- **Frontend**: Next.js 15 with App Router
- **Backend**: Convex (real-time database)
- **Auth**: Clerk
- **Payments**: Stripe
- **Email**: Resend
- **AI**: OpenAI/Anthropic (user-provided keys)
- **Storage**: Convex (screenshots), S3/R2/GCS (videos)
- **UI**: Tailwind CSS + shadcn/ui

## Implementation Rules

1. **Read before writing** - Always understand existing code before modifying
2. **Follow CLAUDE.md** - Adhere to project conventions
3. **Match DESIGN.md** - Use the retro design system consistently
4. **Test everything** - Run `npm run typecheck` and `npm run test` after changes
5. **Small commits** - One story = one commit with clear message
6. **No over-engineering** - Implement exactly what the story requires

## Acceptance Criteria Validation

For each acceptance criterion:

- Implement the feature
- Verify it works manually or via test
- Ensure typecheck passes

Only mark `passes: true` when ALL criteria are met.

## Completion Signal

When ALL stories have `passes: true`, output:

```
<promise>COMPLETE</promise>
```

This signals that FeedbackFlow is ready for review.

## Current Focus

Read `prd.json` now and find the first incomplete story. Implement it fully before moving on.

Remember:

- Quality over speed
- Follow the design system
- Test your work
- Update the changelog
