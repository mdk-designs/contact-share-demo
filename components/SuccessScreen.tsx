'use client'

import { Check, ExternalLink, Download, Send } from 'lucide-react'
import { CARD_CONFIG } from '@/lib/config'
import type { Profile } from '@/lib/supabase'

const WhatsAppIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
  </svg>
)

const TelegramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.16l-1.92 9.07c-.14.65-.53.81-1.07.51l-2.98-2.2-1.44 1.39c-.16.16-.29.29-.6.29l.21-3.05 5.56-5.02c.24-.22-.05-.34-.38-.13l-6.87 4.33-2.95-.92c-.64-.2-.65-.64.13-.95l11.53-4.44c.53-.2 1 .12.77 1.12z"/>
  </svg>
)

const LinkedInIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect x="2" y="9" width="4" height="12"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
)

interface SuccessScreenProps {
  visitorName: string
  profile?: Profile | null
  fallbackDownload?: boolean
  vcfUrl?: string
  telegramDeepLink?: string | null
}

export default function SuccessScreen({
  visitorName,
  profile,
  fallbackDownload,
  vcfUrl,
  telegramDeepLink,
}: SuccessScreenProps) {
  const firstName = profile?.first_name || CARD_CONFIG.firstName
  const phone = profile?.mobile_phone || profile?.work_phone || CARD_CONFIG.phone
  const linkedIn = profile?.social_links?.linkedin || CARD_CONFIG.linkedIn
  const website = profile?.website_url || CARD_CONFIG.website
  const whatsappMessage = `Hi ${firstName}! I just saved your contact card and wanted to connect.`
  const vcfFilename = profile ? `${profile.first_name || 'Contact'}.vcf` : CARD_CONFIG.vcfFilename
  const activeVcfDownloadUrl = vcfUrl || (profile?.slug ? `/api/vcard/${profile.slug}` : '/api/contact.vcf')

  const waLink = phone ? `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}` : null
  const displayName = visitorName.split(' ')[0] || visitorName

  return (
    <div className="success-screen" role="status" aria-live="polite" aria-label="Contact exchange successful">
      {/* Animated check ring */}
      <div className="success-check-ring" aria-hidden="true">
        <div className="check-ring-outer" />
        <div className="check-icon-wrap">
          <Check size={26} strokeWidth={2.5} />
        </div>
      </div>

      <h3 className="success-title">{fallbackDownload ? 'Contact Ready!' : 'Contact Exchanged!'}</h3>
      
      <p className="success-sub">
        {firstName}&apos;s contact card is ready. What&apos;s next, {displayName}?
      </p>

      {/* Action buttons */}
      <div style={{ width: '100%' }} className="space-y-2 mt-4">
        {/* Telegram Direct Delivery Button (if configured) */}
        {telegramDeepLink && (
          <a
            href={telegramDeepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="action-btn !bg-sky-500 hover:!bg-sky-600 !text-white !border-none shadow-md font-semibold flex items-center justify-center gap-2"
            id="success-telegram-btn"
            aria-label="Receive contact card on Telegram"
          >
            <TelegramIcon />
            <span>Get vCard on Telegram</span>
            <ExternalLink size={14} aria-hidden="true" className="opacity-75" />
          </a>
        )}

        {/* 1-Tap Direct vCard Download Button */}
        <a
          href={`${activeVcfDownloadUrl}?download=1&t=${Date.now()}`}
          download={vcfFilename}
          className="action-btn !bg-indigo-600 hover:!bg-indigo-700 !text-white !border-none shadow-md font-semibold flex items-center justify-center gap-2"
          id="success-direct-download-btn"
          aria-label={`Save ${firstName}'s contact file`}
        >
          <Download size={16} />
          <span>Save Contact Card (.vcf)</span>
        </a>

        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="action-btn btn-whatsapp"
            id="success-whatsapp-btn"
            aria-label={`Message ${firstName} on WhatsApp`}
          >
            <WhatsAppIcon />
            <span>Message on WhatsApp</span>
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        )}

        {linkedIn && (
          <a
            href={linkedIn}
            target="_blank"
            rel="noopener noreferrer"
            className="action-btn btn-linkedin"
            id="success-linkedin-btn"
            aria-label={`Connect with ${firstName} on LinkedIn`}
          >
            <LinkedInIcon />
            <span>Connect on LinkedIn</span>
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        )}

        {website && (
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className="action-btn btn-portfolio"
            id="success-portfolio-btn"
            aria-label={`Explore ${firstName}'s portfolio`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
            <span>Explore Portfolio</span>
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        )}
      </div>
    </div>
  )
}
