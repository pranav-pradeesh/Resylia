-- Resylia Plan Structure Migration
-- Run these in Supabase SQL Editor

-- Add plan-related columns to organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS 
  plan TEXT DEFAULT 'starter' 
  CHECK (plan IN ('starter', 'growth', 'pro'));

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS 
  billing_cycle TEXT DEFAULT 'monthly' 
  CHECK (billing_cycle IN ('monthly', 'annual'));

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS 
  seat_count INTEGER DEFAULT 10;

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS 
  seat_limit INTEGER DEFAULT 10;

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS 
  slack_bot_token TEXT DEFAULT NULL;

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS 
  slack_workspace_id TEXT DEFAULT NULL;

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS 
  slack_bot_connected BOOLEAN DEFAULT FALSE;

-- Add onboarding tracking
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS 
  onboarding_completed BOOLEAN DEFAULT FALSE;

-- Remove deprecated columns if they exist
ALTER TABLE organizations 
  DROP COLUMN IF EXISTS ai_messages_used,
  DROP COLUMN IF EXISTS ai_messages_limit,
  DROP COLUMN IF EXISTS ai_messages_reset_date;

-- Create new tables for plan management
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  razorpay_subscription_id TEXT UNIQUE NOT NULL,
  razorpay_customer_id TEXT NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('starter', 'growth', 'pro')),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'annual')),
  seat_count INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trial', 'canceled', 'past_due')),
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  next_billing_at TIMESTAMP WITH TIME ZONE,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for anonymous escalations
CREATE TABLE IF NOT EXISTS anonymous_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_token TEXT UNIQUE NOT NULL,
  org_id TEXT DEFAULT 'all',
  department TEXT NOT NULL,
  concern_type TEXT NOT NULL CHECK (concern_type IN ('safety', 'harassment', 'burnout', 'toxic', 'other')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  issue_description TEXT NOT NULL,
  affected_people INTEGER DEFAULT 1,
  timeframe TEXT NOT NULL CHECK (timeframe IN ('ongoing', 'past_week', 'past_month', 'long_term')),
  previous_reports BOOLEAN DEFAULT FALSE,
  preferred_contact TEXT NOT NULL CHECK (preferred_contact IN ('anonymous', 'email', 'phone')),
  encrypted_contact_data JSONB NULL,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'addressed', 'resolved')),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolution_summary TEXT NULL,
  ip_address TEXT DEFAULT 'unknown',
  user_agent TEXT DEFAULT 'unknown'
);

-- Create industry benchmarks table
CREATE TABLE IF NOT EXISTS industry_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry TEXT NOT NULL,
  org_size_range TEXT NOT NULL,
  avg_burnout_risk NUMERIC(3,2) NOT NULL,
  avg_energy NUMERIC(3,2) NOT NULL,
  avg_stress NUMERIC(3,2) NOT NULL,
  avg_workload NUMERIC(3,2) NOT NULL,
  avg_engagement NUMERIC(3,2) NOT NULL,
  sample_size INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  key_insights TEXT[] DEFAULT '{}'
);

-- Create burnout predictions table
CREATE TABLE IF NOT EXISTS burnout_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  current_risk NUMERIC(3,2) NOT NULL,
  prediction_7_days NUMERIC(3,2) NOT NULL,
  prediction_14_days NUMERIC(3,2) NOT NULL,
  prediction_30_days NUMERIC(3,2) NOT NULL,
  estimated_burnout_date DATE NULL,
  confidence_score NUMERIC(3,2) NOT NULL,
  risk_factors TEXT[] DEFAULT '{}',
  recommended_actions TEXT[] DEFAULT '{}',
  model_version TEXT DEFAULT '1.0',
  predicted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, org_id, created_at::DATE)
);

-- Create RLS policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE industry_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE burnout_predictions ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (you may want to adjust based on your auth system)
CREATE POLICY "Users can view own org subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE org_id = org_id));

CREATE POLICY "Service role can manage subscriptions" ON subscriptions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Anyone can read industry benchmarks" ON industry_benchmarks
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage benchmarks" ON industry_benchmarks
  FOR ALL USING (auth.role() = 'service_role');

-- Drop tables if they don't exist (for idempotency)
DROP TABLE IF EXISTS benchmark_comparisons;
DROP TABLE IF EXISTS industry_benchmarks;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_org_id ON subscriptions(org_id);
CREATE INDEX IF NOT EXISTS idx_anonymous_escalations_token ON anonymous_escalations(anonymous_token);
CREATE INDEX IF NOT EXISTS idx_burnout_predictions_user_org ON burnout_predictions(user_id, org_id);