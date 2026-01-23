# Self-Hosting FeedbackFlow

This guide covers important configuration details for self-hosting FeedbackFlow on your own infrastructure.

## Table of Contents

- [Environment Configuration](#environment-configuration)
- [Hardcoded URLs](#hardcoded-urls)
- [Widget Configuration](#widget-configuration)
- [Email Configuration](#email-configuration)
- [Storage Configuration](#storage-configuration)

## Environment Configuration

After cloning the repository, copy `.env.example` to `.env.local` and configure all required variables. See the [Quick Start](README.md#quick-start) section in the README for detailed setup instructions.

### Required Variables

- `CONVEX_DEPLOYMENT` - Your Convex deployment name
- `NEXT_PUBLIC_CONVEX_URL` - Your Convex deployment URL
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
- `CLERK_SECRET_KEY` - Clerk secret key
- `CLERK_ISSUER_URL` - Your Clerk issuer URL (format: `https://your-app-XX.clerk.accounts.dev`)

### Optional Variables

- `NEXT_PUBLIC_APP_URL` - Your application's public URL (used in emails and webhooks)
- `STRIPE_SECRET_KEY` - For billing features
- `RESEND_API_KEY` - For email notifications
- `NEXT_PUBLIC_POSTHOG_KEY` - PostHog project API key (set to `disabled` to turn off analytics)
- `NEXT_PUBLIC_POSTHOG_HOST` - PostHog host URL (defaults to `https://us.i.posthog.com`)

## Hardcoded URLs

FeedbackFlow includes some hardcoded URLs that reference the official hosted version (`feedbackflow.cc`). These are used as **fallbacks** when environment variables are not set. For self-hosting, you should configure the appropriate environment variables to override these defaults.

### Widget API URL

**Files affected:**
- `widget/src/offline-queue.ts` (line 103)
- `widget/src/submit-ui/submit-ui.ts` (line 308)

**Default fallback:** `https://feedbackflow.cc/api/widget/submit`

**How to override:**
When embedding the widget, specify your own `apiUrl`:

```html
<script
  src="https://yourdomain.com/widget.js"
  data-widget-key="your-widget-key"
  data-api-url="https://yourdomain.com/api/widget/submit"
></script>
```

Or when using the JavaScript API:

```javascript
FeedbackFlow.init({
  widgetKey: 'your-widget-key',
  apiUrl: 'https://yourdomain.com/api/widget/submit'
});
```

### Email Service URLs

**Files affected:**
- `lib/email/service.ts` (lines 21, 93, 163, 224)

**Default fallback:** `https://feedbackflow.cc`

**How to override:**
Set the `NEXT_PUBLIC_APP_URL` environment variable:

```bash
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

This URL is used in:
- Email notification links
- Dashboard URLs in emails
- Unsubscribe links
- Status page links

### Widget Branding

**Files affected:**
- `widget/src/widget.ts` (line 121)

**Default:** "Powered by FeedbackFlow" with link to `https://feedbackflow.cc`

**Note:** Per the AGPL-3.0 license, you must retain attribution to FeedbackFlow. You can customize the styling but should maintain the attribution link.

### Integration Export Footers

**Files affected:**
- `lib/integrations/linear.ts` (line 268)
- `lib/integrations/notion.ts` (line 526)

**Default:** Exports to Linear and Notion include a footer: "Exported from FeedbackFlow (https://feedbackflow.cc)"

**How to customize:**
These are embedded in the export functions. If you want to customize them, modify the respective files:

```typescript
// lib/integrations/linear.ts
sections.push("\n---\n*Exported from [YourCompany](https://yourdomain.com)*");

// lib/integrations/notion.ts
link: { url: "https://yourdomain.com" }
```

## Widget Configuration

### Building the Widget

After making any changes to widget files, rebuild it:

```bash
npm run widget:build
```

This generates:
- `public/widget.js` - For serving from your domain
- `widget/dist/feedbackflow.js` - Standalone distribution

### Serving the Widget

The widget can be served from:
1. **Your Next.js app** - `https://yourdomain.com/widget.js` (served from `public/`)
2. **CDN** - Upload `widget/dist/feedbackflow.js` to your CDN
3. **Static hosting** - Serve from any static file host

### Widget Configuration Options

```javascript
FeedbackFlow.init({
  widgetKey: 'required-widget-key',
  apiUrl: 'https://yourdomain.com/api/widget/submit', // Override API endpoint
  position: 'bottom-right', // Widget position
  primaryColor: '#6B9AC4', // Brand color
  buttonText: 'Feedback', // Button text
  privacyPolicyUrl: 'https://yourdomain.com/privacy' // Privacy policy link
});
```

## Email Configuration

### Email From Address

Set your verified sending domain:

```bash
EMAIL_FROM=YourApp <noreply@yourdomain.com>
```

### Email Templates

Email templates use `NEXT_PUBLIC_APP_URL` for all links. Ensure this is set to your production domain.

## Storage Configuration

By default, FeedbackFlow uses Convex storage for screenshots and recordings. For production deployments with high volume, consider configuring external storage:

### S3-Compatible Storage

```bash
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_REGION=us-east-1
S3_BUCKET=your-bucket-name
S3_ENDPOINT=https://s3.amazonaws.com  # Or your R2/custom endpoint
```

Configure storage in the dashboard under Settings > Storage.

## Analytics Configuration

FeedbackFlow uses PostHog for privacy-respecting product analytics. This is **optional** and can be completely disabled.

### Disabling Analytics

To disable all analytics tracking:

```bash
NEXT_PUBLIC_POSTHOG_KEY=disabled
```

### Self-Hosted PostHog

If you run your own PostHog instance:

```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_your_project_key
NEXT_PUBLIC_POSTHOG_HOST=https://posthog.yourdomain.com
```

### Privacy Features

The PostHog integration is configured with privacy in mind:
- Respects browser Do Not Track setting
- Uses localStorage instead of cookies
- Autocapture is disabled (only explicit events are tracked)
- Session recording is disabled by default
- User identification uses only non-PII data (user ID, email domain)

## Deployment Checklist

Before deploying to production:

- [ ] Set `NEXT_PUBLIC_APP_URL` to your production domain
- [ ] Configure `CLERK_ISSUER_URL` with your Clerk instance
- [ ] Set up Stripe webhooks pointing to `https://yourdomain.com/api/webhooks/stripe`
- [ ] Configure widget `apiUrl` in all widget installations
- [ ] Verify email `EMAIL_FROM` address is verified in Resend
- [ ] Test widget submissions end-to-end
- [ ] Test email notifications
- [ ] Review CORS settings if serving widget from different domain
- [ ] Set up monitoring and error tracking
- [ ] Configure backup strategy for Convex data
- [ ] Configure or disable PostHog analytics (`NEXT_PUBLIC_POSTHOG_KEY`)

## Support

For self-hosting questions:
- Check the [documentation](https://yourdomain.com/docs)
- Review [SECURITY.md](SECURITY.md) for security best practices
- Open an issue on [GitHub](https://github.com/infinitemoneyai/feedbackflow/issues)

## License

FeedbackFlow is licensed under AGPL-3.0. When self-hosting:
- You must retain all copyright notices and attribution
- If you modify the code and run it as a network service, you must make your modifications available
- See [LICENSE](LICENSE) for full terms
