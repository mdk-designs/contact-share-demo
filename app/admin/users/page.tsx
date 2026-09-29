'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users,
  UserPlus,
  Search,
  ExternalLink,
  QrCode,
  Download,
  Shield,
  UserCheck,
  FileSpreadsheet,
  Edit,
  Trash2,
  Check,
  X,
  Sparkles,
  Loader2,
} from 'lucide-react'
import { getAllProfiles, createProfile, updateProfile, deleteProfile, type Profile } from '@/lib/supabase'
import { CARD_CONFIG } from '@/lib/config'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'

export default function AdminUsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [csvModalOpen, setCsvModalOpen] = useState(false)
  const [csvText, setCsvText] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getAllProfiles()
      if (data && data.length > 0) {
        setProfiles(data)
      } else {
        // Fallback showcase card
        setProfiles([
          {
            id: 'demo-deepak',
            slug: 'deepak-kumar',
            role: 'admin',
            first_name: CARD_CONFIG.firstName,
            last_name: CARD_CONFIG.lastName,
            job_title: CARD_CONFIG.title,
            company_name: CARD_CONFIG.organization,
            department: CARD_CONFIG.companyTagline,
            work_email: CARD_CONFIG.email,
            mobile_phone: CARD_CONFIG.phone,
            website_url: CARD_CONFIG.website,
            address: CARD_CONFIG.location,
            bio: `${CARD_CONFIG.title} at ${CARD_CONFIG.organization}`,
            is_active: true,
          },
        ])
      }
    } catch (e) {
      console.warn('Failed to load profiles:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filtered = profiles.filter((p) => {
    const term = search.toLowerCase()
    return (
      p.first_name.toLowerCase().includes(term) ||
      p.last_name.toLowerCase().includes(term) ||
      p.slug.toLowerCase().includes(term) ||
      p.work_email.toLowerCase().includes(term) ||
      (p.job_title && p.job_title.toLowerCase().includes(term)) ||
      (p.company_name && p.company_name.toLowerCase().includes(term))
    )
  })

  // Toggle user active status
  const handleToggleStatus = async (profile: Profile) => {
    const nextState = !profile.is_active
    setProfiles((prev) =>
      prev.map((p) => (p.id === profile.id ? { ...p, is_active: nextState } : p))
    )
    await updateProfile(profile.id, { is_active: nextState })
    toast.success(`Card ${nextState ? 'activated' : 'deactivated'} for ${profile.first_name}`)
  }

  // Toggle user role between Admin and Member
  const handleToggleRole = async (profile: Profile) => {
    const nextRole = profile.role === 'admin' ? 'member' : 'admin'
    setProfiles((prev) =>
      prev.map((p) => (p.id === profile.id ? { ...p, role: nextRole } : p))
    )
    await updateProfile(profile.id, { role: nextRole })
    toast.success(`Role changed to ${nextRole.toUpperCase()} for ${profile.first_name}`)
  }

  // Delete profile
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteProfile(deleteTarget.id || deleteTarget.slug)
      setProfiles((prev) => prev.filter((p) => p.id !== deleteTarget.id && p.slug !== deleteTarget.slug))
      toast.success(`Member ${deleteTarget.first_name} ${deleteTarget.last_name} removed`)
      setDeleteTarget(null)
    } catch (err: any) {
      toast.error(`Delete failed: ${err.message}`)
    } finally {
      setDeleting(false)
    }
  }

  // Parse and batch import from CSV text
  const handleImportCSV = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!csvText.trim()) return

    setImporting(true)
    setImportResult(null)

    try {
      const lines = csvText.trim().split('\n')
      let importedCount = 0

      for (const line of lines) {
        // Expected format: FirstName, LastName, Email, Title, Company, Phone
        const cols = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''))
        if (cols.length < 3) continue

        const [firstName, lastName, email, jobTitle, companyName, phone] = cols
        // Skip header if line matches
        if (firstName.toLowerCase() === 'firstname' || firstName.toLowerCase() === 'first name') continue

        const baseSlug = `${firstName}-${lastName}`.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        const uniqueSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`

        const newProfile: Partial<Profile> = {
          first_name: firstName,
          last_name: lastName || '',
          slug: uniqueSlug,
          work_email: email,
          job_title: jobTitle || 'Team Member',
          company_name: companyName || 'Company',
          mobile_phone: phone || '',
          role: 'member',
          is_active: true,
        }

        await createProfile(newProfile)
        importedCount++
      }

      setImportResult(`Successfully imported ${importedCount} member(s)!`)
      toast.success(`Imported ${importedCount} new team members`)
      setCsvText('')
      await loadData()
      setTimeout(() => {
        setCsvModalOpen(false)
        setImportResult(null)
      }, 1500)
    } catch (err: any) {
      setImportResult(`Import failed: ${err.message}`)
      toast.error(`Import error: ${err.message}`)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Team Members</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Manage company members, assign vanity slugs, and access dynamic QR codes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCsvModalOpen(true)}
            className="rounded-xl border-[var(--border-card)] bg-[var(--bg-card)] shadow-xs"
          >
            <FileSpreadsheet size={15} className="text-emerald-500 mr-1.5" />
            <span>Bulk CSV Import</span>
          </Button>

          <Button variant="gradient" asChild className="rounded-xl shadow-md">
            <Link href="/admin/users/new">
              <UserPlus size={15} className="mr-1.5" /> Add Member
            </Link>
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative flex items-center">
        <Search size={16} className="absolute left-3.5 text-[var(--text-muted)] pointer-events-none" />
        <Input
          type="text"
          placeholder="Search by name, email, job title, company, or slug…"
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
                <TableHead className="px-4 py-3 font-semibold text-xs text-[var(--text-muted)] uppercase tracking-wider">Member</TableHead>
                <TableHead className="px-4 py-3 font-semibold text-xs text-[var(--text-muted)] uppercase tracking-wider">Vanity Slug</TableHead>
                <TableHead className="px-4 py-3 font-semibold text-xs text-[var(--text-muted)] uppercase tracking-wider">Title &amp; Org</TableHead>
                <TableHead className="px-4 py-3 font-semibold text-xs text-[var(--text-muted)] uppercase tracking-wider">Role</TableHead>
                <TableHead className="px-4 py-3 font-semibold text-xs text-[var(--text-muted)] uppercase tracking-wider">Status</TableHead>
                <TableHead className="px-4 py-3 text-right font-semibold text-xs text-[var(--text-muted)] uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-[var(--border-subtle)]">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-[var(--text-muted)]">
                    Loading team cards…
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-[var(--text-muted)]">
                    No members match your search.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((profile) => (
                  <TableRow key={profile.id} className="hover:bg-[var(--border-subtle)]/50 transition-colors">
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8 rounded-lg border border-[var(--pastel-lavender-border)]">
                          <AvatarFallback className="rounded-lg bg-[var(--pastel-lavender-bg)] text-xs font-bold text-[var(--pastel-lavender-fg)]">
                            {profile.first_name[0]}{profile.last_name[0] || ''}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <Link
                            href={`/admin/users/${profile.id || profile.slug}`}
                            className="font-semibold text-[var(--text-primary)] hover:text-indigo-600 dark:hover:text-indigo-400"
                          >
                            {profile.first_name} {profile.last_name}
                          </Link>
                          <p className="text-[11px] text-[var(--text-muted)]">{profile.work_email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <code className="rounded-md bg-[var(--border-subtle)] px-2 py-0.5 text-[11px] font-mono text-[var(--text-secondary)]">
                        /c/{profile.slug}
                      </code>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <p className="font-medium text-[var(--text-primary)]">{profile.job_title || '—'}</p>
                      <p className="text-[11px] text-[var(--text-muted)]">{profile.company_name || '—'}</p>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleToggleRole(profile)}
                        className="cursor-pointer transition-transform active:scale-95 text-left"
                        title={`Click to switch role to ${profile.role === 'admin' ? 'Member' : 'Admin'}`}
                      >
                        <Badge
                          variant={profile.role === 'admin' ? 'lavender' : 'outline'}
                          className="gap-1 font-semibold uppercase tracking-wider text-[10px] hover:ring-1 hover:ring-indigo-400"
                        >
                          {profile.role === 'admin' ? (
                            <Shield size={11} className="text-indigo-500" />
                          ) : (
                            <UserCheck size={11} />
                          )}
                          {profile.role}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(profile)}
                        className="h-auto p-0 hover:bg-transparent"
                        title="Click to toggle status"
                      >
                        <Badge
                          variant={profile.is_active ? 'success' : 'destructive'}
                          className="cursor-pointer gap-1.5 py-0.5 text-[10px] font-medium transition-opacity hover:opacity-80"
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              profile.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                            }`}
                          />
                          {profile.is_active ? 'Active' : 'Disabled'}
                        </Badge>
                      </Button>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-lg text-[var(--text-secondary)] hover:text-indigo-600">
                          <Link href={`/admin/users/${profile.id || profile.slug}`} title="Manage & Edit Profile">
                            <Edit size={14} />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                          <Link href={`/c/${profile.slug}`} target="_blank" title="View Public Card">
                            <ExternalLink size={14} />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                          <Link href={`/admin/qr-generator?slug=${profile.slug}`} title="Generate QR in Studio">
                            <QrCode size={14} />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                          <a href={`/api/vcard/${profile.slug}`} title="Download vCard">
                            <Download size={14} />
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(profile)}
                          className="h-8 w-8 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="Delete Member"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── Bulk CSV Import Dialog ── */}
      <Dialog open={csvModalOpen} onOpenChange={setCsvModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl border-[var(--border-card)] bg-[var(--bg-card)]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <FileSpreadsheet size={16} />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-[var(--text-primary)]">Bulk CSV Member Import</DialogTitle>
                <DialogDescription className="text-xs text-[var(--text-muted)]">Paste CSV rows to generate multiple digital business cards</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleImportCSV} className="space-y-3 pt-2">
            <p className="text-xs text-[var(--text-secondary)]">
              Format: <code className="rounded-md bg-[var(--bg-sheet)] px-1.5 py-0.5 font-mono text-[11px]">FirstName, LastName, Email, JobTitle, Company, Phone</code>
            </p>
            <Textarea
              rows={6}
              required
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={`Sarah, Connor, sarah@cyberdyne.com, Security Chief, Cyberdyne, +15551234567\nMarcus, Vance, marcus@techcorp.io, Engineering VP, TechCorp, +15559876543`}
              className="font-mono text-xs bg-[var(--bg-sheet)] rounded-xl border-[var(--border-card)]"
            />

            {importResult && (
              <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 p-2.5 text-xs text-indigo-900 dark:text-indigo-300">
                {importResult}
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCsvModalOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="gradient"
                disabled={importing}
                className="rounded-xl shadow-md"
              >
                {importing ? (
                  <><Loader2 size={14} className="animate-spin mr-1.5" /> Importing…</>
                ) : (
                  <><Sparkles size={14} className="mr-1.5" /> Import Members</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Confirm Delete Member Dialog ── */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl border-[var(--border-card)] bg-[var(--bg-card)]">
          <DialogHeader>
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40">
                <Trash2 size={18} />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-[var(--text-primary)]">Delete Member Card</DialogTitle>
                <DialogDescription className="text-xs text-[var(--text-muted)]">This action will remove their live digital card</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {deleteTarget && (
            <div className="space-y-3 py-2 text-xs text-[var(--text-secondary)]">
              <p>
                Are you sure you want to permanently delete <strong className="text-[var(--text-primary)]">{deleteTarget.first_name} {deleteTarget.last_name}</strong>?
              </p>
              <div className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-sheet)] p-3 space-y-1">
                <p><span className="text-[var(--text-muted)]">Vanity URL:</span> <code className="font-mono text-indigo-600 dark:text-indigo-400">/c/{deleteTarget.slug}</code></p>
                <p><span className="text-[var(--text-muted)]">Email:</span> {deleteTarget.work_email}</p>
              </div>
              <p className="text-rose-500 text-[11px]">
                Warning: Anyone scanning the physical QR code or visiting this vanity URL will see a &quot;Card Unavailable&quot; message.
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={handleConfirmDelete}
              className="rounded-xl shadow-md"
            >
              {deleting ? (
                <><Loader2 size={14} className="animate-spin mr-1.5" /> Deleting…</>
              ) : (
                <><Trash2 size={14} className="mr-1.5" /> Delete Member</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
