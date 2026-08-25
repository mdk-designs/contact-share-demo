-- ═══════════════════════════════════════════════════════════════════
--  Digital Business Card — Supabase Migration
--
--  Run in: Supabase Dashboard → SQL Editor → New query → Paste → Run
-- ═══════════════════════════════════════════════════════════════════

-- 1. Drop table if re-running migration (safe for development)
drop table if exists public.leads;

-- 2. Create leads table
create table public.leads (
  id            uuid        primary key default gen_random_uuid(),
  name          text        not null,
  phone         text        not null,
  email         text,
  organization  text,
  created_at    timestamptz not null default now()
);

-- 3. Enable Row Level Security
alter table public.leads enable row level security;

-- 4. Allow anonymous INSERT (visitors submitting the exchange form)
--    Anon key can INSERT but cannot SELECT, UPDATE, or DELETE.
create policy "anon_can_insert_leads"
  on public.leads
  for insert
  to anon
  with check (true);

-- 5. Allow authenticated users (card owner) to view all leads
create policy "auth_can_read_leads"
  on public.leads
  for select
  to authenticated
  using (true);

-- 6. Performance index — newest leads first
create index leads_created_at_idx
  on public.leads (created_at desc);

-- ───────────────────────────────────────────────
--  Verify: run this to check leads are visible
-- ───────────────────────────────────────────────
-- select id, name, phone, email, organization, created_at
-- from public.leads
-- order by created_at desc
-- limit 25;
