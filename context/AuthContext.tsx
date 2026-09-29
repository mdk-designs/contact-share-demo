'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { getSupabaseClient, type Profile } from '@/lib/supabase'

export interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  role: 'master_admin' | 'admin' | 'member' | null
  isAdmin: boolean
  isMasterAdmin: boolean
  isLoading: boolean
  isDemo: boolean
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null; role?: 'master_admin' | 'admin' | 'member' }>
  signUp: (
    email: string,
    password: string,
    metadata?: {
      firstName?: string
      lastName?: string
      role?: 'master_admin' | 'admin' | 'member'
      companyName?: string
    }
  ) => Promise<{ error: Error | null }>
  signInWithOtp: (email: string) => Promise<{ error: Error | null }>
  signInAsDemo: (demoRole: 'master_admin' | 'admin' | 'member') => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  elevateCurrentRole: (newRole: 'master_admin' | 'admin' | 'member') => void
}

const DEMO_ADMIN_USER = {
  id: 'demo-admin-id',
  email: 'admin@contactforge.io',
  user_metadata: {
    first_name: 'Deepak',
    last_name: 'Kumar',
    role: 'master_admin',
    company_name: 'ContactForge Enterprise',
  },
  app_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as unknown as User

const DEMO_MEMBER_USER = {
  id: 'demo-member-id',
  email: 'sarah.jenkins@contactforge.io',
  user_metadata: {
    first_name: 'Sarah',
    last_name: 'Jenkins',
    role: 'member',
    company_name: 'ContactForge Studio',
  },
  app_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as unknown as User

const DEMO_ADMIN_PROFILE: Profile = {
  id: 'd0000000-0000-0000-0000-000000000001',
  slug: 'deepak-kumar',
  role: 'master_admin',
  first_name: 'Deepak',
  last_name: 'Kumar',
  headline: 'UI/UX Engineer & Lead Architect',
  job_title: 'UI/UX Engineer & Lead Architect',
  company_name: 'ContactForge Enterprise',
  department: 'Design Systems & Platform',
  work_email: 'admin@contactforge.io',
  work_phone: '+1 (555) 234-5678',
  mobile_phone: '+1 (555) 234-5678',
  website_url: 'https://deepak.design',
  address: 'San Francisco, CA',
  bio: 'Master Administrator and Lead Product Engineer. Full authority over platform profiles, leads, and analytics.',
  is_active: true,
  social_links: {
    linkedin: 'https://linkedin.com/in/deepakkumar',
    github: 'https://github.com/deepakkumar',
    twitter: 'https://twitter.com/deepakkdesign',
  },
  card_theme: {
    primaryColor: '#6366F1',
    accentColor: '#A855F7',
    template: 'modern',
  },
}

const DEMO_MEMBER_PROFILE: Profile = {
  id: 'demo-member-id',
  slug: 'sarah-jenkins',
  role: 'member',
  first_name: 'Sarah',
  last_name: 'Jenkins',
  headline: 'Account Executive & Client Relations',
  job_title: 'Account Executive',
  company_name: 'ContactForge Studio',
  department: 'Sales & Growth',
  work_email: 'sarah.jenkins@contactforge.io',
  work_phone: '+1 (555) 876-5432',
  mobile_phone: '+1 (555) 876-5432',
  website_url: 'https://contactforge.io',
  address: 'New York, NY',
  bio: 'Helping enterprises connect, exchange tactile credentials, and build memorable client experiences.',
  is_active: true,
  social_links: {
    linkedin: 'https://linkedin.com/in/sarahjenkins',
    twitter: 'https://twitter.com/sarahgrowth',
  },
  card_theme: {
    primaryColor: '#10B981',
    accentColor: '#14B8A6',
    template: 'minimal',
  },
}

const STORAGE_KEY = 'contactforge_demo_session'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [role, setRole] = useState<'master_admin' | 'admin' | 'member' | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isDemo, setIsDemo] = useState<boolean>(false)

  // Fetch or sync the profile for the given user
  const fetchProfileForUser = useCallback(async (targetUser: User): Promise<Profile | null> => {
    const client = getSupabaseClient()
    const targetEmail = targetUser.email?.toLowerCase().trim()
    const metaRole = (targetUser.user_metadata?.role as 'master_admin' | 'admin' | 'member') || 'member'

    if (client) {
      try {
        // 1. Try querying public.profiles by user_id (the auth foreign key)
        const { data: byUserId, error: userErr } = await client
          .from('profiles')
          .select('*')
          .eq('user_id', targetUser.id)
          .maybeSingle()

        if (!userErr && byUserId) {
          return byUserId as Profile
        }

        // 2. Try querying public.profiles by primary key id
        const { data: byId, error: idErr } = await client
          .from('profiles')
          .select('*')
          .eq('id', targetUser.id)
          .maybeSingle()

        if (!idErr && byId) {
          return byId as Profile
        }

        // 3. Try querying by work_email if ID didn't match
        if (targetEmail) {
          const { data: byEmail, error: emailErr } = await client
            .from('profiles')
            .select('*')
            .eq('work_email', targetEmail)
            .maybeSingle()

          if (!emailErr && byEmail) {
            // Auto-link user_id if currently null
            if (!byEmail.user_id) {
              await client.from('profiles').update({ user_id: targetUser.id }).eq('id', byEmail.id)
            }
            return byEmail as Profile
          }
        }
      } catch (e) {
        console.warn('[AuthContext] Database profile lookup notice:', e)
      }
    }

    // 4. Fallback: synthesize profile from user metadata
    const isMasterEmail = targetEmail === 'kumardeepak181999@gmail.com' || targetEmail === 'admin@contactforge.io'
    const finalRole: 'master_admin' | 'admin' | 'member' = isMasterEmail ? 'master_admin' : metaRole

    const firstName = targetUser.user_metadata?.first_name || targetUser.email?.split('@')[0] || 'User'
    const lastName = targetUser.user_metadata?.last_name || ''
    const rawSlug = `${firstName}-${lastName}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'card-owner'

    const synthesized: Profile = {
      id: targetUser.id,
      user_id: targetUser.id,
      slug: rawSlug,
      role: finalRole,
      first_name: firstName,
      last_name: lastName,
      work_email: targetUser.email || '',
      company_name: targetUser.user_metadata?.company_name || 'ContactForge',
      is_active: true,
      card_theme: {
        primaryColor: finalRole === 'master_admin' || finalRole === 'admin' ? '#6366F1' : '#10B981',
        accentColor: finalRole === 'master_admin' || finalRole === 'admin' ? '#A855F7' : '#14B8A6',
        template: 'modern',
      },
    }

    return synthesized
  }, [])

  // Restore session on mount (Supabase Auth first, then local demo fallback)
  useEffect(() => {
    let isMounted = true
    const client = getSupabaseClient()

    async function initAuth() {
      try {
        if (client) {
          const { data: { session: currentSession }, error } = await client.auth.getSession()

          if (!error && currentSession?.user) {
            if (!isMounted) return
            setUser(currentSession.user)
            setSession(currentSession)
            setIsDemo(false)

            const prof = await fetchProfileForUser(currentSession.user)
            if (isMounted) {
              setProfile(prof)
              setRole(prof?.role || (currentSession.user.user_metadata?.role as 'admin' | 'member') || 'member')
              setIsLoading(false)
            }
            return
          }
        }

        // Check for stored Demo session
        if (typeof window !== 'undefined') {
          const savedDemo = localStorage.getItem(STORAGE_KEY)
          if (savedDemo) {
            const parsed = JSON.parse(savedDemo)
            if (parsed.role === 'admin') {
              setUser(DEMO_ADMIN_USER)
              setProfile(DEMO_ADMIN_PROFILE)
              setRole('admin')
              setIsDemo(true)
            } else {
              setUser(DEMO_MEMBER_USER)
              setProfile(DEMO_MEMBER_PROFILE)
              setRole('member')
              setIsDemo(true)
            }
          }
        }
      } catch (err) {
        console.warn('[AuthContext] Auth initialization notice:', err)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    initAuth()

    // Listen to Supabase Auth state changes
    if (client) {
      const { data: authListener } = client.auth.onAuthStateChange(async (event, newSession) => {
        if (!isMounted) return

        if (newSession?.user) {
          setUser(newSession.user)
          setSession(newSession)
          setIsDemo(false)
          if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY)
          }

          const prof = await fetchProfileForUser(newSession.user)
          if (isMounted) {
            setProfile(prof)
            setRole(prof?.role || (newSession.user.user_metadata?.role as 'admin' | 'member') || 'member')
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setSession(null)
          setProfile(null)
          setRole(null)
          setIsDemo(false)
          if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY)
          }
        }
      })

      return () => {
        isMounted = false
        authListener.subscription.unsubscribe()
      }
    }

    return () => {
      isMounted = false
    }
  }, [fetchProfileForUser])

  // Sign In with Email & Password
  const signInWithPassword = useCallback(
    async (email: string, password: string): Promise<{ error: Error | null; role?: 'master_admin' | 'admin' | 'member' }> => {
      setIsLoading(true)
      const cleanEmail = email.toLowerCase().trim()

      // 1. Check for quick demo shortcuts if entered in credentials
      if (cleanEmail === 'admin@contactforge.io' || (cleanEmail.includes('admin') && password === 'admin123')) {
        await signInAsDemo('master_admin')
        setIsLoading(false)
        return { error: null, role: 'master_admin' }
      }
      if (cleanEmail === 'member@contactforge.io' || cleanEmail === 'sarah.jenkins@contactforge.io' || password === 'member123') {
        await signInAsDemo('member')
        setIsLoading(false)
        return { error: null, role: 'member' }
      }

      // 2. Real Supabase Auth
      const client = getSupabaseClient()
      if (!client) {
        // Fallback demo authentication
        const fallbackRole = cleanEmail.includes('admin') || cleanEmail.includes('deepak') ? 'master_admin' : 'member'
        await signInAsDemo(fallbackRole)
        setIsLoading(false)
        return { error: null, role: fallbackRole }
      }

      try {
        const { data, error } = await client.auth.signInWithPassword({
          email: cleanEmail,
          password,
        })

        if (error) {
          setIsLoading(false)
          return { error }
        }

        if (data.user) {
          setUser(data.user)
          setSession(data.session)
          setIsDemo(false)
          if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY)
          }

          const prof = await fetchProfileForUser(data.user)
          const resolvedRole = prof?.role || (data.user.user_metadata?.role as 'master_admin' | 'admin' | 'member') || 'member'
          setProfile(prof)
          setRole(resolvedRole)
          setIsLoading(false)
          return { error: null, role: resolvedRole }
        }

        setIsLoading(false)
        return { error: new Error('User sign-in did not return user credentials') }
      } catch (err: any) {
        setIsLoading(false)
        return { error: err instanceof Error ? err : new Error(String(err)) }
      }
    },
    [fetchProfileForUser]
  )

  // Sign Up with Email, Password & User Metadata
  const signUp = useCallback(
    async (
      email: string,
      password: string,
      metadata?: {
        firstName?: string
        lastName?: string
        role?: 'master_admin' | 'admin' | 'member'
        companyName?: string
      }
    ): Promise<{ error: Error | null }> => {
      setIsLoading(true)
      const cleanEmail = email.toLowerCase().trim()
      const client = getSupabaseClient()

      if (!client) {
        // Emulate signup and sign in as demo
        await signInAsDemo(metadata?.role || 'member')
        setIsLoading(false)
        return { error: null }
      }

      try {
        const { data, error } = await client.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              first_name: metadata?.firstName || cleanEmail.split('@')[0],
              last_name: metadata?.lastName || '',
              role: metadata?.role || 'member',
              company_name: metadata?.companyName || 'ContactForge',
            },
          },
        })

        if (error) {
          setIsLoading(false)
          return { error }
        }

        if (data.user) {
          setUser(data.user)
          setSession(data.session)
          setIsDemo(false)

          const prof = await fetchProfileForUser(data.user)
          setProfile(prof)
          setRole(prof?.role || metadata?.role || 'member')
        }

        setIsLoading(false)
        return { error: null }
      } catch (err: any) {
        setIsLoading(false)
        return { error: err instanceof Error ? err : new Error(String(err)) }
      }
    },
    [fetchProfileForUser]
  )

  // Passwordless Magic Link / OTP
  const signInWithOtp = useCallback(async (email: string): Promise<{ error: Error | null }> => {
    setIsLoading(true)
    const client = getSupabaseClient()
    if (!client) {
      setIsLoading(false)
      return { error: new Error('Supabase client is not configured') }
    }

    try {
      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/admin` : undefined
      const { error } = await client.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          emailRedirectTo: redirectUrl,
        },
      })

      setIsLoading(false)
      return { error }
    } catch (err: any) {
      setIsLoading(false)
      return { error: err instanceof Error ? err : new Error(String(err)) }
    }
  }, [])

  // 1-Click Demo Login
  const signInAsDemo = useCallback(async (demoRole: 'master_admin' | 'admin' | 'member'): Promise<void> => {
    setIsLoading(true)
    const chosenUser = demoRole === 'master_admin' || demoRole === 'admin' ? DEMO_ADMIN_USER : DEMO_MEMBER_USER
    const chosenProfile = demoRole === 'master_admin' || demoRole === 'admin' ? DEMO_ADMIN_PROFILE : DEMO_MEMBER_PROFILE

    setUser(chosenUser)
    setSession(null)
    setProfile(chosenProfile)
    setRole(demoRole)
    setIsDemo(true)

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ role: demoRole, timestamp: Date.now() }))
    }
    setIsLoading(false)
  }, [])

  // Sign Out
  const signOut = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    const client = getSupabaseClient()

    try {
      if (client) {
        await client.auth.signOut()
      }
    } catch (err) {
      console.warn('[AuthContext] Sign out warning:', err)
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }

    setUser(null)
    setSession(null)
    setProfile(null)
    setRole(null)
    setIsDemo(false)
    setIsLoading(false)
  }, [])

  // Refresh profile
  const refreshProfile = useCallback(async (): Promise<void> => {
    if (user) {
      const updated = await fetchProfileForUser(user)
      if (updated) {
        setProfile(updated)
        setRole(updated.role)
      }
    }
  }, [user, fetchProfileForUser])

  // Instant elevate role (useful for testing admin portal)
  const elevateCurrentRole = useCallback((newRole: 'master_admin' | 'admin' | 'member') => {
    setRole(newRole)
    if (profile) {
      setProfile({ ...profile, role: newRole })
    }
    if (typeof window !== 'undefined' && isDemo) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ role: newRole, timestamp: Date.now() }))
    }
  }, [profile, isDemo])

  const isMasterAdmin = useMemo(() => role === 'master_admin', [role])
  const isAdmin = useMemo(() => role === 'master_admin' || role === 'admin', [role])

  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      session,
      profile,
      role,
      isAdmin,
      isMasterAdmin,
      isLoading,
      isDemo,
      signInWithPassword,
      signUp,
      signInWithOtp,
      signInAsDemo,
      signOut,
      refreshProfile,
      elevateCurrentRole,
    }),
    [
      user,
      session,
      profile,
      role,
      isAdmin,
      isMasterAdmin,
      isLoading,
      isDemo,
      signInWithPassword,
      signUp,
      signInWithOtp,
      signInAsDemo,
      signOut,
      refreshProfile,
      elevateCurrentRole,
    ]
  )

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
