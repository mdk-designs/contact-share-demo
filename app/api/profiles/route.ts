import { NextRequest, NextResponse } from 'next/server'
import {
  getLocalProfiles,
  getLocalProfileBySlug,
  saveLocalProfile,
  updateLocalProfile,
  deleteLocalProfile,
} from '@/lib/profilesStore'
import { getSupabaseClient, type Profile } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')

  if (slug) {
    const cleanSlug = decodeURIComponent(slug).toLowerCase().trim()
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
          return NextResponse.json(data)
        }
      } catch {
        // Fallback to local store
      }
    }

    // 2. Try local store
    const local = getLocalProfileBySlug(cleanSlug)
    if (local) {
      return NextResponse.json(local)
    }

    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  // Return all profiles
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
    } catch {
      // Ignore
    }
  }

  const localProfiles = getLocalProfiles()

  // Merge (db takes priority, but include local ones that don't exist in DB)
  const map = new Map<string, Profile>()
  localProfiles.forEach((p) => map.set(p.slug.toLowerCase().trim(), p))
  dbProfiles.forEach((p) => map.set(p.slug.toLowerCase().trim(), p))

  return NextResponse.json(Array.from(map.values()))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { profile } = body as { profile: Partial<Profile> }

    if (!profile) {
      return NextResponse.json({ error: 'Profile payload is required' }, { status: 400 })
    }

    // If an ID is provided, check if it's an existing profile update (e.g. toggle status)
    if (profile.id && (!profile.slug || !profile.first_name || !profile.last_name)) {
      const updated = updateLocalProfile(profile.id, profile)
      if (updated) {
        const client = getSupabaseClient()
        if (client) {
          try {
            await client
              .from('profiles')
              .update({ ...profile, updated_at: new Date().toISOString() })
              .eq('id', profile.id)
          } catch {
            // Non-blocking
          }
        }
        return NextResponse.json(updated)
      }
    }

    if (!profile.slug || !profile.first_name || !profile.last_name) {
      return NextResponse.json(
        { error: 'Missing required profile fields (slug, first_name, last_name)' },
        { status: 400 }
      )
    }

    const fullProfile: Profile = {
      id: profile.id || crypto.randomUUID(),
      slug: profile.slug.toLowerCase().trim(),
      role: profile.role || 'member',
      first_name: profile.first_name.trim(),
      last_name: profile.last_name.trim(),
      job_title: profile.job_title?.trim(),
      company_name: profile.company_name?.trim(),
      department: profile.department?.trim(),
      work_email: profile.work_email?.trim() || '',
      work_phone: profile.work_phone?.trim(),
      mobile_phone: profile.mobile_phone?.trim(),
      website_url: profile.website_url?.trim(),
      address: profile.address?.trim(),
      bio: profile.bio?.trim(),
      avatar_url: profile.avatar_url?.trim(),
      social_links: profile.social_links || {},
      card_theme: profile.card_theme || {
        primaryColor: '#6366F1',
        accentColor: '#A855F7',
        template: 'modern',
      },
      is_active: profile.is_active ?? true,
      created_at: profile.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // 1. Always save to local persistent store so it is immediately accessible
    const savedLocal = saveLocalProfile(fullProfile)

    // 2. Also try saving to Supabase if configured
    const client = getSupabaseClient()
    if (client) {
      try {
        const { data, error } = await client
          .from('profiles')
          .upsert([fullProfile], { onConflict: 'slug' })
          .select()
          .maybeSingle()

        if (!error && data) {
          return NextResponse.json(data)
        }
      } catch (dbErr) {
        console.warn('[API /api/profiles] Supabase sync deferred:', dbErr)
      }
    }

    return NextResponse.json(savedLocal)
  } catch (err: any) {
    console.error('[API /api/profiles] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const id = body.id || body.profile?.id || body.slug || body.profile?.slug
    const updates = body.updates || body.profile || body

    if (!id) {
      return NextResponse.json({ error: 'Profile id or slug is required for updates' }, { status: 400 })
    }

    // Remove top-level wrapper keys if they exist in updates
    const cleanedUpdates = { ...updates }
    delete cleanedUpdates.id
    delete cleanedUpdates.updates
    delete cleanedUpdates.profile

    const updated = updateLocalProfile(id, cleanedUpdates)

    const client = getSupabaseClient()
    if (client) {
      try {
        await client
          .from('profiles')
          .update({ ...cleanedUpdates, updated_at: new Date().toISOString() })
          .or(`id.eq.${id},slug.eq.${id.toLowerCase()}`)
      } catch (err) {
        console.warn('[API PUT /api/profiles] Supabase update warning:', err)
      }
    }

    return NextResponse.json(updated || { id, ...cleanedUpdates, success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  return PUT(request)
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const slug = searchParams.get('slug')

  if (!id && !slug) {
    return NextResponse.json({ error: 'id or slug is required' }, { status: 400 })
  }

  const target = id || slug || ''
  deleteLocalProfile(target)

  const client = getSupabaseClient()
  if (client) {
    try {
      if (id) {
        await client.from('profiles').delete().or(`id.eq.${id},slug.eq.${id.toLowerCase()}`)
      } else if (slug) {
        await client.from('profiles').delete().eq('slug', slug.toLowerCase())
      }
    } catch {
      // Ignore
    }
  }

  return NextResponse.json({ success: true })
}
