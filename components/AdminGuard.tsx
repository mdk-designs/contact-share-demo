'use client'

import React, { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { ShieldAlert, ArrowRight, LogOut, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isDemo, role, isAdmin, isLoading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const isAuthenticated = Boolean(user && !isDemo)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/?redirect=${encodeURIComponent(pathname)}`)
    }
  }, [isLoading, isAuthenticated, pathname, router])

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
          Verifying Administrator Privileges…
        </h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Checking your authentication session and role permissions.
        </p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
          Authentication Required
        </h2>
        <p className="mt-1 max-w-sm text-xs text-[var(--text-muted)]">
          You must be signed in with an administrator account to view the Admin Console. Redirecting to login…
        </p>
        <div className="mt-5">
          <Button asChild variant="gradient" className="rounded-xl">
            <Link href={`/?redirect=${encodeURIComponent(pathname)}`}>
              <span>Go to Sign In</span>
              <ArrowRight size={14} className="ml-1.5" />
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  // User is logged in but role is NOT admin
  if (!isAdmin) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6 sm:p-8 shadow-xl text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 ring-8 ring-rose-500/5">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <Badge variant="outline" className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-rose-600 border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40">
            Access Restricted · Admin Only
          </Badge>

          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] sm:text-2xl">
            Admin Portal Restricted
          </h2>

          <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
            You are currently signed in as <span className="font-semibold text-[var(--text-primary)]">{user?.email || 'Team Member'}</span> with the role <span className="font-semibold text-emerald-600 dark:text-emerald-400">Member</span>.
          </p>

          <p className="mt-2 text-xs text-[var(--text-muted)]">
            The Admin Portal is reserved for company managers and platform admins to manage team members, batch generate QR codes, and monitor organization-wide leads.
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            <Button asChild variant="default" className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold shadow-md hover:brightness-105">
              <Link href="/portal/profile">
                <span>Go to Member Portal</span>
                <ArrowRight size={14} className="ml-1.5" />
              </Link>
            </Button>

            <Button
              variant="ghost"
              onClick={() => signOut()}
              className="rounded-xl text-xs text-[var(--text-muted)] hover:text-rose-600"
            >
              <LogOut size={13} className="mr-1.5" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Admin access granted
  return <>{children}</>
}
