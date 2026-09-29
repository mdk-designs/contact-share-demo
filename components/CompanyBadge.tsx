import { CARD_CONFIG } from '@/lib/config'

import type { Profile } from '@/lib/supabase'

interface CompanyBadgeProps {
  profile?: Profile | null
}

export default function CompanyBadge({ profile }: CompanyBadgeProps) {
  const organization = profile?.company_name || CARD_CONFIG.organization
  const companyInitials =
    organization
      .split(' ')
      .map((w) => w[0])
      .filter(Boolean)
      .join('')
      .slice(0, 2)
      .toUpperCase() || CARD_CONFIG.companyInitials
  const companyTagline = profile?.department || CARD_CONFIG.companyTagline
  const website = profile?.website_url || CARD_CONFIG.website

  if (!organization) return null

  return (
    <section aria-label="Company information">
      <div className="glass-card">
        <a
          href={website.startsWith('http') ? website : `https://${website}`}
          target="_blank"
          rel="noopener noreferrer"
          className="company-badge-wrap"
          aria-label={`Visit ${organization} website`}
          id="company-badge"
        >
          <div className="company-logo-mark" aria-hidden="true">{companyInitials}</div>
          <div>
            <p className="company-name-text">{organization}</p>
            <p className="company-role-text">{companyTagline}</p>
          </div>
        </a>
      </div>
    </section>
  )
}
