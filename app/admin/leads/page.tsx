'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Mail,
  Search,
  Download,
  RefreshCw,
  Send,
  Check,
  Clock,
  X,
  Sparkles,
  AlertCircle,
  Loader2,
  Trash2,
} from 'lucide-react'
import { getLeads, getAllProfiles, deleteLead, type Lead, type Profile } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})
  const [profileList, setProfileList] = useState<Profile[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  // Test email modal state
  const [testModalOpen, setTestModalOpen] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [testName, setTestName] = useState('John Doe')
  const [testSlug, setTestSlug] = useState('deepak-kumar')
  const [sendingTest, setSendingTest] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  // Sending email per lead row state
  const [sendingRowId, setSendingRowId] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [leadList, allProfiles] = await Promise.all([
        getLeads(),
        getAllProfiles(),
      ])
      setLeads(leadList)
      setProfileList(allProfiles)
      const map: Record<string, Profile> = {}
      allProfiles.forEach((p) => {
        map[p.id] = p
      })
      setProfiles(map)
    } catch (e) {
      console.warn('Failed loading leads:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim()
    if (!term) return leads
    return leads.filter((l) => {
      const name = (l.visitor_name || l.name || '').toLowerCase()
      const email = (l.visitor_email || l.email || '').toLowerCase()
      const company = (l.visitor_company || l.organization || '').toLowerCase()
      const phone = (l.visitor_phone || l.phone || '').toLowerCase()
      return (
        name.includes(term) ||
        email.includes(term) ||
        company.includes(term) ||
        phone.includes(term)
      )
    })
  }, [leads, search])

  const handleExportCSV = () => {
    if (filtered.length === 0) return

    const headers = [
      'Visitor Name',
      'Visitor Email',
      'Visitor Phone',
      'Visitor Company',
      'Card Owner',
      'vCard Emailed',
      'Date Exchanged',
    ]
    const rows = filtered.map((l) => {
      const owner =
        l.profile_id && profiles[l.profile_id]
          ? `${profiles[l.profile_id].first_name} ${profiles[l.profile_id].last_name}`
          : 'General'
      return [
        `"${(l.visitor_name || l.name || '').replace(/"/g, '""')}"`,
        `"${(l.visitor_email || l.email || '').replace(/"/g, '""')}"`,
        `"${(l.visitor_phone || l.phone || '').replace(/"/g, '""')}"`,
        `"${(l.visitor_company || l.organization || '').replace(/"/g, '""')}"`,
        `"${owner.replace(/"/g, '""')}"`,
        `"${l.vcard_emailed ? 'YES' : 'NO'}"`,
        `"${l.created_at ? new Date(l.created_at).toLocaleDateString() : 'N/A'}"`,
      ].join(',')
    })

    const csvContent = [headers.join(','), ...rows].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `exchanged_leads_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Leads exported to CSV')
  }

  // Send / Re-send vCard email for a specific row
  const handleSendLeadEmail = async (lead: Lead) => {
    const targetEmail = lead.visitor_email || lead.email
    if (!targetEmail) {
      toast.error('This lead does not have an email address.')
      return
    }

    const rowId = lead.id || 'current'
    setSendingRowId(rowId)

    try {
      const owner = lead.profile_id && profiles[lead.profile_id] ? profiles[lead.profile_id] : null
      const res = await fetch('/api/functions/send-vcard-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: lead.id,
          slug: owner?.slug || 'deepak-kumar',
          visitor_name: lead.visitor_name || lead.name,
          visitor_email: targetEmail,
          visitor_phone: lead.visitor_phone || lead.phone,
          visitor_company: lead.visitor_company || lead.organization,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setLeads((prev) =>
          prev.map((l) => (l.id === lead.id ? { ...l, vcard_emailed: true } : l))
        )
        toast.success(`vCard email dispatched to ${targetEmail}`)
      } else {
        toast.error(`Email dispatch: ${data.message || data.error || 'Check key configuration'}`)
      }
    } catch (e: any) {
      toast.error(`Error sending email: ${e.message}`)
    } finally {
      setSendingRowId(null)
    }
  }

  // Trigger test email via Resend
  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!testEmail) return

    setSendingTest(true)
    setTestResult(null)

    try {
      const res = await fetch('/api/functions/send-vcard-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: testSlug,
          visitor_name: testName,
          visitor_email: testEmail,
          visitor_phone: '+1 555 019 2834',
          visitor_company: 'Test Prospect Company',
          notes: 'Test email dispatch from ContactForge Admin',
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        const msg = data.visitorEmailed
          ? `vCard email delivered to ${testEmail} with attachment!`
          : `Test processed (${data.message})`
        setTestResult({ success: true, message: msg })
        toast.success(msg)
      } else {
        const msg = data.message || data.error || 'Failed to dispatch email. Please ensure RESEND_API_KEY is configured.'
        setTestResult({ success: false, message: msg })
        toast.error(msg)
      }
    } catch (err: any) {
      const msg = err.message || 'Network error while dispatching test email.'
      setTestResult({ success: false, message: msg })
      toast.error(msg)
    } finally {
      setSendingTest(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Exchanged Leads</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Review captured contacts and manage automated RFC 6350 vCard email delivery.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setTestModalOpen(true)}
            className="rounded-xl border-[var(--border-card)] bg-[var(--bg-card)] shadow-xs"
          >
            <Mail size={14} className="text-indigo-500 mr-1.5" />
            <span>Test Email Dispatch</span>
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={loadData}
            title="Refresh leads"
            className="rounded-xl border-[var(--border-card)] bg-[var(--bg-card)] shadow-xs"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </Button>

          <Button
            variant="gradient"
            onClick={handleExportCSV}
            disabled={filtered.length === 0}
            className="rounded-xl shadow-md"
          >
            <Download size={14} className="mr-1.5" /> Export CSV ({filtered.length})
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative flex items-center">
        <Search size={16} className="absolute left-3.5 text-[var(--text-muted)] pointer-events-none" />
        <Input
          type="text"
          placeholder="Filter by visitor name, email, company, or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-10 rounded-xl bg-[var(--bg-card)] border-[var(--border-card)] text-xs shadow-xs"
        />
      </div>

      {/* Table Card */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] shadow-xs">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-[var(--bg-sheet)]">
              <TableRow className="border-b border-[var(--border-card)]">
                <TableHead className="px-4 py-3 font-semibold text-xs text-[var(--text-muted)] uppercase tracking-wider">Prospect</TableHead>
                <TableHead className="px-4 py-3 font-semibold text-xs text-[var(--text-muted)] uppercase tracking-wider">Phone</TableHead>
                <TableHead className="px-4 py-3 font-semibold text-xs text-[var(--text-muted)] uppercase tracking-wider">Company / Org</TableHead>
                <TableHead className="px-4 py-3 font-semibold text-xs text-[var(--text-muted)] uppercase tracking-wider">Card Owner</TableHead>
                <TableHead className="px-4 py-3 font-semibold text-xs text-[var(--text-muted)] uppercase tracking-wider">Exchanged Date</TableHead>
                <TableHead className="px-4 py-3 font-semibold text-xs text-[var(--text-muted)] uppercase tracking-wider">vCard Delivery</TableHead>
                <TableHead className="px-4 py-3 font-semibold text-xs text-[var(--text-muted)] uppercase tracking-wider text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-[var(--border-subtle)]">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-[var(--text-muted)]">
                    Loading exchanged leads…
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-[var(--text-muted)]">
                    {search
                      ? 'No leads match your filter.'
                      : 'No contact exchanges captured yet. Share cards via QR to start receiving leads.'}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((lead, idx) => {
                  const owner =
                    lead.profile_id && profiles[lead.profile_id]
                      ? profiles[lead.profile_id]
                      : null
                  const isEmailed = lead.vcard_emailed
                  const isSending = sendingRowId === (lead.id || 'current')

                  return (
                    <TableRow
                      key={lead.id || idx}
                      className="hover:bg-[var(--border-subtle)]/50 transition-colors"
                    >
                      <TableCell className="px-4 py-3">
                        <p className="font-semibold text-[var(--text-primary)]">
                          {lead.visitor_name || lead.name}
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          {lead.visitor_email || lead.email || '—'}
                        </p>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-[var(--text-secondary)]">
                        {lead.visitor_phone || lead.phone || '—'}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-[var(--text-secondary)]">
                        {lead.visitor_company || lead.organization || '—'}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {owner ? (
                          <Link
                            href={`/c/${owner.slug}`}
                            target="_blank"
                            className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            {owner.first_name} {owner.last_name}
                          </Link>
                        ) : (
                          <span className="text-[var(--text-muted)]">Direct Card</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-[var(--text-muted)]">
                        {lead.created_at
                          ? new Date(lead.created_at).toLocaleDateString()
                          : 'Recent'}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {isEmailed ? (
                          <Badge variant="mint" className="gap-1 font-semibold text-[10px]">
                            <Check size={10} /> vCard Emailed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 font-semibold text-[10px] text-amber-600 dark:text-amber-400">
                            <Clock size={10} /> Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendLeadEmail(lead)}
                          disabled={isSending}
                          className="h-7 px-2.5 text-[11px] font-medium rounded-lg border-[var(--border-card)] bg-[var(--bg-card)] hover:bg-[var(--border-subtle)]"
                          title="Trigger vCard email to prospect"
                        >
                          <Send size={11} className={`mr-1 ${isSending ? 'animate-pulse text-indigo-500' : ''}`} />
                          <span>{isSending ? 'Sending…' : isEmailed ? 'Re-send' : 'Send'}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async () => {
                            if (!lead.id) return
                            await deleteLead(lead.id)
                            setLeads((prev) => prev.filter((l) => l.id !== lead.id))
                            toast.success('Lead removed')
                          }}
                          className="h-7 w-7 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 ml-1 inline-flex items-center justify-center"
                          title="Delete lead record"
                        >
                          <Trash2 size={12} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── Test Email Dispatch Dialog ── */}
      <Dialog open={testModalOpen} onOpenChange={setTestModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border-[var(--border-card)] bg-[var(--bg-card)]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                <Mail size={16} />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-[var(--text-primary)]">Test vCard Email Dispatch</DialogTitle>
                <DialogDescription className="text-xs text-[var(--text-muted)]">Send an RFC 6350 .vcf attachment via Resend</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSendTest} className="space-y-3.5 pt-2">
            <div className="space-y-1.5 text-left">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Recipient Email Address
              </Label>
              <Input
                type="email"
                required
                placeholder="your.email@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="h-10 rounded-xl bg-[var(--bg-sheet)] border-[var(--border-card)] text-xs"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Recipient Name
              </Label>
              <Input
                type="text"
                required
                placeholder="John Doe"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                className="h-10 rounded-xl bg-[var(--bg-sheet)] border-[var(--border-card)] text-xs"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Select Cardholder Profile to Send
              </Label>
              <select
                value={testSlug}
                onChange={(e) => setTestSlug(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-card)] bg-[var(--bg-sheet)] h-10 px-3 text-xs text-[var(--text-primary)] outline-none focus:border-indigo-500 shadow-xs"
              >
                <option value="deepak-kumar">Deepak Kumar (Showcase Card)</option>
                {profileList.map((p) => (
                  <option key={p.id} value={p.slug}>
                    {p.first_name} {p.last_name} ({p.job_title || p.company_name || 'Card'})
                  </option>
                ))}
              </select>
            </div>

            {testResult && (
              <div
                className={`flex items-start gap-2 rounded-xl p-3 text-xs ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                }`}
              >
                {testResult.success ? <Check size={15} /> : <AlertCircle size={15} />}
                <div className="flex-1">{testResult.message}</div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setTestModalOpen(false)
                  setTestResult(null)
                }}
                className="rounded-xl"
              >
                Close
              </Button>
              <Button
                type="submit"
                variant="gradient"
                disabled={sendingTest}
                className="rounded-xl shadow-md"
              >
                {sendingTest ? (
                  <><Loader2 size={14} className="animate-spin mr-1.5" /> Dispatching…</>
                ) : (
                  <><Sparkles size={14} className="mr-1.5" /> Send Test vCard</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
