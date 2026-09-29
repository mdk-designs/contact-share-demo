'use client'

import { QRCodeSVG } from 'qrcode.react'
import { CARD_CONFIG } from '@/lib/config'

import type { Profile } from '@/lib/supabase'
import { useEffect, useState } from 'react'

interface QRCodeSectionProps {
  profile?: Profile | null
  targetUrl?: string
}

export default function QRCodeSection({ profile, targetUrl }: QRCodeSectionProps) {
  const firstName = profile?.first_name || CARD_CONFIG.firstName
  const lastName = profile?.last_name || CARD_CONFIG.lastName
  const [resolvedUrl, setResolvedUrl] = useState(targetUrl || CARD_CONFIG.qrUrl)

  useEffect(() => {
    if (targetUrl) {
      setResolvedUrl(targetUrl)
    } else if (profile?.slug) {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://app-amber-phi-95.vercel.app'
      setResolvedUrl(`${origin}/c/${profile.slug}`)
    }
  }, [profile?.slug, targetUrl])

  return (
    <section aria-label="QR Code" id="qr-section">
      <div className="glass-card">
        <p className="section-label">Scan to Connect</p>
        <div className="divider" />
        <div className="qr-widget">
          <div className="qr-box" role="img" aria-label={`QR code — scan to open ${firstName} ${lastName}'s card`}>
            <QRCodeSVG
              value={resolvedUrl}
              size={90}
              bgColor="#ffffff"
              fgColor="#0F172A"
              level="M"
              marginSize={0}
            />
          </div>
          <div className="qr-copy">
            <p className="qr-copy-title">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/>
                <path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
              </svg>
              Scan this QR
            </p>
            <p className="qr-copy-sub">
              Point your camera here to open {firstName} {lastName}&apos;s digital card — no app needed.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
