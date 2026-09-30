'use client'

import React, { useEffect, useState, useMemo } from 'react'
import {
  ArrowRightLeft,
  Search,
  Download,
  Calendar,
  Filter,
  MessageCircle,
  FileSpreadsheet,
  Send,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Building,
  Phone,
  Mail,
  X,
} from 'lucide-react'
import { getContactExchanges, type ContactExchange } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { buildWhatsAppUrl } from '@/lib/phone'
import { generateVisitorVCardString } from '@/lib/vcard'
import { toast } from 'sonner'

export default function MemberExchangesPage() {
  const { profile, user } = useAuth()
  const [exchanges, setExchanges] = useState<ContactExchange[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState<'all' | 'qr' | 'nfc' | 'direct'>('all')
  const [selectedExchange, setSelectedExchange] = useState<ContactExchange | null>(null)

  useEffect(() => {
    async function loadExchanges() {
      setLoading(true)
      try {
        const targetProfileId = profile?.id
        const list = await getContactExchanges(targetProfileId)
        setExchanges(list)
      } catch (err) {
        console.warn('Failed loading contact exchanges:', err)
        toast.error('Failed to load contact exchanges.')
      } finally {
        setLoading(false)
      }
    }

    if (profile?.id || user?.id) {
      loadExchanges()
    } else {
      setLoading(false)
    }
  }, [profile?.id, user?.id])

  // Filtered list
  const filteredExchanges = useMemo(() => {
    return exchanges.filter((e) => {
      const matchSearch =
        search.trim() === '' ||
        e.visitor_name.toLowerCase().includes(search.toLowerCase()) ||
        (e.visitor_phone && e.visitor_phone.includes(search)) ||
        (e.visitor_email && e.visitor_email.toLowerCase().includes(search.toLowerCase())) ||
        (e.visitor_company && e.visitor_company.toLowerCase().includes(search.toLowerCase()))

      const matchSource = sourceFilter === 'all' || e.source === sourceFilter
      return matchSearch && matchSource
    })
  }, [exchanges, search, sourceFilter])

  // CSV Export
  const exportCsv = () => {
    if (filteredExchanges.length === 0) {
      toast.info('No contact exchanges to export.')
      return
    }

    const headers = ['Date', 'Name', 'Phone', 'Email', 'Organization', 'Job Title', 'Source', 'Telegram Status', 'Notes']
    const rows = filteredExchanges.map((e) => [
      e.created_at ? new Date(e.created_at).toLocaleString() : '',
      `"${e.visitor_name.replace(/"/g, '""')}"`,
      `"${e.visitor_phone_e164 || e.visitor_phone}"`,
      `"${e.visitor_email || ''}"`,
      `"${(e.visitor_company || '').replace(/"/g, '""')}"`,
      `"${(e.visitor_job_title || '').replace(/"/g, '""')}"`,
      e.source,
      e.cardholder_telegram_status,
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ])

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Contact_Exchanges_${profile?.slug || 'my-card'}_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Contact exchanges exported to CSV')
  }

  // Download visitor vCard
  const downloadVisitorVCard = (exchange: ContactExchange) => {
    const vcardStr = generateVisitorVCardString({
      name: exchange.visitor_name,
      phone: exchange.visitor_phone_e164 || exchange.visitor_phone,
      email: exchange.visitor_email,
      organization: exchange.visitor_company,
      jobTitle: exchange.visitor_job_title,
      notes: exchange.notes,
    })

    const blob = new Blob([vcardStr], { type: 'text/vcard;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${exchange.visitor_name.trim().replace(/\s+/g, '_')}.vcf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(`Downloaded contact card for ${exchange.visitor_name}`)
  }

  const thisWeekCount = useMemo(() => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    return exchanges.filter((e) => new Date(e.created_at).getTime() >= oneWeekAgo).length
  }, [exchanges])

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)] sm:text-2xl flex items-center gap-2.5">
            <ArrowRightLeft className="text-emerald-500" size={24} />
            <span>Contact Exchanges</span>
          </h1>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            People who scanned your card and exchanged contact information with you.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={exportCsv}
            variant="outline"
            size="sm"
            className="rounded-xl border-[var(--border-card)] text-xs font-semibold gap-1.5 shadow-xs"
          >
            <FileSpreadsheet size={14} className="text-emerald-500" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="rounded-2xl border-[var(--border-card)] bg-[var(--bg-card)] p-4 shadow-xs">
          <span className="text-[11px] font-medium text-[var(--text-muted)]">Total Exchanges</span>
          <p className="mt-1 text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            {exchanges.length}
          </p>
        </Card>

        <Card className="rounded-2xl border-[var(--border-card)] bg-[var(--bg-card)] p-4 shadow-xs">
          <span className="text-[11px] font-medium text-[var(--text-muted)]">This Week</span>
          <p className="mt-1 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {thisWeekCount}
          </p>
        </Card>

        <Card className="rounded-2xl border-[var(--border-card)] bg-[var(--bg-card)] p-4 shadow-xs">
          <span className="text-[11px] font-medium text-[var(--text-muted)]">Via QR Scan</span>
          <p className="mt-1 text-2xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
            {exchanges.filter((e) => e.source === 'qr').length}
          </p>
        </Card>

        <Card className="rounded-2xl border-[var(--border-card)] bg-[var(--bg-card)] p-4 shadow-xs">
          <span className="text-[11px] font-medium text-[var(--text-muted)]">Via Direct/NFC</span>
          <p className="mt-1 text-2xl font-bold tracking-tight text-purple-600 dark:text-purple-400">
            {exchanges.filter((e) => e.source === 'nfc' || e.source === 'direct').length}
          </p>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input
            placeholder="Search by name, phone, email, organization…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)] hidden sm:inline">Source:</span>
          {(['all', 'qr', 'nfc', 'direct'] as const).map((s) => (
            <Button
              key={s}
              variant={sourceFilter === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSourceFilter(s)}
              className={`rounded-xl h-8 px-3 text-xs capitalize ${
                sourceFilter === s ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''
              }`}
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* Exchanges Table */}
      <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-[var(--text-muted)]">
            Loading contact exchanges…
          </div>
        ) : filteredExchanges.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
              <ArrowRightLeft size={24} />
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">No Contact Exchanges Yet</h3>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
              When people scan your digital business card and submit their contact details, they will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)]/50 text-[var(--text-muted)] uppercase tracking-wider text-[10px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Phone / WhatsApp</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Organization</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {filteredExchanges.map((exchange) => {
                  const phoneDigits = (exchange.visitor_phone_e164 || exchange.visitor_phone).replace(/\D/g, '')
                  const waUrl = phoneDigits ? `https://wa.me/${phoneDigits}` : null

                  return (
                    <tr
                      key={exchange.id}
                      className="hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                      onClick={() => setSelectedExchange(exchange)}
                    >
                      <td className="py-3 px-4 font-semibold text-[var(--text-primary)]">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 font-bold text-xs shrink-0">
                            {exchange.visitor_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="truncate max-w-[140px]">{exchange.visitor_name}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-[var(--text-secondary)] font-mono text-[11px]">
                        {exchange.visitor_phone_e164 || exchange.visitor_phone}
                      </td>

                      <td className="py-3 px-4 text-[var(--text-muted)] truncate max-w-[150px]">
                        {exchange.visitor_email || '—'}
                      </td>

                      <td className="py-3 px-4 text-[var(--text-muted)] truncate max-w-[140px]">
                        {exchange.visitor_company || '—'}
                      </td>

                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                          {exchange.source || 'unknown'}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-[var(--text-muted)] whitespace-nowrap text-[11px]">
                        {exchange.created_at ? new Date(exchange.created_at).toLocaleDateString() : '—'}
                      </td>

                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {waUrl && (
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                              title="Chat on WhatsApp"
                            >
                              <a href={waUrl} target="_blank" rel="noopener noreferrer">
                                <MessageCircle size={14} />
                              </a>
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadVisitorVCard(exchange)}
                            className="h-7 w-7 p-0 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                            title="Download vCard"
                          >
                            <Download size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Exchange Detail Dialog */}
      {selectedExchange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-0">
          <div className="w-full max-w-md rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6 shadow-2xl relative animate-in zoom-in-95">
            <button
              onClick={() => setSelectedExchange(null)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 font-bold text-lg">
                {selectedExchange.visitor_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  {selectedExchange.visitor_name}
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Exchanged on {new Date(selectedExchange.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl bg-[var(--bg-subtle)] p-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                  <Phone size={13} /> Mobile
                </span>
                <span className="font-semibold text-[var(--text-primary)] font-mono">
                  {selectedExchange.visitor_phone_e164 || selectedExchange.visitor_phone}
                </span>
              </div>

              {selectedExchange.visitor_email && (
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                    <Mail size={13} /> Email
                  </span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {selectedExchange.visitor_email}
                  </span>
                </div>
              )}

              {selectedExchange.visitor_company && (
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                    <Building size={13} /> Organization
                  </span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {selectedExchange.visitor_company}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Attributed Source</span>
                <Badge variant="outline" className="capitalize text-[10px]">
                  {selectedExchange.source}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Cardholder vCard</span>
                <Badge variant="mint" className="text-[10px]">
                  {selectedExchange.cardholder_vcard_status}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Telegram Bot Alert</span>
                <Badge
                  variant={selectedExchange.cardholder_telegram_status === 'sent' ? 'mint' : 'outline'}
                  className="text-[10px]"
                >
                  {selectedExchange.cardholder_telegram_status}
                </Badge>
              </div>

              {selectedExchange.whatsapp_clicked_at && (
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)]">WhatsApp CTA Clicked</span>
                  <span className="text-emerald-600 font-semibold text-[11px]">
                    {new Date(selectedExchange.whatsapp_clicked_at).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>

            {selectedExchange.notes && (
              <div className="mt-3 p-3 rounded-xl bg-[var(--bg-subtle)] text-xs text-[var(--text-secondary)]">
                <span className="font-semibold block mb-1 text-[var(--text-primary)]">Notes:</span>
                {selectedExchange.notes}
              </div>
            )}

            <div className="mt-5 flex gap-2">
              <Button
                onClick={() => downloadVisitorVCard(selectedExchange)}
                variant="outline"
                className="flex-1 rounded-xl text-xs font-semibold gap-1.5"
              >
                <Download size={14} />
                <span>Save to Contacts</span>
              </Button>

              {selectedExchange.visitor_phone && (
                <Button
                  asChild
                  className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 shadow-sm"
                >
                  <a
                    href={buildWhatsAppUrl(selectedExchange.visitor_phone_e164 || selectedExchange.visitor_phone) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle size={14} />
                    <span>WhatsApp</span>
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
