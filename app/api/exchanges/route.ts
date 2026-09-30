import { NextRequest, NextResponse } from 'next/server'
import {
  createContactExchange,
  resolveProfileWithFallback,
  createTelegramLinkToken,
  updateContactExchange,
  getContactExchanges,
  type ContactExchange,
} from '@/lib/supabase'
import { normalizePhoneNumber, buildWhatsAppUrl } from '@/lib/phone'
import { checkRateLimit, hashIp } from '@/lib/rateLimit'
import { generateVisitorVCardString } from '@/lib/vcard'
import {
  isTelegramConfigured,
  getTelegramDeepLink,
  sendTelegramVCardDocument,
  formatCardholderTelegramCaption,
} from '@/lib/telegram'
import { sendVCardEmail } from '@/lib/email'

export async function handleExchange(request: NextRequest) {
  try {
    // 1. Privacy-safe Rate Limiting
    const forwarded = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1'
    const clientIp = forwarded.split(',')[0].trim()
    const ipIdentifier = hashIp(clientIp)

    const rateResult = checkRateLimit(`exchange:${ipIdentifier}`, 15, 60)
    if (!rateResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: `Too many submissions. Please wait ${rateResult.resetInSeconds} seconds before trying again.`,
          },
        },
        { status: 429, headers: { 'Retry-After': String(rateResult.resetInSeconds) } }
      )
    }

    const body = await request.json()
    const {
      slug,
      profile_id,
      visitor_name,
      visitor_phone,
      visitor_email,
      visitor_company,
      visitor_job_title,
      notes,
      source,
      qr_scan_id,
      idempotency_key,
    } = body

    // 2. Input Validation & Bounds
    if (!visitor_name || typeof visitor_name !== 'string' || visitor_name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Your name is required.' } },
        { status: 400 }
      )
    }
    if (visitor_name.trim().length > 120) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Name cannot exceed 120 characters.' } },
        { status: 400 }
      )
    }

    if (!visitor_phone || typeof visitor_phone !== 'string' || visitor_phone.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Your mobile number is required.' } },
        { status: 400 }
      )
    }
    if (visitor_phone.trim().length > 40) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Phone number cannot exceed 40 characters.' } },
        { status: 400 }
      )
    }

    const phoneNorm = normalizePhoneNumber(visitor_phone.trim())
    if (!phoneNorm.valid) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: phoneNorm.error || 'Please enter a valid mobile number.' } },
        { status: 400 }
      )
    }

    if (visitor_email && visitor_email.trim().length > 0) {
      if (visitor_email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(visitor_email.trim())) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'Please enter a valid email address.' } },
          { status: 400 }
        )
      }
    }

    if (visitor_company && visitor_company.trim().length > 160) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Organization cannot exceed 160 characters.' } },
        { status: 400 }
      )
    }

    if (notes && notes.trim().length > 1000) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Notes cannot exceed 1000 characters.' } },
        { status: 400 }
      )
    }

    // 3. Resolve Target Profile
    const targetSlug = slug || 'deepak-kumar'
    const profile = await resolveProfileWithFallback(targetSlug)

    if (!profile || !profile.is_active) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'The requested digital business card is not active or could not be found.' } },
        { status: 404 }
      )
    }

    const cleanSource = ['qr', 'nfc', 'direct'].includes(source) ? source : 'unknown'

    // 4. Create or Retrieve (Idempotency check)
    const { data: exchange, error: insertError, isDuplicate } = await createContactExchange({
      profile_id: profile.id,
      visitor_name: visitor_name.trim(),
      visitor_phone: visitor_phone.trim(),
      visitor_phone_e164: phoneNorm.e164,
      visitor_email: visitor_email?.trim() || undefined,
      visitor_company: visitor_company?.trim() || undefined,
      visitor_job_title: visitor_job_title?.trim() || undefined,
      notes: notes?.trim() || undefined,
      source: cleanSource,
      qr_scan_id: qr_scan_id || undefined,
      idempotency_key: idempotency_key || undefined,
      cardholder_vcard_status: 'sent',
      visitor_vcard_status: 'pending',
    })

    if (!exchange || insertError) {
      console.error('[handleExchange] Failed saving exchange:', insertError)
      return NextResponse.json(
        { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to record contact exchange. Please try again.' } },
        { status: 500 }
      )
    }

    // Prepare URLs
    const cardholderVCardUrl = `/api/vcard/${encodeURIComponent(profile.slug)}`
    const cardholderPhone = profile.mobile_phone || profile.work_phone
    const whatsappUrl = cardholderPhone
      ? buildWhatsAppUrl(cardholderPhone, `Hi ${profile.first_name}, it was great connecting with you on ContactForge.`)
      : null

    // 5. If this was a duplicate submission (idempotency key match), return existing state without re-triggering notifications
    if (isDuplicate) {
      return NextResponse.json({
        success: true,
        is_duplicate: true,
        exchange_id: exchange.id,
        cardholder_vcard_url: cardholderVCardUrl,
        whatsapp_url: whatsappUrl,
        telegram: {
          cardholder_status: exchange.cardholder_telegram_status,
          visitor_status: exchange.visitor_telegram_status,
        },
      })
    }

    // 6. Independent Downstream Delivery: Email Notification
    let emailStatus: ContactExchange['email_status'] = 'not_applicable'
    if (visitor_email && visitor_email.trim().length > 0) {
      try {
        emailStatus = 'pending'
        const emailResult = await sendVCardEmail({
          leadId: exchange.id,
          visitorName: visitor_name.trim(),
          visitorEmail: visitor_email.trim(),
          visitorPhone: visitor_phone.trim(),
          visitorCompany: visitor_company?.trim(),
          notes: notes?.trim(),
          profile,
        })
        emailStatus = emailResult.visitorEmailed ? 'sent' : 'failed'
      } catch (e) {
        console.warn('[handleExchange] Email delivery notice:', e)
        emailStatus = 'failed'
      }
      updateContactExchange(exchange.id, { email_status: emailStatus }).catch(() => {})
    }

    // 7. Independent Downstream Delivery: Cardholder Telegram Alert
    let cardholderTelegramStatus: ContactExchange['cardholder_telegram_status'] = 'not_applicable'
    if (isTelegramConfigured() && profile.telegram_chat_id) {
      try {
        cardholderTelegramStatus = 'pending'
        const visitorVcard = generateVisitorVCardString({
          name: visitor_name.trim(),
          phone: phoneNorm.e164 || visitor_phone.trim(),
          email: visitor_email?.trim(),
          organization: visitor_company?.trim(),
          jobTitle: visitor_job_title?.trim(),
          notes: notes?.trim(),
        })

        const tgRes = await sendTelegramVCardDocument({
          chatId: profile.telegram_chat_id,
          vcardString: visitorVcard,
          filename: `${visitor_name.trim().replace(/\s+/g, '_')}.vcf`,
          caption: formatCardholderTelegramCaption({
            visitorName: visitor_name.trim(),
            visitorPhone: phoneNorm.e164 || visitor_phone.trim(),
            visitorCompany: visitor_company?.trim(),
            visitorEmail: visitor_email?.trim(),
          }),
        })

        cardholderTelegramStatus = tgRes.success ? 'sent' : 'failed'
      } catch (tgErr) {
        console.warn('[handleExchange] Telegram alert notice:', tgErr)
        cardholderTelegramStatus = 'failed'
      }
      updateContactExchange(exchange.id, { cardholder_telegram_status: cardholderTelegramStatus }).catch(() => {})
    }

    // 8. One-Time Telegram Token for Visitor
    let telegramConnectUrl: string | null = null
    if (isTelegramConfigured()) {
      try {
        const { token } = await createTelegramLinkToken(exchange.id)
        telegramConnectUrl = getTelegramDeepLink(`tok_${token}`)
      } catch {}
    }

    return NextResponse.json({
      success: true,
      exchange_id: exchange.id,
      cardholder_vcard_url: cardholderVCardUrl,
      whatsapp_url: whatsappUrl,
      telegram: {
        cardholder_status: cardholderTelegramStatus,
        visitor_status: telegramConnectUrl ? 'pending_connection' : 'not_applicable',
        connect_url: telegramConnectUrl,
      },
    })
  } catch (err: any) {
    console.error('[handleExchange] Unhandled exception:', err)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred. Please try again.' } },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return handleExchange(request)
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const profileId = searchParams.get('profile_id') || undefined
  const exchanges = await getContactExchanges(profileId)
  return NextResponse.json(exchanges)
}
