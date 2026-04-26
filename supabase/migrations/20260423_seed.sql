-- ============================================================
-- Resylia development seed
-- Run: supabase db reset  (runs schema + RLS + seed automatically)
-- ============================================================

-- Org
insert into organizations (id, name, slug, plan, seat_count) values
  ('00000000-0000-0000-0000-000000000001', 'Acme Corp', 'acme', 'growth', 50);

-- Users (passwords set via Supabase Auth in dev — these are profile rows only)
-- IDs must match auth.users — create via supabase CLI: supabase auth user create
insert into users (id, org_id, role, department, is_active) values
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', 'admin',    'Engineering', true),
  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000001', 'manager',  'Engineering', true),
  ('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0000-000000000001', 'employee', 'Engineering', true),
  ('00000000-0000-0000-0001-000000000004', '00000000-0000-0000-0000-000000000001', 'employee', 'Engineering', true),
  ('00000000-0000-0000-0001-000000000005', '00000000-0000-0000-0000-000000000001', 'employee', 'Engineering', true),
  ('00000000-0000-0000-0001-000000000006', '00000000-0000-0000-0000-000000000001', 'employee', 'Design',      true),
  ('00000000-0000-0000-0001-000000000007', '00000000-0000-0000-0000-000000000001', 'employee', 'Design',      true),
  ('00000000-0000-0000-0001-000000000008', '00000000-0000-0000-0000-000000000001', 'hr',       'People',      true);

-- Set manager relationships
update users set manager_id = '00000000-0000-0000-0001-000000000002'
where id in (
  '00000000-0000-0000-0001-000000000003',
  '00000000-0000-0000-0001-000000000004',
  '00000000-0000-0000-0001-000000000005',
  '00000000-0000-0000-0001-000000000006',
  '00000000-0000-0000-0001-000000000007'
);

-- Check-ins: 14 days of history for employees 3–7
do $$
declare
  uid uuid;
  d int;
  e int; s int; w int;
begin
  foreach uid in array array[
    '00000000-0000-0000-0001-000000000003'::uuid,
    '00000000-0000-0000-0001-000000000004'::uuid,
    '00000000-0000-0000-0001-000000000005'::uuid,
    '00000000-0000-0000-0001-000000000006'::uuid,
    '00000000-0000-0000-0001-000000000007'::uuid
  ] loop
    for d in 1..14 loop
      -- Simulate high-stress week 1 tapering slightly in week 2
      e := case when d <= 7 then 1 + floor(random()*2)::int else 2 + floor(random()*2)::int end;
      s := case when d <= 7 then 3 + floor(random()*2)::int else 2 + floor(random()*2)::int end;
      w := case when d <= 7 then 3 + floor(random()*2)::int else 2 + floor(random()*2)::int end;

      insert into checkins (
        user_id, org_id, energy, stress, workload,
        sentiment_score, burnout_risk_score, source, checked_in_at
      ) values (
        uid,
        '00000000-0000-0000-0000-000000000001',
        e, s, w,
        round((-0.5 + random())::numeric, 2),
        round((((s-1)/4.0)*0.4 + ((w-1)/4.0)*0.3 + ((5-e-1)/4.0)*0.3)::numeric, 3),
        'web',
        now() - (d || ' days')::interval
      )
      on conflict do nothing;
    end loop;
  end loop;
end;
$$;

-- Subscription
insert into subscriptions (org_id, status, plan, seat_count, current_period_end) values
  ('00000000-0000-0000-0000-000000000001', 'active', 'growth', 50, now() + interval '30 days');
