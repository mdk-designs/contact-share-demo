/**
 * ─────────────────────────────────────────────────────────────────
 *  Telegram Bot Provision & API Integration
 *  Enables bi-directional vCard sharing between cardholders & visitors.
 *  Fully functional and gracefully inert until TELEGRAM_BOT_TOKEN is set.
 * ─────────────────────────────────────────────────────────────────
 */

export interface TelegramSendResult {
  success: boolean
  notConfigured?: boolean
  messageId?: number
  error?: string
}

/**
 * Check if the Telegram Bot Token is configured in environment variables.
 */
export function isTelegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_TOKEN.trim().length > 0)
}

/**
 * Get the public Telegram Bot Username (without @).
 */
export function getBotUsername(): string | null {
  const username = process.env.NEXT_PUBLIC_TELEGRAM_BOT || process.env.TELEGRAM_BOT_USERNAME
  return username ? username.replace(/^@/, '').trim() : null
}

/**
 * Generate a Telegram deep link with a start parameter.
 * e.g., https://t.me/ContactForgeBot?start=tok_12345
 */
export function getTelegramDeepLink(startParam: string): string | null {
  const botUser = getBotUsername()
  if (!botUser) return null
  return `https://t.me/${botUser}?start=${encodeURIComponent(startParam)}`
}

/**
 * Send a text message to a Telegram Chat ID.
 */
export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  parseMode: 'Markdown' | 'HTML' = 'HTML'
): Promise<TelegramSendResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    return { success: false, notConfigured: true, error: 'TELEGRAM_BOT_TOKEN not configured' }
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
      }),
    })

    const data = await res.json()
    if (!res.ok || !data.ok) {
      console.warn('[Telegram API] sendMessage failed:', data)
      return { success: false, error: data.description || 'Failed to send Telegram message' }
    }

    return { success: true, messageId: data.result?.message_id }
  } catch (err: any) {
    console.error('[Telegram API] Network error during sendMessage:', err)
    return { success: false, error: err?.message || 'Network error' }
  }
}

/**
 * Send an RFC 6350 .vcf file directly as a document to a Telegram Chat.
 */
export async function sendTelegramVCardDocument({
  chatId,
  vcardString,
  filename,
  caption,
}: {
  chatId: string | number
  vcardString: string
  filename: string
  caption?: string
}): Promise<TelegramSendResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    return { success: false, notConfigured: true, error: 'TELEGRAM_BOT_TOKEN not configured' }
  }

  try {
    const formData = new FormData()
    formData.append('chat_id', String(chatId))

    const cleanFilename = filename.endsWith('.vcf') ? filename : `${filename}.vcf`
    const blob = new Blob([vcardString], { type: 'text/vcard;charset=utf-8' })
    formData.append('document', blob, cleanFilename)

    if (caption) {
      formData.append('caption', caption)
      formData.append('parse_mode', 'HTML')
    }

    const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
      method: 'POST',
      body: formData,
    })

    const data = await res.json()
    if (!res.ok || !data.ok) {
      console.warn('[Telegram API] sendDocument failed:', data)
      return { success: false, error: data.description || 'Failed to send Telegram vCard document' }
    }

    return { success: true, messageId: data.result?.message_id }
  } catch (err: any) {
    console.error('[Telegram API] Network error during sendDocument:', err)
    return { success: false, error: err?.message || 'Network error' }
  }
}

/**
 * Formats notification for cardholder when a visitor exchanges contacts.
 */
export function formatCardholderTelegramCaption(exchange: {
  visitorName: string
  visitorPhone?: string
  visitorCompany?: string
  visitorEmail?: string
  date?: string
}): string {
  const dateStr = exchange.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  return [
    '🔄 <b>New Contact Exchange</b>',
    '',
    `<b>Name:</b> ${exchange.visitorName}`,
    `<b>Phone:</b> ${exchange.visitorPhone || '—'}`,
    exchange.visitorCompany ? `<b>Organization:</b> ${exchange.visitorCompany}` : '',
    exchange.visitorEmail ? `<b>Email:</b> ${exchange.visitorEmail}` : '',
    `<b>Date:</b> ${dateStr}`,
    '',
    '<i>ContactForge Platform · Tap attached file to add to contacts</i>',
  ].filter(Boolean).join('\n')
}

/**
 * Formats notification for visitor receiving cardholder's contact.
 */
export function formatVisitorTelegramCaption(profile: {
  firstName: string
  lastName: string
  companyName?: string
  jobTitle?: string
}): string {
  const fullName = `${profile.firstName} ${profile.lastName}`.trim()
  return [
    '✅ <b>Contact Exchange Complete</b>',
    '',
    'You exchanged contacts with:',
    `<b>${fullName}</b>`,
    profile.companyName ? profile.companyName : '',
    profile.jobTitle ? profile.jobTitle : '',
    '',
    'Here is their contact card. Tap below to save directly to your contacts.',
  ].filter(Boolean).join('\n')
}
