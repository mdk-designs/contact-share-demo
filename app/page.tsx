'use client'

import { useState, useCallback } from 'react'
import CardHero from '@/components/CardHero'
import ContactDetails from '@/components/ContactDetails'
import QRCodeSection from '@/components/QRCodeSection'
import CompanyBadge from '@/components/CompanyBadge'
import ExchangeModal from '@/components/ExchangeModal'
import Toast from '@/components/Toast'
import { ArrowRightLeft } from 'lucide-react'

type ToastState = { visible: boolean; type: 'success' | 'error'; message: string }

export default function HomePage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [toast, setToast] = useState<ToastState>({ visible: false, type: 'success', message: '' })

  const showToast = useCallback((type: 'success' | 'error', msg: string) => {
    setToast({ visible: true, type, message: msg })
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3500)
  }, [])

  const openModal  = useCallback(() => setModalOpen(true), [])
  const closeModal = useCallback(() => setModalOpen(false), [])

  return (
    <>
      {/* ── Phone frame ── */}
      <div className="phone-frame">
        <CardHero />
        <main className="content-sheet" aria-label="Business card details">
          <ContactDetails />
          <QRCodeSection />
          <CompanyBadge />
        </main>
      </div>

      {/* ── Sticky CTA ── */}
      <div className="cta-sticky" role="complementary" aria-label="Exchange contact action">
        <button
          className="cta-btn"
          onClick={openModal}
          id="cta-exchange-btn"
          aria-label="Open contact exchange form"
          aria-haspopup="dialog"
          aria-expanded={modalOpen}
        >
          <ArrowRightLeft size={18} aria-hidden="true" />
          Exchange &amp; Save Contact
        </button>
      </div>

      {/* ── Modal ── */}
      <ExchangeModal open={modalOpen} onClose={closeModal} onToast={showToast} />

      {/* ── Toast ── */}
      <Toast visible={toast.visible} type={toast.type} message={toast.message} />
    </>
  )
}
