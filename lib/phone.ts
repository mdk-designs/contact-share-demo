/**
 * ─────────────────────────────────────────────────────────────────
 * Phone Normalization & WhatsApp Deep Link Utilities
 * Formats user phone input to RFC/E.164 standard and generates
 * sanitized WhatsApp URLs.
 * ─────────────────────────────────────────────────────────────────
 */

export interface PhoneValidationResult {
  valid: boolean
  raw: string
  e164?: string
  digitsOnly?: string
  display?: string
  error?: string
}

export const COMMON_COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'United States / Canada', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+971', country: 'United Arab Emirates', flag: '🇦🇪' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
]

/**
 * Normalizes phone numbers to standard E.164 and digits-only formats.
 * @param input Raw phone input string from user
 * @param defaultCountryCode Optional country code prefix if not included in input (default: '+91')
 */
export function normalizePhoneNumber(
  input: string,
  defaultCountryCode = '+91'
): PhoneValidationResult {
  if (!input || typeof input !== 'string') {
    return { valid: false, raw: input || '', error: 'Phone number is required' }
  }

  const trimmed = input.trim()
  // Keep only digits and leading plus
  let cleaned = trimmed.replace(/[^\d+]/g, '')

  if (!cleaned) {
    return { valid: false, raw: trimmed, error: 'Phone number contains no digits' }
  }

  // Handle leading plus
  let hasPlus = cleaned.startsWith('+')
  let digits = cleaned.replace(/\D/g, '')

  if (digits.length < 7) {
    return { valid: false, raw: trimmed, error: 'Phone number is too short (min 7 digits)' }
  }

  if (digits.length > 15) {
    return { valid: false, raw: trimmed, error: 'Phone number exceeds maximum length (15 digits)' }
  }

  let e164: string
  if (hasPlus) {
    e164 = `+${digits}`
  } else {
    const cleanDefault = defaultCountryCode.replace(/\D/g, '')
    // If input already starts with the country code digits (e.g. 919876543210 with default +91)
    if (cleanDefault && digits.startsWith(cleanDefault) && digits.length > 10) {
      e164 = `+${digits}`
    } else {
      e164 = `+${cleanDefault}${digits}`
    }
  }

  const finalDigits = e164.replace(/\D/g, '')

  if (finalDigits.length < 8 || finalDigits.length > 15) {
    return { valid: false, raw: trimmed, error: 'Invalid international phone format' }
  }

  return {
    valid: true,
    raw: trimmed,
    e164,
    digitsOnly: finalDigits,
    display: formatPhoneDisplay(e164),
  }
}

/**
 * Generates an official WhatsApp Click-to-Chat deep link.
 * wa.me requires phone number without leading '+' or symbols.
 */
export function buildWhatsAppUrl(
  phone: string,
  message?: string,
  defaultCountryCode = '+91'
): string | null {
  const normalized = normalizePhoneNumber(phone, defaultCountryCode)
  if (!normalized.valid || !normalized.digitsOnly) {
    return null
  }

  const base = `https://wa.me/${normalized.digitsOnly}`
  if (!message) {
    return base
  }

  return `${base}?text=${encodeURIComponent(message.trim())}`
}

function formatPhoneDisplay(e164: string): string {
  // Simple clean formatting e.g. +91 98765 43210
  if (e164.startsWith('+91') && e164.length === 13) {
    return `+91 ${e164.slice(3, 8)} ${e164.slice(8)}`
  }
  if (e164.startsWith('+1') && e164.length === 12) {
    return `+1 (${e164.slice(2, 5)}) ${e164.slice(5, 8)}-${e164.slice(8)}`
  }
  return e164
}
