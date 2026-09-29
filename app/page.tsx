'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  CreditCard,
  Lock,
  Mail,
  User,
  Building,
  KeyRound,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ThemeToggle from '@/components/ThemeToggle'
import { toast } from 'sonner'

function LoginFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTarget = searchParams.get('redirect')

  const {
    user,
    role,
    isAdmin,
    signInWithPassword,
    signUp,
    signInWithOtp,
    signInAsDemo,
    isLoading,
  } = useAuth()

  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'demo'>('signin')

  // Auto-redirect authenticated users to their corresponding portal
  useEffect(() => {
    if (!isLoading && user) {
      if (redirectTarget) {
        router.push(redirectTarget)
      } else if (isAdmin) {
        router.push('/admin')
      } else {
        router.push('/portal/profile')
      }
    }
  }, [isLoading, user, isAdmin, redirectTarget, router])

  // Sign In form state
  const [signInEmail, setSignInEmail] = useState('')
  const [signInPassword, setSignInPassword] = useState('')
  const [showSignInPassword, setShowSignInPassword] = useState(false)
  const [signInError, setSignInError] = useState<string | null>(null)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Sign Up form state
  const [signUpFirstName, setSignUpFirstName] = useState('')
  const [signUpLastName, setSignUpLastName] = useState('')
  const [signUpEmail, setSignUpEmail] = useState('')
  const [signUpPassword, setSignUpPassword] = useState('')
  const [signUpCompany, setSignUpCompany] = useState('')
  const [showSignUpPassword, setShowSignUpPassword] = useState(false)
  const [signUpError, setSignUpError] = useState<string | null>(null)

  // Handle Sign In submission
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignInError(null)

    if (!signInEmail) {
      setSignInError('Please enter your email address.')
      return
    }
    if (!signInPassword) {
      setSignInError('Please enter your password.')
      return
    }

    setIsSubmitting(true)
    try {
      const { error, role: loggedInRole } = await signInWithPassword(signInEmail, signInPassword)
      if (error) {
        setSignInError(error.message || 'Failed to sign in. Please check your credentials.')
        toast.error('Authentication failed', { description: error.message })
        return
      }

      toast.success('Signed in successfully!')

      if (redirectTarget) {
        router.push(redirectTarget)
      } else if (loggedInRole === 'admin') {
        router.push('/admin')
      } else {
        router.push('/portal/profile')
      }
    } catch (err: any) {
      setSignInError(err.message || 'An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Magic Link (OTP)
  const handleMagicLink = async () => {
    setSignInError(null)
    if (!signInEmail) {
      setSignInError('Please enter your work email to receive a sign-in link.')
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await signInWithOtp(signInEmail)
      if (error) {
        setSignInError(error.message)
        toast.error('Magic link error', { description: error.message })
      } else {
        setMagicLinkSent(true)
        toast.success('Magic link sent!', {
          description: `Check your inbox at ${signInEmail} for the login link.`,
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Sign Up submission (Default role: Member)
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignUpError(null)

    if (!signUpFirstName || !signUpEmail || !signUpPassword) {
      setSignUpError('Please complete all required fields.')
      return
    }
    if (signUpPassword.length < 6) {
      setSignUpError('Password must be at least 6 characters long.')
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await signUp(signUpEmail, signUpPassword, {
        firstName: signUpFirstName,
        lastName: signUpLastName,
        role: 'member',
        companyName: signUpCompany || 'DesignForge Studio',
      })

      if (error) {
        setSignUpError(error.message)
        toast.error('Registration failed', { description: error.message })
        return
      }

      toast.success('Account created!', {
        description: `Welcome to ContactForge, ${signUpFirstName}!`,
      })

      if (redirectTarget) {
        router.push(redirectTarget)
      } else {
        router.push('/portal/profile')
      }
    } catch (err: any) {
      setSignUpError(err.message || 'Registration failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Quick 1-click Demo Sign In (Member only)
  const handleDemoSignIn = async () => {
    setIsSubmitting(true)
    try {
      await signInAsDemo('member')
      toast.success('Signed in as Demo Team Member')

      if (redirectTarget) {
        router.push(redirectTarget)
      } else {
        router.push('/portal/profile')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors duration-200">
      {/* Top Bar */}
      <header className="w-full border-b border-[var(--border-card)] bg-[var(--bg-card)]/80 backdrop-blur-md px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white shadow-sm shadow-indigo-500/20">
              <ShieldCheck size={18} />
            </div>
            <div>
              <span className="font-bold tracking-tight text-sm sm:text-base">ContactForge</span>
              <span className="text-[11px] text-[var(--text-muted)] block sm:inline sm:ml-2">
                Digital Business Cards &amp; Leads
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/card"
              className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium transition-colors"
            >
              <Globe size={13} />
              <span>Card Demo</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-lg">
          {/* Redirect / Target Banner Notice */}
          {redirectTarget && (
            <div className="mb-4 flex items-center gap-2.5 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/80 bg-indigo-50/90 dark:bg-indigo-950/60 p-3.5 text-xs text-indigo-700 dark:text-indigo-300 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
              <Lock size={16} className="shrink-0 text-indigo-600 dark:text-indigo-400" />
              <div>
                <span className="font-semibold">Authentication required: </span>
                <span>Please sign in to access your requested portal.</span>
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] shadow-xl backdrop-blur-xl">
            {/* Header Badge & Title */}
            <div className="bg-gradient-to-b from-[var(--border-subtle)]/40 to-transparent p-6 pb-4 sm:p-8 sm:pb-4 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/25">
                <KeyRound size={22} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
                ContactForge Portal
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-[var(--text-secondary)]">
                Sign in to manage your digital business card and lead capture.
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
              <div className="px-6 sm:px-8">
                <TabsList className="grid w-full grid-cols-3 rounded-2xl p-1 bg-[var(--border-subtle)]/70">
                  <TabsTrigger value="signin" className="rounded-xl text-xs font-semibold py-2">
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="rounded-xl text-xs font-semibold py-2">
                    Create Account
                  </TabsTrigger>
                  <TabsTrigger value="demo" className="rounded-xl text-xs font-semibold py-2 text-indigo-600 dark:text-indigo-400">
                    <Sparkles size={12} className="mr-1 inline" /> Quick Demo
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* ──────────────────────────────────────────────────────── */}
              {/* TAB 1: SIGN IN */}
              {/* ──────────────────────────────────────────────────────── */}
              <TabsContent value="signin" className="p-6 sm:p-8 pt-4 focus-visible:outline-none">
                <form onSubmit={handleSignIn} className="space-y-4">
                  {signInError && (
                    <div className="flex items-start gap-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-600 dark:text-rose-400">
                      <AlertCircle size={15} className="mt-0.5 shrink-0" />
                      <span>{signInError}</span>
                    </div>
                  )}

                  {magicLinkSent && (
                    <div className="flex items-start gap-2 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                      <span>Check your email inbox! A secure magic sign-in link has been dispatched.</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="signin-email" className="text-xs font-medium text-[var(--text-secondary)]">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-3 text-[var(--text-muted)] pointer-events-none" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="you@company.com"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        required
                        className="pl-10 h-10 rounded-xl bg-[var(--bg-app)] border-[var(--border-card)] text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="signin-password" className="text-xs font-medium text-[var(--text-secondary)]">
                        Password
                      </Label>
                      <button
                        type="button"
                        onClick={handleMagicLink}
                        className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Email me a magic link
                      </button>
                    </div>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-3 text-[var(--text-muted)] pointer-events-none" />
                      <Input
                        id="signin-password"
                        type={showSignInPassword ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        required
                        className="pl-10 pr-10 h-10 rounded-xl bg-[var(--bg-app)] border-[var(--border-card)] text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignInPassword(!showSignInPassword)}
                        className="absolute right-3.5 top-3 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        aria-label="Toggle password visibility"
                      >
                        {showSignInPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting || isLoading}
                    className="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 text-white font-semibold shadow-md shadow-indigo-500/20 hover:brightness-105 transition-all text-xs sm:text-sm"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        <span>Verifying credentials…</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight size={15} className="ml-2" />
                      </>
                    )}
                  </Button>

                  <div className="pt-2 text-center">
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Want to evaluate the portal immediately?{' '}
                      <button
                        type="button"
                        onClick={() => setActiveTab('demo')}
                        className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Try Quick Demo Access
                      </button>
                    </p>
                  </div>
                </form>
              </TabsContent>

              {/* ──────────────────────────────────────────────────────── */}
              {/* TAB 2: CREATE ACCOUNT */}
              {/* ──────────────────────────────────────────────────────── */}
              <TabsContent value="signup" className="p-6 sm:p-8 pt-4 focus-visible:outline-none">
                <form onSubmit={handleSignUp} className="space-y-4">
                  {signUpError && (
                    <div className="flex items-start gap-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-600 dark:text-rose-400">
                      <AlertCircle size={15} className="mt-0.5 shrink-0" />
                      <span>{signUpError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-first" className="text-xs font-medium text-[var(--text-secondary)]">
                        First Name
                      </Label>
                      <Input
                        id="signup-first"
                        type="text"
                        placeholder="Alex"
                        value={signUpFirstName}
                        onChange={(e) => setSignUpFirstName(e.target.value)}
                        required
                        className="h-10 rounded-xl bg-[var(--bg-app)] border-[var(--border-card)] text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-last" className="text-xs font-medium text-[var(--text-secondary)]">
                        Last Name
                      </Label>
                      <Input
                        id="signup-last"
                        type="text"
                        placeholder="Rivera"
                        value={signUpLastName}
                        onChange={(e) => setSignUpLastName(e.target.value)}
                        className="h-10 rounded-xl bg-[var(--bg-app)] border-[var(--border-card)] text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="signup-email" className="text-xs font-medium text-[var(--text-secondary)]">
                      Work Email
                    </Label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-3 text-[var(--text-muted)] pointer-events-none" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="alex@company.com"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        required
                        className="pl-10 h-10 rounded-xl bg-[var(--bg-app)] border-[var(--border-card)] text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="signup-company" className="text-xs font-medium text-[var(--text-secondary)]">
                      Company / Organization
                    </Label>
                    <div className="relative">
                      <Building size={15} className="absolute left-3.5 top-3 text-[var(--text-muted)] pointer-events-none" />
                      <Input
                        id="signup-company"
                        type="text"
                        placeholder="DesignForge Studio"
                        value={signUpCompany}
                        onChange={(e) => setSignUpCompany(e.target.value)}
                        className="pl-10 h-10 rounded-xl bg-[var(--bg-app)] border-[var(--border-card)] text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="signup-password" className="text-xs font-medium text-[var(--text-secondary)]">
                      Password (min. 6 characters)
                    </Label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-3 text-[var(--text-muted)] pointer-events-none" />
                      <Input
                        id="signup-password"
                        type={showSignUpPassword ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        required
                        minLength={6}
                        className="pl-10 pr-10 h-10 rounded-xl bg-[var(--bg-app)] border-[var(--border-card)] text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                        className="absolute right-3.5 top-3 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        aria-label="Toggle password visibility"
                      >
                        {showSignUpPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-app)]/50 p-3 text-xs text-[var(--text-muted)] flex items-center gap-2">
                    <CreditCard size={15} className="text-emerald-500 shrink-0" />
                    <span>Registers an individual digital business card &amp; lead management portal.</span>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting || isLoading}
                    className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold shadow-md shadow-emerald-500/20 hover:brightness-105 transition-all text-xs sm:text-sm"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        <span>Creating account…</span>
                      </>
                    ) : (
                      <>
                        <span>Register with Supabase</span>
                        <ArrowRight size={15} className="ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* ──────────────────────────────────────────────────────── */}
              {/* TAB 3: 1-CLICK DEMO ACCESS (Team Member Only) */}
              {/* ──────────────────────────────────────────────────────── */}
              <TabsContent value="demo" className="p-6 sm:p-8 pt-4 focus-visible:outline-none space-y-4">
                <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-sheet)]/50 p-4">
                  <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                    Explore the digital business card portal instantly without entering credentials:
                  </p>
                </div>

                {/* Team Member Demo */}
                <div className="relative overflow-hidden rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-gradient-to-br from-emerald-50/70 to-teal-50/40 dark:from-emerald-950/50 dark:to-teal-950/20 p-4 sm:p-5 transition-all hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                        <CreditCard size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-[var(--text-primary)]">Team Member Portal</h3>
                          <Badge variant="mint" className="text-[9px] uppercase font-bold px-1.5 py-0.2">
                            Demo Account
                          </Badge>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                          Sarah Jenkins · sarah.jenkins@contactforge.io
                        </p>
                      </div>
                    </div>
                  </div>

                  <ul className="mt-3 space-y-1 text-[11px] text-[var(--text-muted)] border-t border-emerald-100 dark:border-emerald-900/40 pt-2.5">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-emerald-500" />
                      <span>Live Digital Card Profile Editor</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-emerald-500" />
                      <span>Personal QR Code &amp; Lead Collector</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-emerald-500" />
                      <span>Instant Contact vCard Export</span>
                    </li>
                  </ul>

                  <Button
                    onClick={handleDemoSignIn}
                    disabled={isSubmitting}
                    className="mt-4 w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs"
                  >
                    <span>Launch Member Portal</span>
                    <ArrowRight size={14} className="ml-1.5" />
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {/* Footer Information */}
            <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-sheet)]/60 px-6 py-4 text-center">
              <div className="flex items-center justify-center gap-2 text-[11px] text-[var(--text-muted)]">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Supabase Auth Cloud Enabled (JWT &amp; RLS)</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[var(--border-card)] py-4 text-center text-xs text-[var(--text-muted)]">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} ContactForge. Enterprise Digital Business Card System.</span>
          <div className="flex items-center gap-4">
            <Link href="/card" className="hover:text-[var(--text-primary)] hover:underline">
              Digital Card Preview
            </Link>
            <Link href="/portal/profile" className="hover:text-[var(--text-primary)] hover:underline">
              Member Portal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-app)]">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  )
}
