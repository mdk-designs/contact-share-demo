'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react'
import {
  QrCode,
  Download,
  Copy,
  Check,
  ExternalLink,
  Share2,
  Nfc,
  BarChart2,
  Smartphone,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getSupabaseClient } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function MemberQRPage() {
  const { user, profile } = useAuth()
  const [copied, setCopied] = useState(false)
  const [copiedNfc, setCopiedNfc] = useState(false)
  const [scansCount, setScansCount] = useState<number>(0)
  const [loadingScans, setLoadingScans] = useState<boolean>(true)
  const [fgColor, setFgColor] = useState<string>('#0F172A')

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://contactforge.io'
  const cardSlug = profile?.slug || 'my-card'
  const cardUrl = `${origin}/c/${cardSlug}`
  const qrTargetUrl = `${cardUrl}?src=qr`
  const nfcTargetUrl = `${cardUrl}?src=nfc`

  // Fetch scan analytics for this user's profile
  useEffect(() => {
    async function fetchScans() {
      if (!profile?.id) {
        setLoadingScans(false)
        return
      }
      try {
        const client = getSupabaseClient()
        if (client) {
          const { count, error } = await client
            .from('qr_scans')
            .select('*', { count: 'exact', head: true })
            .eq('profile_id', profile.id)

          if (!error && typeof count === 'number') {
            setScansCount(count)
          }
        }
      } catch (err) {
        console.warn('Could not load QR scan count:', err)
      } finally {
        setLoadingScans(false)
      }
    }
    fetchScans()
  }, [profile?.id])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(cardUrl)
    setCopied(true)
    toast.success('Card link copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyNfcLink = () => {
    navigator.clipboard.writeText(nfcTargetUrl)
    setCopiedNfc(true)
    toast.success('NFC Tag URL copied! Paste this into your NFC tag writer tool.')
    setTimeout(() => setCopiedNfc(false), 2000)
  }

  const handleDownloadPNG = () => {
    const canvas = document.getElementById('personal-qr-canvas') as HTMLCanvasElement
    if (!canvas) return
    const pngUrl = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = pngUrl
    a.download = `QR-${cardSlug}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast.success('High-res QR code downloaded!')
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.first_name || 'My'} Digital Business Card`,
          text: `Connect with ${profile?.first_name || 'me'} on ContactForge!`,
          url: cardUrl,
        })
      } catch {
        // Ignored if cancelled
      }
    } else {
      handleCopyLink()
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              My Personal QR &amp; NFC Code
            </h1>
            <Badge variant="mint" className="text-[10px] font-bold uppercase tracking-wider">
              Live &amp; Scannable
            </Badge>
          </div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Scan to instantly view your digital card, exchange contact info, and download your vCard.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="rounded-xl text-xs border-[var(--border-card)] shadow-xs"
          >
            {copied ? <Check size={14} className="text-emerald-500 mr-1.5" /> : <Copy size={14} className="mr-1.5" />}
            <span>{copied ? 'Copied' : 'Copy Clean Link'}</span>
          </Button>

          <Button
            size="sm"
            asChild
            className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-semibold shadow-xs"
          >
            <Link href={`/c/${cardSlug}`} target="_blank" rel="noopener noreferrer">
              <span>Preview Card</span>
              <ExternalLink size={13} className="ml-1.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: Interactive QR Card */}
        <div className="md:col-span-7 flex flex-col items-center">
          <Card className="w-full rounded-3xl border-[var(--border-card)] bg-[var(--bg-card)] shadow-lg overflow-hidden text-center">
            <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-indigo-500/10 p-8 flex flex-col items-center">
              {/* QR Container */}
              <div className="relative p-6 bg-white rounded-3xl shadow-xl ring-1 ring-slate-900/5 transition-transform hover:scale-[1.02] duration-300">
                <QRCodeSVG
                  value={qrTargetUrl}
                  size={240}
                  level="H"
                  fgColor={fgColor}
                  bgColor="#FFFFFF"
                  includeMargin={false}
                />

                {/* Hidden canvas for high-res PNG export */}
                <div className="hidden">
                  <QRCodeCanvas
                    id="personal-qr-canvas"
                    value={qrTargetUrl}
                    size={1024}
                    level="H"
                    fgColor={fgColor}
                    bgColor="#FFFFFF"
                    includeMargin={true}
                  />
                </div>
              </div>

              <div className="mt-5">
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  {profile ? `${profile.first_name} ${profile.last_name}` : 'Digital Business Card'}
                </h3>
                <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                  /c/{cardSlug}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-5 border-t border-[var(--border-subtle)] bg-[var(--bg-sheet)]/30 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPNG}
                className="rounded-xl text-xs font-semibold border-[var(--border-card)] shadow-xs"
              >
                <Download size={14} className="mr-1.5 text-emerald-500" />
                <span>Download PNG (1024px)</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="rounded-xl text-xs font-semibold border-[var(--border-card)] shadow-xs"
              >
                <Share2 size={14} className="mr-1.5 text-indigo-500" />
                <span>Share Card</span>
              </Button>
            </div>
          </Card>
        </div>

        {/* Right: NFC Setup & Analytics */}
        <div className="md:col-span-5 space-y-4">
          {/* Analytics Stats */}
          <Card className="rounded-2xl border-[var(--border-card)] bg-[var(--bg-card)] p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <BarChart2 size={16} className="text-emerald-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                QR Code Analytics
              </h2>
            </div>
            <p className="text-3xl font-black text-[var(--text-primary)]">
              {loadingScans ? '…' : scansCount}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              Total lifetime card scans logged on ContactForge.
            </p>
          </Card>

          {/* NFC Tag Configuration */}
          <Card className="rounded-2xl border-[var(--border-card)] bg-[var(--bg-card)] p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone size={16} className="text-indigo-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                NFC Tag Writing
              </h2>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Write this canonical URL into your physical NFC smart card, sticker, or phone badge using any NFC writing app (e.g. NFC Tools):
            </p>
            <div className="mt-3 p-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] font-mono text-[11px] text-[var(--text-primary)] truncate">
              {nfcTargetUrl}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyNfcLink}
              className="mt-3 w-full rounded-xl text-xs font-semibold"
            >
              {copiedNfc ? <Check size={13} className="text-emerald-500 mr-1.5" /> : <Copy size={13} className="mr-1.5" />}
              <span>{copiedNfc ? 'NFC Link Copied' : 'Copy NFC Target URL'}</span>
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
