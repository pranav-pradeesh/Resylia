# File Upload Security Guidelines & Implementation

**Status**: ℹ️ CURRENTLY NOT IMPLEMENTED - Use if feature added  
**Applies if**: Profile images, document uploads, CSV imports, file exports  
**Risk Level**: HIGH (if uploads exist)

---

## 📋 File Upload Attack Surface

### Common Vulnerabilities

1. **Path Traversal**: `../../etc/passwd` → reads system files
2. **MIME Type Spoofing**: `.exe` renamed to `.jpg` → executes as binary
3. **Malware**: Compressed archives with malicious payloads
4. **XXE Injection**: XML files with entity expansion
5. **DoS**: 10GB zip file → crash server
6. **Symbolic Links**: Uploads symlink to `/etc/passwd`

---

## 🛡️ Security Implementation (If File Uploads Added)

### 1. Server-Side MIME Type Validation

❌ **WRONG** - Only check file extension:
```typescript
// VULNERABLE: extension can be spoofed
if (filename.endsWith('.jpg')) {
  // Process file
}
```

✅ **CORRECT** - Verify magic bytes:
```typescript
import FileType from 'file-type'

const buffer = await file.arrayBuffer()
const type = await FileType.fromBuffer(buffer)

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
if (!ALLOWED_TYPES.includes(type?.mime ?? '')) {
  throw new Error('Invalid file type')
}
```

### 2. File Size Limit

```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

if (file.size > MAX_FILE_SIZE) {
  throw new Error('File too large')
}
```

### 3. Supabase Storage Configuration

```typescript
// Upload to PRIVATE bucket (not /public)
const { data, error } = await supabase.storage
  .from('private-uploads') // NOT 'public'
  .upload(`${userId}/${fileName}`, file, {
    upsert: false,
    cacheControl: '0', // Don't cache uploaded files
  })

// Generate signed URL (short TTL)
const { data: signedUrl } = await supabase.storage
  .from('private-uploads')
  .createSignedUrl(`${userId}/${fileName}`, 900) // 15 minute expiry

// Return signed URL to client (not public URL)
return signedUrl.signedUrl
```

### 4. Malware Scanning (Optional but Recommended)

```typescript
// Use ClamAV or cloud scanning API
// Example: VirusTotal API, URLhaus, etc.

import { scanFileForMalware } from './security/scanner'

const scanResult = await scanFileForMalware(file)
if (scanResult.isInfected) {
  throw new Error('File flagged as malware')
}
```

### 5. Separate Origin for File Downloads

❌ **WRONG** - Serve uploads from same origin:
```
https://app.resylia.com/uploads/file.pdf ← XSS risk
```

✅ **CORRECT** - Use subdomain or CDN:
```
https://files.resylia.com/uploads/[signed_token]
https://cdn.resylia.com/uploads/[signed_token]
```

**Configuration**:
```typescript
// next.config.ts or nginx
const FILE_CDN = process.env.FILE_CDN_URL ?? 'https://files.resylia.com'
const SIGNED_URL = new URL(`${FILE_CDN}/uploads/${signedPath}`)
```

### 6. Disable Script Execution

Even if files are stored separately, prevent execution:

```typescript
// Response headers for file downloads
res.setHeader('Content-Disposition', 'attachment; filename="..."')
res.setHeader('X-Content-Type-Options', 'nosniff')
res.setHeader('Content-Security-Policy', "default-src 'none'")
```

### 7. Input Validation for CSV Imports

```typescript
import { parse } from 'csv-parse/sync'

const parsed = parse(csvContent, {
  columns: true,
  max_records: 10000, // Prevent billion-row DOS
  relax: false, // Strict parsing
})

// Validate each row
for (const row of parsed) {
  if (!isValidEmployeeRow(row)) {
    throw new Error(`Invalid row: ${JSON.stringify(row)}`)
  }
}
```

---

## 📊 Current Status: NO FILE UPLOADS IN PHASE 1

**Resylia currently does NOT support file uploads:**
- ✅ No profile image uploads
- ✅ No document storage
- ✅ No CSV imports
- ✅ No file exports (only API responses)

**If added in future:**
1. Implement server-side MIME validation (magic bytes)
2. Use Supabase private buckets
3. Generate signed URLs with 15-min TTL
4. Serve from separate origin (CDN/subdomain)
5. Disable script execution in response headers
6. Add malware scanning (ClamAV or API)
7. Limit file size to 5 MB
8. Validate & sanitize imports (CSV, Excel)

---

## 🔒 Rate Limiting Tiers (IMPLEMENTED)

Different endpoints need different limits based on sensitivity:

| Endpoint | Limit | Duration | Purpose |
|----------|-------|----------|---------|
| `/api/auth/login` | 5 requests | 15 minutes (per IP) | Prevent brute force |
| `/api/auth/signup` | 10 requests | 1 hour (per IP) | Prevent account spam |
| `/api/checkin` | 3 requests | 24 hours (per user) | One check-in per day |
| `/api/admin/*` | 20 requests | 1 minute (per user) | Sensitive operations |
| `/api/webhooks/stripe` | 50 requests | 1 minute (per IP) | Allow batch retries |
| `/api/general` | 100 requests | 1 minute (per user) | Normal API usage |
| `/api/public` | unlimited | - | Public endpoints only |

**Implementation** (in `packages/shared/src/rate-limit.ts`):
```typescript
export const rateLimiters = {
  auth: new Ratelimit({
    redis: Redis.fromEnv(),
    analytics: true,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
  }),
  checkin: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(3, '24 h'),
  }),
  admin: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(20, '1 m'),
  }),
  webhook: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(50, '1 m'),
  }),
}
```

---

## 🔗 Sub-Resource Integrity (SRI) for CDN Assets

If external scripts are added, verify integrity:

```html
<script
  src="https://cdn.example.com/lib.min.js"
  integrity="sha384-+DLHTgj97m/j5mJOZV5YRCwEV5S/gYQ1X8EzxL7UPn+ZYqZ8Vhz4+8xz5nwJHH"
  crossorigin="anonymous"
></script>
```

**Generate SRI hash**:
```bash
openssl dgst -sha384 -binary lib.min.js | openssl base64 -A
# Output: sha384-+DLHTgj97m/j5mJOZV5YRCwEV5S/...
```

---

## 📝 Dependency Pinning & Verification

Prevent supply-chain attacks:

```json
{
  "scripts": {
    "preinstall": "npx only-allow pnpm"
  }
}
```

**.npmrc**:
```
audit=true
save-exact=true
engine-strict=true
```

**CI Pipeline** (.github/workflows/ci.yml):
```yaml
- name: Audit dependencies
  run: |
    pnpm audit --audit-level=high
    pnpm dlx lockfile-lint --path pnpm-lock.yaml --allowed-hosts npm
```

---

## 📊 Summary

| Feature | Status | Risk | Priority |
|---------|--------|------|----------|
| AI output validation | ✅ Implemented | Mitigated | Complete |
| Session timeout | ✅ Implemented | Mitigated | Complete |
| Stripe replay protection | ✅ Implemented | Mitigated | Complete |
| Permissions-Policy header | ✅ Implemented | Mitigated | Complete |
| CSP violation reporting | ✅ Implemented | Mitigated | Complete |
| Audit log tamper protection | ✅ Implemented | Mitigated | Complete |
| Rate limiting tiers | ✅ Implemented | Mitigated | Complete |
| SRI for CDN assets | 🔲 If needed | Low (no external scripts) | Future |
| File uploads | 🔲 Not planned | N/A (no uploads) | Phase 2+ |
| Dependency verification | ✅ Configured | Mitigated | Complete |

---

**Status**: ✅ COMPREHENSIVE SECURITY HARDENING COMPLETE
