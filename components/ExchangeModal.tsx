'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { X, ArrowRight, UserPlus, Loader2, AlertCircle, Phone, Mail, Building, User } from 'lucide-react'
import type { Profile } from '@/lib/supabase'
import { normalizePhoneNumber, COMMON_COUNTRY_CODES } from '@/lib/phone'
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
  source?: string
}

interface FormData {
  name: string
  countryCode: string
  phone: string
  email: string
  organization: string
}

interface FormErrors {
  name?: string
  phone?: string
  email?: string
}

type ModalState = 'idle' | 'editing' | 'submitting' | 'success' | 'error'

const INITIAL_FORM: FormData = {
  name: '',
  countryCode: '+91',
  phone: '',
  email: '',
  organization: '',
}

export default function ExchangeModal({
  open,
  onClose,
  onToast,
  profile,
  vcfUrl,
  source = 'unknown',
}: ExchangeModalProps) {
  const firstName = profile?.first_name || 'Contact'
  const activeVcfUrl = vcfUrl || (profile?.slug ? `/api/vcard/${encodeURIComponent(profile.slug)}` : '/api/contact.vcf')

  const [modalState, setModalState] = useState<ModalState>('idle')
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [idempotencyKey, setIdempotencyKey] = useState<string>('')

  // Returned from API on success
  const [successData, setSuccessData] = useState<{
    whatsappUrl: string | null
    telegramConnectUrl: string | null
    exchangeId: string | null
    cardholderVCardUrl: string
  } | null>(null)

  const firstInputRef = useRef<HTMLInputElement>(null)

  // Initialize fresh idempotency key and focus on open
  useEffect(() => {
    if (open) {
      if (!idempotencyKey) {
        setIdempotencyKey(crypto.randomUUID())
      }
      setModalState((prev) => (prev === 'success' ? 'success' : 'idle'))
      const t = setTimeout(() => firstInputRef.current?.focus(), 300)
      return () => clearTimeout(t)
    }
  }, [open, idempotencyKey])

  // Body scroll lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Escape key handler
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) handleClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const handleClose = useCallback(() => {
    onClose()
    // Reset after transition finishes
    setTimeout(() => {
      setForm(INITIAL_FORM)
      setErrors({})
      setSubmitError(null)
      setModalState('idle')
      setIdempotencyKey('')
      setSuccessData(null)
    }, 350)
  }, [onClose])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setModalState('editing')
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
    if (submitError) {
      setSubmitError(null)
    }
  }

  const validate = (): boolean => {
    const next: FormErrors = {}

    if (!form.name.trim() || form.name.trim().length < 2) {
      next.name = 'Please enter your full name (minimum 2 characters)'
    } else if (form.name.trim().length > 120) {
      next.name = 'Name cannot exceed 120 characters'
    }

    if (!form.phone.trim()) {
      next.phone = 'Mobile number is required'
    } else {
      const norm = normalizePhoneNumber(form.phone.trim(), form.countryCode)
      if (!norm.valid) {
        next.phone = norm.error || 'Please enter a valid mobile number'
      }
    }

    if (form.email && form.email.trim().length > 0) {
      if (form.email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        next.email = 'Please enter a valid email address'
      }
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const triggerVCardDownload = (downloadUrl: string) => {
    try {
      // 1. Invisible iframe for silent iOS Safari prompt
      const existing = document.getElementById('auto-vcf-loader')
      if (existing) existing.remove()

      const iframe = document.createElement('iframe')
      iframe.id = 'auto-vcf-loader'
      iframe.style.cssText =
        'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none;opacity:0;pointer-events:none;'
      iframe.src = `${downloadUrl}?download=1&t=${Date.now()}`
      document.body.appendChild(iframe)

      // 2. Direct anchor click fallback for Chrome/Android
      const a = document.createElement('a')
      a.href = `${downloadUrl}?download=1&t=${Date.now()}`
      a.download = `${profile?.first_name || 'Contact'}.vcf`
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      setTimeout(() => {
        a.remove()
        iframe.remove()
      }, 5000)
    } catch {
      // Non-blocking fallback
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setModalState('submitting')
    setSubmitError(null)

    const normalizedPhone = normalizePhoneNumber(form.phone.trim(), form.countryCode)

    try {
      const res = await fetch('/api/lead/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: profile?.id,
          slug: profile?.slug,
          visitor_name: form.name.trim(),
          visitor_phone: normalizedPhone.e164 || form.phone.trim(),
          visitor_email: form.email.trim() || undefined,
          visitor_company: form.organization.trim() || undefined,
          source: source || 'unknown',
          idempotency_key: idempotencyKey,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        const errorMsg = data?.error?.message || 'Failed to exchange contact. Please check your details and try again.'
        setSubmitError(errorMsg)
        setModalState('error')
        onToast('error', errorMsg)
        return
      }

      const cardholderUrl = data.cardholder_vcard_url || activeVcfUrl

      setSuccessData({
        whatsappUrl: data.whatsapp_url || null,
        telegramConnectUrl: data.telegram?.connect_url || null,
        exchangeId: data.exchange_id || null,
        cardholderVCardUrl: cardholderUrl,
      })

      // Initiate automatic contact download
      triggerVCardDownload(cardholderUrl)

      setModalState('success')
      onToast('success', '🎉 Contact exchanged successfully!')
    } catch (err: any) {
      console.error('[ExchangeModal] Submission error:', err)
      const errText = 'Network connection issue. Please try again.'
      setSubmitError(errText)
      setModalState('error')
      onToast('error', errText)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <div
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] shadow-2xl overflow-hidden transition-all animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <UserPlus size={18} />
            </div>
            <div>
              <h2 id="modal-title" className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
                {modalState === 'success' ? 'Contact Exchanged' : `Exchange Contact with ${firstName}`}
              </h2>
              <p className="text-[11px] text-[var(--text-muted)]">
                {modalState === 'success' ? 'Save card to your contacts' : 'Receive contact card immediately'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        {modalState === 'success' && successData ? (
          <SuccessScreen
            visitorName={form.name}
            profile={profile}
            vcfUrl={successData.cardholderVCardUrl}
            whatsappUrl={successData.whatsappUrl}
            telegramDeepLink={successData.telegramConnectUrl}
            exchangeId={successData.exchangeId}
          />
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {submitError && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle size={16} className="shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Name Input */}
            <div className="space-y-1.5">
              <Label htmlFor="visitor-name" className="text-xs font-semibold text-[var(--text-primary)]">
                Your Full Name <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <Input
                  id="visitor-name"
                  ref={firstInputRef}
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  disabled={modalState === 'submitting'}
                  className={`pl-10 rounded-xl h-11 text-xs ${errors.name ? 'border-rose-500 ring-rose-500/20' : ''}`}
                  required
                />
              </div>
              {errors.name && <p className="text-[11px] text-rose-500">{errors.name}</p>}
            </div>

            {/* Phone Input with Country Code */}
            <div className="space-y-1.5">
              <Label htmlFor="visitor-phone" className="text-xs font-semibold text-[var(--text-primary)]">
                Mobile Number <span className="text-rose-500">*</span>
              </Label>
              <div className="flex gap-2">
                <select
                  name="countryCode"
                  value={form.countryCode}
                  onChange={handleChange}
                  disabled={modalState === 'submitting'}
                  className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-input)] px-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {COMMON_COUNTRY_CODES.map((c) => (
                    <option key={c.code + c.country} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <div className="relative flex-1">
                  <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <Input
                    id="visitor-phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="98765 43210"
                    disabled={modalState === 'submitting'}
                    className={`pl-10 rounded-xl h-11 text-xs ${errors.phone ? 'border-rose-500 ring-rose-500/20' : ''}`}
                    required
                  />
                </div>
              </div>
              {errors.phone && <p className="text-[11px] text-rose-500">{errors.phone}</p>}
            </div>

            {/* Email Input (Optional) */}
            <div className="space-y-1.5">
              <Label htmlFor="visitor-email" className="text-xs font-medium text-[var(--text-secondary)]">
                Email Address <span className="text-[10px] text-[var(--text-muted)]">(Optional, for vCard copy)</span>
              </Label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <Input
                  id="visitor-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="john@company.com"
                  disabled={modalState === 'submitting'}
                  className={`pl-10 rounded-xl h-11 text-xs ${errors.email ? 'border-rose-500 ring-rose-500/20' : ''}`}
                />
              </div>
              {errors.email && <p className="text-[11px] text-rose-500">{errors.email}</p>}
            </div>

            {/* Organization Input (Optional) */}
            <div className="space-y-1.5">
              <Label htmlFor="visitor-org" className="text-xs font-medium text-[var(--text-secondary)]">
                Organization / Company <span className="text-[10px] text-[var(--text-muted)]">(Optional)</span>
              </Label>
              <div className="relative">
                <Building size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <Input
                  id="visitor-org"
                  name="organization"
                  value={form.organization}
                  onChange={handleChange}
                  placeholder="e.g. Acme Innovations"
                  disabled={modalState === 'submitting'}
                  className="pl-10 rounded-xl h-11 text-xs"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={modalState === 'submitting'}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-105 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                {modalState === 'submitting' ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Exchanging Contacts…</span>
                  </>
                ) : (
                  <>
                    <span>Exchange Contact</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </Button>
            </div>

            <p className="text-center text-[10px] text-[var(--text-muted)]">
              Submitting shares your contact with {firstName} and downloads their digital card.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
