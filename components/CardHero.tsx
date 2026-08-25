import { CARD_CONFIG } from '@/lib/config'

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

export default function CardHero() {
  const { firstName, lastName, scriptAccent, title, linkedIn, github, website, twitter } = CARD_CONFIG

  return (
    <header className="hero" role="banner">
      {/* Spinning gold avatar ring */}
      <div className="avatar-wrap" aria-hidden="true">
        <div className="avatar-ring" />
        <div className="avatar-ring-mask" />
        <div className="avatar-inner">
          {firstName[0]}{lastName[0]}
        </div>
      </div>

      {/* Script accent */}
      <p className="script-accent" aria-hidden="true">{scriptAccent}</p>

      {/* Name */}
      <h1 className="hero-name" id="card-name">{firstName} {lastName}</h1>

      {/* Role badge */}
      <div className="hero-badge" role="note" aria-label={`Role: ${title}`}>
        <span className="badge-dot" aria-hidden="true" />
        {title}
      </div>

      {/* Social strip */}
      <nav className="social-strip" aria-label="Social profiles">
        <a href={linkedIn} target="_blank" rel="noopener noreferrer"
           className="social-btn" aria-label="LinkedIn profile" id="hero-linkedin">
          <LinkedInSVG />
        </a>
        <a href={github} target="_blank" rel="noopener noreferrer"
           className="social-btn" aria-label="GitHub profile" id="hero-github">
          <GithubSVG />
        </a>
        <a href={website} target="_blank" rel="noopener noreferrer"
           className="social-btn" aria-label="Portfolio website" id="hero-portfolio">
          <GlobeSVG />
        </a>
        <a href={twitter} target="_blank" rel="noopener noreferrer"
           className="social-btn" aria-label="X / Twitter profile" id="hero-twitter">
          <XSVG />
        </a>
      </nav>
    </header>
  )
}
