import { ChevronRight } from 'lucide-react'
import { CARD_CONFIG } from '@/lib/config'

const PhoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.23h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8A16 16 0 0 0 15.2 16.09l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.04z"/>
  </svg>
)

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
)

const GlobeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
)

const MapPinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
)

const contactRows = [
  {
    id: 'cd-phone',
    icon: <PhoneIcon />,
    iconClass: 'icon-green',
    label: 'Phone',
    value: (c: typeof CARD_CONFIG) => c.phoneDisplay,
    href: (c: typeof CARD_CONFIG) => `tel:${c.phone}`,
  },
  {
    id: 'cd-email',
    icon: <MailIcon />,
    iconClass: 'icon-gold',
    label: 'Work Email',
    value: (c: typeof CARD_CONFIG) => c.email,
    href: (c: typeof CARD_CONFIG) => `mailto:${c.email}`,
  },
  {
    id: 'cd-website',
    icon: <GlobeIcon />,
    iconClass: 'icon-blue',
    label: 'Portfolio',
    value: (c: typeof CARD_CONFIG) => c.website.replace('https://', ''),
    href: (c: typeof CARD_CONFIG) => c.website,
  },
  {
    id: 'cd-location',
    icon: <MapPinIcon />,
    iconClass: 'icon-purple',
    label: 'Location',
    value: (c: typeof CARD_CONFIG) => c.location,
    href: (c: typeof CARD_CONFIG) => `https://maps.google.com/?q=${encodeURIComponent(c.location)}`,
  },
]

export default function ContactDetails() {
  const cfg = CARD_CONFIG

  return (
    <section aria-label="Contact details">
      <div className="glass-card">
        <p className="section-label">Contact</p>
        <div className="divider" />
        {contactRows.map((row) => (
          <a
            key={row.id}
            id={row.id}
            href={row.href(cfg)}
            className="contact-row"
            target={row.href(cfg).startsWith('http') ? '_blank' : undefined}
            rel={row.href(cfg).startsWith('http') ? 'noopener noreferrer' : undefined}
            aria-label={`${row.label}: ${row.value(cfg)}`}
          >
            <div className={`contact-icon ${row.iconClass}`}>{row.icon}</div>
            <div className="contact-meta">
              <p className="contact-meta-label">{row.label}</p>
              <p className="contact-meta-value">{row.value(cfg)}</p>
            </div>
            <ChevronRight size={14} className="row-arrow" aria-hidden="true" />
          </a>
        ))}
      </div>
    </section>
  )
}
