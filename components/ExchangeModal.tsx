'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { X, ArrowRight, UserPlus } from 'lucide-react'
import { insertLead } from '@/lib/supabase'
import { CARD_CONFIG } from '@/lib/config'
import SuccessScreen from './SuccessScreen'

interface ExchangeModalProps {
  open: boolean
  onClose: () => void
  onToast: (type: 'success' | 'error', msg: string) => void
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

/**
 * Triggers native OS contact import by loading /api/contact.vcf
 * inside a hidden <iframe>.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  HOW IT WORKS                                                   │
 * │                                                                 │
 * │  /api/contact.vcf responds with:                               │
 * │    Content-Type: text/vcard; charset=utf-8                     │
 * │    Content-Disposition: inline; filename="Deepak_Kumar.vcf"    │
 * │                                                                 │
 * │  iOS Safari intercepts the text/vcard MIME type and shows the  │
 * │  native "Create New Contact" overlay — the page stays alive.   │
 * │  Android Chrome launches the system Contacts save intent.      │
 * └─────────────────────────────────────────────────────────────────┘
 */
async function triggerNativeContactImport(): Promise<boolean> {
  const ua = navigator.userAgent || ''
  const isDesktop = !(/Mobi|Android|iPhone|iPad|iPod/i.test(ua))

  if (isDesktop) {
    // 1. DESKTOP: Return false to show the large QR code on the success screen
    return false
  }

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

  // Development logging
  console.log('navigator.share supported:', !!navigator.share)
  console.log('navigator.canShare supported:', !!navigator.canShare)

  let canShareFile = false
  try {
    if (navigator.canShare) {
      canShareFile = navigator.canShare({ files: [file] })
    }
  } catch (err) {
    console.error('Error checking canShare:', err)
  }
  
  console.log('vCard file share supported:', canShareFile)

  if (navigator.share && canShareFile) {
    try {
      console.log('Native share attempted')
      await navigator.share({
        title: `${CARD_CONFIG.firstName} ${CARD_CONFIG.lastName}`,
        text: 'Save my contact',
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

export default function ExchangeModal({ open, onClose, onToast }: ExchangeModalProps) {
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
      // 1. Trigger native OS contact import
      const nativelyShared = await triggerNativeContactImport()
      if (!nativelyShared) {
        setFallbackDownload(true)
      }

      // 2. Save visitor's contact to Supabase in background to keep UI fast
      insertLead({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        organization: form.organization.trim() || undefined,
      }).then(({ error }) => {
        if (error) console.error('[Supabase] Insert error:', error)
      })

      // 3. Transition to success screen
      setSubmitted(true)
      onToast('success', '🎉 Contact exchanged successfully!')
    } catch (err) {
      console.error('[ExchangeModal]', err)
      onToast('error', 'Something went wrong — please try again.')
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
          <SuccessScreen visitorName={form.name} fallbackDownload={fallbackDownload} />
        ) : (
          <>
            {/* ─── HEADER ─── */}
            <div className="modal-header">
              <div className="modal-icon-wrap" aria-hidden="true">
                <UserPlus size={22} />
              </div>
              <h2 className="modal-title" id="modal-heading">Exchange Contact</h2>
              <p className="modal-sub" id="modal-desc">
                Share your details to receive {CARD_CONFIG.firstName}'s contact directly on your phone.
              </p>
            </div>

            {/* ─── FORM ─── */}
            <form onSubmit={handleSubmit} noValidate aria-label="Contact exchange form" id="exchange-form">
              {/* Full Name */}
              <div className="field-group">
                <label htmlFor="field-name" className="field-label">
                  Full Name <span className="req" aria-hidden="true">*</span>
                </label>
                <input
                  ref={firstInputRef}
                  id="field-name"
                  name="name"
                  type="text"
                  inputMode="text"
                  autoComplete="name"
                  placeholder="e.g. Priya Sharma"
                  className={`field-input ${errors.name ? 'has-error' : ''}`}
                  value={form.name}
                  onChange={handleChange}
                  aria-required="true"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'err-name' : undefined}
                  disabled={loading}
                />
                {errors.name && <p id="err-name" className="field-error" role="alert">{errors.name}</p>}
              </div>

              {/* Phone */}
              <div className="field-group">
                <label htmlFor="field-phone" className="field-label">
                  Phone Number <span className="req" aria-hidden="true">*</span>
                </label>
                <input
                  id="field-phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+91 98765 00000"
                  className={`field-input ${errors.phone ? 'has-error' : ''}`}
                  value={form.phone}
                  onChange={handleChange}
                  aria-required="true"
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? 'err-phone' : undefined}
                  disabled={loading}
                />
                {errors.phone && <p id="err-phone" className="field-error" role="alert">{errors.phone}</p>}
              </div>

              {/* Email */}
              <div className="field-group">
                <label htmlFor="field-email" className="field-label">Email Address</label>
                <input
                  id="field-email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  className={`field-input ${errors.email ? 'has-error' : ''}`}
                  value={form.email}
                  onChange={handleChange}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'err-email' : undefined}
                  disabled={loading}
                />
                {errors.email && <p id="err-email" className="field-error" role="alert">{errors.email}</p>}
              </div>

              {/* Organization */}
              <div className="field-group">
                <label htmlFor="field-org" className="field-label">Organization</label>
                <input
                  id="field-org"
                  name="organization"
                  type="text"
                  autoComplete="organization"
                  placeholder="Your company or school"
                  className="field-input"
                  value={form.organization}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
                id="submit-btn"
                aria-label={loading ? 'Processing…' : `Get ${CARD_CONFIG.firstName}'s contact`}
              >
                {loading ? (
                  <><span className="spinner" aria-hidden="true" /> Saving…</>
                ) : (
                  <>Get {CARD_CONFIG.firstName}'s Contact <ArrowRight size={15} aria-hidden="true" /></>
                )}
              </button>

              <p style={{ textAlign: 'center', fontSize: 10.5, color: 'var(--text-muted)', marginTop: 10, opacity: 0.55 }}>
                🔒 Your details are kept private and never sold.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
