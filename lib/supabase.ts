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

export interface Profile {
  id: string
  slug: string
  role: 'admin' | 'member'
  first_name: string
  last_name: string
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
 * Insert a visitor lead into Supabase (with resilient local backup).
 */
export async function insertLead(lead: Lead): Promise<{ data?: Lead | null; error: Error | null }> {
  // Always persist to local store first so leads are never lost
  let savedLocal: Lead | null = null
  try {
    if (typeof window === 'undefined') {
      const { saveLocalLead } = require('@/lib/leadsStore')
      savedLocal = saveLocalLead(lead)
    } else {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead }),
      })
      if (res.ok) {
        savedLocal = await res.json()
      }
    }
  } catch (err) {
    console.warn('[insertLead] Local store backup error:', err)
  }

  const client = getSupabaseClient()
  if (!client) {
    return { data: savedLocal || lead, error: null }
  }

  const payload: Record<string, unknown> = {
    name: lead.name || lead.visitor_name,
    phone: lead.phone || lead.visitor_phone,
    email: lead.email || lead.visitor_email || null,
    organization: lead.organization || lead.visitor_company || null,
    visitor_name: lead.visitor_name || lead.name,
    visitor_email: lead.visitor_email || lead.email || null,
    visitor_phone: lead.visitor_phone || lead.phone || null,
    visitor_company: lead.visitor_company || lead.organization || null,
    visitor_job_title: lead.visitor_job_title || null,
    notes: lead.notes || null,
  }

  if (lead.profile_id) {
    payload.profile_id = lead.profile_id
  }

  try {
    const { data, error } = await client.from('leads').insert([payload]).select().single()
    if (!error && data) {
      return { data: data as Lead, error: null }
    }
  } catch {
    // Fall back to saved local
  }

  return { data: savedLocal || lead, error: null }
}

/**
 * Fetch a profile by its vanity slug.
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

  // Fallback to local persistent store
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
  } catch (err) {
    console.warn('[Store] Local profile lookup fallback:', err)
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

  // Fetch local persistent profiles and merge
  let localProfiles: Profile[] = []
  try {
    if (typeof window === 'undefined') {
      const { getLocalProfiles } = require('@/lib/profilesStore')
      localProfiles = getLocalProfiles()
    } else {
      const res = await fetch('/api/profiles')
      if (res.ok) {
        localProfiles = await res.json()
      }
    }
  } catch (err) {
    console.warn('[Store] Local profiles list fallback:', err)
  }

  const map = new Map<string, Profile>()
  localProfiles.forEach((p) => map.set(p.slug.toLowerCase().trim(), p))
  dbProfiles.forEach((p) => map.set(p.slug.toLowerCase().trim(), p))

  return Array.from(map.values())
}

/**
 * Fetch leads (optionally filtered by profile_id).
 */
export async function getLeads(profileId?: string): Promise<Lead[]> {
  const client = getSupabaseClient()
  let dbLeads: Lead[] = []

  if (client) {
    try {
      let query = client.from('leads').select('*').order('created_at', { ascending: false })
      if (profileId) {
        query = query.eq('profile_id', profileId)
      }

      const { data, error } = await query
      if (!error && data) {
        dbLeads = data as Lead[]
      }
    } catch (err) {
      console.warn('[Supabase] getLeads failed:', err)
    }
  }

  // Fetch local leads and merge
  let localLeads: Lead[] = []
  try {
    if (typeof window === 'undefined') {
      const { getLocalLeads } = require('@/lib/leadsStore')
      localLeads = getLocalLeads(profileId)
    } else {
      const url = profileId ? `/api/leads?profile_id=${encodeURIComponent(profileId)}` : '/api/leads'
      const res = await fetch(url)
      if (res.ok) {
        localLeads = await res.json()
      }
    }
  } catch (err) {
    console.warn('[Store] Local leads list fallback:', err)
  }

  const map = new Map<string, Lead>()
  localLeads.forEach((l) => l.id && map.set(l.id, l))
  dbLeads.forEach((l) => l.id && map.set(l.id, l))

  return Array.from(map.values()).sort((a, b) => {
    const da = a.created_at ? new Date(a.created_at).getTime() : 0
    const db = b.created_at ? new Date(b.created_at).getTime() : 0
    return db - da
  })
}

/**
 * Delete a lead record by ID.
 */
export async function deleteLead(id: string): Promise<{ success: boolean; error: Error | null }> {
  try {
    if (typeof window === 'undefined') {
      const { deleteLocalLead } = require('@/lib/leadsStore')
      deleteLocalLead(id)
    } else {
      await fetch(`/api/leads?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    }
  } catch {
    // Non-blocking
  }

  const client = getSupabaseClient()
  if (client) {
    try {
      await client.from('leads').delete().eq('id', id)
    } catch {
      // Non-blocking
    }
  }

  return { success: true, error: null }
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
      console.warn('[Supabase] getProfileById error:', error.message)
      return resolveProfileWithFallback(id)
    }

    return (data as Profile | null) || resolveProfileWithFallback(id)
  } catch (err) {
    console.warn('[Supabase] getProfileById failed:', err)
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
  // Update local store first
  if (typeof window === 'undefined') {
    try {
      const { updateLocalProfile } = require('@/lib/profilesStore')
      updateLocalProfile(id, updates)
    } catch {
      // Ignore
    }
  } else {
    try {
      await fetch('/api/profiles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates }),
      })
    } catch {
      // Ignore
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
  if (typeof window === 'undefined') {
    try {
      const { deleteLocalProfile } = require('@/lib/profilesStore')
      deleteLocalProfile(idOrSlug)
    } catch {
      // Ignore
    }
  } else {
    try {
      await fetch(`/api/profiles?id=${encodeURIComponent(idOrSlug)}`, {
        method: 'DELETE',
      })
    } catch {
      // Ignore
    }
  }

  const client = getSupabaseClient()
  if (client) {
    try {
      await client
        .from('profiles')
        .delete()
        .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug.toLowerCase()}`)
    } catch {
      // Ignore
    }
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

  // 1. Save to local persistent store / API
  if (typeof window === 'undefined') {
    try {
      const { saveLocalProfile } = require('@/lib/profilesStore')
      saveLocalProfile(newProfile)
    } catch (err) {
      console.warn('[createProfile] Server store save error:', err)
    }
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
    } catch (err) {
      console.warn('[createProfile] API save error:', err)
    }
  }

  // 2. Also save to Supabase if connected
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
 * Log a QR code scan event.
 */
export async function logQrScan(profileId: string, userAgent?: string, ipAddress?: string): Promise<void> {
  const client = getSupabaseClient()
  if (!client) return

  try {
    await client.from('qr_scans').insert([
      {
        profile_id: profileId,
        user_agent: userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : null),
        ip_address: ipAddress || null,
      },
    ])
  } catch {
    // Non-blocking telemetry
  }
}

/**
 * Resolve profile by slug with automatic fallback for showcase/demo cards.
 */
export async function resolveProfileWithFallback(slug: string): Promise<Profile | null> {
  const cleanSlug = decodeURIComponent(slug).toLowerCase().trim()
  
  // 1. Check Supabase database & local persistent store
  const dbProfile = await getProfileBySlug(cleanSlug)
  if (dbProfile) return dbProfile

  // 2. Direct server-side check in local store
  if (typeof window === 'undefined') {
    try {
      const { getLocalProfileBySlug } = require('@/lib/profilesStore')
      const local = getLocalProfileBySlug(cleanSlug)
      if (local) return local
    } catch {
      // Ignore
    }
  }

  // 3. Showcase / Demo profiles fallback (e.g. Deepak Kumar demo)
  if (cleanSlug === 'deepak-kumar' || cleanSlug === 'demo') {
    return {
      id: 'demo-profile-deepak',
      slug: cleanSlug,
      role: 'member',
      first_name: 'Deepak',
      last_name: 'Kumar',
      job_title: 'UI/UX Engineer & Product Designer',
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
