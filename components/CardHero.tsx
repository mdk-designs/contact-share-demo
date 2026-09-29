import { memo } from 'react'
import { CARD_CONFIG } from '@/lib/config'
import ThemeToggle from '@/components/ThemeToggle'
import type { Profile } from '@/lib/supabase'

/* ── Inline brand SVGs (lucide-react v1 removed brand icons) ── */
const LinkedInSVG = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect x="2" y="9" width="4" height="12"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
)

const GithubSVG = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
  </svg>
)

const GlobeSVG = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
)

const XSVG = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)

interface CardHeroProps {
  profile?: Profile | null
}

function CardHeroComponent({ profile }: CardHeroProps) {
  const firstName = profile?.first_name || CARD_CONFIG.firstName
  const lastName = profile?.last_name || CARD_CONFIG.lastName
  const title = profile?.job_title || profile?.headline || CARD_CONFIG.title
  const linkedIn = profile?.social_links?.linkedin || CARD_CONFIG.linkedIn
  const github = profile?.social_links?.github || CARD_CONFIG.github
  const website = profile?.website_url || CARD_CONFIG.website
  const twitter = profile?.social_links?.twitter || CARD_CONFIG.twitter
  const avatarUrl = profile?.avatar_url

  return (
    <header className="hero" role="banner">
      {/* Theme toggle */}
      <ThemeToggle floating />

      {/* Modern pastel avatar ring */}
      <div className="avatar-wrap" aria-hidden="true">
        <div className="avatar-ring" />
        <div className="avatar-ring-mask" />
        <div className="avatar-inner" style={{ overflow: 'hidden' }}>
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={`${firstName} ${lastName}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            `${firstName[0] || 'D'}${lastName[0] || 'K'}`
          )}
        </div>
      </div>

      {/* Category badge */}
      <span className="script-accent" aria-hidden="true">Digital Business Card</span>

      {/* Name */}
      <h1 className="hero-name" id="card-name">{firstName} {lastName}</h1>

      {/* Role badge */}
      <div className="hero-badge" role="note" aria-label={`Role: ${title}`}>
        <span className="badge-dot" aria-hidden="true" />
        {title}
      </div>

      {/* Social strip */}
      <nav className="social-strip" aria-label="Social profiles">
        {linkedIn ? (
          <a href={linkedIn} target="_blank" rel="noopener noreferrer"
             className="social-btn" aria-label="LinkedIn profile" id="hero-linkedin">
            <LinkedInSVG />
          </a>
        ) : null}
        {github ? (
          <a href={github} target="_blank" rel="noopener noreferrer"
             className="social-btn" aria-label="GitHub profile" id="hero-github">
            <GithubSVG />
          </a>
        ) : null}
        {website ? (
          <a href={website} target="_blank" rel="noopener noreferrer"
             className="social-btn" aria-label="Portfolio website" id="hero-portfolio">
            <GlobeSVG />
          </a>
        ) : null}
        {twitter ? (
          <a href={twitter} target="_blank" rel="noopener noreferrer"
             className="social-btn" aria-label="X / Twitter profile" id="hero-twitter">
            <XSVG />
          </a>
        ) : null}
      </nav>
    </header>
  )
}

const CardHero = memo(CardHeroComponent)
export default CardHero
