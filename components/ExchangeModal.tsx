'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { X, ArrowRight, UserPlus, Loader2 } from 'lucide-react'
import { insertLead, type Profile } from '@/lib/supabase'
import { CARD_CONFIG } from '@/lib/config'
import SuccessScreen from './SuccessScreen'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface ExchangeModalProps {
  open: boolean
  onClose: () => void
  onToast: (type: 'success' | 'error', msg: string) => void
  profile?: Profile | null
  vcfUrl?: string
}

interface FormData {
  name: string
  phone: string
  email: string
  organization: string
}

interface FormErrors {
  name?: string
  phone?: string
  email?: string
}

const EMPTY: FormData = { name: '', phone: '', email: '', organization: '' }

async function triggerNativeContactImport(targetVcfUrl: string) {
  // Remove any stale iframe first
  const existing = document.getElementById('vcf-loader')
  if (existing) existing.remove()

  const iframe = document.createElement('iframe')
  iframe.id = 'vcf-loader'
  iframe.style.cssText =
    'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none;opacity:0;pointer-events:none;'
  // Bust cache with timestamp so the correct vcf is always fetched
  const separator = targetVcfUrl.includes('?') ? '&' : '?'
  iframe.src = `${targetVcfUrl}${separator}t=${Date.now()}`
  document.body.appendChild(iframe)

  // Generate vCard data
  const vCard = `BEGIN:VCARD
VERSION:3.0
FN:${CARD_CONFIG.firstName} ${CARD_CONFIG.lastName}
N:${CARD_CONFIG.lastName};${CARD_CONFIG.firstName};;;
TEL;TYPE=CELL:${CARD_CONFIG.phone}
EMAIL:${CARD_CONFIG.email}
ORG:${CARD_CONFIG.organization}
TITLE:${CARD_CONFIG.title}
URL:${CARD_CONFIG.website}
END:VCARD`

  const file = new File([vCard], CARD_CONFIG.vcfFilename, {
    type: 'text/vcard',
  })

  if (navigator.share) {
    try {
      console.log('Native share attempted')
      await navigator.share({
        files: [file],
      })
      return true
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Native share cancelled')
        return true // User aborted, do not fallback to download
      }
      console.error('Native share failed:', error)
      // On other errors, continue to fallback below
    }
  }

  console.log('Falling back to vCard download')

  // FALLBACK: Download .vcf explicitly via anchor tag
  const url = `/api/contact.vcf?t=${Date.now()}`
  const a = document.createElement('a')
  a.href = url
  a.download = CARD_CONFIG.vcfFilename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  return false
}

export default function ExchangeModal({ open, onClose, onToast, profile, vcfUrl }: ExchangeModalProps) {
  const firstName = profile?.first_name || CARD_CONFIG.firstName
  const activeVcfUrl = vcfUrl || (profile?.slug ? `/api/vcard/${profile.slug}` : '/api/contact.vcf')
  const [form, setForm] = useState<FormData>(EMPTY)
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [fallbackDownload, setFallbackDownload] = useState(false)

  const firstInputRef = useRef<HTMLInputElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)

  // Focus management
  useEffect(() => {
    if (open && !submitted) {
      const t = setTimeout(() => firstInputRef.current?.focus(), 420)
      return () => clearTimeout(t)
    }
  }, [open, submitted])

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && open) handleClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleClose = useCallback(() => {
    onClose()
    // Reset after the slide-down animation completes
    setTimeout(() => { setForm(EMPTY); setErrors({}); setSubmitted(false); setFallbackDownload(false) }, 450)
  }, [onClose])


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const validate = (): boolean => {
    const next: FormErrors = {}
    if (!form.name.trim() || form.name.trim().length < 2) next.name = 'Please enter your full name'
    if (!form.phone.trim() || !/^[\d\s+\-()\\.]{7,16}$/.test(form.phone.trim())) next.phone = 'Enter a valid phone number'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Enter a valid email address'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      // 1. Dispatch visitor contact to API (handles Supabase DB & Edge Function email dispatch)
      const res = await fetch('/api/lead/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: profile?.id,
          slug: profile?.slug,
          visitor_name: form.name.trim(),
          visitor_phone: form.phone.trim(),
          visitor_email: form.email.trim() || undefined,
          visitor_company: form.organization.trim() || undefined,
        }),
      })

      if (!res.ok) {
        // Fallback directly to client-side insertLead
        await insertLead({
          profile_id: profile?.id,
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
          organization: form.organization.trim() || undefined,
          visitor_name: form.name.trim(),
          visitor_phone: form.phone.trim(),
          visitor_email: form.email.trim() || undefined,
          visitor_company: form.organization.trim() || undefined,
        })
      }

      // 2. Trigger native OS contact import via hidden iframe
      triggerNativeContactImport(activeVcfUrl)

      // 3. Transition to success screen
      setSubmitted(true)
      onToast('success', '🎉 Contact exchanged successfully!')
    } catch (err) {
      console.error('[ExchangeModal]', err)
      // Still trigger vCard import even if network failed
      triggerNativeContactImport(activeVcfUrl)
      setSubmitted(true)
      onToast('success', '🎉 Contact downloaded to your phone!')
    } finally {
      setLoading(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === backdropRef.current) handleClose()
  }

  return (
    <div
      ref={backdropRef}
      className={`modal-backdrop ${open ? 'open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-heading"
      aria-describedby="modal-desc"
      onClick={handleBackdropClick}
      id="exchange-modal"
    >
      <div className="modal-sheet" role="document" style={{ position: 'relative' }}>
        {/* Drag handle */}
        <div className="modal-handle" aria-hidden="true" />

        {/* Close button */}
        <button
          className="modal-close-btn"
          onClick={handleClose}
          aria-label="Close modal"
          id="modal-close-btn"
        >
          <X size={15} />
        </button>

        {/* ─── SUCCESS SCREEN ─── */}
        {submitted ? (
          <SuccessScreen visitorName={form.name} profile={profile} />
        ) : (
          <>
            {/* ─── HEADER ─── */}
            <div className="modal-header">
              <div className="modal-icon-wrap" aria-hidden="true">
                <UserPlus size={22} />
              </div>
              <h2 className="modal-title" id="modal-heading">Exchange Contact</h2>
              <p className="modal-sub" id="modal-desc">
                Share your details to receive {firstName}&apos;s contact directly on your phone.
              </p>
            </div>

            {/* ─── FORM ─── */}
            <form onSubmit={handleSubmit} noValidate aria-label="Contact exchange form" id="exchange-form" className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5 text-left">
                <Label htmlFor="field-name" className="text-xs font-semibold text-[var(--text-secondary)]">
                  Full Name <span className="text-rose-500" aria-hidden="true">*</span>
                </Label>
                <Input
                  ref={firstInputRef}
                  id="field-name"
                  name="name"
                  type="text"
                  inputMode="text"
                  autoComplete="name"
                  placeholder="e.g. Priya Sharma"
                  className={`h-11 rounded-xl bg-[var(--bg-input)] border-[var(--border-card)] text-sm shadow-xs ${errors.name ? 'border-rose-500 focus-visible:ring-rose-500/20' : ''}`}
                  value={form.name}
                  onChange={handleChange}
                  aria-required="true"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'err-name' : undefined}
                  disabled={loading}
                />
                {errors.name && <p id="err-name" className="text-[11px] font-medium text-rose-500" role="alert">{errors.name}</p>}
              </div>

              {/* Phone */}
              <div className="space-y-1.5 text-left">
                <Label htmlFor="field-phone" className="text-xs font-semibold text-[var(--text-secondary)]">
                  Phone Number <span className="text-rose-500" aria-hidden="true">*</span>
                </Label>
                <Input
                  id="field-phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+91 98765 00000"
                  className={`h-11 rounded-xl bg-[var(--bg-input)] border-[var(--border-card)] text-sm shadow-xs ${errors.phone ? 'border-rose-500 focus-visible:ring-rose-500/20' : ''}`}
                  value={form.phone}
                  onChange={handleChange}
                  aria-required="true"
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? 'err-phone' : undefined}
                  disabled={loading}
                />
                {errors.phone && <p id="err-phone" className="text-[11px] font-medium text-rose-500" role="alert">{errors.phone}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1.5 text-left">
                <Label htmlFor="field-email" className="text-xs font-semibold text-[var(--text-secondary)]">Email Address</Label>
                <Input
                  id="field-email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  className={`h-11 rounded-xl bg-[var(--bg-input)] border-[var(--border-card)] text-sm shadow-xs ${errors.email ? 'border-rose-500 focus-visible:ring-rose-500/20' : ''}`}
                  value={form.email}
                  onChange={handleChange}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'err-email' : undefined}
                  disabled={loading}
                />
                {errors.email && <p id="err-email" className="text-[11px] font-medium text-rose-500" role="alert">{errors.email}</p>}
              </div>

              {/* Organization */}
              <div className="space-y-1.5 text-left">
                <Label htmlFor="field-org" className="text-xs font-semibold text-[var(--text-secondary)]">Organization</Label>
                <Input
                  id="field-org"
                  name="organization"
                  type="text"
                  autoComplete="organization"
                  placeholder="Your company or school"
                  className="h-11 rounded-xl bg-[var(--bg-input)] border-[var(--border-card)] text-sm shadow-xs"
                  value={form.organization}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="gradient"
                size="lg"
                disabled={loading}
                id="submit-btn"
                className="w-full h-12 rounded-2xl text-sm font-semibold shadow-md mt-2"
                aria-label={loading ? 'Processing…' : `Get ${firstName}'s contact`}
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin mr-2" aria-hidden="true" /> Saving…</>
                ) : (
                  <>Get {firstName}&apos;s Contact <ArrowRight size={15} className="ml-1.5" aria-hidden="true" /></>
                )}
              </Button>

              <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 12 }}>
                🔒 Your details are kept private and never sold.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
