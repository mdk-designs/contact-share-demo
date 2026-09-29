'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react'
import {
  QrCode,
  Download,
  Copy,
  Check,
  ExternalLink,
  Share2,
  Sparkles,
  BarChart2,
  Smartphone,
  Eye,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getSupabaseClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function MemberQRPage() {
  const { user, profile } = useAuth()
  const [copied, setCopied] = useState(false)
  const [scansCount, setScansCount] = useState<number>(0)
  const [loadingScans, setLoadingScans] = useState<boolean>(true)
  const [fgColor, setFgColor] = useState<string>('#0F172A')

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://contactforge.io'
  const cardSlug = profile?.slug || 'my-card'
  const cardUrl = `${origin}/c/${cardSlug}`

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
              My Personal QR Code
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
            <span>{copied ? 'Copied' : 'Copy Link'}</span>
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
                  value={cardUrl}
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
                    value={cardUrl}
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

            <CardContent className="p-6 space-y-4">
              {/* Color Customization */}
              <div className="flex items-center justify-center gap-3">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Accent Color:</span>
                <div className="flex items-center gap-2">
                  {[
                    { label: 'Slate', color: '#0F172A' },
                    { label: 'Emerald', color: '#059669' },
                    { label: 'Indigo', color: '#4F46E5' },
                    { label: 'Purple', color: '#7C3AED' },
                  ].map((c) => (
                    <button
                      key={c.color}
                      onClick={() => setFgColor(c.color)}
                      style={{ backgroundColor: c.color }}
                      className={`h-6 w-6 rounded-full transition-transform ${
                        fgColor === c.color ? 'ring-2 ring-offset-2 ring-emerald-500 scale-110' : 'hover:scale-105'
                      }`}
                      title={c.label}
                      aria-label={c.label}
                    />
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  onClick={handleDownloadPNG}
                  className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-xs shadow-md hover:brightness-105"
                >
                  <Download size={14} className="mr-1.5" />
                  <span>Download PNG</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="rounded-xl border-[var(--border-card)] text-xs font-semibold shadow-xs"
                >
                  <Share2 size={14} className="mr-1.5" />
                  <span>Share QR</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Analytics & Usage Instructions */}
        <div className="md:col-span-5 space-y-4">
          {/* Scan Stats */}
          <Card className="rounded-3xl border-[var(--border-card)] bg-[var(--bg-card)] shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-[var(--text-primary)]">
                  Live Scan Analytics
                </CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                  <BarChart2 size={16} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
                  {loadingScans ? '…' : scansCount}
                </span>
                <span className="text-xs text-[var(--text-muted)] ml-2">Total QR Scans</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Every time an in-person client or colleague scans your badge or screen, a scan record is anonymously registered in your account analytics.
              </p>
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card className="rounded-3xl border-[var(--border-card)] bg-[var(--bg-card)] shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-[var(--text-primary)]">
                  How to Use Your QR
                </CardTitle>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
                  <Smartphone size={16} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-[var(--text-secondary)]">
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 font-bold text-[10px]">
                  1
                </span>
                <p>Add it to your lock screen wallpaper or digital wallet for immediate tap or scan.</p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 font-bold text-[10px]">
                  2
                </span>
                <p>Include the PNG image on your email signature and presentation slides.</p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 font-bold text-[10px]">
                  3
                </span>
                <p>
                  Visitors can save your vCard with 1 tap, and you can receive their details via{' '}
                  <Link href="/portal/settings" className="font-semibold text-emerald-600 dark:text-emerald-400 underline">
                    Telegram integration
                  </Link>.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
