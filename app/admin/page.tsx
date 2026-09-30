'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Users,
  QrCode,
  ArrowRightLeft,
  UserPlus,
  ArrowRight,
  TrendingUp,
  Download,
  ExternalLink,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  Send,
  Zap,
} from 'lucide-react'
import {
  getAllProfiles,
  getContactExchanges,
  getScanStats,
  type Profile,
  type ContactExchange,
} from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function AdminDashboardPage() {
  const { isMasterAdmin } = useAuth()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [exchanges, setExchanges] = useState<ContactExchange[]>([])
  const [scanCount, setScanCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [copiedLink, setCopiedLink] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const [profData, exData, stats] = await Promise.all([
          getAllProfiles(),
          getContactExchanges(),
          getScanStats(),
        ])
        setProfiles(profData)
        setExchanges(exData)
        setScanCount(stats.totalScans)
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

  // Calculate real metrics
  const activeProfiles = useMemo(() => profiles.filter((p) => p.is_active), [profiles])

  const exchangesToday = useMemo(() => {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    return exchanges.filter((e) => new Date(e.created_at).getTime() >= startOfToday.getTime()).length
  }, [exchanges])

  const exchangesThisWeek = useMemo(() => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    return exchanges.filter((e) => new Date(e.created_at).getTime() >= oneWeekAgo).length
  }, [exchanges])

  const recentExchanges = useMemo(() => exchanges.slice(0, 5), [exchanges])

  return (
    <div className="space-y-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border-subtle)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="lavender" className="gap-1.5 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
              {isMasterAdmin ? 'Super Admin Console' : 'Enterprise Admin'}
            </Badge>
            <span className="text-xs text-[var(--text-muted)]">• Multi-Tenant Platform</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Platform Overview
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Manage your organization&apos;s digital business cards, dynamic QRs, and captured contact exchanges.
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Total Users & Active Cards */}
        <Card className="rounded-2xl border-[var(--border-card)] bg-[var(--bg-card)] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Total Team Cards
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
              {loading ? '—' : profiles.length}
            </p>
          </div>
          <div className="mt-2 text-xs text-[var(--text-muted)]">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{activeProfiles.length} active</span> cards
          </div>
        </Card>

        {/* Metric 2: Total Contact Exchanges */}
        <Card className="rounded-2xl border-[var(--border-card)] bg-[var(--bg-card)] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Contact Exchanges
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ArrowRightLeft size={18} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
              {loading ? '—' : exchanges.length}
            </p>
          </div>
          <div className="mt-2 text-xs text-[var(--text-muted)]">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{exchangesThisWeek}</span> this week · <span className="font-semibold">{exchangesToday}</span> today
          </div>
        </Card>

        {/* Metric 3: QR Code Scans */}
        <Card className="rounded-2xl border-[var(--border-card)] bg-[var(--bg-card)] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              QR Code Scans
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <QrCode size={18} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
              {loading ? '—' : scanCount}
            </p>
          </div>
          <div className="mt-2 text-xs text-[var(--text-muted)]">
            Dynamic tracking via <span className="font-mono text-[11px]">/c/:slug</span>
          </div>
        </Card>

        {/* Metric 4: vCard Delivery Standard */}
        <Card className="rounded-2xl border-[var(--border-card)] bg-[var(--bg-card)] p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              vCard Standard
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Download size={18} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
              RFC 6350
            </p>
          </div>
          <div className="mt-2 text-xs text-[var(--text-muted)]">
            Native iOS &amp; Android import sync
          </div>
        </Card>
      </div>

      {/* ── Main Dashboard Split View ── */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Quick Navigation & Showcase Card (5 cols) */}
        <div className="space-y-6 lg:col-span-5">
          <Card className="rounded-2xl p-6 shadow-xs border-[var(--border-card)] bg-[var(--bg-card)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Quick Navigation
              </h2>
              <span className="text-[11px] text-[var(--text-muted)]">3 Console Sections</span>
            </div>

            <div className="space-y-3">
              <Link
                href="/admin/users"
                className="group flex items-center justify-between rounded-xl border border-[var(--border-card)] p-4 text-xs font-semibold hover:border-indigo-300 dark:hover:border-indigo-800 hover:bg-[var(--border-subtle)] transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 transition-transform group-hover:scale-105">
                    <Users size={16} />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      Team Member Directory
                    </p>
                    <p className="text-[11px] font-normal text-[var(--text-muted)]">
                      Create, edit, or de-activate cards
                    </p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-[var(--text-dim)] transition-transform group-hover:translate-x-1 group-hover:text-indigo-500" />
              </Link>

              <Link
                href="/admin/exchanges"
                className="group flex items-center justify-between rounded-xl border border-[var(--border-card)] p-4 text-xs font-semibold hover:border-emerald-300 dark:hover:border-emerald-800 hover:bg-[var(--border-subtle)] transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 transition-transform group-hover:scale-105">
                    <ArrowRightLeft size={16} />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      Contact Exchanges
                    </p>
                    <p className="text-[11px] font-normal text-[var(--text-muted)]">
                      Audit all bi-directional exchanges &amp; CSV
                    </p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-[var(--text-dim)] transition-transform group-hover:translate-x-1 group-hover:text-emerald-500" />
              </Link>

              <Link
                href="/admin/qr-generator"
                className="group flex items-center justify-between rounded-xl border border-[var(--border-card)] p-4 text-xs font-semibold hover:border-purple-300 dark:hover:border-purple-800 hover:bg-[var(--border-subtle)] transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 transition-transform group-hover:scale-105">
                    <QrCode size={16} />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)] group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      QR Code Studio &amp; Batch
                    </p>
                    <p className="text-[11px] font-normal text-[var(--text-muted)]">
                      Export SVG, PNG &amp; branded print codes
                    </p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-[var(--text-dim)] transition-transform group-hover:translate-x-1 group-hover:text-purple-500" />
              </Link>
            </div>
          </Card>
        </div>

        {/* Right Column: Recent Contact Exchanges (7 cols) */}
        <div className="space-y-6 lg:col-span-7">
          <Card className="rounded-2xl p-6 shadow-xs border-[var(--border-card)] bg-[var(--bg-card)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)]">
                  Recent Contact Exchanges
                </h2>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Real-time feed of prospects exchanging contacts
                </p>
              </div>

              <Button asChild variant="ghost" size="sm" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                <Link href="/admin/exchanges">
                  <span>View All</span>
                  <ArrowRight size={13} className="ml-1" />
                </Link>
              </Button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)]">
                Loading activity…
              </div>
            ) : recentExchanges.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)]">
                No contact exchanges recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-subtle)]">
                {recentExchanges.map((ex) => (
                  <div key={ex.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 font-bold text-xs shrink-0">
                        {ex.visitor_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">
                          {ex.visitor_name}
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)] font-mono">
                          {ex.visitor_phone_e164 || ex.visitor_phone}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                        {ex.source}
                      </Badge>
                      <p className="text-[10px] text-[var(--text-muted)] mt-1">
                        {ex.created_at ? new Date(ex.created_at).toLocaleDateString() : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
