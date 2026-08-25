'use client'

import { QRCodeSVG } from 'qrcode.react'
import { CARD_CONFIG } from '@/lib/config'

export default function QRCodeSection() {
  const { qrUrl, firstName, lastName } = CARD_CONFIG

  return (
    <section aria-label="QR Code" id="qr-section">
      <div className="glass-card">
        <p className="section-label">Scan to Connect</p>
        <div className="divider" />
        <div className="qr-widget">
          <div className="qr-box" role="img" aria-label={`QR code — scan to open ${firstName} ${lastName}'s card`}>
            <QRCodeSVG
              value={qrUrl}
              size={90}
              bgColor="#ffffff"
              fgColor="#0B132B"
              level="M"
              marginSize={0}
            />
          </div>
          <div className="qr-copy">
            <p className="qr-copy-title">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/>
                <path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
              </svg>
              Scan this QR
            </p>
            <p className="qr-copy-sub">
              Point your camera here to open {firstName} {lastName}'s digital card — no app needed.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
