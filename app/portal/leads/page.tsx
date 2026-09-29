'use client'

import { useEffect, useState } from 'react'
import { Mail, Search, Download, RefreshCw } from 'lucide-react'
import { getLeads, type Lead } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export default function MemberLeadsPage() {
  const { profile } = useAuth()
  const [leads, setLeads] = useState<Lead[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getLeads(profile?.id)
      setLeads(data)
    } catch (e) {
      console.warn('Failed loading member leads:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [profile?.id])

  const filtered = leads.filter((l) => {
    const term = search.toLowerCase()
    const name = (l.visitor_name || l.name || '').toLowerCase()
    const email = (l.visitor_email || l.email || '').toLowerCase()
    const company = (l.visitor_company || l.organization || '').toLowerCase()
    const phone = (l.visitor_phone || l.phone || '').toLowerCase()
    return name.includes(term) || email.includes(term) || company.includes(term) || phone.includes(term)
  })

  const handleExportCSV = () => {
    if (filtered.length === 0) return

    const headers = ['Prospect Name', 'Email', 'Phone', 'Company', 'Date']
    const rows = filtered.map((l) => [
      `"${(l.visitor_name || l.name || '').replace(/"/g, '""')}"`,
      `"${(l.visitor_email || l.email || '').replace(/"/g, '""')}"`,
      `"${(l.visitor_phone || l.phone || '').replace(/"/g, '""')}"`,
      `"${(l.visitor_company || l.organization || '').replace(/"/g, '""')}"`,
      `"${l.created_at ? new Date(l.created_at).toLocaleDateString() : 'Recent'}"`,
    ].join(','))

    const csvContent = [headers.join(','), ...rows].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `my_contacts_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">My Captured Contacts</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            People who scanned your card and exchanged their details with you.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            title="Refresh"
            className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-2 text-[var(--text-secondary)] hover:bg-[var(--border-subtle)]"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleExportCSV}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md hover:brightness-105 disabled:opacity-50"
          >
            <Download size={14} /> Export CSV ({filtered.length})
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] px-3 py-2 shadow-sm">
        <Search size={16} className="text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder="Search by name, email, or company…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none"
        />
      </div>

      {/* Table Card */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--border-card)] bg-[var(--bg-sheet)] uppercase tracking-wider text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-3 font-semibold">Contact Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 font-semibold">Company / Org</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[var(--text-muted)]">
                    Loading your contacts…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[var(--text-muted)]">
                    {search ? 'No contacts match your filter.' : 'No contacts captured yet. Share your card to start networking!'}
                  </td>
                </tr>
              ) : (
                filtered.map((lead, idx) => (
                  <tr key={lead.id || idx} className="hover:bg-[var(--border-subtle)]/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">
                      {lead.visitor_name || lead.name}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      {lead.visitor_email || lead.email ? (
                        <a href={`mailto:${lead.visitor_email || lead.email}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                          {lead.visitor_email || lead.email}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      {lead.visitor_phone || lead.phone ? (
                        <a href={`tel:${lead.visitor_phone || lead.phone}`} className="hover:underline">
                          {lead.visitor_phone || lead.phone}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      {lead.visitor_company || lead.organization || '—'}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">
                      {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'Recent'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {lead.vcard_emailed ? (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-[var(--pastel-mint-bg)] text-[var(--pastel-mint-fg)] border border-[var(--pastel-mint-border)]">
                          ✓ vCard Emailed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-[var(--pastel-lavender-bg)] text-[var(--pastel-lavender-fg)] border border-[var(--pastel-lavender-border)]">
                          Exchanged
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
