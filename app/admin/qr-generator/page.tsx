'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react'
import { Download, Printer, Palette, Copy, Check, Sparkles, Sliders } from 'lucide-react'
import { getAllProfiles, type Profile } from '@/lib/supabase'
import { CARD_CONFIG } from '@/lib/config'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

function QRStudioContent() {
  const searchParams = useSearchParams()
  const initialSlug = searchParams.get('slug') || 'deepak-kumar'

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [selectedSlug, setSelectedSlug] = useState(initialSlug)
  const [fgColor, setFgColor] = useState('#0F172A')
  const [bgColor, setBgColor] = useState('#FFFFFF')
  const [copied, setCopied] = useState(false)
  const [batchMode, setBatchMode] = useState(false)

  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const data = await getAllProfiles()
      if (data && data.length > 0) {
        setProfiles(data)
      } else {
        setProfiles([
          {
            id: 'deepak',
            slug: 'deepak-kumar',
            first_name: CARD_CONFIG.firstName,
            last_name: CARD_CONFIG.lastName,
            job_title: CARD_CONFIG.title,
            company_name: CARD_CONFIG.organization,
            work_email: CARD_CONFIG.email,
            is_active: true,
            role: 'admin',
          },
        ])
      }
    }
    load()
  }, [])

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://app-amber-phi-95.vercel.app'
  const targetUrl = `${origin}/c/${selectedSlug}`

  // Download PNG (rendered via hidden canvas)
  const handleDownloadPNG = () => {
    const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement
    if (!canvas) return

    const pngUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = pngUrl
    link.download = `${selectedSlug}_qr_1024x1024.png`
    link.click()
    toast.success('High-resolution PNG QR downloaded')
  }

  // Download SVG
  const handleDownloadSVG = () => {
    const svgEl = document.getElementById('qr-svg')
    if (!svgEl) return

    const svgData = new XMLSerializer().serializeToString(svgEl)
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${selectedSlug}_qr_vector.svg`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Vector SVG QR downloaded')
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(targetUrl)
    setCopied(true)
    toast.success('Canonical QR link copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dynamic QR Studio</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Design, customize, and batch export high-res vector QR codes for business cards &amp; badges.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={batchMode ? 'default' : 'outline'}
            onClick={() => setBatchMode(!batchMode)}
            className="rounded-xl shadow-xs text-xs font-semibold"
          >
            <Printer size={15} className="mr-1.5" /> {batchMode ? 'Studio Mode' : 'Printable Sheet Preview'}
          </Button>
        </div>
      </div>

      {batchMode ? (
        /* Batch Printable Cards View */
        <Card className="rounded-2xl border-[var(--border-card)] bg-[var(--bg-card)] p-6 shadow-xs">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold">Printable Business Card Sheet (A4 / Letter Ready)</h2>
              <p className="text-xs text-[var(--text-muted)]">
                Ready for high-quality card stock printing. Each card includes the member&apos;s dynamic QR.
              </p>
            </div>
            <Button
              onClick={() => window.print()}
              variant="gradient"
              className="rounded-xl shadow-md"
            >
              <Printer size={14} className="mr-1.5" /> Print Sheet
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map((p) => (
              <div
                key={p.id}
                className="flex flex-col justify-between rounded-2xl border-2 border-dashed border-[var(--border-card)] p-5 bg-white text-slate-900 shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between border-b pb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                      {p.company_name || 'DesignForge Studio'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">/c/{p.slug}</span>
                  </div>
                  <div className="mt-3">
                    <p className="text-base font-bold">{p.first_name} {p.last_name}</p>
                    <p className="text-xs text-slate-500">{p.job_title || 'Team Member'}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{p.work_email}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t pt-3">
                  <div className="p-1 rounded-lg border border-slate-200">
                    <QRCodeSVG
                      value={`${origin}/c/${p.slug}`}
                      size={72}
                      level="H"
                      fgColor="#0f172a"
                      bgColor="#ffffff"
                    />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Scan to save</p>
                    <p className="text-[9px] text-slate-400">Instant vCard</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        /* Studio Single QR Customizer */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Controls */}
          <Card className="space-y-4 rounded-2xl border-[var(--border-card)] bg-[var(--bg-card)] p-6 shadow-xs lg:col-span-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <Sliders size={15} /> Customization Controls
            </h2>

            {/* Select Target Profile */}
            <div className="space-y-1.5 text-left">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Select Team Member
              </Label>
              <select
                value={selectedSlug}
                onChange={(e) => setSelectedSlug(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-card)] bg-[var(--bg-sheet)] h-10 px-3 text-xs text-[var(--text-primary)] outline-none focus:border-indigo-500 shadow-xs"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.slug}>
                    {p.first_name} {p.last_name} (/c/{p.slug}) — {p.job_title || 'Member'}
                  </option>
                ))}
              </select>
            </div>

            {/* Target URL Display */}
            <div className="space-y-1.5 text-left">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Encoded Canonical Destination URL
              </Label>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--border-card)] bg-[var(--bg-sheet)] px-3 h-10">
                <code className="w-full text-xs font-mono text-indigo-600 dark:text-indigo-400 overflow-hidden text-ellipsis whitespace-nowrap">
                  {targetUrl}
                </code>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyLink}
                  className="h-7 w-7 rounded-lg text-[var(--text-secondary)]"
                  title="Copy link"
                >
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </Button>
              </div>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2 border-t border-[var(--border-subtle)]">
              <div className="space-y-1.5 text-left">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Foreground Color (Pattern)
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="h-10 w-12 cursor-pointer rounded-xl border border-[var(--border-card)] bg-transparent p-0.5"
                  />
                  <Input
                    type="text"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="h-10 rounded-xl bg-[var(--bg-sheet)] font-mono text-xs uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Background Color
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="h-10 w-12 cursor-pointer rounded-xl border border-[var(--border-card)] bg-transparent p-0.5"
                  />
                  <Input
                    type="text"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="h-10 rounded-xl bg-[var(--bg-sheet)] font-mono text-xs uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Export Actions */}
            <div className="pt-4 border-t border-[var(--border-subtle)] space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Download &amp; Export Formats
              </Label>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  type="button"
                  variant="gradient"
                  onClick={handleDownloadPNG}
                  className="rounded-xl shadow-md text-xs font-semibold"
                >
                  <Download size={14} className="mr-1.5" /> Download PNG (1024x1024)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDownloadSVG}
                  className="rounded-xl border-[var(--border-card)] bg-[var(--bg-card)] text-xs font-semibold"
                >
                  <Download size={14} className="mr-1.5" /> Download Vector SVG
                </Button>
              </div>
            </div>
          </Card>

          {/* Live Preview Panel */}
          <Card className="flex flex-col items-center justify-center rounded-2xl border-[var(--border-card)] bg-[var(--bg-card)] p-6 shadow-xs text-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-4">
              Live QR Preview
            </h3>

            <div
              className="p-4 rounded-2xl shadow-md border border-[var(--border-card)] transition-transform duration-200 hover:scale-105"
              style={{ backgroundColor: bgColor }}
            >
              <div id="qr-svg">
                <QRCodeSVG
                  value={targetUrl}
                  size={200}
                  level="H"
                  fgColor={fgColor}
                  bgColor={bgColor}
                  marginSize={1}
                />
              </div>
            </div>

            {/* Hidden canvas for high-res PNG export */}
            <div className="hidden" ref={canvasRef}>
              <QRCodeCanvas
                id="qr-canvas"
                value={targetUrl}
                size={1024}
                level="H"
                fgColor={fgColor}
                bgColor={bgColor}
                marginSize={2}
              />
            </div>

            <p className="mt-4 text-xs font-semibold text-[var(--text-primary)]">
              /c/{selectedSlug}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              Error Correction Level: <strong>H (30% Redundant)</strong>
            </p>
          </Card>
        </div>
      )}
    </div>
  )
}

export default function QRGeneratorPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-xs text-[var(--text-muted)]">
          Loading QR Studio…
        </div>
      }
    >
      <QRStudioContent />
    </Suspense>
  )
}

