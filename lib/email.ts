import { generateVCardString } from './vcard'
import { getProfileBySlug, getSupabaseClient, type Profile, type Lead } from './supabase'

export interface SendVCardEmailParams {
  leadId?: string
  visitorName: string
  visitorEmail: string
  visitorPhone?: string
  visitorCompany?: string
  notes?: string
  profile: Profile
  testMode?: boolean
}

/**
 * Generate responsive, modern HTML email template for the visitor receiving the cardholder's vCard.
 */
export function generateVisitorEmailHtml(profile: Profile, visitorName: string): string {
  const firstName = profile.first_name || 'Contact'
  const lastName = profile.last_name || ''
  const fullName = `${firstName} ${lastName}`.trim()
  const title = profile.job_title || ''
  const company = profile.company_name || ''
  const phone = profile.mobile_phone || profile.work_phone || ''
  const email = profile.work_email || ''
  const website = profile.website_url || ''
  const address = profile.address || ''
  const bio = profile.bio || ''
  const cardUrl = `https://app-amber-phi-95.vercel.app/c/${profile.slug}`
  const filename = `${firstName}_${lastName}.vcf`.replace(/\s+/g, '_')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Saved Contact: ${fullName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.05);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 28px; text-align: center; color: #ffffff;">
              <div style="display: inline-block; width: 68px; height: 68px; border-radius: 20px; background: rgba(255, 255, 255, 0.2); border: 2px solid rgba(255, 255, 255, 0.4); line-height: 64px; font-size: 26px; font-weight: 700; color: #ffffff; margin-bottom: 12px;">
                ${firstName[0] || 'C'}${lastName[0] || ''}
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; color: #ffffff;">${fullName}</h1>
              ${title || company ? `<p style="margin: 6px 0 0 0; font-size: 13px; color: rgba(255, 255, 255, 0.9); font-weight: 500;">${[title, company].filter(Boolean).join(' • ')}</p>` : ''}
            </td>
          </tr>

          <!-- Message Body -->
          <tr>
            <td style="padding: 28px 28px 20px 28px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #334155;">
                Hello <strong>${visitorName}</strong>,
              </p>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                Thank you for connecting! As requested via the digital business card exchange, the complete contact card for <strong>${fullName}</strong> is attached to this email (<strong>${filename}</strong>).
              </p>

              ${bio ? `
              <div style="background-color: #f1f5f9; border-left: 3px solid #6366f1; padding: 12px 16px; border-radius: 0 12px 12px 0; margin-bottom: 24px; font-size: 13px; font-style: italic; color: #475569;">
                "${bio}"
              </div>
              ` : ''}

              <!-- Contact Summary Box -->
              <table role="presentation" width="100%" style="background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 24px; padding: 16px;">
                <tr>
                  <td style="padding: 6px 12px; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase;">Direct Phone</td>
                  <td style="padding: 6px 12px; font-size: 13px; color: #0f172a; font-weight: 500; text-align: right;">${phone || '—'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 12px; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase;">Work Email</td>
                  <td style="padding: 6px 12px; font-size: 13px; color: #0f172a; font-weight: 500; text-align: right;">${email || '—'}</td>
                </tr>
                ${website ? `
                <tr>
                  <td style="padding: 6px 12px; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase;">Website</td>
                  <td style="padding: 6px 12px; font-size: 13px; color: #4f46e5; font-weight: 500; text-align: right;">${website}</td>
                </tr>
                ` : ''}
                ${address ? `
                <tr>
                  <td style="padding: 6px 12px; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase;">Location</td>
                  <td style="padding: 6px 12px; font-size: 13px; color: #0f172a; font-weight: 500; text-align: right;">${address}</td>
                </tr>
                ` : ''}
              </table>

              <!-- Attachment Instruction Banner -->
              <div style="background-color: #eef2ff; border: 1px solid #c7d2fe; border-radius: 14px; padding: 14px 16px; text-align: center; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; color: #3730a3; font-weight: 600;">
                  📥 How to save this contact:
                </p>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #4338ca; line-height: 1.4;">
                  Tap or click the attached <strong>${filename}</strong> file at the bottom of this email to import directly into Apple Contacts (iPhone/Mac) or Google Contacts (Android).
                </p>
              </div>

              <!-- Button CTA -->
              <div style="text-align: center; margin-bottom: 12px;">
                <a href="${cardUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-size: 13px; font-weight: 600; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);">
                  View Live Digital Card &rarr;
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top: 1px solid #e2e8f0; padding: 18px 28px; background-color: #fafbfc; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                Powered by <strong>ContactForge</strong> Enterprise Digital Business Cards
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

/**
 * Generate HTML email template to notify the cardholder that a new prospect lead was captured.
 */
export function generateCardholderAlertEmailHtml(profile: Profile, lead: {
  visitorName: string
  visitorEmail?: string
  visitorPhone?: string
  visitorCompany?: string
  notes?: string
}): string {
  const firstName = profile.first_name || 'Team Member'
  const leadsUrl = 'https://app-amber-phi-95.vercel.app/portal/leads'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Lead Captured</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);">
          <tr>
            <td style="background-color: #0f172a; padding: 24px 28px; color: #ffffff;">
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #38bdf8; font-weight: 700; margin-bottom: 4px;">ContactForge • Lead Alert</div>
              <h1 style="margin: 0; font-size: 20px; font-weight: 700;">⚡ New Contact Exchange Received</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 28px;">
              <p style="margin: 0 0 16px 0; font-size: 14px; color: #334155;">
                Hi <strong>${firstName}</strong>, someone just scanned your digital business card and exchanged their contact information:
              </p>

              <table role="presentation" width="100%" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; padding: 14px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 6px 10px; font-size: 12px; color: #64748b; font-weight: 600;">Prospect Name:</td>
                  <td style="padding: 6px 10px; font-size: 13px; color: #0f172a; font-weight: 700;">${lead.visitorName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 10px; font-size: 12px; color: #64748b; font-weight: 600;">Phone:</td>
                  <td style="padding: 6px 10px; font-size: 13px; color: #0f172a; font-weight: 500;">${lead.visitorPhone || '—'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 10px; font-size: 12px; color: #64748b; font-weight: 600;">Email:</td>
                  <td style="padding: 6px 10px; font-size: 13px; color: #0f172a; font-weight: 500;">${lead.visitorEmail || '—'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 10px; font-size: 12px; color: #64748b; font-weight: 600;">Company / Org:</td>
                  <td style="padding: 6px 10px; font-size: 13px; color: #0f172a; font-weight: 500;">${lead.visitorCompany || '—'}</td>
                </tr>
                ${lead.notes ? `
                <tr>
                  <td style="padding: 6px 10px; font-size: 12px; color: #64748b; font-weight: 600;">Notes:</td>
                  <td style="padding: 6px 10px; font-size: 13px; color: #0f172a; font-weight: 500;">${lead.notes}</td>
                </tr>
                ` : ''}
              </table>

              <div style="text-align: center; margin-top: 18px;">
                <a href="${leadsUrl}" target="_blank" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 11px 24px; border-radius: 10px; font-size: 13px; font-weight: 600;">
                  Open Leads Dashboard &rarr;
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="border-top: 1px solid #e2e8f0; padding: 14px 28px; background-color: #fafbfc; text-align: center; font-size: 11px; color: #94a3b8;">
              Captured automatically via ContactForge Platform
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

/**
 * Dispatches vCard email to visitor and alert email to card owner via Resend API.
 */
export async function sendVCardEmail(params: SendVCardEmailParams): Promise<{
  success: boolean
  visitorEmailed: boolean
  ownerAlerted: boolean
  message: string
}> {
  const apiKey = process.env.RESEND_API_KEY
  const { profile, visitorName, visitorEmail, visitorPhone, visitorCompany, notes, leadId } = params

  if (!apiKey) {
    console.warn('[Resend] RESEND_API_KEY environment variable is not configured. Email simulation mode active.')
    return {
      success: true,
      visitorEmailed: false,
      ownerAlerted: false,
      message: 'RESEND_API_KEY not configured. Email logged in simulated mode.',
    }
  }

  const fullName = `${profile.first_name} ${profile.last_name}`.trim()
  const vcardFilename = `${profile.first_name}_${profile.last_name}.vcf`.replace(/\s+/g, '_')

  // 1. Build RFC 6350 vCard
  const vcardString = generateVCardString({
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
  })

  const vcardBase64 = Buffer.from(vcardString, 'utf-8').toString('base64')

  let visitorEmailed = false
  let ownerAlerted = false

  try {
    // 2. Dispatch email to visitor with attached vCard
    if (visitorEmail) {
      const visitorHtml = generateVisitorEmailHtml(profile, visitorName)
      const visitorPayload = {
        from: `"${fullName} (via ContactForge)" <onboarding@resend.dev>`,
        to: [visitorEmail],
        subject: `Saved Contact: ${fullName} (${profile.company_name || 'Contact Card'})`,
        html: visitorHtml,
        attachments: [
          {
            filename: vcardFilename,
            content: vcardBase64,
          },
        ],
      }

      const resVisitor = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(visitorPayload),
      })

      if (resVisitor.ok) {
        visitorEmailed = true
      } else {
        const errText = await resVisitor.text()
        console.warn('[Resend] Visitor email dispatch warning:', errText)
      }
    }

    // 3. Dispatch alert email to cardholder
    if (profile.work_email && profile.work_email !== visitorEmail) {
      const alertHtml = generateCardholderAlertEmailHtml(profile, {
        visitorName,
        visitorEmail,
        visitorPhone,
        visitorCompany,
        notes,
      })

      const alertPayload = {
        from: `"ContactForge Lead Alert" <onboarding@resend.dev>`,
        to: [profile.work_email],
        subject: `⚡ New Lead Captured: ${visitorName} (${visitorCompany || 'Digital Card'})`,
        html: alertHtml,
      }

      const resAlert = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(alertPayload),
      })

      if (resAlert.ok) {
        ownerAlerted = true
      } else {
        const errText = await resAlert.text()
        console.warn('[Resend] Cardholder alert dispatch warning:', errText)
      }
    }

    // 4. Update Supabase leads table if leadId is available
    if (leadId && visitorEmailed) {
      const client = getSupabaseClient()
      if (client) {
        await client
          .from('leads')
          .update({
            vcard_emailed: true,
            vcard_emailed_at: new Date().toISOString(),
          })
          .eq('id', leadId)
      }
    }

    return {
      success: true,
      visitorEmailed,
      ownerAlerted,
      message: visitorEmailed ? 'vCard and alert emails delivered successfully' : 'Email processed',
    }
  } catch (err: any) {
    console.error('[Resend] Unexpected dispatch failure:', err)
    return {
      success: false,
      visitorEmailed,
      ownerAlerted,
      message: err?.message || 'Email dispatch failed',
    }
  }
}
