'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import ThemeToggle from '@/components/ThemeToggle'
import {
  User,
  ArrowRightLeft,
  ArrowUpRight,
  Shield,
  CreditCard,
  LogOut,
  QrCode,
  Settings,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

export default function PortalHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, role, isAdmin, isMasterAdmin, signOut } = useAuth()

  const navItems = [
    {
      label: 'My Card',
      href: '/portal/profile',
      icon: User,
      active: pathname === '/portal/profile',
    },
    {
      label: 'QR Code',
      href: '/portal/qr',
      icon: QrCode,
      active: pathname === '/portal/qr',
    },
    {
      label: 'Contact Exchanges',
      href: '/portal/exchanges',
      icon: ArrowRightLeft,
      active: pathname.startsWith('/portal/exchanges') || pathname.startsWith('/portal/leads'),
    },
    {
      label: 'Settings',
      href: '/portal/settings',
      icon: Settings,
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

  const roleLabel = isMasterAdmin ? 'Super Admin' : isAdmin ? 'Admin' : 'Member'

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
                <span className="text-[11px] text-[var(--text-muted)] hidden sm:inline">Digital Business Card &amp; Exchanges</span>
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

          {/* User Profile & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Direct Link to Live Public Card */}
            {profile?.slug && (
              <Button asChild variant="outline" size="sm" className="hidden md:inline-flex h-9 rounded-xl border-[var(--border-card)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] gap-1.5 shadow-xs">
                <Link href={`/c/${profile.slug}`} target="_blank" rel="noopener noreferrer">
                  <span>View My Card</span>
                  <ArrowUpRight size={13} className="text-[var(--text-dim)]" />
                </Link>
              </Button>
            )}

            {/* Switch to Admin Console if user is Admin or Super Admin */}
            {isAdmin && (
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex h-9 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 gap-1.5">
                <Link href="/admin">
                  <Shield size={14} />
                  <span>Admin Console</span>
                </Link>
              </Button>
            )}

            <ThemeToggle />

            {/* User Profile Capsule */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-[var(--border-subtle)]">
              <div className="flex flex-col text-right hidden sm:flex">
                <span className="text-xs font-bold text-[var(--text-primary)] truncate max-w-[130px]">
                  {displayName}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] font-medium">
                  {roleLabel}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="h-8 rounded-xl border-[var(--border-card)] px-2.5 text-xs text-[var(--text-secondary)] hover:text-rose-600 hover:border-rose-200 dark:hover:border-rose-900 transition-colors shadow-xs"
                title="Sign out of ContactForge"
              >
                <LogOut size={13} className="sm:mr-1" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex lg:hidden overflow-x-auto py-2.5 gap-1.5 border-t border-[var(--border-subtle)] no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs transition-colors ${
                  item.active
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-200/60 dark:border-emerald-800/60'
                    : 'text-[var(--text-secondary)] font-medium hover:bg-[var(--border-subtle)]'
                }`}
              >
                <Icon size={14} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </header>
  )
}
