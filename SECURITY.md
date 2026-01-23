# Security Policy

## Reporting a Vulnerability

We take the security of FeedbackFlow seriously. If you believe you have found a security vulnerability, please report it to us as described below.

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: **security@feedbackflow.cc**

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include the following information in your report:

- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |
| < 1.0   | :x:                |

## Security Best Practices

When self-hosting FeedbackFlow, we recommend:

1. **Environment Variables**: Never commit `.env` files or expose sensitive keys
2. **HTTPS Only**: Always use HTTPS in production
3. **API Keys**: Rotate API keys regularly and use encryption at rest
4. **Dependencies**: Keep dependencies up to date with `npm audit` and `npm update`
5. **Webhooks**: Verify webhook signatures (Stripe, Clerk)
6. **Rate Limiting**: Configure appropriate rate limits for your use case
7. **CORS**: Configure CORS policies appropriately for your widget
8. **Database**: Use Convex's built-in security rules and authentication

## Security Features

FeedbackFlow includes several built-in security features:

- **API Key Storage**: User-provided API keys (OpenAI, Anthropic, Linear, Notion) are obfuscated using base64 encoding before storage in Convex. **Note**: This is not cryptographic encryption. For production deployments, we recommend implementing proper AES-256-GCM encryption via a Convex action that uses a secure key management service.
- **Rate Limiting**: Built-in rate limiting for API endpoints and widget submissions
- **Honeypot**: Anti-spam honeypot field in widget submissions
- **GDPR Compliance**: Data export and deletion capabilities
- **Authentication**: Secure authentication via Clerk with support for MFA
- **Webhook Verification**: All webhooks verify signatures before processing
- **Input Validation**: Comprehensive input validation and sanitization
- **XSS Protection**: React's built-in XSS protection and Content Security Policy headers

### API Key Storage Implementation

The current implementation in `convex/apiKeys.ts` uses base64 encoding to obfuscate API keys. This provides basic protection against casual viewing but is **not cryptographically secure**. The keys are:

1. Base64 encoded before storage
2. Stored in Convex database
3. Decoded when needed for API calls
4. Only accessible to authenticated team members

**For production use**, consider:
- Implementing proper encryption using AES-256-GCM
- Using a key management service (AWS KMS, Google Cloud KMS, HashiCorp Vault)
- Rotating encryption keys regularly
- Implementing key access logging and monitoring

## Disclosure Policy

When we receive a security bug report, we will:

1. Confirm the problem and determine the affected versions
2. Audit code to find any similar problems
3. Prepare fixes for all supported versions
4. Release new security fix versions as soon as possible

## Comments on this Policy

If you have suggestions on how this process could be improved, please submit a pull request or open an issue.
