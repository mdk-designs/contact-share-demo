'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import ThemeToggle from '@/components/ThemeToggle'
import {
  LayoutDashboard,
  Users,
  QrCode,
  Mail,
  ArrowUpRight,
  Shield,
  LogOut,
  User as UserIcon,
  LogIn,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

export default function AdminHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, role, signOut, isDemo } = useAuth()

  const navItems = [
    {
      label: 'Overview',
      href: '/admin',
      icon: LayoutDashboard,
      active: pathname === '/admin',
    },
    {
      label: 'Team Members',
      href: '/admin/users',
      icon: Users,
      active: pathname.startsWith('/admin/users'),
    },
    {
      label: 'QR Studio & Batch',
      href: '/admin/qr-generator',
      icon: QrCode,
      active: pathname.startsWith('/admin/qr-generator'),
    },
    {
      label: 'Exchanged Leads',
      href: '/admin/leads',
      icon: Mail,
      active: pathname.startsWith('/admin/leads'),
    },
  ]

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out successfully')
    router.push('/')
  }

  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Administrator'

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-card)] bg-[var(--bg-card)]/90 backdrop-blur-md transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Brand & Desktop Navigation */}
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-3 transition-opacity hover:opacity-90">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white shadow-sm shadow-indigo-500/20">
                <Shield size={18} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold tracking-tight text-sm sm:text-base">ContactForge</span>
                  <Badge variant="lavender" className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                    Admin
                  </Badge>
                </div>
                <span className="text-[11px] text-[var(--text-muted)] hidden sm:inline">Enterprise Digital Cards</span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1.5 pl-2 border-l border-[var(--border-subtle)]" aria-label="Desktop Admin Navigation">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs transition-all duration-150 ${
                      item.active
                        ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200/60 dark:border-indigo-800/60 shadow-xs'
                        : 'text-[var(--text-secondary)] font-medium hover:bg-[var(--border-subtle)] hover:text-[var(--text-primary)] border border-transparent'
                    }`}
                  >
                    <Icon size={14} className={item.active ? 'text-indigo-600 dark:text-indigo-400' : 'text-[var(--text-dim)]'} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100/60">
              <Link href="/portal/profile">
                <span>Member Portal</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </Button>

            {/* User status & Sign Out / In */}
            {user && !isDemo ? (
              <div className="flex items-center gap-2 pl-1 border-l border-[var(--border-subtle)]">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-xs font-semibold text-[var(--text-primary)] leading-tight">
                    {displayName}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">{user.email}</span>
                    {isDemo && (
                      <span className="text-[9px] uppercase px-1 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold">
                        Demo
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  title="Sign out of Admin Portal"
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

            {/* Theme Toggle aligned cleanly */}
            <div className="flex items-center pl-1">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile / Tablet Horizontal Navigation Strip */}
      <div className="lg:hidden border-t border-[var(--border-subtle)] bg-[var(--bg-sheet)]/60 px-4 py-2">
        <nav className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5" aria-label="Mobile Admin Navigation">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-all ${
                  item.active
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'text-[var(--text-secondary)] bg-[var(--bg-card)] border border-[var(--border-card)] font-medium hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon size={13} />
                <span>{item.label}</span>
              </Link>
            )
          })}
          <Link
            href="/portal/profile"
            className="flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-800/50"
          >
            <span>Portal &rarr;</span>
          </Link>
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
