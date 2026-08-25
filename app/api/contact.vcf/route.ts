import { NextResponse } from 'next/server'
import { CARD_CONFIG } from '@/lib/config'

/**
 * GET /api/contact.vcf
 *
 * Serves a vCard 3.0 string with:
 *   Content-Type: text/vcard; charset=utf-8
 *   Content-Disposition: inline; filename="..."
 *
 * When loaded inside a hidden <iframe> on mobile:
 *  - iOS Safari  → native "Add to Contacts" overlay appears over the page
 *  - Android     → system contacts app launches the save prompt
 *
 * The page itself stays alive in the background throughout.
 */
export async function GET() {
  const {
    firstName,
    lastName,
    title,
    organization,
    phoneDisplay,
    email,
    website,
    location,
    linkedIn,
    vcfFilename,
  } = CARD_CONFIG

  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${lastName};${firstName};;;`,
    `FN:${firstName} ${lastName}`,
    `ORG:${organization}`,
    `TITLE:${title}`,
    `TEL;TYPE=CELL,VOICE:${phoneDisplay}`,
    `EMAIL;TYPE=WORK,INTERNET:${email}`,
    `URL:${website}`,
    `ADR;TYPE=WORK:;;${location};;;;`,
    `X-SOCIALPROFILE;TYPE=linkedin:${linkedIn}`,
    `NOTE:Digital Card — ${website}`,
    'END:VCARD',
  ].join('\r\n')

  return new NextResponse(vcard, {
    status: 200,
    headers: {
      // These two headers are what trigger native OS contact prompts
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': `inline; filename="${vcfFilename}"`,
      // Prevent any caching so a fresh VCF is always fetched
      'Cache-Control': 'no-store, must-revalidate',
    },
  })
}
