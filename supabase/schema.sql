-- ═══════════════════════════════════════════════════════════════════
--  Digital Business Card & Multi-User Platform — Supabase Schema
--  Full Profiles, Leads Capture, QR Scans & RLS Configuration
--
--  Execute in: Supabase Dashboard → SQL Editor → New query → Paste → Run
-- ═══════════════════════════════════════════════════════════════════

-- 1. Enable required extensions
create extension if not exists "uuid-ossp";

-- 2. Create User Roles Enum (admin vs member)
do $$ begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('admin', 'member');
  end if;
end $$;

-- 3. Profiles Table (Holds team member credentials, card details & role)
create table if not exists public.profiles (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete set null,
  slug            text unique not null,
  role            user_role default 'member' not null,
  first_name      text not null,
  last_name       text not null default '',
  headline        text,
  job_title       text,
  company_name    text default 'DesignForge Studio',
  department      text,
  work_email      text not null,
  work_phone      text,
  mobile_phone    text,
  website_url     text,
  address         text,
  bio             text,
  avatar_url      text,
  cover_image_url text,
  social_links    jsonb default '{}'::jsonb,
  card_theme      jsonb default '{"primaryColor": "#6366F1", "accentColor": "#A855F7", "template": "modern"}'::jsonb,
  is_active       boolean default true not null,
  created_at      timestamptz default now() not null,
  updated_at      timestamptz default now() not null
);

-- Indexes for lightning fast lookups
create index if not exists idx_profiles_slug on public.profiles(slug);
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_email on public.profiles(work_email);

-- 4. Leads / Exchanged Contacts Table
-- If public.leads already exists from single-user POC, alter it safely
do $$ begin
  if not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'leads') then
    create table public.leads (
      id                uuid primary key default gen_random_uuid(),
      profile_id        uuid references public.profiles(id) on delete set null,
      name              text not null,
      phone             text not null,
      email             text,
      organization      text,
      visitor_name      text,
      visitor_email     text,
      visitor_phone     text,
      visitor_company   text,
      visitor_job_title text,
      notes             text,
      vcard_emailed     boolean default false not null,
      vcard_emailed_at  timestamptz,
      created_at        timestamptz default now() not null
    );
  else
    alter table public.leads add column if not exists profile_id uuid references public.profiles(id) on delete set null;
    alter table public.leads add column if not exists visitor_name text;
    alter table public.leads add column if not exists visitor_email text;
    alter table public.leads add column if not exists visitor_phone text;
    alter table public.leads add column if not exists visitor_company text;
    alter table public.leads add column if not exists visitor_job_title text;
    alter table public.leads add column if not exists notes text;
    alter table public.leads add column if not exists vcard_emailed boolean default false;
    alter table public.leads add column if not exists vcard_emailed_at timestamptz;
  end if;
end $$;

create index if not exists idx_leads_profile_id on public.leads(profile_id);
create index if not exists idx_leads_created_at on public.leads(created_at desc);

-- 5. QR Scan Analytics Table
create table if not exists public.qr_scans (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid references public.profiles(id) on delete cascade,
  user_agent  text,
  ip_address  text,
  scanned_at  timestamptz default now() not null
);

create index if not exists idx_qr_scans_profile_id on public.qr_scans(profile_id);

-- ═══════════════════════════════════════════════════════════════════
-- 6. Trigger: Optional Automatic Profile creation on auth.users Sign Up
-- ═══════════════════════════════════════════════════════════════════

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  raw_role user_role := 'member';
  first_name_val text;
  last_name_val text;
  company_val text;
  slug_base text;
  slug_candidate text;
  counter integer := 1;
begin
  first_name_val := coalesce(new.raw_user_meta_data->>'first_name', split_part(new.email, '@', 1));
  last_name_val  := coalesce(new.raw_user_meta_data->>'last_name', '');
  company_val    := coalesce(new.raw_user_meta_data->>'company_name', 'DesignForge Studio');

  if new.raw_user_meta_data->>'role' = 'admin' then
    raw_role := 'admin'::user_role;
  end if;

  slug_base := lower(regexp_replace(trim(first_name_val || '-' || last_name_val), '[^a-zA-Z0-9]+', '-', 'g'));
  slug_base := trim(both '-' from slug_base);
  if slug_base = '' then
    slug_base := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-zA-Z0-9]+', '-', 'g'));
  end if;

  slug_candidate := slug_base;
  while exists (select 1 from public.profiles where slug = slug_candidate) loop
    slug_candidate := slug_base || '-' || counter;
    counter := counter + 1;
  end loop;

  insert into public.profiles (
    user_id,
    slug,
    role,
    first_name,
    last_name,
    company_name,
    work_email,
    is_active
  ) values (
    new.id,
    slug_candidate,
    raw_role,
    first_name_val,
    last_name_val,
    company_val,
    new.email,
    true
  ) on conflict (slug) do update set
    user_id = excluded.user_id,
    work_email = excluded.work_email,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════════
-- 7. Row Level Security (RLS) Configuration
-- ═══════════════════════════════════════════════════════════════════

alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.qr_scans enable row level security;

-- PROFILES POLICIES
drop policy if exists "Allow select profiles" on public.profiles;
create policy "Allow select profiles"
  on public.profiles for select
  to anon, authenticated
  using (true);

drop policy if exists "Allow insert profiles" on public.profiles;
create policy "Allow insert profiles"
  on public.profiles for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Allow update profiles" on public.profiles;
create policy "Allow update profiles"
  on public.profiles for update
  to anon, authenticated
  using (true);

drop policy if exists "Allow delete profiles" on public.profiles;
create policy "Allow delete profiles"
  on public.profiles for delete
  to anon, authenticated
  using (true);

-- LEADS POLICIES
drop policy if exists "Allow anon insert leads" on public.leads;
create policy "Allow anon insert leads"
  on public.leads for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Allow select leads" on public.leads;
create policy "Allow select leads"
  on public.leads for select
  to anon, authenticated
  using (true);

drop policy if exists "Allow update leads" on public.leads;
create policy "Allow update leads"
  on public.leads for update
  to anon, authenticated
  using (true);

drop policy if exists "Allow delete leads" on public.leads;
create policy "Allow delete leads"
  on public.leads for delete
  to anon, authenticated
  using (true);

-- QR SCANS POLICIES
drop policy if exists "Allow insert qr_scans" on public.qr_scans;
create policy "Allow insert qr_scans"
  on public.qr_scans for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Allow select qr_scans" on public.qr_scans;
create policy "Allow select qr_scans"
  on public.qr_scans for select
  to anon, authenticated
  using (true);

-- ═══════════════════════════════════════════════════════════════════
-- 8. Data API Table Grants (Required by Supabase PostgREST)
-- ═══════════════════════════════════════════════════════════════════

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.profiles to anon, authenticated, service_role;
grant select, insert, update, delete on table public.leads to anon, authenticated, service_role;
grant select, insert, update, delete on table public.qr_scans to anon, authenticated, service_role;

-- ═══════════════════════════════════════════════════════════════════
-- 9. Seed Showcase Profile (Deepak Kumar)
-- ═══════════════════════════════════════════════════════════════════

insert into public.profiles (
  id,
  slug,
  role,
  first_name,
  last_name,
  job_title,
  company_name,
  department,
  work_email,
  work_phone,
  mobile_phone,
  website_url,
  address,
  bio,
  is_active
) values (
  'd0000000-0000-0000-0000-000000000001',
  'deepak-kumar',
  'admin',
  'Deepak',
  'Kumar',
  'UI/UX Engineer & Product Designer',
  'DesignForge Studio',
  'Product & Design Systems',
  'deepak@designforge.studio',
  '+919876543210',
  '+919876543210',
  'https://deepak.design',
  'Bengaluru, India',
  'UI/UX Engineer & Product Designer at DesignForge Studio. Crafting tactile digital products and design systems.',
  true
)
on conflict (slug) do update set
  is_active = true,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  job_title = excluded.job_title;
