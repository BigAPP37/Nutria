'use client'

import { useEffect } from 'react'

interface ToastProps {
  message: string
  isVisible: boolean
  onClose: () => void
  durationMs?: number
}

export function Toast({
  message,
  isVisible,
  onClose,
  durationMs = 2600,
}: ToastProps) {
  useEffect(() => {
    if (!isVisible) return

    const timer = window.setTimeout(() => {
      onClose()
    }, durationMs)

    return () => window.clearTimeout(timer)
  }, [durationMs, isVisible, onClose])

  if (!isVisible) return null

  return (
    <div
      className="fixed inset-x-0 z-50 flex justify-center px-4"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 6rem)' }}
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className="w-full max-w-sm rounded-2xl px-4 py-3 text-center text-sm font-semibold text-white shadow-[0_14px_38px_rgba(249,115,22,0.34)]"
        style={{
          background: 'linear-gradient(135deg, #F97316 0%, #EA6C0A 100%)',
        }}
      >
        {message}
      </div>
    </div>
  )
}
