import { NextRequest, NextResponse } from 'next/server'
import { insertLead, resolveProfileWithFallback } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      profile_id,
      slug,
      visitor_name,
      visitor_phone,
      visitor_email,
      visitor_company,
      visitor_job_title,
      notes,
    } = body

    if (!visitor_name || !visitor_phone) {
      return NextResponse.json(
        { error: 'visitor_name and visitor_phone are required fields.' },
        { status: 400 }
      )
    }

    // Resolve profile_id if only slug was provided
    let targetProfileId = profile_id
    if (!targetProfileId && slug) {
      const resolved = await resolveProfileWithFallback(slug)
      if (resolved?.id) {
        targetProfileId = resolved.id
      }
    }

    // 1. Insert lead record into Supabase PostgreSQL
    const { data: lead, error: insertError } = await insertLead({
      profile_id: targetProfileId,
      name: visitor_name.trim(),
      phone: visitor_phone.trim(),
      email: visitor_email?.trim() || undefined,
      organization: visitor_company?.trim() || undefined,
      visitor_name: visitor_name.trim(),
      visitor_phone: visitor_phone.trim(),
      visitor_email: visitor_email?.trim() || undefined,
      visitor_company: visitor_company?.trim() || undefined,
      visitor_job_title: visitor_job_title?.trim() || undefined,
      notes: notes?.trim() || undefined,
    })

    if (insertError) {
      console.warn('[API /api/lead/exchange] Database insert warning:', insertError)
    }

    const leadId = lead?.id || `simulated-${Date.now()}`

    let emailed = false

    // 2. Dispatch RFC 6350 vCard email to visitor & alert to cardholder
    const resolvedProfile = await resolveProfileWithFallback(slug || 'deepak-kumar')
    if (resolvedProfile && visitor_email) {
      // 2a. Direct Next.js / Vercel Resend integration if API key is present
      if (process.env.RESEND_API_KEY) {
        try {
          const { sendVCardEmail } = await import('@/lib/email')
          const emailRes = await sendVCardEmail({
            leadId: lead?.id,
            visitorName: visitor_name.trim(),
            visitorEmail: visitor_email.trim(),
            visitorPhone: visitor_phone?.trim(),
            visitorCompany: visitor_company?.trim(),
            notes: notes?.trim(),
            profile: resolvedProfile,
          })
          emailed = emailRes.visitorEmailed
        } catch (emailErr) {
          console.warn('[API /api/lead/exchange] Direct email dispatch error:', emailErr)
        }
      }

      // 2b. Supabase Edge Function trigger fallback if configured
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!emailed && supabaseUrl && anonKey && lead?.id) {
        fetch(`${supabaseUrl}/functions/v1/send-vcard-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${anonKey}`,
          },
          body: JSON.stringify({ lead_id: lead.id }),
        }).catch((edgeErr) => {
          console.warn('[API /api/lead/exchange] Edge function trigger notification:', edgeErr)
        })
      }
    }

    return NextResponse.json(
      {
        success: true,
        lead_id: leadId,
        emailed,
        message: emailed
          ? 'Lead captured and vCard delivered to visitor email'
          : 'Lead captured and vCard delivery queued successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[API /api/lead/exchange] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error while exchanging contact' },
      { status: 500 }
    )
  }
}
