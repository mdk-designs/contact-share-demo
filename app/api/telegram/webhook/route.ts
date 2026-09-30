import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { generateVCardString, generateVisitorVCardString } from '@/lib/vcard'
import {
  isTelegramConfigured,
  getBotUsername,
  sendTelegramMessage,
  sendTelegramVCardDocument,
  formatVisitorTelegramCaption,
} from '@/lib/telegram'

export async function GET(request: NextRequest) {
  const configured = isTelegramConfigured()
  const botUsername = getBotUsername()
  const origin = request.nextUrl.origin

  return NextResponse.json({
    status: 'online',
    provisioned: true,
    telegram_configured: configured,
    bot_username: botUsername,
    webhook_url: `${origin}/api/telegram/webhook`,
    instructions: configured
      ? `Telegram Bot is active! Set webhook via: https://api.telegram.org/bot<TOKEN>/setWebhook?url=${origin}/api/telegram/webhook`
      : 'To activate: Set TELEGRAM_BOT_TOKEN and NEXT_PUBLIC_TELEGRAM_BOT in your .env.local',
  })
}

export async function POST(request: NextRequest) {
  try {
    if (!isTelegramConfigured()) {
      return NextResponse.json(
        { message: 'Telegram provision is active, but TELEGRAM_BOT_TOKEN is not configured.' },
        { status: 200 }
      )
    }

    // Optional webhook secret verification
    const secretHeader = request.headers.get('x-telegram-bot-api-secret-token')
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET
    if (expectedSecret && secretHeader !== expectedSecret) {
      console.warn('[Telegram Webhook] Unauthorized webhook attempt: secret mismatch')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const update = await request.json()
    const message = update?.message
    if (!message || !message.text) {
      return NextResponse.json({ ok: true })
    }

    const chatId = message.chat.id
    const text = message.text.trim()

    // Handle /start commands
    if (text.startsWith('/start')) {
      const parts = text.split(/\s+/)
      const param = parts[1] || ''

      const supabase = getSupabaseClient()

      // Case 1: Secure One-Time Token from Contact Exchange (/start tok_<token>)
      if (param.startsWith('tok_')) {
        const rawToken = param.replace(/^tok_/, '').trim()

        if (supabase) {
          // Look up token
          const { data: tokenRecord } = await supabase
            .from('telegram_link_tokens')
            .select('*')
            .eq('token_hash', rawToken)
            .maybeSingle()

          if (!tokenRecord) {
            await sendTelegramMessage(
              chatId,
              '⚠️ <b>Invalid or expired link.</b>\nPlease scan the digital business card again to request contact sharing.'
            )
            return NextResponse.json({ ok: true })
          }

          if (tokenRecord.consumed_at) {
            await sendTelegramMessage(
              chatId,
              'ℹ️ <b>Contact card already delivered.</b>\nThis one-time link has already been used.'
            )
            return NextResponse.json({ ok: true })
          }

          const isExpired = new Date(tokenRecord.expires_at).getTime() < Date.now()
          if (isExpired) {
            await sendTelegramMessage(
              chatId,
              '⏳ <b>This link has expired.</b>\nPlease scan the digital business card again to exchange contacts.'
            )
            return NextResponse.json({ ok: true })
          }

          // Mark token consumed
          await supabase
            .from('telegram_link_tokens')
            .update({
              consumed_at: new Date().toISOString(),
              telegram_chat_id: String(chatId),
            })
            .eq('id', tokenRecord.id)

          // Fetch contact exchange record
          const { data: exchange } = await supabase
            .from('contact_exchanges')
            .select('*, profile:profiles(*)')
            .eq('id', tokenRecord.exchange_id)
            .maybeSingle()

          if (exchange && exchange.profile) {
            const cardholder = exchange.profile
            const cardholderVCard = generateVCardString({
              firstName: cardholder.first_name,
              lastName: cardholder.last_name,
              workEmail: cardholder.work_email,
              workPhone: cardholder.work_phone,
              mobilePhone: cardholder.mobile_phone,
              organization: cardholder.company_name,
              jobTitle: cardholder.job_title,
              url: cardholder.website_url,
              address: cardholder.address,
              bio: cardholder.bio,
            })

            await sendTelegramVCardDocument({
              chatId,
              vcardString: cardholderVCard,
              filename: `${cardholder.first_name}_${cardholder.last_name}.vcf`,
              caption: formatVisitorTelegramCaption({
                firstName: cardholder.first_name,
                lastName: cardholder.last_name,
                companyName: cardholder.company_name,
                jobTitle: cardholder.job_title,
              }),
            })

            // Update exchange status
            await supabase
              .from('contact_exchanges')
              .update({
                visitor_telegram_status: 'delivered',
                telegram_recipient_connected_at: new Date().toISOString(),
              })
              .eq('id', exchange.id)

            return NextResponse.json({ ok: true })
          }
        }

        await sendTelegramMessage(
          chatId,
          '⚠️ Could not retrieve the contact exchange. Please scan the QR card again.'
        )
        return NextResponse.json({ ok: true })
      }

      // Case 2: Cardholder linking from Settings (/start link_<userId> or /start user_<userId>)
      if (param.startsWith('link_') || param.startsWith('user_')) {
        const targetUserId = param.replace(/^(link_|user_)/, '')

        if (supabase) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .update({ telegram_chat_id: String(chatId) })
            .or(`user_id.eq.${targetUserId},id.eq.${targetUserId}`)
            .select()
            .maybeSingle()

          if (profile && !error) {
            await sendTelegramMessage(
              chatId,
              `✅ <b>Account Connected!</b>\n\nHello <b>${profile.first_name}</b>, your Telegram is now linked to your ContactForge card (<b>${profile.slug}</b>).\n\nWhenever someone exchanges contact details on your card, their contact card (.vcf) will be automatically sent to you here.`
            )
            return NextResponse.json({ ok: true })
          }
        }

        await sendTelegramMessage(
          chatId,
          '⚠️ <b>Profile not found.</b>\nPlease ensure you are logged into your ContactForge Member Portal and click <b>Connect Telegram</b> in Settings.'
        )
        return NextResponse.json({ ok: true })
      }

      // Case 3: Legacy direct exchange link (/start lead_<id>)
      if (param.startsWith('lead_')) {
        const leadId = param.replace(/^lead_/, '')

        if (supabase) {
          const { data: exchange } = await supabase
            .from('contact_exchanges')
            .select('*, profile:profiles(*)')
            .eq('id', leadId)
            .maybeSingle()

          if (exchange && exchange.profile) {
            const cardholder = exchange.profile
            const cardholderVCard = generateVCardString({
              firstName: cardholder.first_name,
              lastName: cardholder.last_name,
              workEmail: cardholder.work_email,
              workPhone: cardholder.work_phone,
              mobilePhone: cardholder.mobile_phone,
              organization: cardholder.company_name,
              jobTitle: cardholder.job_title,
              url: cardholder.website_url,
              address: cardholder.address,
              bio: cardholder.bio,
            })

            await sendTelegramVCardDocument({
              chatId,
              vcardString: cardholderVCard,
              filename: `${cardholder.first_name}_${cardholder.last_name}.vcf`,
              caption: formatVisitorTelegramCaption({
                firstName: cardholder.first_name,
                lastName: cardholder.last_name,
                companyName: cardholder.company_name,
                jobTitle: cardholder.job_title,
              }),
            })

            return NextResponse.json({ ok: true })
          }
        }

        await sendTelegramMessage(
          chatId,
          '⚠️ Could not locate the contact exchange request. Please scan the QR code again or download the vCard directly from the webpage.'
        )
        return NextResponse.json({ ok: true })
      }

      // Default greeting
      await sendTelegramMessage(
        chatId,
        '👋 <b>Welcome to ContactForge Bot!</b>\n\nThis bot enables instantaneous bi-directional vCard sharing when people exchange contacts via digital cards.\n\n• If you are a cardholder, connect via your <b>Member Portal &gt; Settings</b>.\n• If you exchanged contacts on a card, click the <b>Get Contact in Telegram</b> button on your confirmation screen.'
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[API /api/telegram/webhook] Error:', error)
    return NextResponse.json({ ok: false, error: error?.message || 'Server error' }, { status: 200 })
  }
}
