'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import CardHero from '@/components/CardHero'
import ContactDetails from '@/components/ContactDetails'
import QRCodeSection from '@/components/QRCodeSection'
import CompanyBadge from '@/components/CompanyBadge'
import {
  Check,
  Sparkles,
  ExternalLink,
  Save,
  User,
  ShieldCheck,
  Mail,
  Camera,
  Loader2,
} from 'lucide-react'
import { CARD_CONFIG } from '@/lib/config'
import {
  getAllProfiles,
  getProfileBySlug,
  updateProfile,
  type Profile,
} from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

import { useAuth } from '@/context/AuthContext'

export default function MemberProfileEditorPage() {
  const { user, profile: authProfile, refreshProfile } = useAuth()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [selectedSlug, setSelectedSlug] = useState('deepak-kumar')
  const [currentProfileId, setCurrentProfileId] = useState<string>('demo-deepak')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    firstName: CARD_CONFIG.firstName,
    lastName: CARD_CONFIG.lastName,
    jobTitle: CARD_CONFIG.title,
    companyName: CARD_CONFIG.organization,
    department: CARD_CONFIG.companyTagline,
    workEmail: CARD_CONFIG.email,
    mobilePhone: CARD_CONFIG.phone,
    websiteUrl: CARD_CONFIG.website,
    address: CARD_CONFIG.location,
    bio: `${CARD_CONFIG.title} at ${CARD_CONFIG.organization}`,
    slug: 'deepak-kumar',
    avatarUrl: '',
    linkedin: CARD_CONFIG.linkedIn,
    github: CARD_CONFIG.github,
    twitter: CARD_CONFIG.twitter,
  })

  // Prioritize logged in user's profile
  useEffect(() => {
    if (authProfile) {
      applyProfile(authProfile)
    } else {
      async function load() {
        try {
          const list = await getAllProfiles()
          if (list && list.length > 0) {
            setProfiles(list)
            const first = list.find((p) => p.slug === 'deepak-kumar') || list[0]
            if (first) {
              applyProfile(first)
            }
          }
        } catch (err) {
          console.warn('Failed loading profiles in portal:', err)
        }
      }
      load()
    }
  }, [authProfile])

  const applyProfile = (p: Profile) => {
    setSelectedSlug(p.slug)
    setCurrentProfileId(p.id)
    setForm({
      firstName: p.first_name || '',
      lastName: p.last_name || '',
      jobTitle: p.job_title || '',
      companyName: p.company_name || '',
      department: p.department || '',
      workEmail: p.work_email || '',
      mobilePhone: p.mobile_phone || p.work_phone || '',
      websiteUrl: p.website_url || '',
      address: p.address || '',
      bio: p.bio || '',
      slug: p.slug,
      avatarUrl: p.avatar_url || '',
      linkedin: p.social_links?.linkedin || '',
      github: p.social_links?.github || '',
      twitter: p.social_links?.twitter || '',
    })
  }

  const handleSelectMember = async (slug: string) => {
    setSelectedSlug(slug)
    const found = profiles.find((p) => p.slug === slug) || (await getProfileBySlug(slug))
    if (found) {
      applyProfile(found)
    }
  }

  const previewProfile = useMemo<Profile>(
    () => ({
      id: currentProfileId,
      slug: form.slug,
      role: 'member',
      first_name: form.firstName,
      last_name: form.lastName,
      job_title: form.jobTitle,
      company_name: form.companyName,
      department: form.department,
      work_email: form.workEmail,
      mobile_phone: form.mobilePhone,
      work_phone: form.mobilePhone,
      website_url: form.websiteUrl,
      address: form.address,
      bio: form.bio,
      avatar_url: form.avatarUrl || undefined,
      is_active: true,
      social_links: {
        linkedin: form.linkedin,
        github: form.github,
        twitter: form.twitter,
      },
    }),
    [currentProfileId, form]
  )

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)

    try {
      const updates: Partial<Profile> = {
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        job_title: form.jobTitle.trim(),
        company_name: form.companyName.trim(),
        department: form.department.trim(),
        work_email: form.workEmail.trim(),
        mobile_phone: form.mobilePhone.trim(),
        work_phone: form.mobilePhone.trim(),
        website_url: form.websiteUrl.trim(),
        address: form.address.trim(),
        bio: form.bio.trim(),
        avatar_url: form.avatarUrl.trim() || undefined,
        social_links: {
          linkedin: form.linkedin.trim() || undefined,
          github: form.github.trim() || undefined,
          twitter: form.twitter.trim() || undefined,
        },
      }

      await updateProfile(currentProfileId, updates)
      await refreshProfile()
      setSaved(true)
      toast.success('Your digital card changes are live!')
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      toast.error('Save failed: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Edit My Digital Card</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Update your contact info, headline, bio, and social profiles. Changes reflect live on your card.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {profiles.length > 1 && (
            <div className="flex items-center gap-1.5 rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] px-3 py-1.5 text-xs">
              <User size={13} className="text-indigo-500" />
              <select
                value={selectedSlug}
                onChange={(e) => handleSelectMember(e.target.value)}
                className="bg-transparent text-xs font-semibold text-[var(--text-primary)] outline-none"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.slug}>
                    {p.first_name} {p.last_name} (/c/{p.slug})
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button variant="outline" size="sm" asChild className="rounded-xl border-[var(--border-card)] bg-[var(--bg-card)] text-xs font-semibold">
            <Link
              href={`/c/${form.slug}`}
              target="_blank"
            >
              <span>Open Live Card</span>
              <ExternalLink size={14} className="ml-1.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Split View: Editor + Live Preview */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Form Editor Column */}
        <div className="lg:col-span-7">
          <Card className="rounded-2xl border-[var(--border-card)] bg-[var(--bg-card)] p-6 shadow-xs">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Personal &amp; Contact Info
                </h2>
                {saved && (
                  <Badge variant="success" className="gap-1 text-xs font-semibold">
                    <Check size={14} /> Saved &amp; Live!
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 text-left">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    First Name
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
                    Last Name
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
                    Work Email
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
                    value={form.mobilePhone}
                    onChange={(e) => setForm((p) => ({ ...p, mobilePhone: e.target.value }))}
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
                  Avatar / Profile Photo URL
                </Label>
                <Input
                  type="url"
                  placeholder="https://images.unsplash.com/... or Supabase storage URL"
                  value={form.avatarUrl}
                  onChange={(e) => setForm((p) => ({ ...p, avatarUrl: e.target.value }))}
                  className="h-10 rounded-xl bg-[var(--bg-sheet)] border-[var(--border-card)] text-xs"
                />
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

              {/* Social Profiles */}
              <div className="pt-3 border-t border-[var(--border-subtle)] space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Social Media Links
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="space-y-1 text-left">
                    <Label className="text-[11px] text-[var(--text-muted)]">LinkedIn</Label>
                    <Input
                      type="url"
                      value={form.linkedin}
                      onChange={(e) => setForm((p) => ({ ...p, linkedin: e.target.value }))}
                      placeholder="https://linkedin.com/in/..."
                      className="h-9 rounded-xl bg-[var(--bg-sheet)] text-xs"
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <Label className="text-[11px] text-[var(--text-muted)]">GitHub</Label>
                    <Input
                      type="url"
                      value={form.github}
                      onChange={(e) => setForm((p) => ({ ...p, github: e.target.value }))}
                      placeholder="https://github.com/..."
                      className="h-9 rounded-xl bg-[var(--bg-sheet)] text-xs"
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <Label className="text-[11px] text-[var(--text-muted)]">X / Twitter</Label>
                    <Input
                      type="url"
                      value={form.twitter}
                      onChange={(e) => setForm((p) => ({ ...p, twitter: e.target.value }))}
                      placeholder="https://twitter.com/..."
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
                  className="rounded-xl shadow-md text-xs font-semibold"
                >
                  {saving ? (
                    <><Loader2 size={15} className="animate-spin mr-1.5" /> Saving…</>
                  ) : (
                    <><Save size={15} className="mr-1.5" /> Save Changes</>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Live Phone Preview Column */}
        <div className="flex flex-col items-center lg:col-span-5">
          <div className="sticky top-24 w-full flex flex-col items-center">
            <span className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
              <Sparkles size={13} className="text-amber-500" /> Live Card Preview
            </span>
            <div className="w-full max-w-[390px] overflow-hidden rounded-[28px] border border-[var(--border-card)] bg-[var(--bg-frame)] shadow-xl transition-all">
              <CardHero profile={previewProfile} />
              <div className="p-4 space-y-3 bg-[var(--bg-sheet)]">
                <ContactDetails profile={previewProfile} />
                <QRCodeSection profile={previewProfile} targetUrl={`https://app-amber-phi-95.vercel.app/c/${form.slug}`} />
                <CompanyBadge profile={previewProfile} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
