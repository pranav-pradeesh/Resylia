/**
 * Supabase Database Types
 * Generated type definitions for the Resylia database schema.
 * These are manually maintained to match the schema in migrations.
 */

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          plan: 'starter' | 'growth' | 'enterprise'
          seat_count: number
          stripe_customer_id: string | null
          slack_team_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          plan?: 'starter' | 'growth' | 'enterprise'
          seat_count: number
          stripe_customer_id?: string | null
          slack_team_id?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          slug?: string
          plan?: 'starter' | 'growth' | 'enterprise'
          seat_count?: number
          stripe_customer_id?: string | null
          slack_team_id?: string | null
        }
      }
      users: {
        Row: {
          id: string
          org_id: string
          role: 'employee' | 'manager' | 'hr' | 'admin'
          department: string | null
          manager_id: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id: string
          org_id: string
          role?: 'employee' | 'manager' | 'hr' | 'admin'
          department?: string | null
          manager_id?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          role?: 'employee' | 'manager' | 'hr' | 'admin'
          department?: string | null
          manager_id?: string | null
          is_active?: boolean
        }
      }
      checkins: {
        Row: {
          id: string
          user_id: string
          org_id: string
          energy: number
          stress: number
          workload: number
          free_text: string | null
          sentiment_score: number | null
          burnout_risk_score: number | null
          source: 'web' | 'slack' | 'teams'
          checked_in_at: string
        }
        Insert: {
          id?: string
          user_id: string
          org_id: string
          energy: number
          stress: number
          workload: number
          free_text?: string | null
          sentiment_score?: number | null
          burnout_risk_score?: number | null
          source: 'web' | 'slack' | 'teams'
          checked_in_at?: string
        }
        Update: {
          free_text?: string | null
          sentiment_score?: number | null
          burnout_risk_score?: number | null
        }
      }
      audit_log: {
        Row: {
          id: string
          event: string
          context: Record<string, unknown>
          ip: string | null
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event: string
          context?: Record<string, unknown>
          ip?: string | null
          user_id?: string | null
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          org_id: string
          stripe_subscription_id: string
          status: string
          plan: 'starter' | 'growth' | 'enterprise'
          seat_count: number
          current_period_end: string
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          stripe_subscription_id: string
          status: string
          plan: 'starter' | 'growth' | 'enterprise'
          seat_count: number
          current_period_end: string
          created_at?: string
        }
        Update: {
          status?: string
          plan?: 'starter' | 'growth' | 'enterprise'
          seat_count?: number
          current_period_end?: string
        }
      }
      risk_events: {
        Row: {
          id: string
          user_id: string
          org_id: string
          risk_level: 'low' | 'medium' | 'high' | 'critical'
          predicted_burnout_date: string | null
          contributing_factors: string[]
          acknowledged_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          org_id: string
          risk_level: 'low' | 'medium' | 'high' | 'critical'
          predicted_burnout_date?: string | null
          contributing_factors?: string[]
          acknowledged_by?: string | null
          created_at?: string
        }
        Update: {
          risk_level?: 'low' | 'medium' | 'high' | 'critical'
          acknowledged_by?: string | null
        }
      }
      alerts: {
        Row: {
          id: string
          org_id: string
          manager_id: string
          type: string
          payload: Record<string, unknown>
          seen_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          manager_id: string
          type: string
          payload: Record<string, unknown>
          seen_at?: string | null
          created_at?: string
        }
        Update: {
          seen_at?: string | null
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
