-- ============================================================
-- Row Level Security Policies
-- ============================================================

alter table organizations       enable row level security;
alter table users               enable row level security;
alter table subscriptions       enable row level security;
alter table checkins            enable row level security;
alter table alerts              enable row level security;
alter table audit_log           enable row level security;
alter table slack_action_queue  enable row level security;

-- Helper: get the current user's org_id
create or replace function current_org_id()
returns uuid language sql stable security definer as $$
  select org_id from users where id = auth.uid()
$$;

-- Helper: get the current user's role
create or replace function current_role_name()
returns text language sql stable security definer as $$
  select role from users where id = auth.uid()
$$;

-- Helper: get a user's manager chain (for scoped team access)
create or replace function is_manager_of(target_user_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from users
    where id = target_user_id
      and manager_id = auth.uid()
  )
$$;

-- ── organizations ─────────────────────────────────────────────────────────────
-- Users can read their own org
create policy "org_read_own" on organizations
  for select using (id = current_org_id());

-- Only admins can update their org
create policy "org_update_admin" on organizations
  for update using (id = current_org_id() and current_role_name() = 'admin');

-- ── users ─────────────────────────────────────────────────────────────────────
-- Everyone can read their own profile
create policy "users_read_own" on users
  for select using (id = auth.uid());

-- Managers/HR/Admins can read profiles in their org
create policy "users_read_team" on users
  for select using (
    org_id = current_org_id()
    and current_role_name() in ('manager','hr','admin')
  );

-- Admins can manage users in their org
create policy "users_manage_admin" on users
  for all using (
    org_id = current_org_id()
    and current_role_name() = 'admin'
  );

-- ── checkins ──────────────────────────────────────────────────────────────────
-- Employees can insert their own check-ins
create policy "checkins_insert_own" on checkins
  for insert with check (user_id = auth.uid() and org_id = current_org_id());

-- Employees can read ONLY their own check-ins
create policy "checkins_read_own" on checkins
  for select using (user_id = auth.uid());

-- CRITICAL: Managers, HR, and Admins CANNOT select individual check-in rows.
-- They access data only via the aggregate_team_checkins() RPC below.
-- No select policy for managers means they get zero rows from direct table access.

-- ── Aggregate-only RPC for managers (never returns individual rows) ────────────
create or replace function aggregate_team_checkins(
  p_manager_id  uuid,
  p_org_id      uuid,
  p_days        int default 7
)
returns table(
  report_date        date,
  avg_stress         numeric,
  avg_energy         numeric,
  avg_workload       numeric,
  high_risk_count    bigint,
  participant_count  bigint
)
language plpgsql security definer as $$
declare
  v_role text;
  v_count bigint;
begin
  -- Verify caller is in the org and has manager+ role
  select role into v_role from users
  where id = p_manager_id and org_id = p_org_id and is_active = true;

  if v_role not in ('manager','hr','admin') then
    raise exception 'Insufficient role';
  end if;

  -- Enforce minimum cohort size before returning any data
  select count(distinct c.user_id) into v_count
  from checkins c
  join users u on u.id = c.user_id
  where c.org_id = p_org_id
    and u.manager_id = p_manager_id
    and c.checked_in_at >= now() - (p_days || ' days')::interval;

  if v_count < 5 then
    return;  -- empty result set — caller handles insufficient_data state
  end if;

  return query
  select
    date_trunc('day', c.checked_in_at)::date as report_date,
    round(avg(c.stress)::numeric, 2)          as avg_stress,
    round(avg(c.energy)::numeric, 2)          as avg_energy,
    round(avg(c.workload)::numeric, 2)        as avg_workload,
    count(*) filter (where c.burnout_risk_score > 0.7) as high_risk_count,
    count(distinct c.user_id)                 as participant_count
  from checkins c
  join users u on u.id = c.user_id
  where c.org_id = p_org_id
    and u.manager_id = p_manager_id
    and c.checked_in_at >= now() - (p_days || ' days')::interval
  group by 1
  order by 1;
end;
$$;

-- ── subscriptions ─────────────────────────────────────────────────────────────
create policy "subs_read_own_org" on subscriptions
  for select using (org_id = current_org_id());

-- Only service role (webhooks) writes subscriptions — no user-facing insert policy

-- ── alerts ────────────────────────────────────────────────────────────────────
create policy "alerts_read_manager" on alerts
  for select using (
    org_id = current_org_id()
    and (manager_id = auth.uid() or current_role_name() in ('hr','admin'))
  );

create policy "alerts_update_seen" on alerts
  for update using (
    org_id = current_org_id()
    and manager_id = auth.uid()
  );

-- ── audit_log ─────────────────────────────────────────────────────────────────
-- HR and Admins can read their org's audit log; no user can write directly
create policy "audit_read_hr_admin" on audit_log
  for select using (
    user_id in (select id from users where org_id = current_org_id())
    and current_role_name() in ('hr','admin')
  );

-- ── slack_action_queue ────────────────────────────────────────────────────────
-- No user policies — accessed only by service role (Slack bot)
