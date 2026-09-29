'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import ThemeToggle from '@/components/ThemeToggle'
import {
  User,
  Mail,
  ArrowUpRight,
  Shield,
  CreditCard,
  LogOut,
  LogIn,
  QrCode,
  Send,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

export default function PortalHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, role, isAdmin, signOut, isDemo } = useAuth()

  const navItems = [
    {
      label: 'My Card Editor',
      href: '/portal/profile',
      icon: User,
      active: pathname === '/portal/profile',
    },
    {
      label: 'My QR Code',
      href: '/portal/qr',
      icon: QrCode,
      active: pathname === '/portal/qr',
    },
    {
      label: 'My Leads',
      href: '/portal/leads',
      icon: Mail,
      active: pathname === '/portal/leads',
    },
    {
      label: 'Telegram & Settings',
      href: '/portal/settings',
      icon: Send,
      active: pathname === '/portal/settings',
    },
  ]

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out successfully')
    router.push('/')
  }

  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Team Member'

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-card)] bg-[var(--bg-card)]/90 backdrop-blur-md transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Brand & Navigation */}
          <div className="flex items-center gap-6">
            <Link href="/portal/profile" className="flex items-center gap-3 transition-opacity hover:opacity-90">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-indigo-600 text-white shadow-sm shadow-emerald-500/20">
                <CreditCard size={18} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold tracking-tight text-sm sm:text-base">ContactForge</span>
                  <Badge variant="mint" className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                    Member Portal
                  </Badge>
                </div>
                <span className="text-[11px] text-[var(--text-muted)] hidden sm:inline">Personal Digital Card &amp; Leads</span>
              </div>
            </Link>

            {/* Desktop Nav Items */}
            <nav className="hidden lg:flex items-center gap-1.5 pl-2 border-l border-[var(--border-subtle)]" aria-label="Portal Navigation">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs transition-all duration-150 ${
                      item.active
                        ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-200/60 dark:border-emerald-800/60 shadow-xs'
                        : 'text-[var(--text-secondary)] font-medium hover:bg-[var(--border-subtle)] hover:text-[var(--text-primary)] border border-transparent'
                    }`}
                  >
                    <Icon size={14} className={item.active ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-dim)]'} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Show Admin Console switch if admin */}
            {isAdmin && (
              <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex rounded-xl border-indigo-200/60 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-950/30 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100/60">
                <Link href="/admin">
                  <Shield size={13} className="text-indigo-500 mr-1.5" />
                  <span>Admin Console</span>
                </Link>
              </Button>
            )}

            <Button size="sm" asChild className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-xs font-semibold text-white shadow-xs hover:brightness-105">
              <Link
                href={`/c/${profile?.slug || 'deepak-kumar'}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>Live Card</span>
                <ArrowUpRight size={13} className="ml-1" />
              </Link>
            </Button>

            {/* User status & Sign Out */}
            {user && !isDemo ? (
              <div className="flex items-center gap-2 pl-1 border-l border-[var(--border-subtle)]">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-xs font-semibold text-[var(--text-primary)] leading-tight">
                    {displayName}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">{user.email}</span>
                    <span className="text-[9px] uppercase px-1 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold">
                      {role || 'member'}
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  title="Sign out of Member Portal"
                  className="rounded-xl h-8 px-2.5 text-xs text-[var(--text-secondary)] hover:text-rose-600 hover:border-rose-200 dark:hover:border-rose-900/60"
                >
                  <LogOut size={13} className="sm:mr-1" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </div>
            ) : (
              <Button size="sm" asChild variant="gradient" className="rounded-xl text-xs h-8">
                <Link href="/">
                  <LogIn size={13} className="mr-1.5" />
                  <span>Sign In</span>
                </Link>
              </Button>
            )}

            {/* Theme Toggle */}
            <div className="flex items-center pl-1">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Nav Strip */}
      <div className="lg:hidden border-t border-[var(--border-subtle)] bg-[var(--bg-sheet)]/60 px-4 py-2">
        <nav className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5" aria-label="Mobile Portal Navigation">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-all ${
                  item.active
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                    : 'text-[var(--text-secondary)] bg-[var(--bg-card)] border border-[var(--border-card)] font-medium hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon size={13} />
                <span>{item.label}</span>
              </Link>
            )
          })}
          {isAdmin && (
            <Link
              href="/admin"
              className="flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-800/50"
            >
              <Shield size={12} />
              <span>Admin Console</span>
            </Link>
          )}
          {user && (
            <button
              onClick={handleSignOut}
              className="flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/50 dark:border-rose-900/50"
            >
              <LogOut size={12} />
              <span>Out</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  )
}
