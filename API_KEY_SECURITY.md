# API Key Security Documentation

## Overview

FeedbackFlow stores and manages several types of API keys:
1. **User-provided keys** - OpenAI, Anthropic, Linear, Notion (stored in Convex)
2. **System keys** - Clerk, Stripe, Resend, Upstash (environment variables)

This document outlines the current security approach and recommendations for production.

---

## Current Implementation

### User-Provided API Keys

**Location:** `convex/apiKeys.ts` and `convex/integrations.ts`

**Storage Method:** Base64 encoding with prefix marker

```typescript
// Encoding (NOT encryption)
function obfuscateKey(key: string): string {
  const textToEncode = `encrypted:${key}`;
  return btoa(textToEncode); // Base64 encoding
}

// Decoding
function deobfuscateKey(encrypted: string): string {
  const decoded = atob(encrypted);
  if (decoded.startsWith("encrypted:")) {
    return decoded.slice("encrypted:".length);
  }
  return encrypted;
}
```

**Keys Stored:**
- **OpenAI API Keys** - For AI analysis and ticket drafting
- **Anthropic API Keys** - For AI analysis (alternative to OpenAI)
- **Linear API Keys** - For exporting feedback to Linear
- **Notion API Keys** - For exporting feedback to Notion

**Access Control:**
- Only team admins can save/update API keys
- Keys are team-scoped (isolated per team)
- Keys are never exposed in API responses (only last 4 chars shown)
- Keys are only decrypted when needed for API calls

---

## Security Assessment

### ✅ Current Strengths

1. **Team Isolation** - Keys are scoped to teams, preventing cross-team access
2. **Role-Based Access** - Only admins can manage integration keys
3. **No Client Exposure** - Keys never sent to frontend (only hints shown)
4. **Convex Security** - Database access controlled by Convex auth rules
5. **Audit Trail** - Activity logs track when keys are used

### ⚠️ Current Limitations

1. **Encoding vs Encryption** - Base64 is encoding, not encryption
   - Anyone with database access can decode keys
   - No cryptographic protection
   
2. **No Key Rotation** - Users cannot rotate keys without re-entering them

3. **No Expiration** - Keys don't expire automatically

4. **Limited Audit** - No logging of key access/decryption events

---

## Production Recommendations

### For MVP Launch (Acceptable)

**Current approach is acceptable for MVP with these conditions:**

1. **Transparency**
   - Document in UI that keys are encoded (not encrypted)
   - Add security notice in settings: "API keys are stored securely but we recommend using keys with minimal permissions"
   
2. **Best Practices**
   - Encourage users to create dedicated API keys with minimal scopes
   - For Linear: Use team-specific tokens, not personal tokens
   - For Notion: Use integration tokens, not internal tokens
   - For OpenAI/Anthropic: Use project-specific keys with spend limits

3. **Access Control**
   - Maintain strict team isolation
   - Keep admin-only key management
   - Regular security audits of Convex auth rules

4. **Monitoring**
   - Set up alerts for unusual API usage
   - Monitor for failed authentication attempts
   - Track API key validation failures

### For Post-Launch (Recommended)

**Implement proper encryption within 3-6 months:**

#### Option 1: Server-Side Encryption (Recommended)

```typescript
// Use AES-256-GCM encryption with a server-side key
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32-byte key
const ALGORITHM = 'aes-256-gcm';

function encryptKey(key: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  
  let encrypted = cipher.update(key, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Return: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}
```

**Implementation:**
- Add `ENCRYPTION_KEY` to environment variables
- Use Convex actions (not mutations) to encrypt/decrypt
- Rotate encryption key annually
- Store key in secure secret manager (AWS Secrets Manager, etc.)

#### Option 2: External Key Management Service

Use a dedicated KMS like:
- **AWS KMS** - Envelope encryption
- **HashiCorp Vault** - Full key management
- **Google Cloud KMS** - Key encryption keys

**Benefits:**
- Professional key management
- Automatic rotation
- Audit logging
- Compliance-ready

#### Option 3: User-Side Encryption (Most Secure)

Let users encrypt keys client-side before sending:
- User provides encryption passphrase
- Keys encrypted in browser before transmission
- FeedbackFlow never sees plaintext keys
- User must re-enter passphrase to use integrations

**Trade-offs:**
- Most secure
- More complex UX
- Users can lose access if they forget passphrase

---

## Implementation Roadmap

### Phase 1: MVP Launch (Current)
- ✅ Base64 encoding with team isolation
- ✅ Admin-only key management
- ✅ No client-side key exposure
- 🔲 Add security notice in UI
- 🔲 Document key permissions best practices

### Phase 2: Enhanced Security (3 months)
- 🔲 Implement AES-256-GCM encryption
- 🔲 Add encryption key to environment
- 🔲 Migrate existing keys to encrypted format
- 🔲 Add key rotation capability
- 🔲 Implement audit logging for key access

### Phase 3: Enterprise Features (6 months)
- 🔲 Integrate with KMS (AWS/GCP)
- 🔲 Add key expiration policies
- 🔲 Implement key usage analytics
- 🔲 Add SIEM integration for security monitoring
- 🔲 SOC 2 compliance preparation

---

## User Communication

### Settings Page Notice

Add this to the integrations settings page:

```
🔒 Security Notice

Your API keys are stored securely with team-level isolation. For maximum 
security, we recommend:

• Use dedicated API keys with minimal permissions
• For Linear: Use team-specific tokens
• For Notion: Use integration tokens
• For AI providers: Set spending limits on your keys

Your keys are never exposed to other teams or in API responses.
```

### README Documentation

Add to README.md:

```markdown
## Security

### API Key Storage

User-provided API keys (OpenAI, Anthropic, Linear, Notion) are:
- Encoded using base64 with team-level isolation
- Never exposed in API responses (only last 4 characters shown)
- Only accessible by team admins
- Stored in Convex with strict access controls

For production deployments, we recommend implementing AES-256-GCM encryption.
See [API_KEY_SECURITY.md](./API_KEY_SECURITY.md) for details.

### Best Practices

1. Use API keys with minimal required permissions
2. Set spending limits on AI provider keys
3. Regularly rotate your API keys
4. Monitor API usage in your provider dashboards
```

---

## Compliance Considerations

### GDPR
- API keys are not personal data
- No special GDPR requirements for key storage
- User can delete keys via settings

### SOC 2
- Current approach may not meet SOC 2 Type II requirements
- Encryption at rest required for SOC 2
- Implement Phase 2 (AES-256-GCM) before SOC 2 audit

### HIPAA
- Current approach NOT HIPAA compliant
- Requires encryption at rest with audited key management
- Must implement Phase 3 (KMS) for HIPAA

### PCI DSS
- Not applicable (no payment card data stored)
- Stripe handles all payment processing

---

## Incident Response

### If Database Access is Compromised

1. **Immediate Actions:**
   - Notify all users to rotate their API keys
   - Disable all stored keys in database
   - Force re-authentication for all users
   - Enable audit logging for all key access

2. **Investigation:**
   - Review access logs
   - Identify compromised keys
   - Assess scope of exposure
   - Document timeline

3. **Communication:**
   - Notify affected users within 24 hours
   - Provide clear instructions for key rotation
   - Offer support for re-configuration

4. **Prevention:**
   - Implement encryption (Phase 2)
   - Add intrusion detection
   - Review access controls

---

## Testing Checklist

Before production launch:

- [ ] Verify team isolation (Team A cannot access Team B's keys)
- [ ] Verify admin-only access (non-admins cannot view/edit keys)
- [ ] Verify keys are not exposed in API responses
- [ ] Verify keys are not logged in application logs
- [ ] Test key validation for all providers
- [ ] Test key deletion and re-addition
- [ ] Verify encrypted keys work after server restart
- [ ] Test with invalid/expired keys

---

## Monitoring

### Metrics to Track

1. **Key Usage:**
   - Number of API calls per key
   - Failed authentication attempts
   - Key validation failures

2. **Security Events:**
   - Unauthorized key access attempts
   - Admin role changes
   - Key creation/deletion events

3. **Performance:**
   - Encryption/decryption latency
   - Key retrieval time
   - Database query performance

### Alerts to Configure

- Multiple failed key validations (potential invalid key)
- Unusual API usage patterns (potential key compromise)
- Admin role changes (potential privilege escalation)
- High error rates on external APIs (potential key issues)

---

## Conclusion

**For MVP launch:** Current base64 encoding approach is acceptable with:
- Clear user communication about security
- Strict access controls
- Team isolation
- Best practice guidance

**For production scale:** Implement AES-256-GCM encryption within 3-6 months.

**For enterprise:** Integrate with KMS and implement full audit logging.

---

## Questions?

For security concerns or questions:
- Open an issue: https://github.com/yourusername/feedbackflow/issues
- Security email: security@yourdomain.com
- Review: [SECURITY.md](./SECURITY.md)
