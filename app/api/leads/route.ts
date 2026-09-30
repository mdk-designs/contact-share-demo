import { NextRequest, NextResponse } from 'next/server'
import { getContactExchanges, createContactExchange, deleteContactExchange, type Lead } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const profileId = searchParams.get('profile_id') || undefined

  const exchanges = await getContactExchanges(profileId)
  const mapped: Lead[] = exchanges.map((e) => ({
    id: e.id,
    profile_id: e.profile_id,
    name: e.visitor_name,
    phone: e.visitor_phone_e164 || e.visitor_phone,
    email: e.visitor_email,
    organization: e.visitor_company,
    visitor_name: e.visitor_name,
    visitor_phone: e.visitor_phone_e164 || e.visitor_phone,
    visitor_email: e.visitor_email,
    visitor_company: e.visitor_company,
    visitor_job_title: e.visitor_job_title,
    notes: e.notes,
    created_at: e.created_at,
  }))

  return NextResponse.json(mapped)
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

    const { data: exchange, error } = await createContactExchange({
      profile_id: lead.profile_id,
      visitor_name: lead.visitor_name || lead.name,
      visitor_phone: lead.visitor_phone || lead.phone,
      visitor_email: lead.visitor_email || lead.email,
      visitor_company: lead.visitor_company || lead.organization,
      visitor_job_title: lead.visitor_job_title,
      notes: lead.notes,
      source: 'direct',
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(exchange, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to record lead' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
  }

  const { success, error } = await deleteContactExchange(id)
  if (!success) {
    return NextResponse.json({ error: error?.message || 'Failed to delete' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
