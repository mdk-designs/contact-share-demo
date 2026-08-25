'use client'

import { CheckCircle, XCircle } from 'lucide-react'

interface ToastProps {
  visible: boolean
  type: 'success' | 'error'
  message: string
}

export default function Toast({ visible, type, message }: ToastProps) {
  return (
    <div
      className={`toast-wrap ${visible ? 'show' : ''}`}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      id="toast-notification"
    >
      <div className={`toast-inner ${type === 'success' ? 'toast-success' : 'toast-error'}`}>
        {type === 'success' ? <CheckCircle size={17} aria-hidden="true" /> : <XCircle size={17} aria-hidden="true" />}
        {message}
      </div>
    </div>
  )
}
