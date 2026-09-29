'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import CardHero from '@/components/CardHero'
import ContactDetails from '@/components/ContactDetails'
import QRCodeSection from '@/components/QRCodeSection'
import CompanyBadge from '@/components/CompanyBadge'
import Toast from '@/components/Toast'
import ThemeToggle from '@/components/ThemeToggle'

const ExchangeModal = dynamic(() => import('@/components/ExchangeModal'), {
  ssr: false,
})
import {
  ArrowRightLeft,
  Shield,
  CreditCard,
  LogIn,
  LogOut,
  User,
  ArrowRight,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type ToastState = { visible: boolean; type: 'success' | 'error'; message: string }

export default function CardPreviewPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [toast, setToast] = useState<ToastState>({ visible: false, type: 'success', message: '' })

  const { user, profile, role, isAdmin, signOut, isDemo } = useAuth()
  const isAuthenticated = Boolean(user && !isDemo)

  const showToast = useCallback((type: 'success' | 'error', msg: string) => {
    setToast({ visible: true, type, message: msg })
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3500)
  }, [])

  const openModal  = useCallback(() => setModalOpen(true), [])
  const closeModal = useCallback(() => setModalOpen(false), [])

  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'User'

  return (
    <>
      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border-card)] bg-[var(--bg-card)]/80 backdrop-blur-md px-4 py-2.5 transition-colors">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white shadow-xs">
              <Shield size={16} />
            </div>
            <div className="hidden sm:block">
              <span className="text-xs font-bold tracking-tight">ContactForge</span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span className="hidden md:inline text-xs text-[var(--text-secondary)]">
                  Signed in as <strong className="text-[var(--text-primary)]">{displayName}</strong>
                </span>
                <Badge
                  variant={isAdmin ? 'lavender' : 'mint'}
                  className="text-[10px] uppercase font-bold px-2 py-0.5"
                >
                  {isAdmin ? 'Admin' : 'Member'}
                </Badge>

                {isAdmin ? (
                  <Button size="sm" asChild variant="gradient" className="rounded-xl text-xs h-8">
                    <Link href="/admin">
                      <Shield size={13} className="mr-1" />
                      <span>Admin Portal</span>
                    </Link>
                  </Button>
                ) : (
                  <Button size="sm" asChild variant="outline" className="rounded-xl text-xs h-8 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400">
                    <Link href="/portal/profile">
                      <CreditCard size={13} className="mr-1" />
                      <span>Member Portal</span>
                    </Link>
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => signOut()}
                  className="rounded-xl text-xs h-8 text-[var(--text-muted)] hover:text-rose-600"
                >
                  <LogOut size={13} />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button size="sm" asChild variant="gradient" className="rounded-xl text-xs h-8">
                  <Link href="/">
                    <LogIn size={13} className="mr-1" />
                    <span>Sign In</span>
                  </Link>
                </Button>
              </div>
            )}

            <div className="pl-1">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* ── Phone frame ── */}
      <div className="phone-frame mt-4">
        <CardHero />
        <main className="content-sheet" aria-label="Business card details">
          <ContactDetails />
          <QRCodeSection />
          <CompanyBadge />

          <div className="pt-4 pb-2 text-center text-[11px] text-[var(--text-muted)] flex items-center justify-center gap-3 border-t border-[var(--border-subtle)]">
            {isAuthenticated ? (
              <>
                <Link href={isAdmin ? '/admin' : '/portal/profile'} className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                  {isAdmin ? 'Admin Console' : 'Member Portal'}
                </Link>
                <span>&bull;</span>
                <button onClick={() => signOut()} className="hover:text-rose-600 hover:underline">
                  Sign Out
                </button>
              </>
            ) : (
              <Link href="/" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                Sign In to Member Portal &rarr;
              </Link>
            )}
          </div>
        </main>
      </div>

      {/* ── Sticky CTA ── */}
      <div className="cta-sticky" role="complementary" aria-label="Exchange contact action">
        <button
          className="cta-btn"
          onClick={openModal}
          id="cta-exchange-btn"
          aria-label="Open contact exchange form"
          aria-haspopup="dialog"
          aria-expanded={modalOpen}
        >
          <ArrowRightLeft size={18} aria-hidden="true" />
          Exchange &amp; Save Contact
        </button>
      </div>

      {/* ── Modal ── */}
      {modalOpen ? (
        <ExchangeModal open={modalOpen} onClose={closeModal} onToast={showToast} />
      ) : null}

      {/* ── Toast ── */}
      <Toast visible={toast.visible} type={toast.type} message={toast.message} />
    </>
  )
}
