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
 * e.g., https://t.me/ContactForgeBot?start=lead_12345
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
    console.info(`[Telegram Provision] Token not set. Message to ${chatId} skipped: "${text.slice(0, 50)}..."`)
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
    console.info(`[Telegram Provision] Token not set. Document ${filename} to ${chatId} skipped.`)
    return { success: false, notConfigured: true, error: 'TELEGRAM_BOT_TOKEN not configured' }
  }

  try {
    const formData = new FormData()
    formData.append('chat_id', String(chatId))

    // Create file blob from vCard string
    const blob = new Blob([vcardString], { type: 'text/vcard;charset=utf-8' })
    formData.append('document', blob, filename.endsWith('.vcf') ? filename : `${filename}.vcf`)

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
