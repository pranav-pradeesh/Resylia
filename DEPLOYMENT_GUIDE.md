# Production Deployment Guide for Resylia

## Pre-Deployment Checklist

### 1. Environment Variables
- Copy `.env.example` to `.env.production`
- Fill in all required values (see `.env.example` comments)
- Ensure `INTERNAL_API_SECRET` is set (for AI queue processing)

### 2. Database Setup

```bash
# Run migrations in order
supabase db push --linked

# Verify all migrations applied
supabase migration list
```

Key migrations added:
- `20260428_ai_queue.sql` - Async AI task queue
- `20260428_outcomes.sql` - ML training data table
- `20260428_checkin_signals.sql` - Response duration + day-of-week fields
- `20260428_materialized_views.sql` - Dashboard aggregations
- `20260428_rls_complete.sql` - Complete RLS policies

### 3. Dependencies

```bash
pnpm install
pnpm build
```

Verify build succeeds with no type errors:
```bash
pnpm run type-check
```

### 4. Critical Environment Variables for Launch

```env
# Groq API
GROQ_API_KEY=<your-groq-key>

# Internal authentication
INTERNAL_API_SECRET=<generate-random-256-bit-hex>

# Redis for rate limiting
UPSTASH_REDIS_REST_URL=<url>
UPSTASH_REDIS_REST_TOKEN=<token>

# Prediction service (optional for Phase 1)
PREDICTION_SERVICE_URL=<url>
PREDICTION_SERVICE_SECRET=<secret>
```

### 5. Cron Job Setup

Configure your deployment platform (Railway/Vercel) to call:

**Every 5 minutes:**
```
POST /api/internal/process-ai-queue
Header: Authorization: Bearer {INTERNAL_API_SECRET}
```

Railway example (in `railway.toml`):
```toml
[triggers]
web-crons = { command = "npx ts-node scripts/cron-trigger.ts", schedule = "*/5 * * * *" }
```

### 6. Database Backups

Enable automated daily backups:
- Supabase: Settings → Backups → Enable daily backups
- Retention: 30 days minimum

### 7. Monitoring

Set up alerts for:
- AI queue failures: Check `ai_queue` table for status='failed' records
- Rate limit hits: Monitor `Redis` for throttling
- Prediction service downtime: Check `checkin` route logs

## Deployment Steps

### Option A: Railway (Recommended)

```bash
# Login to Railway
railway login

# Link project
railway link

# Set environment variables
railway env

# Deploy
railway up
```

### Option B: Vercel + Supabase

```bash
# Deploy web app
vercel deploy --prod

# Deploy prediction service
cd services/prediction
railway deploy --prod
```

### Option C: Docker

```bash
# Build
docker build -t resylia:latest .

# Run with environment
docker run -e GROQ_API_KEY=... -e DATABASE_URL=... resylia:latest
```

## Post-Deployment Verification

1. **Check database**
   ```sql
   SELECT COUNT(*) FROM checkins; -- Should be accessible
   SELECT COUNT(*) FROM ai_queue;  -- Should exist
   ```

2. **Test check-in flow**
   - Create test user in your app
   - Submit a check-in with free text
   - Verify check-in returns immediately (< 1s)
   - Check `ai_queue` table for pending tasks

3. **Verify AI queue processing**
   - Wait 5 minutes for cron to trigger
   - Check `ai_queue` table for completed tasks
   - Verify sentiment scores updated in `checkins` table

4. **Test rate limiting**
   - Submit 11 check-ins rapidly
   - 11th should return 429 error
   - Should reset at start of next hour

5. **Check Groq API integration**
   - Look for successful calls in Groq dashboard
   - Verify token usage matches volume

## Monitoring and Alerts

### Log locations:
- **Vercel**: Deployments → Function logs
- **Railway**: Logs panel
- **Supabase**: Database → Query performance

### Key metrics to track:
- Check-in submission latency (should be < 1s)
- AI queue processing success rate (target: > 98%)
- Groq API token consumption
- Database query performance

### Common issues:

**Issue: AI queue tasks stuck in 'processing'**
- Check logs for Groq API errors
- Verify GROQ_API_KEY is set correctly
- Check retry count in `ai_queue` table

**Issue: High check-in latency (> 2s)**
- Disable prediction service if slow
- Check database connection pool
- Review rate limiter configuration

**Issue: RLS errors when viewing team data**
- Verify user has `manager` or `hr` role
- Check that manager has >= 5 direct reports
- Review logs for permission errors

## Rollback Plan

If deployment fails:

1. **Revert to previous version:**
   ```bash
   railway rollback
   # or
   vercel rollback
   ```

2. **Database rollback:**
   ```sql
   -- Don't delete migrations; instead disable them:
   -- Revert app code to previous version
   -- Keep database schema as-is (backward compatible)
   ```

3. **Check-in interruption:**
   - If AI processing down: check-ins still work (synchronous part)
   - Queue tasks will retry automatically (up to 3 times)

## Performance Benchmarks

Target metrics for Phase 1:
- **Check-in submission**: < 1 second
- **Sentiment analysis**: < 30 seconds (async)
- **Coaching suggestion**: < 30 seconds (async)
- **Manager dashboard load**: < 2 seconds
- **Database query P95**: < 500ms

## Security Reminders

- [ ] RLS policies enabled on all tables
- [ ] Audit logging enabled
- [ ] MFA enabled for admin/hr accounts (recommended)
- [ ] HTTPS enforced
- [ ] CORS configured correctly
- [ ] Rate limiting active
- [ ] Groq API key rotated regularly
- [ ] Internal API secret never logged

## Cost Management

Monitor your spending:
- **Groq API**: ~$0.0001 per 1K tokens
  - 500 employees × 2 AI calls/day = ~$3-5/day
- **Supabase**: Storage + compute (scale as needed)
- **Redis**: Upstash Redis (free tier = 10,000 commands/day)
- **Email**: Resend ~$0.20 per email

Set up billing alerts:
- Groq: $50/month warning
- Supabase: $25/month warning

## Next Steps (Phase 2)

- [ ] MFA for HR/Admin (currently recommended for Phase 1)
- [ ] Manager intervention logging
- [ ] LightGBM model training (uses `outcomes` table)
- [ ] Weekly digest emails
- [ ] Employee data portability
- [ ] Microsoft Teams bot
