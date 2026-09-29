'use client'

import { useState, useCallback, useEffect } from 'react'
import CardHero from '@/components/CardHero'
import ContactDetails from '@/components/ContactDetails'
import QRCodeSection from '@/components/QRCodeSection'
import CompanyBadge from '@/components/CompanyBadge'
import ExchangeModal from '@/components/ExchangeModal'
import Toast from '@/components/Toast'
import { ArrowRightLeft, Download, Share2, Check, ShieldCheck } from 'lucide-react'
import type { Profile } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast as sonnerToast } from 'sonner'

interface ClientCardViewProps {
  initialProfile: Profile | null
  slug: string
}

type ToastState = { visible: boolean; type: 'success' | 'error'; message: string }

export default function ClientCardView({ initialProfile, slug }: ClientCardViewProps) {
  const [profile] = useState<Profile | null>(initialProfile)
  const [modalOpen, setModalOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState<ToastState>({ visible: false, type: 'success', message: '' })

  const showToast = useCallback((type: 'success' | 'error', msg: string) => {
    setToast({ visible: true, type, message: msg })
    if (type === 'success') {
      sonnerToast.success(msg)
    } else {
      sonnerToast.error(msg)
    }
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3500)
  }, [])

  const openModal = useCallback(() => setModalOpen(true), [])
  const closeModal = useCallback(() => setModalOpen(false), [])

  const vcfUrl = `/api/vcard/${slug}`

  // 1-tap direct vCard download
  const handleDirectDownload = useCallback(() => {
    // Remove old loader if present
    const oldLoader = document.getElementById('direct-vcf-loader')
    if (oldLoader) oldLoader.remove()

    const iframe = document.createElement('iframe')
    iframe.id = 'direct-vcf-loader'
    iframe.style.cssText =
      'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none;opacity:0;pointer-events:none;'
    iframe.src = `${vcfUrl}?t=${Date.now()}`
    document.body.appendChild(iframe)

    showToast('success', '📥 Downloading contact card (.vcf)...')
    setTimeout(() => iframe.remove(), 6000)
  }, [vcfUrl, showToast])

  // Share card via native Web Share API or copy link
  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : `https://app-amber-phi-95.vercel.app/c/${slug}`
    const shareTitle = `${profile?.first_name || 'Contact'} ${profile?.last_name || ''} · Digital Business Card`

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `Connect with ${profile?.first_name || 'me'} on ContactForge:`,
          url: shareUrl,
        })
        return
      } catch {
        // Fallback to clipboard
      }
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      showToast('success', '🔗 Card link copied to clipboard!')
      setTimeout(() => setCopied(false), 2500)
    }
  }

  // Record scan event telemetry once mounted
  useEffect(() => {
    fetch(`/api/scan/${slug}`, { method: 'POST' }).catch(() => {})
  }, [slug])

  return (
    <>
      {/* ── Phone frame ── */}
      <div className="phone-frame">
        {/* ── Top Utility Pill Bar ── */}
        <div className="w-full pt-3 px-4 flex items-center justify-between z-30 bg-transparent">
          <Badge variant="outline" className="gap-1.5 rounded-full bg-[var(--bg-card)]/80 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-[var(--text-secondary)] border-[var(--border-card)] shadow-xs">
            <ShieldCheck size={13} className="text-indigo-500" />
            <span>Verified Digital Card</span>
          </Badge>

          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="h-7 rounded-full bg-[var(--bg-card)]/80 backdrop-blur-md px-3 text-[11px] font-semibold text-[var(--text-secondary)] border-[var(--border-card)] hover:bg-[var(--border-subtle)] shadow-xs gap-1.5"
            aria-label="Share contact card link"
          >
            {copied ? <Check size={12} className="text-emerald-500" /> : <Share2 size={12} />}
            <span>{copied ? 'Copied' : 'Share'}</span>
          </Button>
        </div>

        <CardHero profile={profile} />

        <main className="content-sheet" aria-label="Business card details">
          {/* Quick Action Buttons directly in flow */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <Button
              variant="outline"
              onClick={handleDirectDownload}
              className="h-11 rounded-2xl border-[var(--border-card)] bg-[var(--bg-card)] px-3.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--border-subtle)] shadow-xs gap-1.5"
              id="hero-save-contact-btn"
              aria-label="Directly download contact vCard file"
            >
              <Download size={14} className="text-indigo-500" />
              <span>Save Contact</span>
            </Button>

            <Button
              variant="gradient"
              onClick={openModal}
              className="h-11 rounded-2xl px-3.5 text-xs font-semibold shadow-xs gap-1.5"
              id="hero-exchange-btn"
              aria-label="Exchange contact information"
            >
              <ArrowRightLeft size={14} />
              <span>Exchange</span>
            </Button>
          </div>

          <ContactDetails profile={profile} />
          <QRCodeSection profile={profile} targetUrl={typeof window !== 'undefined' ? window.location.href : undefined} />
          <CompanyBadge profile={profile} />

          {/* Footer branding */}
          <footer className="pt-4 pb-20 text-center">
            <p className="text-[11px] text-[var(--text-muted)]">
              Powered by <span className="font-semibold text-[var(--text-primary)]">ContactForge</span> Platform
            </p>
          </footer>
        </main>
      </div>

      {/* ── Sticky Bottom CTA Bar ── */}
      <div className="cta-sticky" role="complementary" aria-label="Exchange contact action">
        <div className="flex w-full items-center gap-2">
          <button
            onClick={handleDirectDownload}
            className="flex h-[48px] w-[52px] flex-shrink-0 items-center justify-center rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] text-[var(--text-primary)] shadow-md transition-transform active:scale-95 hover:bg-[var(--border-subtle)] pointer-events-auto"
            title="Download vCard file directly"
            aria-label="Download vCard file directly"
          >
            <Download size={18} className="text-indigo-500" />
          </button>

          <button
            className="cta-btn flex-1 !m-0 !h-[48px]"
            onClick={openModal}
            id="cta-exchange-btn"
            aria-label="Open contact exchange form"
            aria-haspopup="dialog"
            aria-expanded={modalOpen}
          >
            <ArrowRightLeft size={16} aria-hidden="true" />
            <span>Exchange &amp; Save Contact</span>
          </button>
        </div>
      </div>

      {/* ── Two-Way Contact Exchange Modal ── */}
      <ExchangeModal
        open={modalOpen}
        onClose={closeModal}
        onToast={showToast}
        profile={profile}
        vcfUrl={vcfUrl}
      />

      {/* ── Notification Toast ── */}
      <Toast visible={toast.visible} type={toast.type} message={toast.message} />
    </>
  )
}
