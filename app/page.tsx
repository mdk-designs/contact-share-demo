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
    isLoading,
  } = useAuth()

  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin')

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



  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Bar */}
      <header className="w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white shadow-sm shadow-indigo-500/20">
              <ShieldCheck size={18} />
            </div>
            <div>
              <span className="font-bold tracking-tight text-sm sm:text-base text-slate-900 dark:text-white">ContactForge</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block sm:inline sm:ml-2">
                Digital Business Cards &amp; Leads
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/card"
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium transition-colors"
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
            <div className="mb-4 flex items-center gap-2.5 rounded-2xl border border-indigo-200 bg-indigo-50/90 dark:border-indigo-800 dark:bg-indigo-950/80 p-3.5 text-xs text-indigo-900 dark:text-indigo-200 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
              <Lock size={16} className="shrink-0 text-indigo-600 dark:text-indigo-400" />
              <div className="leading-snug">
                <span className="font-bold text-indigo-950 dark:text-indigo-100">Authentication required: </span>
                <span className="text-indigo-900 dark:text-indigo-200">Please sign in to access your requested portal.</span>
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl backdrop-blur-xl">
            {/* Header Badge & Title */}
            <div className="bg-gradient-to-b from-slate-50/60 dark:from-slate-800/40 to-transparent p-6 pb-4 sm:p-8 sm:pb-4 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/25">
                <KeyRound size={22} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                ContactForge Portal
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Sign in to manage your digital business card and lead capture.
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
              <div className="px-6 sm:px-8">
                <TabsList className="grid w-full grid-cols-2 rounded-2xl p-1 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
                  <TabsTrigger
                    value="signin"
                    className="rounded-xl text-xs font-semibold py-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
                  >
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger
                    value="signup"
                    className="rounded-xl text-xs font-semibold py-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
                  >
                    Create Account
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* ──────────────────────────────────────────────────────── */}
              {/* TAB 1: SIGN IN */}
              {/* ──────────────────────────────────────────────────────── */}
              <TabsContent value="signin" className="p-6 sm:p-8 pt-4 focus-visible:outline-none">
                <form onSubmit={handleSignIn} className="space-y-4">
                  {signInError && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900 dark:border-rose-900/80 dark:bg-rose-950/70 dark:text-rose-100 shadow-xs">
                      <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />
                      <span className="font-medium text-rose-900 dark:text-rose-100 leading-relaxed">{signInError}</span>
                    </div>
                  )}

                  {magicLinkSent && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 dark:border-emerald-900/80 dark:bg-emerald-950/70 dark:text-emerald-100 shadow-xs">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-medium text-emerald-900 dark:text-emerald-100 leading-relaxed">
                        Check your email inbox! A secure magic sign-in link has been dispatched.
                      </span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="signin-email" className="text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-normal normal-case">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-2.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="you@company.com"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        required
                        className="pl-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="signin-password" className="text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-normal normal-case">
                        Password
                      </Label>
                      <button
                        type="button"
                        onClick={handleMagicLink}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline"
                      >
                        Email me a magic link
                      </button>
                    </div>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-2.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                      <Input
                        id="signin-password"
                        type={showSignInPassword ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        required
                        className="pl-10 pr-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignInPassword(!showSignInPassword)}
                        className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 transition-colors"
                        aria-label="Toggle password visibility"
                      >
                        {showSignInPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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


                </form>
              </TabsContent>

              {/* ──────────────────────────────────────────────────────── */}
              {/* TAB 2: CREATE ACCOUNT */}
              {/* ──────────────────────────────────────────────────────── */}
              <TabsContent value="signup" className="p-6 sm:p-8 pt-4 focus-visible:outline-none">
                <form onSubmit={handleSignUp} className="space-y-4">
                  {signUpError && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900 dark:border-rose-900/80 dark:bg-rose-950/70 dark:text-rose-100 shadow-xs">
                      <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />
                      <span className="font-medium text-rose-900 dark:text-rose-100 leading-relaxed">{signUpError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-first" className="text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-normal normal-case">
                        First Name
                      </Label>
                      <Input
                        id="signup-first"
                        type="text"
                        placeholder="Alex"
                        value={signUpFirstName}
                        onChange={(e) => setSignUpFirstName(e.target.value)}
                        required
                        className="h-10 rounded-xl bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-last" className="text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-normal normal-case">
                        Last Name
                      </Label>
                      <Input
                        id="signup-last"
                        type="text"
                        placeholder="Rivera"
                        value={signUpLastName}
                        onChange={(e) => setSignUpLastName(e.target.value)}
                        className="h-10 rounded-xl bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="signup-email" className="text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-normal normal-case">
                      Work Email
                    </Label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-2.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="alex@company.com"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        required
                        className="pl-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="signup-company" className="text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-normal normal-case">
                      Company / Organization
                    </Label>
                    <div className="relative">
                      <Building size={16} className="absolute left-3.5 top-2.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                      <Input
                        id="signup-company"
                        type="text"
                        placeholder="DesignForge Studio"
                        value={signUpCompany}
                        onChange={(e) => setSignUpCompany(e.target.value)}
                        className="pl-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="signup-password" className="text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-normal normal-case">
                      Password (min. 6 characters)
                    </Label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-2.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                      <Input
                        id="signup-password"
                        type={showSignUpPassword ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        required
                        minLength={6}
                        className="pl-10 pr-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                        className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 transition-colors"
                        aria-label="Toggle password visibility"
                      >
                        {showSignUpPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-3 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <CreditCard size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
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

            </Tabs>

            {/* Footer Information */}
            <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 px-6 py-3.5 text-center">
              <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>Supabase Auth Cloud Enabled (JWT &amp; RLS)</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-800 py-4 text-xs text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-950/50 backdrop-blur-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <span>&copy; {new Date().getFullYear()} ContactForge. Enterprise Digital Business Card System.</span>
          <div className="flex items-center gap-4">
            <Link href="/card" className="hover:text-slate-800 dark:hover:text-slate-200 hover:underline transition-colors font-medium">
              Digital Card Preview
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
