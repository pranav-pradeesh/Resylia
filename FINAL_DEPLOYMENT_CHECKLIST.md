# FINAL DEPLOYMENT CHECKLIST — Launch Today

**Target**: Production deployment to Railway/Vercel  
**Timeline**: Today (April 28, 2026)  
**Estimated Duration**: 2-3 hours

---

## 🚨 CRITICAL: Do These First (15 minutes)

### Step 1: Verify Build
```bash
cd /c/Users/Lenovo/Downloads/resylia

# Install any missing dependencies
pnpm install

# Type check
pnpm run type-check
# Expected: ✅ 0 errors

# Build
pnpm build
# Expected: ✅ Success, no errors
```

**If build fails**:
- Check `pnpm-lock.yaml` integrity: `pnpm ls`
- Check for missing exports in `packages/ai/src/index.ts`
- Check for circular imports: look at first error message

---

### Step 2: Environment Variables Checklist

**Create `.env.production` in project root**:
```bash
# AI & LLM
GROQ_API_KEY=gsk_xxxxx...
INTERNAL_API_SECRET=secret_xxxxx...

# Database
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxx...
DATABASE_URL=postgresql://user:pass@host/db

# Cache & Rate Limiting
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxx...

# Payments
STRIPE_SECRET_KEY=sk_live_xxxxx...
STRIPE_WEBHOOK_SECRET=whsec_xxxxx...

# Security
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://resylia.app
```

**Verify all are set**:
```bash
required_vars=(
  "GROQ_API_KEY" "INTERNAL_API_SECRET" "SUPABASE_URL"
  "SUPABASE_SERVICE_ROLE_KEY" "DATABASE_URL" "UPSTASH_REDIS_REST_URL"
  "UPSTASH_REDIS_REST_TOKEN" "STRIPE_SECRET_KEY" "STRIPE_WEBHOOK_SECRET"
)

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ MISSING: $var"
    exit 1
  fi
done
echo "✅ All environment variables set"
```

---

### Step 3: Database Migrations (Production)

⚠️ **CRITICAL**: Run migrations before deploying code!

```bash
# List pending migrations
supabase migration list --db-url "postgresql://user:pass@host/db"

# Apply ALL pending migrations
supabase db push --db-url "postgresql://user:pass@host/db"

# Verify migrations applied
supabase migration list
# Should show ALL 20260428_* migrations as APPLIED
```

**Migrations to verify are present**:
- 20260423_schema.sql ✅
- 20260423_rls_policies.sql ✅
- 20260423_seed.sql ✅
- 20260427_invites.sql ✅
- 20260428_ai_queue.sql ✅ **NEW**
- 20260428_checkin_signals.sql ✅ **NEW**
- 20260428_materialized_views.sql ✅ **NEW**
- 20260428_rls_complete.sql ✅ **NEW**
- 20260428_audit_log_tamper_protection.sql ✅ **NEW**

---

## 🔧 Configure Hosting (30 minutes)

### Option A: Railway (Recommended)

```bash
# 1. Install Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Link to project
railway link --id [project-id]

# 4. Add environment variables
railway variables set GROQ_API_KEY=...
railway variables set INTERNAL_API_SECRET=...
railway variables set SUPABASE_URL=...
# ... (set all from Step 2)

# 5. Deploy
railway deploy
```

### Option B: Vercel

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Create environment variables in Vercel dashboard
# Set all from Step 2 above

# 4. Deploy
vercel deploy --prod
```

### Option C: Docker (Self-hosted)

```bash
# 1. Create Dockerfile (if not exists)
docker build -t resylia .

# 2. Set environment variables
docker run -e GROQ_API_KEY=... \
           -e SUPABASE_URL=... \
           [... all env vars ...] \
           -p 3000:3000 \
           resylia
```

---

## ✅ Critical Configuration: AI Queue Cron Job

**MUST DO: This is why async AI works!**

The application needs a cron job to process queued AI tasks every 5 minutes.

### Railway Cron

1. **Create a Rails-style cron trigger**:
   - Go to Railway dashboard
   - Add HTTP trigger
   - Set URL: `https://api.resylia.app/api/internal/process-ai-queue`
   - Set frequency: Every 5 minutes
   - Add header: `Authorization: Bearer [INTERNAL_API_SECRET]`

2. **Verify it's working**:
   ```bash
   # After 5 minutes, check logs
   railway logs | grep "process-ai-queue"
   # Should see: "Processing 50 pending AI tasks"
   ```

### Vercel Cron (if using)

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/internal/process-ai-queue",
    "schedule": "*/5 * * * *"
  }]
}
```

### Self-Hosted

```bash
# Use curl with crontab
# Add to /etc/crontab:
*/5 * * * * curl -H "Authorization: Bearer $INTERNAL_API_SECRET" https://api.resylia.app/api/internal/process-ai-queue

# Or use node-schedule npm package
```

---

## 🔐 Security Configuration (30 minutes)

### Step 1: Configure Stripe Webhook

1. **Get webhook URL**:
   - Your domain: `https://resylia.app` or `https://your-domain.com`
   - Webhook path: `/api/webhooks/stripe`
   - Full URL: `https://resylia.app/api/webhooks/stripe`

2. **Add to Stripe Dashboard**:
   - Go to Stripe → Settings → Webhooks
   - Add endpoint: `https://resylia.app/api/webhooks/stripe`
   - Events: `charge.succeeded`, `charge.failed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy Signing secret (whsec_xxxxx...)
   - Set `STRIPE_WEBHOOK_SECRET` environment variable

---

### Step 2: Configure CSP Report Endpoint

1. **Verify endpoint exists**:
   ```bash
   curl -X POST https://resylia.app/api/security/csp-report \
     -H "Content-Type: application/csp-report" \
     -d '{"csp-report":{}}'
   # Expected: 204 No Content
   ```

2. **Monitor CSP violations**:
   ```sql
   -- In Supabase, check audit logs for CSP reports
   SELECT * FROM audit_log 
   WHERE event = 'csp_violation' 
   ORDER BY created_at DESC
   LIMIT 10;
   ```

---

### Step 3: Test Security Headers

```bash
# Verify all security headers are present
curl -I https://resylia.app | grep -E "X-Frame|X-Content|CSP|Permissions|HSTS"

# Expected output:
# X-Frame-Options: DENY ✅
# X-Content-Type-Options: nosniff ✅
# Strict-Transport-Security: max-age=63072000 ✅
# Permissions-Policy: camera=() ✅
# Content-Security-Policy: ✅

# Use online tool:
# https://securityheaders.com/?q=resylia.app
# Expected: A or A+ grade
```

---

## 🧪 Post-Launch Testing (30 minutes)

### Test 1: Check-in Submission
```bash
# Login as employee
curl -X POST https://resylia.app/api/checkin \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"energy":3,"stress":5,"workload":4,"mood":"stressed"}'

# Expected: 200 OK, immediate response
# Check audit logs: should show enqueued task
```

### Test 2: AI Processing (wait 5 minutes)
```bash
# Manually trigger AI processing
curl -X POST https://resylia.app/api/internal/process-ai-queue \
  -H "Authorization: Bearer $INTERNAL_API_SECRET"

# Expected: 200 OK
# Check response: should show "processed X tasks"

# Verify AI results in database
SELECT sentiment, suggestions FROM checkins 
WHERE id = [checkin_id] \
LIMIT 1;
# Should have sentiment and suggestions populated
```

### Test 3: Session Timeout
```bash
# 1. Login in browser
# 2. Wait 31 minutes without activity
# 3. Next page load should redirect to /login?reason=session_timeout
# Verify: Session maintained if there's activity
```

### Test 4: Rate Limiting
```bash
# Test check-in rate limit (3 per day)
for i in {1..5}; do
  curl -X POST https://resylia.app/api/checkin \
    -H "Authorization: Bearer $USER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"energy":3,"stress":3,"workload":3}'
  echo "Request $i"
done

# Expected:
# Requests 1-3: 200 OK
# Requests 4-5: 429 Too Many Requests
```

### Test 5: Stripe Webhook
```bash
# Send test event
stripe_test_secret="rk_test_xxxxx..."

event_data='{
  "type": "charge.succeeded",
  "data": {
    "object": {
      "amount": 9900,
      "currency": "usd",
      "customer": "cus_xxxxx"
    }
  }
}'

# Sign the event
curl -X POST https://resylia.app/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: [computed signature]" \
  -d "$event_data"

# Expected: 200 OK, database updated
```

---

## 📊 Monitoring & Alerts (15 minutes)

### Setup Monitoring

```bash
# 1. Enable application logging
railway logs --follow

# 2. Create alert for errors
# In Railway dashboard:
#   - Alerts → New Alert
#   - Condition: Error rate > 1%
#   - Action: Email notification

# 3. Monitor AI queue size
# Query Supabase:
SELECT COUNT(*) FROM ai_queue WHERE status = 'pending';
# Should be < 10 (if cron job is working)
```

### Create Billing Alerts

**Groq** (estimated $3-5/day):
```bash
# In Groq console:
#   - Set monthly budget: $150
#   - Alert at 80% usage: $120 spent
```

**Supabase** (estimated $50-100/month):
```bash
# In Supabase dashboard:
#   - Billing → Notifications
#   - Alert at $80 spent (80% of budget)
```

**Stripe** (payment processing):
```bash
# In Stripe dashboard:
#   - Account Settings → Billing
#   - Set spending limit to prevent surprise charges
```

---

## 🚀 GO/NO-GO Decision Matrix

### GO (Launch immediately)
✅ Meets ALL criteria:
- [ ] Build passes: `pnpm build` ✅
- [ ] Type check passes: `pnpm run type-check` ✅
- [ ] All migrations applied
- [ ] Environment variables set
- [ ] Stripe webhook configured
- [ ] Cron job for AI queue running
- [ ] Security headers verified (curl)
- [ ] CSP report endpoint working (204 response)
- [ ] Check-in rate limit verified (3 per day)
- [ ] Audit log is append-only (UPDATE fails)

### NO-GO (Delay 24 hours)
❌ If ANY of these fail:
- [ ] Build fails or has type errors
- [ ] Critical migration doesn't apply
- [ ] Stripe webhook not responding
- [ ] AI cron job not running
- [ ] Security headers missing
- [ ] Rate limiting doesn't work
- [ ] Audit logs show tampering

---

## 📋 Final Checklist Before Go-Live

**Commit changes**:
```bash
git add -A
git commit -m "Security hardening: AI guardrails, session timeout, audit protection, breach plan"
git push origin main
```

**Final verification**:
```bash
# Build one more time
pnpm install
pnpm build
# ✅ Must succeed

# Type check
pnpm run type-check
# ✅ Must be clean

# List migrations
supabase migration list
# ✅ All 20260428_* should be APPLIED
```

**DNS & Domain**:
- [ ] Domain DNS points to production server
- [ ] SSL certificate is valid
- [ ] HSTS preload list includes your domain (wait 7 days)

**Documentation**:
- [ ] Privacy Policy published at `/privacy`
- [ ] Terms of Service published at `/terms`
- [ ] DPO contact published (dpo@resylia.com)
- [ ] Data Breach Response Plan saved (not public)

**Team Readiness**:
- [ ] DPO briefed on incident response procedures
- [ ] Support team trained on new features
- [ ] Engineering team on-call for 24 hours post-launch
- [ ] Incident response contact list distributed

---

## 🎯 Success Criteria (First 24 Hours)

**Monitor these metrics**:

| Metric | Target | Alert if |
|--------|--------|----------|
| Uptime | 99.9%+ | < 99% |
| Error rate | < 0.5% | > 1% |
| AI queue size | < 10 tasks | > 100 tasks |
| CSP violations | 0-5/day | > 20/day |
| Stripe webhook delay | < 5s | > 30s |
| Audit log entries | 100+ | 0 entries |

---

## 🔄 Post-Launch (Hour 1-24)

### Every Hour
```bash
# Check for errors
railway logs | grep -i error | tail -5

# Verify AI processing
SELECT COUNT(*) FROM ai_queue WHERE status = 'pending';
# Should be < 10
```

### After 24 Hours
```bash
# Review all metrics
# Check user feedback (support/slack)
# Verify backups are running
# Check error logs for patterns
```

### If Issues Found
1. **AI queue backlog**: Manually trigger queue processing
2. **Rate limiting too strict**: Adjust limits in `packages/shared/src/rate-limit.ts`
3. **Session timeout complaints**: Increase from 30 min to 45 min
4. **Stripe webhooks failing**: Verify webhook secret matches

---

## ✅ LAUNCH SIGN-OFF

**Before clicking deploy**:
- [ ] CTO: Verified build & type check _____ Date: ____
- [ ] Security: Verified headers & compliance _____ Date: ____
- [ ] DPO: Breach response plan approved _____ Date: ____
- [ ] DevOps: Infrastructure ready _____ Date: ____

**Status**: 🟢 **READY TO DEPLOY**

---

**Deploy command** (when ready):
```bash
railway deploy  # or vercel deploy --prod
```

After deployment succeeds, your URL will be live at `https://resylia.app`

**Verification**:
```bash
curl https://resylia.app
# Should respond with website HTML
```

---

**🎉 YOU'RE LIVE! 🎉**
