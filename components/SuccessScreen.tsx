'use client'

import { Check, ExternalLink } from 'lucide-react'
import { CARD_CONFIG } from '@/lib/config'

const WhatsAppIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
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
}

export default function SuccessScreen({ visitorName }: SuccessScreenProps) {
  const { phone, linkedIn, website, firstName, whatsappMessage } = CARD_CONFIG

  const waLink = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}`
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

      <h3 className="success-title">Contact Saved!</h3>
      <p className="success-sub">
        {firstName}'s contact was sent to your phone.{'\n'}
        What's next, {displayName}?
      </p>

      {/* Action buttons */}
      <div style={{ width: '100%' }}>
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="action-btn btn-whatsapp"
          id="success-whatsapp-btn"
          aria-label={`Message ${firstName} on WhatsApp`}
        >
          <WhatsAppIcon />
          Message on WhatsApp
          <ExternalLink size={14} aria-hidden="true" />
        </a>

        <a
          href={linkedIn}
          target="_blank"
          rel="noopener noreferrer"
          className="action-btn btn-linkedin"
          id="success-linkedin-btn"
          aria-label={`Connect with ${firstName} on LinkedIn`}
        >
          <LinkedInIcon />
          Connect on LinkedIn
          <ExternalLink size={14} aria-hidden="true" />
        </a>

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
          Explore Portfolio
          <ExternalLink size={14} aria-hidden="true" />
        </a>
      </div>
    </div>
  )
}
