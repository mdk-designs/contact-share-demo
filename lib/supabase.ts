import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

/**
 * Lazy Supabase client — only created when first used, and only if
 * environment variables are present.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (_client) return _client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return null
  }

  _client = createClient(url, key)
  return _client
}

/**
 * Checks if local file-based fallback storage is allowed.
 * Per specification: In production, default is false to avoid divergent states.
 */
export function isLocalFallbackAllowed(): boolean {
  if (process.env.LOCAL_FALLBACK_ENABLED !== undefined) {
    return process.env.LOCAL_FALLBACK_ENABLED === 'true'
  }
  return process.env.NODE_ENV !== 'production'
}

export interface Profile {
  id: string
  user_id?: string
  slug: string
  role: 'master_admin' | 'admin' | 'member'
  first_name: string
  last_name: string
  telegram_chat_id?: string
  headline?: string
  job_title?: string
  company_name?: string
  department?: string
  work_email: string
  work_phone?: string
  mobile_phone?: string
  website_url?: string
  address?: string
  bio?: string
  avatar_url?: string
  cover_image_url?: string
  social_links?: {
    linkedin?: string
    twitter?: string
    github?: string
    instagram?: string
    [key: string]: string | undefined
  }
  card_theme?: {
    primaryColor?: string
    accentColor?: string
    template?: string
  }
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export type ExchangeSource = 'qr' | 'nfc' | 'direct' | 'unknown'
export type DeliveryStatus = 'pending' | 'processing' | 'sent' | 'delivered' | 'failed' | 'not_applicable'

export interface ContactExchange {
  id: string
  profile_id: string
  visitor_name: string
  visitor_phone: string
  visitor_phone_e164?: string
  visitor_email?: string
  visitor_company?: string
  visitor_job_title?: string
  notes?: string
  source: ExchangeSource
  qr_scan_id?: string
  idempotency_key?: string
  cardholder_vcard_status: DeliveryStatus
  visitor_vcard_status: DeliveryStatus
  email_status: DeliveryStatus
  cardholder_telegram_status: DeliveryStatus
  visitor_telegram_status: DeliveryStatus
  whatsapp_clicked_at?: string
  telegram_recipient_connected_at?: string
  created_at: string
  updated_at: string
  profile?: Profile
}

export interface TelegramLinkToken {
  id: string
  exchange_id: string
  token_hash: string
  expires_at: string
  consumed_at?: string
  telegram_chat_id?: string
  created_at: string
}

// Backward compatibility alias for legacy code
export interface Lead {
  id?: string
  profile_id?: string
  name: string
  phone: string
  email?: string
  organization?: string
  visitor_name?: string
  visitor_email?: string
  visitor_phone?: string
  visitor_company?: string
  visitor_job_title?: string
  notes?: string
  vcard_emailed?: boolean
  vcard_emailed_at?: string
  created_at?: string
}

/**
 * Creates or retrieves a ContactExchange with idempotency protection.
 */
export async function createContactExchange(
  exchange: Partial<ContactExchange>
): Promise<{ data: ContactExchange | null; error: Error | null; isDuplicate?: boolean }> {
  const client = getSupabaseClient()

  // 1. If idempotency key provided, check database first
  if (exchange.idempotency_key && client) {
    try {
      const { data: existing } = await client
        .from('contact_exchanges')
        .select('*')
        .eq('idempotency_key', exchange.idempotency_key)
        .maybeSingle()

      if (existing) {
        return { data: existing as ContactExchange, error: null, isDuplicate: true }
      }
    } catch {
      // Continue to insertion
    }
  }

  const exchangeId = exchange.id || crypto.randomUUID()
  const now = new Date().toISOString()

  const fullExchange: ContactExchange = {
    id: exchangeId,
    profile_id: exchange.profile_id || '',
    visitor_name: (exchange.visitor_name || '').trim(),
    visitor_phone: (exchange.visitor_phone || '').trim(),
    visitor_phone_e164: exchange.visitor_phone_e164,
    visitor_email: exchange.visitor_email?.trim() || undefined,
    visitor_company: exchange.visitor_company?.trim() || undefined,
    visitor_job_title: exchange.visitor_job_title?.trim() || undefined,
    notes: exchange.notes?.trim() || undefined,
    source: exchange.source || 'unknown',
    qr_scan_id: exchange.qr_scan_id,
    idempotency_key: exchange.idempotency_key,
    cardholder_vcard_status: exchange.cardholder_vcard_status || 'pending',
    visitor_vcard_status: exchange.visitor_vcard_status || 'pending',
    email_status: exchange.email_status || 'not_applicable',
    cardholder_telegram_status: exchange.cardholder_telegram_status || 'not_applicable',
    visitor_telegram_status: exchange.visitor_telegram_status || 'not_applicable',
    created_at: now,
    updated_at: now,
  }

  // 1. Execute atomic RPC function in Supabase if connected
  if (client && fullExchange.profile_id) {
    try {
      const { data, error } = await client.rpc('submit_contact_exchange', {
        p_profile_id: fullExchange.profile_id,
        p_visitor_name: fullExchange.visitor_name,
        p_visitor_phone: fullExchange.visitor_phone,
        p_visitor_phone_e164: fullExchange.visitor_phone_e164 || null,
        p_visitor_email: fullExchange.visitor_email || null,
        p_visitor_company: fullExchange.visitor_company || null,
        p_visitor_job_title: fullExchange.visitor_job_title || null,
        p_notes: fullExchange.notes || null,
        p_source: fullExchange.source || 'unknown',
        p_qr_scan_id: fullExchange.qr_scan_id || null,
        p_idempotency_key: fullExchange.idempotency_key || null,
      })

      if (!error && data && data.exchange) {
        if (isLocalFallbackAllowed()) {
          try {
            if (typeof window === 'undefined') {
              const { saveLocalExchange } = require('@/lib/exchangesStore')
              saveLocalExchange(data.exchange as ContactExchange)
            }
          } catch {}
        }
        return {
          data: data.exchange as ContactExchange,
          error: null,
          isDuplicate: Boolean(data.is_duplicate),
        }
      }
      console.warn('[Supabase] submit_contact_exchange rpc notice:', error)
    } catch (err: any) {
      console.warn('[Supabase] submit_contact_exchange exception:', err)
    }
  }

  // 2. Fallback to local store if allowed
  if (isLocalFallbackAllowed()) {
    try {
      if (typeof window === 'undefined') {
        const { saveLocalExchange, getLocalExchanges } = require('@/lib/exchangesStore')
        if (fullExchange.idempotency_key) {
          const list = getLocalExchanges()
          const existing = list.find((e: ContactExchange) => e.idempotency_key === fullExchange.idempotency_key)
          if (existing) {
            return { data: existing, error: null, isDuplicate: true }
          }
        }
        const saved = saveLocalExchange(fullExchange)
        return { data: saved, error: null }
      } else {
        const res = await fetch('/api/exchanges', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ exchange: fullExchange }),
        })
        if (res.ok) {
          const saved = await res.json()
          return { data: saved, error: null }
        }
      }
    } catch (err: any) {
      console.warn('[Store] Local fallback exchange save error:', err)
    }
  }

  return { data: fullExchange, error: null }
}

/**
 * Fetch contact exchanges (optionally filtered by profileId).
 */
export async function getContactExchanges(profileId?: string): Promise<ContactExchange[]> {
  const client = getSupabaseClient()
  let dbExchanges: ContactExchange[] = []

  if (client) {
    try {
      let query = client
        .from('contact_exchanges')
        .select('*, profile:profiles(*)')
        .order('created_at', { ascending: false })

      if (profileId) {
        query = query.eq('profile_id', profileId)
      }

      const { data, error } = await query
      if (!error && data) {
        dbExchanges = data as ContactExchange[]
      }
    } catch (err) {
      console.warn('[Supabase] getContactExchanges failed:', err)
    }
  }

  // If local fallback is allowed, merge local records
  if (isLocalFallbackAllowed()) {
    try {
      let localExchanges: ContactExchange[] = []
      if (typeof window === 'undefined') {
        const { getLocalExchanges } = require('@/lib/exchangesStore')
        localExchanges = getLocalExchanges(profileId)
      } else {
        const url = profileId ? `/api/exchanges?profile_id=${encodeURIComponent(profileId)}` : '/api/exchanges'
        const res = await fetch(url)
        if (res.ok) {
          localExchanges = await res.json()
        }
      }

      const map = new Map<string, ContactExchange>()
      localExchanges.forEach((e) => e.id && map.set(e.id, e))
      dbExchanges.forEach((e) => e.id && map.set(e.id, e))

      return Array.from(map.values()).sort((a, b) => {
        const da = a.created_at ? new Date(a.created_at).getTime() : 0
        const db = b.created_at ? new Date(b.created_at).getTime() : 0
        return db - da
      })
    } catch (err) {
      console.warn('[Store] Local fallback getContactExchanges error:', err)
    }
  }

  return dbExchanges
}

/**
 * Update an existing contact exchange (status updates, notes, etc.).
 */
export async function updateContactExchange(
  id: string,
  updates: Partial<ContactExchange>
): Promise<{ data: ContactExchange | null; error: Error | null }> {
  const client = getSupabaseClient()

  if (client) {
    try {
      const { data, error } = await client
        .from('contact_exchanges')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .maybeSingle()

      if (!error && data) {
        if (isLocalFallbackAllowed() && typeof window === 'undefined') {
          try {
            const { updateLocalExchange } = require('@/lib/exchangesStore')
            updateLocalExchange(id, updates)
          } catch {}
        }
        return { data: data as ContactExchange, error: null }
      }
    } catch (err: any) {
      console.warn('[Supabase] updateContactExchange failed:', err)
    }
  }

  if (isLocalFallbackAllowed() && typeof window === 'undefined') {
    try {
      const { updateLocalExchange } = require('@/lib/exchangesStore')
      const updated = updateLocalExchange(id, updates)
      return { data: updated, error: null }
    } catch {}
  }

  return { data: null, error: new Error('Failed to update exchange') }
}

/**
 * Delete a contact exchange by ID.
 */
export async function deleteContactExchange(id: string): Promise<{ success: boolean; error: Error | null }> {
  const client = getSupabaseClient()
  if (client) {
    try {
      await client.from('contact_exchanges').delete().eq('id', id)
    } catch {}
  }

  if (isLocalFallbackAllowed() && typeof window === 'undefined') {
    try {
      const { deleteLocalExchange } = require('@/lib/exchangesStore')
      deleteLocalExchange(id)
    } catch {}
  }

  return { success: true, error: null }
}

/**
 * Record WhatsApp CTA click event.
 */
export async function recordWhatsAppClick(exchangeId: string): Promise<boolean> {
  const now = new Date().toISOString()
  const { data } = await updateContactExchange(exchangeId, { whatsapp_clicked_at: now })
  return Boolean(data)
}

/**
 * Creates a cryptographically random, short-lived token for Telegram linking.
 */
export async function createTelegramLinkToken(exchangeId: string): Promise<{ token: string; expiresAt: string }> {
  const token = crypto.randomUUID().replace(/-/g, '')
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours expiry
  const client = getSupabaseClient()

  if (client) {
    try {
      await client.from('telegram_link_tokens').insert([
        {
          exchange_id: exchangeId,
          token_hash: token,
          expires_at: expiresAt,
        },
      ])
    } catch (err) {
      console.warn('[Telegram Token] DB insert warning:', err)
    }
  }

  return { token, expiresAt }
}

/**
 * Backward-compatible wrapper for insertLead -> maps to createContactExchange.
 */
export async function insertLead(lead: Lead): Promise<{ data?: Lead | null; error: Error | null }> {
  const res = await createContactExchange({
    profile_id: lead.profile_id,
    visitor_name: lead.visitor_name || lead.name,
    visitor_phone: lead.visitor_phone || lead.phone,
    visitor_email: lead.visitor_email || lead.email,
    visitor_company: lead.visitor_company || lead.organization,
    visitor_job_title: lead.visitor_job_title,
    notes: lead.notes,
    source: 'direct',
  })

  if (res.data) {
    return {
      data: {
        id: res.data.id,
        profile_id: res.data.profile_id,
        name: res.data.visitor_name,
        phone: res.data.visitor_phone,
        email: res.data.visitor_email,
        organization: res.data.visitor_company,
        visitor_name: res.data.visitor_name,
        visitor_phone: res.data.visitor_phone,
        visitor_email: res.data.visitor_email,
        visitor_company: res.data.visitor_company,
        visitor_job_title: res.data.visitor_job_title,
        notes: res.data.notes,
        created_at: res.data.created_at,
      },
      error: res.error,
    }
  }

  return { data: lead, error: res.error }
}

/**
 * Backward-compatible wrapper for getLeads.
 */
export async function getLeads(profileId?: string): Promise<Lead[]> {
  const exchanges = await getContactExchanges(profileId)
  return exchanges.map((e) => ({
    id: e.id,
    profile_id: e.profile_id,
    name: e.visitor_name,
    phone: e.visitor_phone,
    email: e.visitor_email,
    organization: e.visitor_company,
    visitor_name: e.visitor_name,
    visitor_phone: e.visitor_phone,
    visitor_email: e.visitor_email,
    visitor_company: e.visitor_company,
    visitor_job_title: e.visitor_job_title,
    notes: e.notes,
    created_at: e.created_at,
  }))
}

export async function deleteLead(id: string): Promise<{ success: boolean; error: Error | null }> {
  return deleteContactExchange(id)
}

/**
 * Fetch a profile by vanity slug.
 */
export async function getProfileBySlug(slug: string): Promise<Profile | null> {
  const cleanSlug = slug.toLowerCase().trim()
  const client = getSupabaseClient()

  if (client) {
    try {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('slug', cleanSlug)
        .eq('is_active', true)
        .maybeSingle()

      if (!error && data) {
        return data as Profile
      }
    } catch (err) {
      console.warn('[Supabase] Profile lookup failed:', err)
    }
  }

  if (isLocalFallbackAllowed()) {
    try {
      if (typeof window === 'undefined') {
        const { getLocalProfileBySlug } = require('@/lib/profilesStore')
        const local = getLocalProfileBySlug(cleanSlug)
        if (local) return local
      } else {
        const res = await fetch(`/api/profiles?slug=${encodeURIComponent(cleanSlug)}`)
        if (res.ok) {
          const local = await res.json()
          if (local && !local.error) return local
        }
      }
    } catch {}
  }

  return null
}

/**
 * Fetch all profiles (for Admin & directory).
 */
export async function getAllProfiles(): Promise<Profile[]> {
  const client = getSupabaseClient()
  let dbProfiles: Profile[] = []

  if (client) {
    try {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data && data.length > 0) {
        dbProfiles = data as Profile[]
      }
    } catch (err) {
      console.warn('[Supabase] Fetch profiles failed:', err)
    }
  }

  if (isLocalFallbackAllowed()) {
    try {
      let localProfiles: Profile[] = []
      if (typeof window === 'undefined') {
        const { getLocalProfiles } = require('@/lib/profilesStore')
        localProfiles = getLocalProfiles()
      } else {
        const res = await fetch('/api/profiles')
        if (res.ok) {
          localProfiles = await res.json()
        }
      }

      const map = new Map<string, Profile>()
      localProfiles.forEach((p) => map.set(p.slug.toLowerCase().trim(), p))
      dbProfiles.forEach((p) => map.set(p.slug.toLowerCase().trim(), p))

      return Array.from(map.values())
    } catch {}
  }

  return dbProfiles
}

/**
 * Fetch a profile by ID or vanity slug.
 */
export async function getProfileById(id: string): Promise<Profile | null> {
  const client = getSupabaseClient()

  if (id === 'demo-deepak' || id === 'deepak-kumar' || id === 'demo-profile-deepak') {
    return resolveProfileWithFallback('deepak-kumar')
  }

  if (!client) {
    return resolveProfileWithFallback(id)
  }

  try {
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .or(`id.eq.${id},slug.eq.${id.toLowerCase()}`)
      .maybeSingle()

    if (error) {
      return resolveProfileWithFallback(id)
    }

    return (data as Profile | null) || resolveProfileWithFallback(id)
  } catch {
    return resolveProfileWithFallback(id)
  }
}

/**
 * Update an existing profile (PUT / PATCH).
 */
export async function updateProfile(
  id: string,
  updates: Partial<Profile>
): Promise<{ data: Profile | null; error: Error | null }> {
  if (isLocalFallbackAllowed()) {
    if (typeof window === 'undefined') {
      try {
        const { updateLocalProfile } = require('@/lib/profilesStore')
        updateLocalProfile(id, updates)
      } catch {}
    } else {
      try {
        await fetch('/api/profiles', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, updates }),
        })
      } catch {}
    }
  }

  const client = getSupabaseClient()
  if (!client) {
    return { data: { id, ...updates } as Profile, error: null }
  }

  try {
    const { data, error } = await client
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .or(`id.eq.${id},slug.eq.${id.toLowerCase()}`)
      .select()
      .maybeSingle()

    return { data: (data as Profile) || ({ id, ...updates } as Profile), error: error as Error | null }
  } catch (err: any) {
    return { data: { id, ...updates } as Profile, error: null }
  }
}

/**
 * Delete a profile by ID or vanity slug.
 */
export async function deleteProfile(idOrSlug: string): Promise<{ success: boolean; error: Error | null }> {
  if (isLocalFallbackAllowed()) {
    if (typeof window === 'undefined') {
      try {
        const { deleteLocalProfile } = require('@/lib/profilesStore')
        deleteLocalProfile(idOrSlug)
      } catch {}
    } else {
      try {
        await fetch(`/api/profiles?id=${encodeURIComponent(idOrSlug)}`, {
          method: 'DELETE',
        })
      } catch {}
    }
  }

  const client = getSupabaseClient()
  if (client) {
    try {
      await client
        .from('profiles')
        .delete()
        .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug.toLowerCase()}`)
    } catch {}
  }

  return { success: true, error: null }
}

/**
 * Create a new team member profile.
 */
export async function createProfile(
  profile: Partial<Profile>
): Promise<{ data: Profile | null; error: Error | null }> {
  const newProfile: Profile = {
    id: profile.id || crypto.randomUUID(),
    slug: profile.slug || 'new-card',
    role: profile.role || 'member',
    first_name: profile.first_name || '',
    last_name: profile.last_name || '',
    job_title: profile.job_title,
    company_name: profile.company_name,
    department: profile.department,
    work_email: profile.work_email || '',
    work_phone: profile.work_phone,
    mobile_phone: profile.mobile_phone,
    website_url: profile.website_url,
    address: profile.address,
    bio: profile.bio,
    avatar_url: profile.avatar_url,
    social_links: profile.social_links || {},
    card_theme: profile.card_theme || {
      primaryColor: '#6366F1',
      accentColor: '#A855F7',
      template: 'modern',
    },
    is_active: profile.is_active ?? true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const client = getSupabaseClient()
  if (client) {
    try {
      const { data, error } = await client
        .from('profiles')
        .insert([newProfile])
        .select()
        .single()

      if (!error && data) {
        return { data: data as Profile, error: null }
      }
    } catch (err: any) {
      console.warn('[createProfile] Supabase insert warning:', err)
    }
  }

  if (isLocalFallbackAllowed()) {
    if (typeof window === 'undefined') {
      try {
        const { saveLocalProfile } = require('@/lib/profilesStore')
        saveLocalProfile(newProfile)
      } catch {}
    } else {
      try {
        const res = await fetch('/api/profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile: newProfile }),
        })
        if (res.ok) {
          const saved = await res.json()
          return { data: saved, error: null }
        }
      } catch {}
    }
  }

  return { data: newProfile, error: null }
}

/**
 * Get total QR scans count from qr_scans table.
 */
export async function getScanStats(): Promise<{ totalScans: number }> {
  const client = getSupabaseClient()
  if (!client) return { totalScans: 0 }

  try {
    const { count, error } = await client
      .from('qr_scans')
      .select('*', { count: 'exact', head: true })

    if (error) return { totalScans: 0 }
    return { totalScans: count || 0 }
  } catch {
    return { totalScans: 0 }
  }
}

/**
 * Log a QR or NFC scan event.
 */
export async function logQrScan(
  profileId: string,
  userAgent?: string,
  ipAddress?: string,
  source: ExchangeSource = 'qr'
): Promise<string | null> {
  const client = getSupabaseClient()
  if (!client) return null

  try {
    const scanId = crypto.randomUUID()
    const { data } = await client.from('qr_scans').insert([
      {
        id: scanId,
        profile_id: profileId,
        user_agent: userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : null),
        ip_address: ipAddress || null,
        source: source || 'qr',
      },
    ]).select('id').maybeSingle()

    return data?.id || scanId
  } catch {
    return null
  }
}

/**
 * Resolve profile by slug with automatic fallback for showcase/demo cards.
 */
export async function resolveProfileWithFallback(slug: string): Promise<Profile | null> {
  const cleanSlug = decodeURIComponent(slug).toLowerCase().trim()

  const dbProfile = await getProfileBySlug(cleanSlug)
  if (dbProfile) return dbProfile

  if (isLocalFallbackAllowed() && typeof window === 'undefined') {
    try {
      const { getLocalProfileBySlug } = require('@/lib/profilesStore')
      const local = getLocalProfileBySlug(cleanSlug)
      if (local) return local
    } catch {}
  }

  if (cleanSlug === 'deepak-kumar' || cleanSlug === 'demo') {
    return {
      id: 'd0000000-0000-0000-0000-000000000001',
      slug: cleanSlug,
      role: 'master_admin',
      first_name: 'Deepak',
      last_name: 'Kumar',
      job_title: 'UI/UX Engineer & Lead Architect',
      company_name: 'DesignForge Studio',
      department: 'Product & Design Systems',
      work_email: 'deepak@designforge.studio',
      work_phone: '+919876543210',
      mobile_phone: '+919876543210',
      website_url: 'https://deepak.design',
      address: 'Bengaluru, India',
      bio: 'UI/UX Engineer & Product Designer at DesignForge Studio. Crafting tactile digital products and design systems.',
      is_active: true,
      social_links: {
        linkedin: 'https://linkedin.com/in/deepakkumar',
        github: 'https://github.com/deepakkumar',
        twitter: 'https://twitter.com/deepakkdesign',
      },
      card_theme: {
        primaryColor: '#6366F1',
        accentColor: '#A855F7',
        template: 'modern',
      },
    }
  }

  return null
}
