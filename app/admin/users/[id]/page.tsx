'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  User,
  QrCode,
  Mail,
  Download,
  ExternalLink,
  Copy,
  Check,
  Save,
  Shield,
  Trash2,
  Sparkles,
  Phone,
  Building,
  Globe,
  Loader2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { getProfileById, updateProfile, deleteProfile, getLeads, type Profile, type Lead } from '@/lib/supabase'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const resolvedParams = use(params)
  const userId = decodeURIComponent(resolvedParams.id)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'qr' | 'leads'>('profile')
  const [copied, setCopied] = useState(false)

  // Form state
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    slug: '',
    jobTitle: '',
    companyName: '',
    department: '',
    workEmail: '',
    phone: '',
    websiteUrl: '',
    address: '',
    bio: '',
    role: 'member' as 'master_admin' | 'admin' | 'member',
    isActive: true,
    linkedin: '',
    github: '',
    twitter: '',
  })

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [found, userLeads] = await Promise.all([
          getProfileById(userId),
          getLeads(userId),
        ])
        if (found) {
          setProfile(found)
          setForm({
            firstName: found.first_name || '',
            lastName: found.last_name || '',
            slug: found.slug || '',
            jobTitle: found.job_title || '',
            companyName: found.company_name || '',
            department: found.department || '',
            workEmail: found.work_email || '',
            phone: found.mobile_phone || found.work_phone || '',
            websiteUrl: found.website_url || '',
            address: found.address || '',
            bio: found.bio || '',
            role: found.role || 'member',
            isActive: found.is_active ?? true,
            linkedin: found.social_links?.linkedin || '',
            github: found.social_links?.github || '',
            twitter: found.social_links?.twitter || '',
          })
          setLeads(userLeads)
        }
      } catch (err) {
        console.warn('Failed loading user detail:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userId])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setSaving(true)

    try {
      const updates: Partial<Profile> = {
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        slug: form.slug.trim().toLowerCase(),
        job_title: form.jobTitle.trim(),
        company_name: form.companyName.trim(),
        department: form.department.trim(),
        work_email: form.workEmail.trim(),
        mobile_phone: form.phone.trim(),
        work_phone: form.phone.trim(),
        website_url: form.websiteUrl.trim(),
        address: form.address.trim(),
        bio: form.bio.trim(),
        role: form.role,
        is_active: form.isActive,
        social_links: {
          linkedin: form.linkedin.trim() || undefined,
          github: form.github.trim() || undefined,
          twitter: form.twitter.trim() || undefined,
        },
      }

      await updateProfile(profile.id, updates)
      setProfile((prev) => (prev ? { ...prev, ...updates } : null))
      toast.success('Member details updated successfully!')
    } catch (err) {
      toast.error('Failed saving changes: ' + (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async () => {
    if (!profile) return
    const nextState = !form.isActive
    setForm((p) => ({ ...p, isActive: nextState }))
    await updateProfile(profile.id, { is_active: nextState })
    setProfile((p) => (p ? { ...p, is_active: nextState } : null))
    toast.success(`Card ${nextState ? 'reactivated' : 'deactivated'}`)
  }

  const cardUrl = `https://app-amber-phi-95.vercel.app/c/${form.slug || profile?.slug || 'deepak-kumar'}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(cardUrl)
    setCopied(true)
    toast.success('Card link copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadPNG = () => {
    const svgEl = document.getElementById('user-qr-svg')
    if (!svgEl) return

    const svgData = new XMLSerializer().serializeToString(svgEl)
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 1024
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      if (!ctx) return
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, 1024, 1024)
      ctx.drawImage(img, 64, 64, 896, 896)
      const a = document.createElement('a')
      a.download = `qr_${form.slug || 'card'}_1024.png`
      a.href = canvas.toDataURL('image/png')
      a.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-xs text-[var(--text-muted)]">
        <Loader2 size={18} className="animate-spin mr-2" /> Loading member record…
      </div>
    )
  }

  if (!profile) {
    return (
      <Card className="rounded-2xl border-[var(--border-card)] bg-[var(--bg-card)] p-8 text-center space-y-3">
        <p className="font-semibold text-[var(--text-primary)]">Member Profile Not Found</p>
        <p className="text-xs text-[var(--text-muted)]">The requested member ID &quot;{userId}&quot; does not exist in the platform registry.</p>
        <Button variant="gradient" asChild className="rounded-xl">
          <Link href="/admin/users">
            <ArrowLeft size={14} className="mr-1.5" /> Return to Team Members
          </Link>
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild className="h-8 w-8 rounded-xl border-[var(--border-card)] bg-[var(--bg-card)]">
            <Link href="/admin/users">
              <ArrowLeft size={15} />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)] sm:text-2xl">
                {profile.first_name} {profile.last_name}
              </h1>
              <Badge variant={form.isActive ? 'success' : 'destructive'} className="text-[10px] font-semibold py-0.5">
                {form.isActive ? 'Active Card' : 'Deactivated'}
              </Badge>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Vanity slug: <span className="font-mono text-indigo-600 dark:text-indigo-400">/c/{profile.slug}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={form.isActive ? 'outline' : 'default'}
            size="sm"
            onClick={handleToggleActive}
            className={`rounded-xl text-xs font-semibold ${
              form.isActive
                ? 'border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/40 dark:hover:bg-rose-950/20'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {form.isActive ? 'Deactivate Card' : 'Reactivate Card'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteModalOpen(true)}
            className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/40 text-xs font-semibold"
          >
            <Trash2 size={13} className="mr-1.5" />
            Delete Member
          </Button>
          <Button variant="outline" size="sm" asChild className="rounded-xl border-[var(--border-card)] bg-[var(--bg-card)]">
            <Link href={`/c/${profile.slug}`} target="_blank">
              <span>Live Card</span>
              <ExternalLink size={13} className="ml-1.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="bg-[var(--bg-sheet)] border border-[var(--border-card)] p-1 rounded-2xl">
          <TabsTrigger value="profile" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-[var(--bg-card)] data-[state=active]:shadow-xs">
            <User size={14} /> Profile &amp; Contact
          </TabsTrigger>
          <TabsTrigger value="qr" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-[var(--bg-card)] data-[state=active]:shadow-xs">
            <QrCode size={14} /> QR Studio &amp; vCard
          </TabsTrigger>
          <TabsTrigger value="leads" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-[var(--bg-card)] data-[state=active]:shadow-xs">
            <Mail size={14} /> Captured Leads ({leads.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Profile Editor */}
        <TabsContent value="profile" className="mt-4">
          <Card className="rounded-2xl border-[var(--border-card)] bg-[var(--bg-card)] shadow-xs">
            <CardContent className="p-6">
              <form onSubmit={handleSave} className="space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 text-left">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      First Name *
                    </Label>
                    <Input
                      type="text"
                      required
                      value={form.firstName}
                      onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                      className="h-10 rounded-xl bg-[var(--bg-sheet)] border-[var(--border-card)] text-xs"
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      Last Name *
                    </Label>
                    <Input
                      type="text"
                      required
                      value={form.lastName}
                      onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                      className="h-10 rounded-xl bg-[var(--bg-sheet)] border-[var(--border-card)] text-xs"
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      Vanity URL Slug *
                    </Label>
                    <Input
                      type="text"
                      required
                      value={form.slug}
                      onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                      className="h-10 rounded-xl bg-[var(--bg-sheet)] border-[var(--border-card)] text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      Role
                    </Label>
                    <select
                      value={form.role}
                      onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as any }))}
                      className="w-full rounded-xl border border-[var(--border-card)] bg-[var(--bg-sheet)] h-10 px-3 text-xs text-[var(--text-primary)] outline-none shadow-xs"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Administrator</option>
                      <option value="master_admin">Master Administrator</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      Job Title
                    </Label>
                    <Input
                      type="text"
                      value={form.jobTitle}
                      onChange={(e) => setForm((p) => ({ ...p, jobTitle: e.target.value }))}
                      className="h-10 rounded-xl bg-[var(--bg-sheet)] border-[var(--border-card)] text-xs"
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      Company Name
                    </Label>
                    <Input
                      type="text"
                      value={form.companyName}
                      onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
                      className="h-10 rounded-xl bg-[var(--bg-sheet)] border-[var(--border-card)] text-xs"
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      Work Email *
                    </Label>
                    <Input
                      type="email"
                      required
                      value={form.workEmail}
                      onChange={(e) => setForm((p) => ({ ...p, workEmail: e.target.value }))}
                      className="h-10 rounded-xl bg-[var(--bg-sheet)] border-[var(--border-card)] text-xs"
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      Phone / WhatsApp
                    </Label>
                    <Input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      className="h-10 rounded-xl bg-[var(--bg-sheet)] border-[var(--border-card)] text-xs"
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      Portfolio / Website
                    </Label>
                    <Input
                      type="url"
                      value={form.websiteUrl}
                      onChange={(e) => setForm((p) => ({ ...p, websiteUrl: e.target.value }))}
                      className="h-10 rounded-xl bg-[var(--bg-sheet)] border-[var(--border-card)] text-xs"
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      Location
                    </Label>
                    <Input
                      type="text"
                      value={form.address}
                      onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                      className="h-10 rounded-xl bg-[var(--bg-sheet)] border-[var(--border-card)] text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    Headline / Bio
                  </Label>
                  <Textarea
                    rows={2}
                    value={form.bio}
                    onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                    className="rounded-xl bg-[var(--bg-sheet)] border-[var(--border-card)] text-xs"
                  />
                </div>

                {/* Social Links */}
                <div className="border-t border-[var(--border-subtle)] pt-4 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Social Profiles</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="space-y-1 text-left">
                      <Label className="text-[11px] text-[var(--text-muted)]">LinkedIn URL</Label>
                      <Input
                        type="url"
                        placeholder="https://linkedin.com/in/..."
                        value={form.linkedin}
                        onChange={(e) => setForm((p) => ({ ...p, linkedin: e.target.value }))}
                        className="h-9 rounded-xl bg-[var(--bg-sheet)] text-xs"
                      />
                    </div>
                    <div className="space-y-1 text-left">
                      <Label className="text-[11px] text-[var(--text-muted)]">GitHub URL</Label>
                      <Input
                        type="url"
                        placeholder="https://github.com/..."
                        value={form.github}
                        onChange={(e) => setForm((p) => ({ ...p, github: e.target.value }))}
                        className="h-9 rounded-xl bg-[var(--bg-sheet)] text-xs"
                      />
                    </div>
                    <div className="space-y-1 text-left">
                      <Label className="text-[11px] text-[var(--text-muted)]">Twitter / X URL</Label>
                      <Input
                        type="url"
                        placeholder="https://twitter.com/..."
                        value={form.twitter}
                        onChange={(e) => setForm((p) => ({ ...p, twitter: e.target.value }))}
                        className="h-9 rounded-xl bg-[var(--bg-sheet)] text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="gradient"
                    disabled={saving}
                    className="rounded-xl shadow-md"
                  >
                    {saving ? (
                      <><Loader2 size={14} className="animate-spin mr-1.5" /> Saving changes…</>
                    ) : (
                      <><Save size={14} className="mr-1.5" /> Save Member Details</>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: QR Studio & vCard */}
        <TabsContent value="qr" className="mt-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <Card className="flex flex-col items-center justify-center rounded-2xl border-[var(--border-card)] bg-[var(--bg-card)] p-8 shadow-xs lg:col-span-5">
              <div className="rounded-2xl bg-white p-4 shadow-md border border-[var(--border-card)]">
                <QRCodeSVG
                  id="user-qr-svg"
                  value={cardUrl}
                  size={220}
                  bgColor="#ffffff"
                  fgColor="#0F172A"
                  level="H"
                  marginSize={1}
                />
              </div>
              <p className="mt-4 font-mono text-xs font-semibold text-[var(--text-primary)]">
                /c/{form.slug || profile.slug}
              </p>
              <p className="text-[11px] text-[var(--text-muted)]">Error Correction Level: High (30% Redundancy)</p>

              <div className="mt-5 flex w-full flex-col gap-2 sm:flex-row">
                <Button
                  variant="gradient"
                  onClick={downloadPNG}
                  className="flex-1 rounded-xl shadow-md text-xs"
                >
                  <Download size={14} className="mr-1.5" /> PNG (1024px)
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="flex-1 rounded-xl border-[var(--border-card)] bg-[var(--bg-sheet)] text-xs"
                >
                  <a
                    href={`/api/vcard/${form.slug || profile.slug}`}
                    download={`${form.firstName}_${form.lastName}.vcf`}
                  >
                    <Download size={14} className="mr-1.5" /> RFC vCard (.vcf)
                  </a>
                </Button>
              </div>
            </Card>

            <Card className="rounded-2xl border-[var(--border-card)] bg-[var(--bg-card)] p-6 shadow-xs lg:col-span-7 space-y-4">
              <CardHeader className="p-0">
                <CardTitle className="text-sm font-bold text-[var(--text-primary)]">Canonical URL &amp; Physical Printing</CardTitle>
                <CardDescription className="text-xs text-[var(--text-muted)]">
                  This dynamic QR code points to the permanent vanity URL below. Even if this member updates their job title, phone, or company, printed cards, badges, and stickers will continue to resolve seamlessly.
                </CardDescription>
              </CardHeader>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-[var(--text-secondary)]">Permanent Card URL</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    readOnly
                    value={cardUrl}
                    className="rounded-xl border-[var(--border-card)] bg-[var(--bg-sheet)] font-mono text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopyLink}
                    className="rounded-xl border-[var(--border-card)] bg-[var(--bg-sheet)]"
                  >
                    {copied ? <Check size={14} className="text-emerald-500 mr-1" /> : <Copy size={14} className="mr-1" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </Button>
                </div>
              </div>

              <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 p-4 text-xs text-indigo-900 dark:text-indigo-300 space-y-1">
                <p className="font-semibold">💡 Print Sheet Creator</p>
                <p className="text-[11px] leading-relaxed opacity-90">
                  To generate multi-up batch printable sheets or custom branded badges for conferences, visit the platform <Link href="/admin/qr-generator" className="font-semibold underline">QR Studio</Link>.
                </p>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Member Captured Leads */}
        <TabsContent value="leads" className="mt-4">
          <Card className="overflow-hidden rounded-2xl border-[var(--border-card)] bg-[var(--bg-card)] shadow-xs">
            <CardHeader className="p-4 border-b border-[var(--border-card)] flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Contacts Exchanged with {profile.first_name}
              </CardTitle>
              <Badge variant="mint" className="text-xs font-semibold">
                {leads.length} Total Captured
              </Badge>
            </CardHeader>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-[var(--bg-sheet)]">
                  <TableRow className="border-b border-[var(--border-card)]">
                    <TableHead className="px-4 py-3 font-semibold text-xs text-[var(--text-muted)] uppercase tracking-wider">Prospect</TableHead>
                    <TableHead className="px-4 py-3 font-semibold text-xs text-[var(--text-muted)] uppercase tracking-wider">Phone</TableHead>
                    <TableHead className="px-4 py-3 font-semibold text-xs text-[var(--text-muted)] uppercase tracking-wider">Company</TableHead>
                    <TableHead className="px-4 py-3 font-semibold text-xs text-[var(--text-muted)] uppercase tracking-wider">Date</TableHead>
                    <TableHead className="px-4 py-3 font-semibold text-xs text-[var(--text-muted)] uppercase tracking-wider text-right">vCard Emailed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-[var(--border-subtle)]">
                  {leads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-[var(--text-muted)]">
                        No leads have been exchanged with {profile.first_name}&apos;s card yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    leads.map((l, i) => (
                      <TableRow key={l.id || i} className="hover:bg-[var(--border-subtle)]/50">
                        <TableCell className="px-4 py-3">
                          <p className="font-semibold text-[var(--text-primary)]">{l.visitor_name || l.name}</p>
                          <p className="text-[11px] text-[var(--text-muted)]">{l.visitor_email || l.email || '—'}</p>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-[var(--text-secondary)]">{l.visitor_phone || l.phone || '—'}</TableCell>
                        <TableCell className="px-4 py-3 text-[var(--text-secondary)]">{l.visitor_company || l.organization || '—'}</TableCell>
                        <TableCell className="px-4 py-3 text-[var(--text-muted)]">
                          {l.created_at ? new Date(l.created_at).toLocaleDateString() : 'Recent'}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          {l.vcard_emailed ? (
                            <Badge variant="mint" className="gap-1 font-semibold text-[10px]">
                              <Check size={10} /> Sent
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Confirm Delete Member Dialog ── */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border-[var(--border-card)] bg-[var(--bg-card)]">
          <DialogHeader>
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40">
                <Trash2 size={18} />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-[var(--text-primary)]">Delete Member Profile</DialogTitle>
                <DialogDescription className="text-xs text-[var(--text-muted)]">Remove digital business card permanently</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs text-[var(--text-secondary)]">
            <p>
              Are you sure you want to permanently delete <strong className="text-[var(--text-primary)]">{profile.first_name} {profile.last_name}</strong>?
            </p>
            <div className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-sheet)] p-3 space-y-1">
              <p><span className="text-[var(--text-muted)]">Slug:</span> <code className="font-mono text-indigo-600 dark:text-indigo-400">/c/{profile.slug}</code></p>
              <p><span className="text-[var(--text-muted)]">Email:</span> {profile.work_email}</p>
            </div>
            <p className="text-rose-500 text-[11px]">
              Warning: Anyone attempting to scan or visit their vanity URL will encounter a &quot;Card Unavailable&quot; screen.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={async () => {
                setDeleting(true)
                try {
                  await deleteProfile(profile.id || profile.slug)
                  toast.success(`Member ${profile.first_name} ${profile.last_name} deleted`)
                  router.push('/admin/users')
                } catch (err: any) {
                  toast.error(`Delete failed: ${err.message}`)
                  setDeleting(false)
                }
              }}
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
