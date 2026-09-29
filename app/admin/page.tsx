'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users,
  QrCode,
  Mail,
  UserPlus,
  ArrowRight,
  TrendingUp,
  Download,
  ExternalLink,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  Send,
  Zap,
} from 'lucide-react'
import { getAllProfiles, getLeads, type Profile, type Lead } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function AdminDashboardPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedLink, setCopiedLink] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const [profData, leadData] = await Promise.all([
          getAllProfiles(),
          getLeads(),
        ])
        setProfiles(profData)
        setLeads(leadData)
      } catch (e) {
        console.warn('Failed loading admin data:', e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const copyCardLink = () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/c/deepak-kumar` : '/c/deepak-kumar'
    navigator.clipboard.writeText(url)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2200)
  }

  const profilesCount = profiles.length > 0 ? profiles.length : 1
  const leadsCount = leads.length

  return (
    <div className="space-y-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border-subtle)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="success" className="gap-1.5 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Workspace
            </Badge>
            <span className="text-xs text-[var(--text-muted)]">• Multi-Tenant Platform</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Platform Overview
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Manage your organization&apos;s digital business cards, dynamic QRs, and captured leads.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="gradient" asChild className="rounded-xl shadow-md">
            <Link href="/admin/users/new">
              <UserPlus size={15} className="mr-1.5" />
              <span>Add Team Member</span>
            </Link>
          </Button>
          <Button variant="outline" asChild className="rounded-xl border-[var(--border-card)] bg-[var(--bg-card)]">
            <Link href="/admin/qr-generator">
              <QrCode size={15} className="mr-1.5" />
              <span>QR Studio</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Metric KPI Cards ── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Active Cards */}
        <Card className="rounded-2xl bg-gradient-to-b from-[var(--bg-card)] to-[var(--bg-sheet)]/60 shadow-xs hover:border-[var(--border-hover)] hover:shadow-md transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Active Cards
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--pastel-lavender-bg)] text-[var(--pastel-lavender-fg)] border border-[var(--pastel-lavender-border)]">
                <Users size={18} />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--text-primary)]">
                {loading ? '1' : profilesCount}
              </p>
            </div>
            <div className="mt-3">
              <Badge variant="success" className="gap-1.5 font-medium py-1">
                <TrendingUp size={12} /> Multi-user profiles enabled
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Leads Exchanged */}
        <Card className="rounded-2xl bg-gradient-to-b from-[var(--bg-card)] to-[var(--bg-sheet)]/60 shadow-xs hover:border-[var(--border-hover)] hover:shadow-md transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Leads Exchanged
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--pastel-mint-bg)] text-[var(--pastel-mint-fg)] border border-[var(--pastel-mint-border)]">
                <Mail size={18} />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--text-primary)]">
                {loading ? '0' : leadsCount}
              </p>
            </div>
            <div className="mt-3">
              <Badge variant="lavender" className="gap-1.5 font-medium py-1">
                <Zap size={12} /> Captured via 2-way exchange
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: Dynamic QRs */}
        <Card className="rounded-2xl bg-gradient-to-b from-[var(--bg-card)] to-[var(--bg-sheet)]/60 shadow-xs hover:border-[var(--border-hover)] hover:shadow-md transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Dynamic QRs
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--pastel-sky-bg)] text-[var(--pastel-sky-fg)] border border-[var(--pastel-sky-border)]">
                <QrCode size={18} />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--text-primary)]">
                100%
              </p>
            </div>
            <div className="mt-3">
              <Badge variant="sky" className="gap-1.5 font-medium py-1">
                <CheckCircle2 size={12} /> Canonical /c/:slug engine
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Metric 4: vCard Delivery */}
        <Card className="rounded-2xl bg-gradient-to-b from-[var(--bg-card)] to-[var(--bg-sheet)]/60 shadow-xs hover:border-[var(--border-hover)] hover:shadow-md transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                vCard Delivery
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--pastel-rose-bg)] text-[var(--pastel-rose-fg)] border border-[var(--pastel-rose-border)]">
                <Download size={18} />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--text-primary)]">
                RFC 6350
              </p>
            </div>
            <div className="mt-3">
              <Badge variant="rose" className="gap-1.5 font-medium py-1">
                <ShieldCheck size={12} /> Native iOS &amp; Android sync
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Main Dashboard Split View ── */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Quick Navigation & Platform Status (5 cols) */}
        <div className="space-y-6 lg:col-span-5">
          {/* Quick Actions Panel */}
          <Card className="rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Quick Navigation
              </h2>
              <span className="text-[11px] text-[var(--text-muted)]">3 Shortcuts</span>
            </div>

            <div className="space-y-3">
              <Link
                href="/admin/users"
                className="group flex items-center justify-between rounded-xl border border-[var(--border-card)] p-4 text-xs font-semibold hover:border-indigo-300 dark:hover:border-indigo-800 hover:bg-[var(--border-subtle)] transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--pastel-lavender-bg)] text-[var(--pastel-lavender-fg)] border border-[var(--pastel-lavender-border)] transition-transform group-hover:scale-105">
                    <Users size={16} />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      Manage Team Members
                    </p>
                    <p className="text-[11px] font-normal text-[var(--text-muted)]">
                      Create, edit, or de-activate cards
                    </p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-[var(--text-dim)] transition-transform group-hover:translate-x-1 group-hover:text-indigo-500" />
              </Link>

              <Link
                href="/admin/qr-generator"
                className="group flex items-center justify-between rounded-xl border border-[var(--border-card)] p-4 text-xs font-semibold hover:border-sky-300 dark:hover:border-sky-800 hover:bg-[var(--border-subtle)] transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--pastel-sky-bg)] text-[var(--pastel-sky-fg)] border border-[var(--pastel-sky-border)] transition-transform group-hover:scale-105">
                    <QrCode size={16} />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)] group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                      QR Studio &amp; Export
                    </p>
                    <p className="text-[11px] font-normal text-[var(--text-muted)]">
                      Download SVG/PNG &amp; print sheets
                    </p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-[var(--text-dim)] transition-transform group-hover:translate-x-1 group-hover:text-sky-500" />
              </Link>

              <Link
                href="/admin/leads"
                className="group flex items-center justify-between rounded-xl border border-[var(--border-card)] p-4 text-xs font-semibold hover:border-emerald-300 dark:hover:border-emerald-800 hover:bg-[var(--border-subtle)] transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--pastel-mint-bg)] text-[var(--pastel-mint-fg)] border border-[var(--pastel-mint-border)] transition-transform group-hover:scale-105">
                    <Mail size={16} />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      Export Leads to CSV
                    </p>
                    <p className="text-[11px] font-normal text-[var(--text-muted)]">
                      Download all prospect contacts
                    </p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-[var(--text-dim)] transition-transform group-hover:translate-x-1 group-hover:text-emerald-500" />
              </Link>
            </div>
          </Card>

          {/* System Status / Architecture Card */}
          <Card className="rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Engine Status &amp; Compliance
              </h2>
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                Operational
              </span>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-[var(--border-subtle)]">
                <span className="text-[var(--text-secondary)]">vCard Protocol</span>
                <span className="font-mono font-semibold text-[var(--text-primary)]">RFC 6350 (v4.0)</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[var(--border-subtle)]">
                <span className="text-[var(--text-secondary)]">Dynamic QR Engine</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">Canonical /c/:slug</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[var(--border-subtle)]">
                <span className="text-[var(--text-secondary)]">Automated Delivery</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Supabase Edge Function</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-[var(--text-secondary)]">Default Active Card</span>
                <Link href="/c/deepak-kumar" target="_blank" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1">
                  deepak-kumar <ExternalLink size={11} />
                </Link>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Recent Leads & Live Test (7 cols) */}
        <Card className="rounded-2xl p-6 shadow-xs lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Recent Exchanged Leads
                </h2>
                <Badge variant="mint" className="text-[10px] font-bold px-2 py-0.5">
                  {leads.length} captured
                </Badge>
              </div>
              <Link
                href="/admin/leads"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
              >
                View All Leads &rarr;
              </Link>
            </div>

            {/* Leads List or Empty State */}
            <div className="mt-4">
              {leads.length > 0 ? (
                <div className="divide-y divide-[var(--border-subtle)]">
                  {leads.slice(0, 5).map((l, i) => (
                    <div key={l.id || i} className="flex items-center justify-between py-3.5 hover:bg-[var(--border-subtle)]/50 px-2 rounded-xl transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white shadow-xs">
                          {(l.visitor_name || l.name || 'P')[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[var(--text-primary)]">
                            {l.visitor_name || l.name}
                          </p>
                          <p className="text-[11px] text-[var(--text-muted)]">
                            {l.visitor_email || l.email || l.visitor_phone || l.phone}
                          </p>
                        </div>
                      </div>
                      <Badge variant="mint" className="text-[10px] font-semibold px-2.5 py-1">
                        Exchanged
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                /* Beautiful Rich Empty State */
                <div className="my-6 rounded-2xl border border-dashed border-[var(--border-card)] bg-gradient-to-b from-[var(--bg-sheet)]/60 to-[var(--bg-card)] p-8 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 shadow-xs mb-4">
                    <Mail size={24} />
                  </div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    Awaiting First Lead Capture
                  </h3>
                  <p className="mx-auto mt-2 max-w-md text-xs text-[var(--text-secondary)] leading-relaxed">
                    When visitors scan any team member&apos;s digital business card and submit the 2-way contact exchange form, their lead record and automated RFC 6350 vCard email delivery status will appear here in real time.
                  </p>

                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <Button variant="default" asChild className="rounded-xl">
                      <Link
                        href="/c/deepak-kumar"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span>Test Exchange Form</span>
                        <ExternalLink size={13} className="ml-1.5" />
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={copyCardLink}
                      className="rounded-xl border-[var(--border-card)] bg-[var(--bg-card)]"
                    >
                      {copiedLink ? (
                        <>
                          <Check size={13} className="text-emerald-500 mr-1.5" />
                          <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} className="mr-1.5" />
                          <span>Copy Demo Card Link</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card Footer Banner */}
          <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>Real-time webhook sync enabled</span>
            <Link href="/admin/leads" className="font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              Manage Exchange Forms &rarr;
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
