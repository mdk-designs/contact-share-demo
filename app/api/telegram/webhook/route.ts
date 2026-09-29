import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { generateVCardString, generateVisitorVCardString } from '@/lib/vcard'
import {
  isTelegramConfigured,
  getBotUsername,
  sendTelegramMessage,
  sendTelegramVCardDocument,
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
      : 'To activate: Create a bot with @BotFather on Telegram, then set TELEGRAM_BOT_TOKEN and NEXT_PUBLIC_TELEGRAM_BOT in your .env.local',
  })
}

export async function POST(request: NextRequest) {
  try {
    if (!isTelegramConfigured()) {
      return NextResponse.json(
        { message: 'Telegram provision is active, but TELEGRAM_BOT_TOKEN is not configured in .env' },
        { status: 200 }
      )
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

      // Case 1: Linking a registered team member (/start link_<userId> or /start user_<userId>)
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
              `✅ <b>Account Connected!</b>\n\nHello <b>${profile.first_name}</b>, your Telegram is now linked to your ContactForge card (<b>${profile.slug}</b>).\n\nWhenever someone scans your QR code and exchanges their details, their contact card (.vcf) will be automatically sent to you here.`
            )
            return NextResponse.json({ ok: true })
          }
        }

        await sendTelegramMessage(
          chatId,
          `⚠️ <b>Profile not found.</b>\nPlease ensure you are logged into your ContactForge Member Portal and click <b>Link Telegram</b> in your Settings.`
        )
        return NextResponse.json({ ok: true })
      }

      // Case 2: Visitor scanned QR and clicked "Get on Telegram" (/start lead_<leadId>)
      if (param.startsWith('lead_')) {
        const leadId = param.replace(/^lead_/, '')

        if (supabase) {
          // Fetch lead
          const { data: lead } = await supabase
            .from('leads')
            .select('*')
            .eq('id', leadId)
            .maybeSingle()

          if (lead && lead.profile_id) {
            // Fetch cardholder profile
            const { data: cardholder } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', lead.profile_id)
              .maybeSingle()

            if (cardholder) {
              // 1. Send Cardholder's vCard to Visitor
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
                caption: `📇 <b>${cardholder.first_name} ${cardholder.last_name}</b>'s Contact Card\nTap the attached file to save directly to your phone contacts!`,
              })

              // 2. If Cardholder has linked Telegram, send visitor's vCard to cardholder as well!
              if (cardholder.telegram_chat_id) {
                const visitorVCard = generateVisitorVCardString({
                  name: lead.visitor_name || lead.name,
                  phone: lead.visitor_phone || lead.phone,
                  email: lead.visitor_email || lead.email,
                  organization: lead.visitor_company || lead.organization,
                  jobTitle: lead.visitor_job_title,
                  notes: lead.notes,
                })

                await sendTelegramVCardDocument({
                  chatId: cardholder.telegram_chat_id,
                  vcardString: visitorVCard,
                  filename: `${(lead.visitor_name || lead.name || 'New_Contact').replace(/\s+/g, '_')}.vcf`,
                  caption: `🤝 <b>New Lead Exchanged!</b>\n<b>${lead.visitor_name || lead.name}</b> just scanned your QR code and shared their contact details.\nTap the file to save their contact!`,
                })
              }

              return NextResponse.json({ ok: true })
            }
          }
        }

        await sendTelegramMessage(
          chatId,
          `⚠️ Could not locate the contact exchange request. Please scan the QR code again or download the vCard directly from the webpage.`
        )
        return NextResponse.json({ ok: true })
      }

      // Default greeting
      await sendTelegramMessage(
        chatId,
        `👋 <b>Welcome to ContactForge Bot!</b>\n\nThis bot enables instantaneous bi-directional vCard sharing when people exchange contacts via digital QR cards.\n\n• If you are a team member, link your account via your <b>Member Portal &gt; Settings</b>.\n• If you scanned a QR card, use the Telegram button shown after submitting the contact form.`
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[API /api/telegram/webhook] Error:', error)
    return NextResponse.json({ ok: false, error: error?.message || 'Server error' }, { status: 200 })
  }
}
