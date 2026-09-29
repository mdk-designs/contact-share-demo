import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { generateVCardString, generateVisitorVCardString } from '@/lib/vcard'
import {
  isTelegramConfigured,
  getBotUsername,
  getTelegramDeepLink,
  sendTelegramVCardDocument,
} from '@/lib/telegram'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lead_id, profile_id, slug, visitor_name, visitor_phone, visitor_email, visitor_company } = body

    if (!isTelegramConfigured()) {
      return NextResponse.json({
        success: false,
        provision_status: 'ready_awaiting_token',
        message: 'Telegram Bot provision is ready. Set TELEGRAM_BOT_TOKEN to activate automated Telegram delivery.',
      })
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client unavailable' }, { status: 500 })
    }

    // 1. Fetch the cardholder profile
    let cardholder = null
    if (profile_id) {
      const { data } = await supabase.from('profiles').select('*').eq('id', profile_id).maybeSingle()
      cardholder = data
    } else if (slug) {
      const { data } = await supabase.from('profiles').select('*').eq('slug', slug.toLowerCase()).maybeSingle()
      cardholder = data
    }

    if (!cardholder) {
      return NextResponse.json({ error: 'Cardholder profile not found' }, { status: 404 })
    }

    let cardholderSent = false

    // 2. If cardholder has linked their Telegram, dispatch visitor's vCard to cardholder!
    if (cardholder.telegram_chat_id) {
      const visitorVCard = generateVisitorVCardString({
        name: visitor_name || 'Exchanged Contact',
        phone: visitor_phone,
        email: visitor_email,
        organization: visitor_company,
      })

      const res = await sendTelegramVCardDocument({
        chatId: cardholder.telegram_chat_id,
        vcardString: visitorVCard,
        filename: `${(visitor_name || 'New_Lead').replace(/\s+/g, '_')}.vcf`,
        caption: `🤝 <b>New Lead Exchanged!</b>\n<b>${visitor_name}</b> (${visitor_phone || visitor_email || 'No phone/email'}) just exchanged contact details with your card.\nTap to add to your phone contacts!`,
      })
      cardholderSent = res.success
    }

    // 3. Return Telegram deep link for the visitor to claim cardholder's vCard via Telegram bot
    const deepLink = lead_id ? getTelegramDeepLink(`lead_${lead_id}`) : null

    return NextResponse.json({
      success: true,
      cardholder_notified: cardholderSent,
      visitor_deep_link: deepLink,
      bot_username: getBotUsername(),
    })
  } catch (error: any) {
    console.error('[API /api/telegram/send-vcard] Error:', error)
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 })
  }
}
