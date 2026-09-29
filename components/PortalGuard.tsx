'use client'

import React, { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { Lock, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PortalGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
    }
  }, [isLoading, user, pathname, router])

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
          Loading Member Portal…
        </h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Connecting to your digital card profile and leads.
        </p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600">
          <Lock className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
          Member Sign In Required
        </h2>
        <p className="mt-1 max-w-sm text-xs text-[var(--text-muted)]">
          Please sign in to access your digital business card editor and view leads captured from your QR code.
        </p>
        <div className="mt-5">
          <Button asChild variant="gradient" className="rounded-xl">
            <Link href={`/login?redirect=${encodeURIComponent(pathname)}`}>
              <span>Sign In to Member Portal</span>
              <ArrowRight size={14} className="ml-1.5" />
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
