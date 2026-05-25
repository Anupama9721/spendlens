-- Run this in your Supabase SQL editor

create table audits (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  tools jsonb not null,
  team_size int,
  use_case text,
  total_current_spend numeric default 0,
  total_monthly_savings numeric default 0,
  total_annual_savings numeric default 0,
  ai_summary text,
  is_high_savings boolean default false,
  created_at timestamptz default now()
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid references audits(id),
  email text not null,
  company_name text,
  role text,
  team_size int,
  monthly_savings numeric default 0,
  is_high_value boolean default false,
  created_at timestamptz default now()
);

create table rate_limits (
  ip text primary key,
  count int default 1,
  window_start timestamptz default now()
);

-- Allow public read of audits (for shareable URLs)
alter table audits enable row level security;
create policy "Public audits are viewable by everyone"
  on audits for select using (true);
create policy "Service role can insert audits"
  on audits for insert with check (true);

-- Leads are private
alter table leads enable row level security;
create policy "Service role only"
  on leads for all using (false);

alter table rate_limits enable row level security;
create policy "Service role only"
  on rate_limits for all using (false);
