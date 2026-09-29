import { NextRequest, NextResponse } from 'next/server'
import { getLocalLeads, saveLocalLead, deleteLocalLead } from '@/lib/leadsStore'
import { getSupabaseClient, type Lead } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const profileId = searchParams.get('profile_id')

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
    } catch {
      // Ignore
    }
  }

  const localLeads = getLocalLeads(profileId || undefined)

  // Merge unique by id
  const map = new Map<string, Lead>()
  localLeads.forEach((l) => l.id && map.set(l.id, l))
  dbLeads.forEach((l) => l.id && map.set(l.id, l))

  // Sort descending by date
  const combined = Array.from(map.values()).sort((a, b) => {
    const da = a.created_at ? new Date(a.created_at).getTime() : 0
    const db = b.created_at ? new Date(b.created_at).getTime() : 0
    return db - da
  })

  return NextResponse.json(combined)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lead } = body as { lead: Lead }

    if (!lead || (!lead.visitor_name && !lead.name) || (!lead.visitor_phone && !lead.phone)) {
      return NextResponse.json(
        { error: 'Missing required lead fields (name, phone)' },
        { status: 400 }
      )
    }

    const fullLead: Lead = {
      id: lead.id || crypto.randomUUID(),
      profile_id: lead.profile_id,
      name: lead.name || lead.visitor_name || '',
      phone: lead.phone || lead.visitor_phone || '',
      email: lead.email || lead.visitor_email,
      organization: lead.organization || lead.visitor_company,
      visitor_name: lead.visitor_name || lead.name || '',
      visitor_phone: lead.visitor_phone || lead.phone || '',
      visitor_email: lead.visitor_email || lead.email,
      visitor_company: lead.visitor_company || lead.organization,
      visitor_job_title: lead.visitor_job_title,
      notes: lead.notes,
      vcard_emailed: lead.vcard_emailed ?? false,
      created_at: lead.created_at || new Date().toISOString(),
    }

    const savedLocal = saveLocalLead(fullLead)

    const client = getSupabaseClient()
    if (client) {
      try {
        await client.from('leads').insert([fullLead])
      } catch {
        // Fallback already saved locally
      }
    }

    return NextResponse.json(savedLocal)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  deleteLocalLead(id)

  const client = getSupabaseClient()
  if (client) {
    try {
      await client.from('leads').delete().eq('id', id)
    } catch {
      // Ignore
    }
  }

  return NextResponse.json({ success: true })
}
