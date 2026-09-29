-- ═══════════════════════════════════════════════════════════════════
--  Multi-User Contact Sharing Platform: 3-Tier DDL & RLS Migration
--  Run in: Supabase Dashboard → SQL Editor → New query → Paste → Run
-- ═══════════════════════════════════════════════════════════════════

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. User Roles Enum (idempotent, supporting 3 tiers: master_admin, admin, member)
do $$ begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('admin', 'member', 'master_admin');
  else
    alter type user_role add value if not exists 'master_admin';
  end if;
end $$;

-- 3. Profiles Table (Holds team member data & public card info)
create table if not exists public.profiles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users on delete set null,
    slug text unique not null,
    role user_role default 'member' not null,
    first_name text not null,
    last_name text not null,
    headline text,
    job_title text,
    company_name text,
    department text,
    work_email text not null,
    work_phone text,
    mobile_phone text,
    website_url text,
    address text,
    bio text,
    avatar_url text,
    cover_image_url text,
    social_links jsonb default '{}'::jsonb,
    card_theme jsonb default '{"primaryColor": "#6366F1", "accentColor": "#A855F7", "template": "modern"}'::jsonb,
    is_active boolean default true not null,
    telegram_chat_id text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure telegram_chat_id column exists if table was pre-existing
alter table public.profiles add column if not exists telegram_chat_id text;

create index if not exists idx_profiles_slug on public.profiles(slug);
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_user_id on public.profiles(user_id);

-- 4. Leads / Exchanged Contacts Table
do $$ begin
  if not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'leads') then
    create table public.leads (
        id uuid default gen_random_uuid() primary key,
        profile_id uuid references public.profiles(id) on delete cascade,
        visitor_name text not null,
        visitor_email text,
        visitor_phone text,
        visitor_company text,
        visitor_job_title text,
        notes text,
        vcard_emailed boolean default false not null,
        vcard_emailed_at timestamp with time zone,
        created_at timestamp with time zone default timezone('utc'::text, now()) not null
    );
  else
    alter table public.leads add column if not exists profile_id uuid references public.profiles(id) on delete cascade;
    alter table public.leads add column if not exists visitor_name text;
    alter table public.leads add column if not exists visitor_email text;
    alter table public.leads add column if not exists visitor_phone text;
    alter table public.leads add column if not exists visitor_company text;
    alter table public.leads add column if not exists visitor_job_title text;
    alter table public.leads add column if not exists notes text;
    alter table public.leads add column if not exists vcard_emailed boolean default false;
    alter table public.leads add column if not exists vcard_emailed_at timestamp with time zone;
  end if;
end $$;

create index if not exists idx_leads_profile_id on public.leads(profile_id);

-- 5. QR Code Scans Analytics Table
create table if not exists public.qr_scans (
    id uuid default gen_random_uuid() primary key,
    profile_id uuid references public.profiles(id) on delete cascade not null,
    ip_address text,
    user_agent text,
    scanned_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_qr_scans_profile_id on public.qr_scans(profile_id);

-- 6. Helper Security Functions (STABLE, SECURITY DEFINER)
create or replace function public.is_master_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where user_id = (select auth.uid())
      and role = 'master_admin'
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where user_id = (select auth.uid())
      and role in ('master_admin', 'admin')
  );
$$;

-- 7. Auto update updated_at trigger
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

-- 8. Row Level Security (RLS) Configuration
alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.qr_scans enable row level security;

-- Drop legacy policies
drop policy if exists "Allow select profiles" on public.profiles;
drop policy if exists "Allow insert profiles" on public.profiles;
drop policy if exists "Allow update profiles" on public.profiles;
drop policy if exists "Allow delete profiles" on public.profiles;
drop policy if exists "profiles_select_policy" on public.profiles;
drop policy if exists "profiles_insert_policy" on public.profiles;
drop policy if exists "profiles_update_policy" on public.profiles;
drop policy if exists "profiles_delete_policy" on public.profiles;

drop policy if exists "Allow anon insert leads" on public.leads;
drop policy if exists "Allow select leads" on public.leads;
drop policy if exists "Allow update leads" on public.leads;
drop policy if exists "leads_insert_policy" on public.leads;
drop policy if exists "leads_select_policy" on public.leads;
drop policy if exists "leads_update_policy" on public.leads;
drop policy if exists "leads_delete_policy" on public.leads;

drop policy if exists "Allow insert qr_scans" on public.qr_scans;
drop policy if exists "Allow select qr_scans" on public.qr_scans;
drop policy if exists "qr_scans_insert_policy" on public.qr_scans;
drop policy if exists "qr_scans_select_policy" on public.qr_scans;
drop policy if exists "qr_scans_delete_policy" on public.qr_scans;

-- ── 3-TIER RLS POLICIES ──

-- PROFILES:
-- Public & all users can view profiles (needed for /c/[slug])
create policy "profiles_select_policy"
on public.profiles for select
using (true);

-- Admins can insert any profile directly; users get profiles via trigger
create policy "profiles_insert_policy"
on public.profiles for insert
with check (public.is_admin() or auth.uid() is not null);

-- Users can update their own profile; admins can update any profile
create policy "profiles_update_policy"
on public.profiles for update
using (
  user_id = (select auth.uid()) or public.is_admin()
)
with check (
  user_id = (select auth.uid()) or public.is_admin()
);

-- Only admins/master_admin can delete profiles
create policy "profiles_delete_policy"
on public.profiles for delete
using (public.is_admin());

-- LEADS:
-- Public (anon) or anyone can submit/insert a lead via QR contact exchange
create policy "leads_insert_policy"
on public.leads for insert
with check (true);

-- Cardholders can view leads exchanged for their profile; Admins can view all leads
create policy "leads_select_policy"
on public.leads for select
using (
  public.is_admin() or
  profile_id in (
    select id from public.profiles
    where user_id = (select auth.uid())
  )
);

-- Cardholders and Admins can update their own leads
create policy "leads_update_policy"
on public.leads for update
using (
  public.is_admin() or
  profile_id in (
    select id from public.profiles
    where user_id = (select auth.uid())
  )
);

-- Only admins can delete leads
create policy "leads_delete_policy"
on public.leads for delete
using (public.is_admin());

-- QR SCANS:
-- Anyone (anon scanner) can log a scan
create policy "qr_scans_insert_policy"
on public.qr_scans for insert
with check (true);

-- Cardholders can view scans on their profile; Admins can view all
create policy "qr_scans_select_policy"
on public.qr_scans for select
using (
  public.is_admin() or
  profile_id in (
    select id from public.profiles
    where user_id = (select auth.uid())
  )
);

-- Only admins can delete scan history
create policy "qr_scans_delete_policy"
on public.qr_scans for delete
using (public.is_admin());

-- 9. Explicit Data API Table Grants
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.profiles to anon, authenticated, service_role;
grant select, insert, update, delete on table public.leads to anon, authenticated, service_role;
grant select, insert, update, delete on table public.qr_scans to anon, authenticated, service_role;

-- 10. Trigger: Automatic Profile Creation on auth.users Sign Up
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

  if new.raw_user_meta_data->>'role' = 'master_admin' then
    raw_role := 'master_admin'::user_role;
  elsif new.raw_user_meta_data->>'role' = 'admin' then
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
