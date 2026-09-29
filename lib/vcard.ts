/**
 * ─────────────────────────────────────────────────────────────────
 *  RFC 6350 / vCard 3.0 Generator Engine
 *  Produces standardized .vcf cards compatible with iOS Safari,
 *  Apple Contacts, Android Contacts, and Microsoft Outlook.
 * ─────────────────────────────────────────────────────────────────
 */

export interface VCardData {
  firstName: string
  lastName: string
  organization?: string
  jobTitle?: string
  workEmail: string
  workPhone?: string
  mobilePhone?: string
  url?: string
  address?: string
  bio?: string
  avatarBase64?: string
}

export function generateVCardString(data: VCardData): string {
  const firstName = data.firstName.trim()
  const lastName = data.lastName.trim()

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${lastName};${firstName};;;`,
    `FN:${firstName} ${lastName}`,
    data.organization ? `ORG:${data.organization.trim()}` : '',
    data.jobTitle ? `TITLE:${data.jobTitle.trim()}` : '',
    data.workEmail ? `EMAIL;TYPE=INTERNET,WORK:${data.workEmail.trim()}` : '',
    data.workPhone ? `TEL;TYPE=WORK,VOICE:${data.workPhone.trim()}` : '',
    data.mobilePhone ? `TEL;TYPE=CELL,VOICE:${data.mobilePhone.trim()}` : '',
    data.url ? `URL:${data.url.trim()}` : '',
    data.address ? `ADR;TYPE=WORK:;;${data.address.trim()};;;;` : '',
    data.bio ? `NOTE:${data.bio.replace(/\r?\n/g, '\\n').trim()}` : '',
    data.avatarBase64 ? `PHOTO;ENCODING=b;TYPE=JPEG:${data.avatarBase64.replace(/\s+/g, '')}` : '',
    `REV:${new Date().toISOString()}`,
    'END:VCARD',
  ]

  return lines.filter(Boolean).join('\r\n')
}
