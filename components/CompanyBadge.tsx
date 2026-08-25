import { CARD_CONFIG } from '@/lib/config'

export default function CompanyBadge() {
  const { organization, companyInitials, companyTagline, website } = CARD_CONFIG

  return (
    <section aria-label="Company information">
      <div className="glass-card">
        <a
          href={website}
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
