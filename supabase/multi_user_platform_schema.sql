-- ═══════════════════════════════════════════════════════════════════
--  Multi-User Contact Sharing Platform: DDL & RLS Migration
--  Run in: Supabase Dashboard → SQL Editor → New query → Paste → Run
-- ═══════════════════════════════════════════════════════════════════

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. User Roles Enum (idempotent)
do $$ begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('admin', 'member');
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
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_profiles_slug on public.profiles(slug);
create index if not exists idx_profiles_role on public.profiles(role);

-- 4. Leads / Exchanged Contacts Table
-- If public.leads already exists from the single-user POC, add multi-user columns safely
do $$ begin
  if not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'leads') then
    create table public.leads (
        id uuid default gen_random_uuid() primary key,
        profile_id uuid references public.profiles(id) on delete cascade,
        visitor_name text not null,
        visitor_email text not null,
        visitor_phone text,
        visitor_company text,
        visitor_job_title text,
        notes text,
        vcard_emailed boolean default false not null,
        vcard_emailed_at timestamp with time zone,
        created_at timestamp with time zone default timezone('utc'::text, now()) not null
    );
  else
    -- Alter existing table to add multi-user columns if not present
    alter table public.leads add column if not exists profile_id uuid references public.profiles(id) on delete cascade;
    alter table public.leads add column if not exists visitor_name text;
    alter table public.leads add column if not exists visitor_email text;
    alter table public.leads add column if not exists visitor_phone text;
    alter table public.leads add column if not exists visitor_company text;
    alter table public.leads add column if not exists visitor_job_title text;
    alter table public.leads add column if not exists notes text;
    alter table public.leads add column if not exists vcard_emailed boolean default false;
    alter table public.leads add column if not exists vcard_emailed_at timestamp with time zone;
    -- Backfill visitor_name/email/phone from legacy name/email/phone if present
    update public.leads set visitor_name = name where visitor_name is null and name is not null;
    update public.leads set visitor_email = email where visitor_email is null and email is not null;
    update public.leads set visitor_phone = phone where visitor_phone is null and phone is not null;
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

-- 6. Row Level Security (RLS) Configuration
alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.qr_scans enable row level security;

-- Drop old policies to avoid collision
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Admins have full access to profiles" on public.profiles;
drop policy if exists "Allow select profiles" on public.profiles;
drop policy if exists "Allow insert profiles" on public.profiles;
drop policy if exists "Allow update profiles" on public.profiles;
drop policy if exists "Allow delete profiles" on public.profiles;

drop policy if exists "Anyone can submit a lead" on public.leads;
drop policy if exists "Users can view their own leads" on public.leads;
drop policy if exists "Admins can view all leads" on public.leads;
drop policy if exists "anon_can_insert_leads" on public.leads;
drop policy if exists "auth_can_read_leads" on public.leads;
drop policy if exists "Allow anon insert leads" on public.leads;
drop policy if exists "Allow select leads" on public.leads;
drop policy if exists "Allow update leads" on public.leads;

drop policy if exists "Anyone can log a scan" on public.qr_scans;
drop policy if exists "Users and Admins can view scans" on public.qr_scans;
drop policy if exists "Allow insert qr_scans" on public.qr_scans;
drop policy if exists "Allow select qr_scans" on public.qr_scans;

-- Profiles Policies
create policy "Allow select profiles"
on public.profiles for select
using (true);

create policy "Allow insert profiles"
on public.profiles for insert
with check (true);

create policy "Allow update profiles"
on public.profiles for update
using (true);

create policy "Allow delete profiles"
on public.profiles for delete
using (true);

-- Leads Policies
create policy "Allow anon insert leads"
on public.leads for insert
with check (true);

create policy "Allow select leads"
on public.leads for select
using (true);

create policy "Allow update leads"
on public.leads for update
using (true);

-- QR Scan Analytics Policies
create policy "Allow insert qr_scans"
on public.qr_scans for insert
with check (true);

create policy "Allow select qr_scans"
on public.qr_scans for select
using (true);

-- 7. Explicit Data API Table Grants (Required after Oct 30 / for new projects)
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on table public.profiles to anon, authenticated, service_role;
grant select, insert, update, delete on table public.leads to anon, authenticated, service_role;
grant select, insert, update, delete on table public.qr_scans to anon, authenticated, service_role;

-- 8. Seed Default Showcase Profile (Deepak Kumar)
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
