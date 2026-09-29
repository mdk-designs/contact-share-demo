import { NextRequest, NextResponse } from 'next/server'
import { getProfileBySlug } from '@/lib/supabase'
import { CARD_CONFIG } from '@/lib/config'
import { generateVCardString } from '@/lib/vcard'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const cleanSlug = decodeURIComponent(slug).toLowerCase()

  // 1. Attempt database lookup
  const profile = await getProfileBySlug(cleanSlug)

  let vcardData
  let filename = `${cleanSlug}.vcf`

  if (profile) {
    vcardData = {
      firstName: profile.first_name,
      lastName: profile.last_name,
      organization: profile.company_name,
      jobTitle: profile.job_title,
      workEmail: profile.work_email,
      workPhone: profile.work_phone,
      mobilePhone: profile.mobile_phone,
      url: profile.website_url,
      address: profile.address,
      bio: profile.bio,
    }
    filename = `${profile.first_name}_${profile.last_name}.vcf`.replace(/\s+/g, '_')
  } else {
    // Fallback to default card config if profile is not in database
    vcardData = {
      firstName: CARD_CONFIG.firstName,
      lastName: CARD_CONFIG.lastName,
      organization: CARD_CONFIG.organization,
      jobTitle: CARD_CONFIG.title,
      workEmail: CARD_CONFIG.email,
      workPhone: CARD_CONFIG.phone,
      mobilePhone: CARD_CONFIG.phone,
      url: CARD_CONFIG.website,
      address: CARD_CONFIG.location,
      bio: `${CARD_CONFIG.title} at ${CARD_CONFIG.organization}`,
    }
    filename = CARD_CONFIG.vcfFilename || 'contact.vcf'
  }

  const vcardBody = generateVCardString(vcardData)

  return new NextResponse(vcardBody, {
    status: 200,
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  })
}
