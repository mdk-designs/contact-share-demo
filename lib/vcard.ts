/**
 * ─────────────────────────────────────────────────────────────────
 * RFC 6350 / vCard 3.0 Generator Engine
 * Produces standardized .vcf cards compatible with iOS Safari,
 * Apple Contacts, Android Contacts, and Microsoft Outlook.
 * Properly escapes semicolons, commas, backslashes and handles Unicode.
 * ─────────────────────────────────────────────────────────────────
 */

export interface VCardData {
  firstName: string
  lastName: string
  organization?: string
  jobTitle?: string
  workEmail?: string
  workPhone?: string
  mobilePhone?: string
  url?: string
  address?: string
  bio?: string
  avatarBase64?: string
}

export interface VisitorVCardData {
  name: string
  phone?: string
  email?: string
  organization?: string
  jobTitle?: string
  notes?: string
}

/**
 * Escapes characters in text values per RFC 2426 Section 2.4.2:
 * Backslashes, commas, semicolons, and newlines must be escaped with a backslash.
 */
export function escapeVCardText(text: string): string {
  if (!text) return ''
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
    .trim()
}

/**
 * Generates Cardholder vCard (Person A to Person B).
 */
export function generateVCardString(data: VCardData): string {
  const firstName = escapeVCardText(data.firstName)
  const lastName = escapeVCardText(data.lastName)
  const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`.trim()

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${lastName};${firstName};;;`,
    `FN:${escapeVCardText(fullName)}`,
    data.organization ? `ORG:${escapeVCardText(data.organization)}` : '',
    data.jobTitle ? `TITLE:${escapeVCardText(data.jobTitle)}` : '',
    data.workEmail ? `EMAIL;TYPE=INTERNET,WORK:${data.workEmail.trim()}` : '',
    data.workPhone ? `TEL;TYPE=WORK,VOICE:${data.workPhone.trim()}` : '',
    data.mobilePhone ? `TEL;TYPE=CELL,VOICE:${data.mobilePhone.trim()}` : '',
    data.url ? `URL:${data.url.trim()}` : '',
    data.address ? `ADR;TYPE=WORK:;;${escapeVCardText(data.address)};;;;` : '',
    data.bio ? `NOTE:${escapeVCardText(data.bio)}` : '',
    data.avatarBase64 ? `PHOTO;ENCODING=b;TYPE=JPEG:${data.avatarBase64.replace(/\s+/g, '')}` : '',
    `REV:${new Date().toISOString()}`,
    'END:VCARD',
  ]

  return lines.filter(Boolean).join('\r\n')
}

/**
 * Generates Visitor vCard (Person B to Person A).
 */
export function generateVisitorVCardString(visitor: VisitorVCardData): string {
  const trimmedName = visitor.name.trim()
  const parts = trimmedName.split(/\s+/)
  const rawFirst = parts[0] || 'Contact'
  const rawLast = parts.slice(1).join(' ') || ''

  const firstName = escapeVCardText(rawFirst)
  const lastName = escapeVCardText(rawLast)

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${lastName};${firstName};;;`,
    `FN:${escapeVCardText(trimmedName)}`,
    visitor.organization ? `ORG:${escapeVCardText(visitor.organization)}` : '',
    visitor.jobTitle ? `TITLE:${escapeVCardText(visitor.jobTitle)}` : '',
    visitor.email ? `EMAIL;TYPE=INTERNET,WORK:${visitor.email.trim()}` : '',
    visitor.phone ? `TEL;TYPE=CELL,VOICE:${visitor.phone.trim()}` : '',
    visitor.notes ? `NOTE:${escapeVCardText(visitor.notes)}` : '',
    `REV:${new Date().toISOString()}`,
    'END:VCARD',
  ]

  return lines.filter(Boolean).join('\r\n')
}
