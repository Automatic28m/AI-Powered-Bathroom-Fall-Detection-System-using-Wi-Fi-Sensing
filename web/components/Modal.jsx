'use client'

// Sedap-style modal: dimmed backdrop + white card. Closes on Escape or backdrop click.
import { useEffect } from 'react'
import { X } from 'lucide-react'

/**
 * @param {{
 *   open: boolean,
 *   title: string,
 *   onClose: () => void,
 *   children: React.ReactNode,
 *   maxWidth?: string,
 * }} props
 */
export default function Modal({ open, title, onClose, children, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return undefined
    /** @param {KeyboardEvent} e */
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`sedap-card relative w-full ${maxWidth} p-6 sm:p-8`}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2 className="text-xl font-semibold text-[#464255]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#a3a3a3] hover:bg-[#f3f2f7] hover:text-[#464255]"
            aria-label="ปิด"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
