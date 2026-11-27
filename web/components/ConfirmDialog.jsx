'use client'

// Yes/no confirmation for destructive actions (delete, turn off)
import Modal from './Modal'

/**
 * @param {{
 *   open: boolean,
 *   title: string,
 *   message: React.ReactNode,
 *   confirmLabel: string,
 *   destructive?: boolean,
 *   pending?: boolean,
 *   error?: string,
 *   onConfirm: () => void,
 *   onClose: () => void,
 * }} props
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  destructive = false,
  pending = false,
  error = '',
  onConfirm,
  onClose,
}) {
  return (
    <Modal open={open} title={title} onClose={onClose} maxWidth="max-w-md">
      <div className="text-sm leading-relaxed text-[#464255]">{message}</div>
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-[14px] bg-[#ff5b5b]/15 px-4 py-3 text-sm text-[#e64545]"
        >
          {error}
        </p>
      )}
      <div className="mt-7 flex justify-end gap-3">
        <button type="button" className="sedap-btn-outline" onClick={onClose} disabled={pending}>
          ยกเลิก
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          className={
            destructive
              ? 'inline-flex h-11 items-center justify-center rounded-[14px] bg-[#ff5b5b] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#e64545] disabled:opacity-50'
              : 'sedap-btn-primary h-11'
          }
        >
          {pending ? 'กำลังดำเนินการ…' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
