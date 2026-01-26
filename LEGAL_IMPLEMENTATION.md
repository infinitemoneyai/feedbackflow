# Legal Terms Implementation

## Overview
Implemented comprehensive Privacy Policy and Terms of Service with mandatory acceptance during user signup.

## What Was Added

### 1. Legal Documents
- **Privacy Policy** (`/privacy`)
  - Comprehensive data collection disclosure
  - Third-party services (Clerk, Convex, Stripe, PostHog, Resend, OpenAI/Anthropic)
  - User rights (GDPR & CCPA compliant)
  - Data retention policies
  - Security measures
  - Cookie usage
  - International data transfers
  - Contact information

- **Terms of Service** (`/terms`)
  - Service description
  - Account registration requirements
  - Acceptable use policy
  - Widget integration guidelines
  - User content ownership
  - Intellectual property
  - Payment and billing terms
  - Refund and cancellation policies
  - Service availability disclaimers
  - API usage terms
  - Third-party integrations
  - Warranties and liability limitations
  - Indemnification
  - Termination conditions
  - Dispute resolution

### 2. Database Schema Updates
**File:** `convex/schema.ts`

Added to `users` table:
```typescript
termsAcceptedAt: v.optional(v.number()),
termsVersion: v.optional(v.string()),
privacyAcceptedAt: v.optional(v.number()),
privacyVersion: v.optional(v.string()),
```

### 3. Backend Mutations
**File:** `convex/users.ts`

Added functions:
- `acceptLegalTerms` - Records user acceptance with timestamp and version
- `hasAcceptedLegalTerms` - Checks if user has accepted current versions

### 4. Legal Acceptance Modal
**File:** `components/auth/legal-acceptance-modal.tsx`

Features:
- Two checkboxes (Terms & Privacy)
- Links to full documents (open in new tab)
- Disabled submit until both accepted
- Loading state during submission
- Version tracking (2026-01-26)

### 5. Onboarding Integration
**File:** `app/onboarding/page.tsx`

Changes:
- Shows legal modal before onboarding starts
- Checks acceptance status on load
- Blocks onboarding until terms accepted
- Seamless flow after acceptance

### 6. Footer Links
**File:** `components/layout/site-footer.tsx`

Added:
- Privacy link
- Terms link
- Positioned before social links

## Version Management

Current versions:
- Terms of Service: `2026-01-26`
- Privacy Policy: `2026-01-26`

To update terms:
1. Update the document content in `/privacy` or `/terms`
2. Change version constant in:
   - `components/auth/legal-acceptance-modal.tsx`
   - `app/onboarding/page.tsx`
3. Existing users will be prompted to re-accept on next login

## User Flow

### New Users
1. Sign up with Clerk
2. Redirected to `/onboarding`
3. Legal modal appears (blocking)
4. Must check both boxes and click "Accept and Continue"
5. Acceptance recorded in database with timestamp
6. Proceeds to onboarding flow

### Existing Users
- No immediate action required
- If terms version changes, they'll be prompted on next visit to onboarding
- Can view terms anytime via footer links

## Legal Compliance

### GDPR (EU Users)
✅ Data collection disclosure
✅ Third-party processors listed
✅ User rights documented
✅ Legal basis for processing
✅ Data retention policies
✅ Right to erasure
✅ Data portability
✅ International transfers

### CCPA (California Users)
✅ Personal information disclosure
✅ No sale of personal information
✅ Right to know
✅ Right to delete
✅ Right to opt-out
✅ Non-discrimination

### Stripe Requirements
✅ Terms of Service present
✅ Refund policy documented
✅ Cancellation terms clear
✅ Payment terms disclosed

## Files Modified/Created

### Created
- `app/(public)/privacy/page.tsx`
- `app/(public)/terms/page.tsx`
- `components/auth/legal-acceptance-modal.tsx`
- `LEGAL_IMPLEMENTATION.md`

### Modified
- `convex/schema.ts`
- `convex/users.ts`
- `app/onboarding/page.tsx`
- `components/layout/site-footer.tsx`

## Testing Checklist

- [ ] New user signup shows legal modal
- [ ] Cannot proceed without accepting both
- [ ] Links to Privacy/Terms open in new tab
- [ ] Acceptance is recorded in database
- [ ] Footer links work on all pages
- [ ] Privacy page renders correctly
- [ ] Terms page renders correctly
- [ ] Mobile responsive design
- [ ] Version tracking works correctly

## Future Enhancements

1. **Email Notification**: Send email when terms are updated
2. **Admin Dashboard**: View acceptance rates and versions
3. **Audit Log**: Track all acceptance events
4. **Multi-language**: Translate terms for international users
5. **Version History**: Show previous versions of terms
6. **Diff View**: Show what changed between versions

## Notes

- Email addresses in documents are placeholders (privacy@feedbackflow.com, legal@feedbackflow.com)
- Jurisdiction in dispute resolution section needs to be specified
- Consider legal review before production launch
- Update "Last updated" dates when making changes
- Keep version strings in sync across all files
