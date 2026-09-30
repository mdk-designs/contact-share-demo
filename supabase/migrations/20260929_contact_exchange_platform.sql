-- ═══════════════════════════════════════════════════════════════════
-- ContactForge: Contact Exchange & Security Upgrade Migration
-- Version: 2.1.0
-- ═══════════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";

-- 1. Create contact_exchanges table
create table if not exists public.contact_exchanges (
    id uuid default gen_random_uuid() primary key,
    profile_id uuid references public.profiles(id) on delete cascade not null,
    visitor_name text not null,
    visitor_phone text not null,
    visitor_phone_e164 text,
    visitor_email text,
    visitor_company text,
    visitor_job_title text,
    notes text,
    source text default 'unknown' check (source in ('qr', 'nfc', 'direct', 'unknown')),
    qr_scan_id uuid references public.qr_scans(id) on delete set null,
    idempotency_key text unique,
    cardholder_vcard_status text default 'pending' check (cardholder_vcard_status in ('pending', 'processing', 'sent', 'delivered', 'failed', 'not_applicable')),
    visitor_vcard_status text default 'pending' check (visitor_vcard_status in ('pending', 'processing', 'sent', 'delivered', 'failed', 'not_applicable')),
    email_status text default 'not_applicable' check (email_status in ('not_applicable', 'pending', 'sent', 'failed')),
    cardholder_telegram_status text default 'not_applicable' check (cardholder_telegram_status in ('not_applicable', 'pending', 'sent', 'failed')),
    visitor_telegram_status text default 'not_applicable' check (visitor_telegram_status in ('not_applicable', 'pending', 'sent', 'failed')),
    whatsapp_clicked_at timestamptz,
    telegram_recipient_connected_at timestamptz,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2. Create telegram_link_tokens table
create table if not exists public.telegram_link_tokens (
    id uuid default gen_random_uuid() primary key,
    exchange_id uuid references public.contact_exchanges(id) on delete cascade not null,
    token_hash text unique not null,
    expires_at timestamptz not null,
    consumed_at timestamptz,
    telegram_chat_id text,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 3. Enhance qr_scans table with source column
alter table public.qr_scans add column if not exists source text default 'qr' check (source in ('qr', 'nfc', 'direct', 'unknown'));

-- 4. Auto-update updated_at trigger for contact_exchanges
drop trigger if exists contact_exchanges_updated_at on public.contact_exchanges;
create trigger contact_exchanges_updated_at
  before update on public.contact_exchanges
  for each row execute function public.update_updated_at();

-- 5. Safe Data Backfill: Backfill from leads table to contact_exchanges
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'leads') then
    insert into public.contact_exchanges (
      id,
      profile_id,
      visitor_name,
      visitor_phone,
      visitor_email,
      visitor_company,
      visitor_job_title,
      notes,
      source,
      email_status,
      created_at
    )
    select
      l.id,
      coalesce(l.profile_id, (select id from public.profiles limit 1)),
      coalesce(l.visitor_name, l.name, 'Unknown Contact'),
      coalesce(l.visitor_phone, l.phone, 'Unknown Phone'),
      coalesce(l.visitor_email, l.email),
      coalesce(l.visitor_company, l.organization),
      l.visitor_job_title,
      l.notes,
      'direct',
      case when l.vcard_emailed then 'sent' else 'not_applicable' end,
      l.created_at
    from public.leads l
    where l.id not in (select id from public.contact_exchanges)
      and (l.profile_id is not null or exists (select 1 from public.profiles));
  end if;
exception when others then
  raise notice 'Leads backfill skipped or partial: %', sqlerrm;
end $$;

-- 6. Indexes for Performance and Integrity
create index if not exists idx_contact_exchanges_profile_id on public.contact_exchanges(profile_id);
create index if not exists idx_contact_exchanges_created_at on public.contact_exchanges(created_at desc);
create index if not exists idx_contact_exchanges_source on public.contact_exchanges(source);
create index if not exists idx_contact_exchanges_visitor_email on public.contact_exchanges(visitor_email);
create index if not exists idx_contact_exchanges_idempotency on public.contact_exchanges(idempotency_key);

create index if not exists idx_telegram_tokens_token_hash on public.telegram_link_tokens(token_hash);
create index if not exists idx_telegram_tokens_exchange_id on public.telegram_link_tokens(exchange_id);
create index if not exists idx_telegram_tokens_expires_at on public.telegram_link_tokens(expires_at);

-- 7. Row Level Security Configuration
alter table public.contact_exchanges enable row level security;
alter table public.telegram_link_tokens enable row level security;

-- Drop legacy/existing policies if any
drop policy if exists "contact_exchanges_insert_policy" on public.contact_exchanges;
drop policy if exists "contact_exchanges_select_policy" on public.contact_exchanges;
drop policy if exists "contact_exchanges_update_policy" on public.contact_exchanges;
drop policy if exists "contact_exchanges_delete_policy" on public.contact_exchanges;

drop policy if exists "telegram_tokens_insert_policy" on public.telegram_link_tokens;
drop policy if exists "telegram_tokens_select_policy" on public.telegram_link_tokens;
drop policy if exists "telegram_tokens_update_policy" on public.telegram_link_tokens;

-- Contact Exchanges RLS:
-- 1. Anyone (public visitor) can insert a new exchange
create policy "contact_exchanges_insert_policy"
on public.contact_exchanges for insert
with check (true);

-- 2. Cardholders can view exchanges for their own profile; Admins / Super Admins can view all
create policy "contact_exchanges_select_policy"
on public.contact_exchanges for select
using (
  public.is_admin() or
  profile_id in (
    select id from public.profiles
    where user_id = (select auth.uid())
  )
);

-- 3. Cardholders and Admins can update exchanges (e.g. status updates, notes)
create policy "contact_exchanges_update_policy"
on public.contact_exchanges for update
using (
  public.is_admin() or
  profile_id in (
    select id from public.profiles
    where user_id = (select auth.uid())
  )
);

-- 4. Only Admins / Super Admins can delete contact exchanges
create policy "contact_exchanges_delete_policy"
on public.contact_exchanges for delete
using (public.is_admin());

-- Telegram Link Tokens RLS:
-- Public insert via exchange API, select/update via service role or controlled token verification
create policy "telegram_tokens_insert_policy"
on public.telegram_link_tokens for insert
with check (true);

create policy "telegram_tokens_select_policy"
on public.telegram_link_tokens for select
using (true);

create policy "telegram_tokens_update_policy"
on public.telegram_link_tokens for update
using (true);

-- 8. Explicit Data API Table Grants
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.contact_exchanges to anon, authenticated, service_role;
grant select, insert, update, delete on table public.telegram_link_tokens to anon, authenticated, service_role;
