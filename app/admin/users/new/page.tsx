'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, UserPlus, Check, Sparkles, Loader2, ArrowRight } from 'lucide-react'
import { createProfile } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function NewUserPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [createdSlug, setCreatedSlug] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    workEmail: '',
    jobTitle: '',
    companyName: 'DesignForge Studio',
    department: 'Product & Design',
    mobilePhone: '',
    websiteUrl: 'https://designforge.studio',
    address: 'Bengaluru, India',
    bio: '',
    slug: '',
    role: 'member' as 'admin' | 'member',
  })

  // Auto-generate vanity slug from first and last name
  const handleNameChange = (first: string, last: string) => {
    const raw = `${first}-${last}`
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
    setForm((prev) => ({
      ...prev,
      firstName: first,
      lastName: last,
      slug: prev.slug === '' || prev.slug === `${prev.firstName}-${prev.lastName}`.toLowerCase().replace(/[^a-z0-9-]/g, '') ? raw : prev.slug,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!form.firstName || !form.lastName || !form.workEmail || !form.slug) {
      setErrorMsg('Please fill in First Name, Last Name, Email, and Vanity Slug.')
      toast.error('Missing required fields')
      return
    }

    setLoading(true)
    try {
      const newProfile = {
        id: crypto.randomUUID(),
        slug: form.slug.toLowerCase().trim(),
        role: form.role,
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        job_title: form.jobTitle.trim() || undefined,
        company_name: form.companyName.trim() || undefined,
        department: form.department.trim() || undefined,
        work_email: form.workEmail.trim(),
        mobile_phone: form.mobilePhone.trim() || undefined,
        work_phone: form.mobilePhone.trim() || undefined,
        website_url: form.websiteUrl.trim() || undefined,
        address: form.address.trim() || undefined,
        bio: form.bio.trim() || undefined,
        is_active: true,
      }

      await createProfile(newProfile)

      setCreatedSlug(form.slug)
      toast.success(`Card /c/${form.slug} created successfully!`)
    } catch (err: unknown) {
      console.error('Profile creation error:', err)
      toast.error('Failed to save profile.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" asChild className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] -ml-2">
        <Link href="/admin/users">
          <ArrowLeft size={14} className="mr-1.5" /> Back to Team Members
        </Link>
      </Button>

      <Card className="rounded-2xl border-[var(--border-card)] bg-[var(--bg-card)] shadow-xs">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold tracking-tight">Create Team Member Card</CardTitle>
          <CardDescription className="text-xs text-[var(--text-secondary)]">
            Add a new employee or member to the digital card platform with an instant vanity URL.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {createdSlug ? (
            <div className="space-y-4 rounded-xl border border-[var(--pastel-mint-border)] bg-[var(--pastel-mint-bg)]/40 p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--pastel-mint-bg)] text-[var(--pastel-mint-fg)] border border-[var(--pastel-mint-border)]">
                <Check size={24} />
              </div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Card Created Successfully!</h2>
              <p className="text-xs text-[var(--text-secondary)]">
                The public digital business card is now live at:
              </p>
              <div className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-3">
                <code className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  /c/{createdSlug}
                </code>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button variant="gradient" asChild className="rounded-xl shadow-md">
                  <Link href={`/c/${createdSlug}`} target="_blank">
                    View Public Card <ArrowRight size={14} className="ml-1.5" />
                  </Link>
                </Button>
                <Button variant="outline" asChild className="rounded-xl border-[var(--border-card)] bg-[var(--bg-card)]">
                  <Link href={`/admin/qr-generator?slug=${createdSlug}`}>
                    Generate QR Code
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setCreatedSlug(null)
                    setForm({
                      firstName: '',
                      lastName: '',
                      workEmail: '',
                      jobTitle: '',
                      companyName: 'DesignForge Studio',
                      department: 'Product & Design',
                      mobilePhone: '',
                      websiteUrl: 'https://designforge.studio',
                      address: 'Bengaluru, India',
                      bio: '',
                      slug: '',
                      role: 'member',
                    })
                  }}
                  className="text-xs text-[var(--text-muted)] hover:underline"
                >
                  Create Another
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 text-left">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    First Name *
                  </Label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Priya"
                    value={form.firstName}
                    onChange={(e) => handleNameChange(e.target.value, form.lastName)}
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
                    placeholder="e.g. Sharma"
                    value={form.lastName}
                    onChange={(e) => handleNameChange(form.firstName, e.target.value)}
                    className="h-10 rounded-xl bg-[var(--bg-sheet)] border-[var(--border-card)] text-xs"
                  />
                </div>
              </div>

              {/* Vanity Slug */}
              <div className="space-y-1.5 text-left">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Vanity URL Slug * (e.g. domain.com/c/<strong>priya-sharma</strong>)
                </Label>
                <div className="flex items-center rounded-xl border border-[var(--border-card)] bg-[var(--bg-sheet)] px-3 h-10 shadow-xs focus-within:ring-2 focus-within:ring-indigo-500/20">
                  <span className="text-xs text-[var(--text-muted)] select-none">/c/</span>
                  <input
                    type="text"
                    required
                    placeholder="priya-sharma"
                    value={form.slug}
                    onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                    className="w-full bg-transparent text-xs font-mono text-[var(--text-primary)] outline-none pl-0.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 text-left">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    Work Email *
                  </Label>
                  <Input
                    type="email"
                    required
                    placeholder="priya@designforge.studio"
                    value={form.workEmail}
                    onChange={(e) => setForm((prev) => ({ ...prev, workEmail: e.target.value }))}
                    className="h-10 rounded-xl bg-[var(--bg-sheet)] border-[var(--border-card)] text-xs"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    Mobile / WhatsApp Phone
                  </Label>
                  <Input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={form.mobilePhone}
                    onChange={(e) => setForm((prev) => ({ ...prev, mobilePhone: e.target.value }))}
                    className="h-10 rounded-xl bg-[var(--bg-sheet)] border-[var(--border-card)] text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 text-left">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    Job Title
                  </Label>
                  <Input
                    type="text"
                    placeholder="Senior Product Designer"
                    value={form.jobTitle}
                    onChange={(e) => setForm((prev) => ({ ...prev, jobTitle: e.target.value }))}
                    className="h-10 rounded-xl bg-[var(--bg-sheet)] border-[var(--border-card)] text-xs"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    Department / Team
                  </Label>
                  <Input
                    type="text"
                    placeholder="Design &amp; Innovation"
                    value={form.department}
                    onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))}
                    className="h-10 rounded-xl bg-[var(--bg-sheet)] border-[var(--border-card)] text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 text-left">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    Company Name
                  </Label>
                  <Input
                    type="text"
                    value={form.companyName}
                    onChange={(e) => setForm((prev) => ({ ...prev, companyName: e.target.value }))}
                    className="h-10 rounded-xl bg-[var(--bg-sheet)] border-[var(--border-card)] text-xs"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    System Role
                  </Label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as any }))}
                    className="w-full rounded-xl border border-[var(--border-card)] bg-[var(--bg-sheet)] h-10 px-3 text-xs text-[var(--text-primary)] outline-none focus:border-indigo-500 shadow-xs"
                  >
                    <option value="member">Member (Personal Card Only)</option>
                    <option value="admin">Admin (Team Management)</option>
                    <option value="master_admin">Master Admin (Complete System Access)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Short Bio / Headline
                </Label>
                <Textarea
                  rows={2}
                  placeholder="Product designer crafting thoughtful user experiences."
                  value={form.bio}
                  onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
                  className="rounded-xl bg-[var(--bg-sheet)] border-[var(--border-card)] text-xs"
                />
              </div>

              <Button
                type="submit"
                variant="gradient"
                size="lg"
                disabled={loading}
                className="w-full rounded-xl py-3 text-xs font-semibold shadow-md mt-2"
              >
                {loading ? (
                  <><Loader2 size={15} className="animate-spin mr-2" /> Creating Card…</>
                ) : (
                  <><Sparkles size={15} className="mr-2" /> Generate Digital Card</>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
