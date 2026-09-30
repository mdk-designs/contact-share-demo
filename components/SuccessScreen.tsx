'use client'

import { useState } from 'react'
import { Check, Download, Send, MessageCircle } from 'lucide-react'
import type { Profile } from '@/lib/supabase'

interface SuccessScreenProps {
  visitorName: string
  profile?: Profile | null
  vcfUrl?: string
  whatsappUrl?: string | null
  telegramDeepLink?: string | null
  exchangeId?: string | null
}

export default function SuccessScreen({
  visitorName,
  profile,
  vcfUrl,
  whatsappUrl,
  telegramDeepLink,
  exchangeId,
}: SuccessScreenProps) {
  const firstName = profile?.first_name || 'Contact'
  const vcfFilename = `${profile?.first_name || 'Contact'}_${profile?.last_name || ''}.vcf`.replace(/\s+/g, '_')
  const activeVcfDownloadUrl = vcfUrl || (profile?.slug ? `/api/vcard/${profile.slug}` : '/api/contact.vcf')
  const displayName = visitorName.split(' ')[0] || visitorName

  const [downloaded, setDownloaded] = useState(false)

  const handleWhatsAppClick = () => {
    if (exchangeId) {
      fetch(`/api/exchanges/${exchangeId}/whatsapp-click`, { method: 'POST' }).catch(() => {})
    }
  }

  const handleDownloadClick = () => {
    setDownloaded(true)
  }

  return (
    <div className="success-screen p-6 text-center" role="status" aria-live="polite" aria-label="Contact exchange successful">
      {/* Animated check ring */}
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 ring-8 ring-emerald-500/5">
        <Check size={32} strokeWidth={2.5} className="animate-in zoom-in-50 duration-300" />
      </div>

      <h3 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Contact Exchanged!</h3>
      
      <p className="mt-2 text-xs text-[var(--text-secondary)] leading-relaxed max-w-xs mx-auto">
        {firstName}&apos;s contact card is ready. What&apos;s next, <span className="font-semibold text-[var(--text-primary)]">{displayName}</span>?
      </p>

      {/* Action buttons */}
      <div className="mt-6 flex flex-col gap-2.5 w-full">
        {/* 1. Primary Download Contact Button */}
        <a
          href={`${activeVcfDownloadUrl}?download=1&t=${Date.now()}`}
          download={vcfFilename}
          onClick={handleDownloadClick}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-xs font-semibold text-white shadow-md hover:brightness-105 transition-all"
          id="success-direct-download-btn"
        >
          <Download size={15} />
          <span>{downloaded ? 'Download Contact Again (.vcf)' : 'Download Contact (.vcf)'}</span>
        </a>

        {/* 2. WhatsApp Person Button */}
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWhatsAppClick}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-3 text-xs font-semibold text-white shadow-md transition-all"
            id="success-whatsapp-btn"
          >
            <MessageCircle size={15} />
            <span>WhatsApp {firstName}</span>
          </a>
        )}

        {/* 3. Telegram Delivery Button (if configured) */}
        {telegramDeepLink && (
          <a
            href={telegramDeepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#229ED9] hover:bg-[#1E88E5] px-4 py-3 text-xs font-semibold text-white shadow-md transition-all"
            id="success-telegram-btn"
          >
            <Send size={15} />
            <span>Get Contact in Telegram</span>
          </a>
        )}
      </div>

      <p className="mt-4 text-[10px] text-[var(--text-muted)]">
        The contact card can be added directly to your phone contacts.
      </p>
    </div>
  )
}
