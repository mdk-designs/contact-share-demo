import { Metadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import { resolveProfileWithFallback, logQrScan } from '@/lib/supabase'
import ClientCardView from '@/components/ClientCardView'
import { CreditCard, ArrowLeft } from 'lucide-react'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const cleanSlug = decodeURIComponent(slug).toLowerCase()
  const profile = await resolveProfileWithFallback(cleanSlug)

  if (!profile) {
    return {
      title: 'Card Not Found | ContactForge',
      description: 'The requested digital business card could not be found.',
    }
  }

  const name = `${profile.first_name} ${profile.last_name}`.trim()
  const titleAndOrg = [profile.job_title, profile.company_name].filter(Boolean).join(' at ')
  const description = profile.bio || (titleAndOrg ? `${titleAndOrg} · Digital Business Card & Contact Exchange.` : 'Digital Business Card & Contact Exchange.')

  return {
    title: `${name} · Digital Business Card`,
    description,
    openGraph: {
      title: `${name} | ContactForge Digital Card`,
      description,
      url: `/c/${cleanSlug}`,
      siteName: 'ContactForge Enterprise Cards',
      type: 'profile',
      images: profile.avatar_url
        ? [
            {
              url: profile.avatar_url,
              width: 800,
              height: 800,
              alt: `${name} avatar`,
            },
          ]
        : [],
    },
    twitter: {
      card: 'summary',
      title: `${name} · Digital Business Card`,
      description,
    },
  }
}

export default async function PublicCardPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const cleanSlug = decodeURIComponent(slug).toLowerCase()

  // 1. Fetch profile from Supabase (or demo fallback)
  const profile = await resolveProfileWithFallback(cleanSlug)

  // 2. Telemetry: log server-side scan event asynchronously
  if (profile?.id) {
    try {
      const headerList = await headers()
      const userAgent = headerList.get('user-agent') || undefined
      const ip =
        headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        headerList.get('x-real-ip') ||
        undefined

      logQrScan(profile.id, userAgent, ip).catch(() => {})
    } catch {
      // Non-blocking telemetry
    }
  }

  // 3. If profile does not exist or has been disabled
  if (!profile || !profile.is_active) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-md rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-8 shadow-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
            <CreditCard size={28} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Card Unavailable
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">
            The digital business card for <span className="font-semibold text-[var(--text-primary)]">{cleanSlug}</span> was not found or has been deactivated by its administrator.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link
              href="/"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:brightness-105"
            >
              <ArrowLeft size={14} /> Back to Showcase
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return <ClientCardView initialProfile={profile} slug={cleanSlug} />
}
