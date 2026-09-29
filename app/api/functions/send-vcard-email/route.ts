import { NextRequest, NextResponse } from 'next/server'
import { resolveProfileWithFallback } from '@/lib/supabase'
import { sendVCardEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      lead_id,
      slug,
      visitor_name,
      visitor_email,
      visitor_phone,
      visitor_company,
      notes,
    } = body

    if (!visitor_email && !visitor_name) {
      return NextResponse.json(
        { error: 'visitor_name and visitor_email are required' },
        { status: 400 }
      )
    }

    const targetSlug = slug || 'deepak-kumar'
    const profile = await resolveProfileWithFallback(targetSlug)

    if (!profile) {
      return NextResponse.json(
        { error: `Profile for slug '${targetSlug}' could not be resolved` },
        { status: 404 }
      )
    }

    const result = await sendVCardEmail({
      leadId: lead_id,
      visitorName: visitor_name || 'Valued Connection',
      visitorEmail: visitor_email,
      visitorPhone: visitor_phone,
      visitorCompany: visitor_company,
      notes: notes,
      profile: profile,
    })

    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    console.error('[API /api/functions/send-vcard-email] Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to dispatch email' },
      { status: 500 }
    )
  }
}
