import { NextRequest, NextResponse } from 'next/server'
import {
  getLocalProfiles,
  getLocalProfileBySlug,
  saveLocalProfile,
  updateLocalProfile,
  deleteLocalProfile,
} from '@/lib/profilesStore'
import { getSupabaseClient, type Profile } from '@/lib/supabase'
import { toPublicProfileDTO } from '@/lib/dto'

/**
 * Helper to verify if the requester has admin authorization.
 */
async function checkAdminAuth(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return false

  const token = authHeader.replace('Bearer ', '').trim()
  const client = getSupabaseClient()
  if (!client) return false

  try {
    const { data: { user } } = await client.auth.getUser(token)
    if (!user) return false

    const { data: profile } = await client
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    return profile?.role === 'admin' || profile?.role === 'master_admin'
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  const isAdmin = await checkAdminAuth(request)

  if (slug) {
    const cleanSlug = decodeURIComponent(slug).toLowerCase().trim()
    let rawProfile: Profile | null = null

    // 1. Try Supabase
    const client = getSupabaseClient()
    if (client) {
      try {
        const { data, error } = await client
          .from('profiles')
          .select('*')
          .eq('slug', cleanSlug)
          .maybeSingle()
        if (data && !error) {
          rawProfile = data as Profile
        }
      } catch {}
    }

    // 2. Try local store
    if (!rawProfile) {
      rawProfile = getLocalProfileBySlug(cleanSlug)
    }

    if (!rawProfile || !rawProfile.is_active) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Admins can see raw profile; public requests receive the sanitized DTO
    if (isAdmin) {
      return NextResponse.json(rawProfile)
    }

    return NextResponse.json(toPublicProfileDTO(rawProfile))
  }

  // Listing profiles
  const client = getSupabaseClient()
  let dbProfiles: Profile[] = []
  if (client) {
    try {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      if (data && !error) {
        dbProfiles = data as Profile[]
      }
    } catch {}
  }

  const localProfiles = getLocalProfiles()
  const map = new Map<string, Profile>()
  localProfiles.forEach((p) => map.set(p.slug.toLowerCase().trim(), p))
  dbProfiles.forEach((p) => map.set(p.slug.toLowerCase().trim(), p))
  const allProfiles = Array.from(map.values())

  if (isAdmin) {
    return NextResponse.json(allProfiles)
  }

  // Strip sensitive internal fields (telegram_chat_id, user_id) for public directory
  const sanitized = allProfiles
    .filter((p) => p.is_active)
    .map((p) => toPublicProfileDTO(p))
    .filter(Boolean)

  return NextResponse.json(sanitized)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { profile } = body as { profile: Profile }

    if (!profile || !profile.slug || !profile.first_name || !profile.work_email) {
      return NextResponse.json(
        { error: 'Missing required profile fields (slug, first_name, work_email)' },
        { status: 400 }
      )
    }

    const cleanSlug = profile.slug.toLowerCase().trim()
    const fullProfile: Profile = {
      id: profile.id || crypto.randomUUID(),
      slug: cleanSlug,
      role: profile.role || 'member',
      first_name: profile.first_name,
      last_name: profile.last_name || '',
      headline: profile.headline,
      job_title: profile.job_title,
      company_name: profile.company_name,
      department: profile.department,
      work_email: profile.work_email,
      work_phone: profile.work_phone,
      mobile_phone: profile.mobile_phone,
      website_url: profile.website_url,
      address: profile.address,
      bio: profile.bio,
      avatar_url: profile.avatar_url,
      cover_image_url: profile.cover_image_url,
      social_links: profile.social_links || {},
      card_theme: profile.card_theme || {
        primaryColor: '#6366F1',
        accentColor: '#A855F7',
        template: 'modern',
      },
      is_active: profile.is_active !== undefined ? profile.is_active : true,
      created_at: profile.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Save to local store
    saveLocalProfile(fullProfile)

    // Also persist to Supabase if connected
    const client = getSupabaseClient()
    if (client) {
      try {
        await client.from('profiles').upsert([fullProfile])
      } catch (err) {
        console.warn('[API /api/profiles POST] Supabase upsert error:', err)
      }
    }

    return NextResponse.json(fullProfile, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, updates } = body as { id: string; updates: Partial<Profile> }

    if (!id || !updates) {
      return NextResponse.json(
        { error: 'Missing required fields: id, updates' },
        { status: 400 }
      )
    }

    // Update in local store
    const updatedLocal = updateLocalProfile(id, updates)

    // Update in Supabase
    const client = getSupabaseClient()
    let updatedDb: Profile | null = null
    if (client) {
      try {
        const { data } = await client
          .from('profiles')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .or(`id.eq.${id},slug.eq.${id.toLowerCase()}`)
          .select()
          .maybeSingle()
        if (data) updatedDb = data as Profile
      } catch (err) {
        console.warn('[API /api/profiles PUT] Supabase update error:', err)
      }
    }

    return NextResponse.json(updatedDb || updatedLocal || { id, ...updates })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing profile ID or slug' }, { status: 400 })
  }

  deleteLocalProfile(id)

  const client = getSupabaseClient()
  if (client) {
    try {
      await client
        .from('profiles')
        .delete()
        .or(`id.eq.${id},slug.eq.${id.toLowerCase()}`)
    } catch {}
  }

  return NextResponse.json({ success: true })
}
