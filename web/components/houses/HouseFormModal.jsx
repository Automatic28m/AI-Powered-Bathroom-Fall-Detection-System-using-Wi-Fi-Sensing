'use client'

// Add a house (WA-6) or edit one (WA-8)
import { useState } from 'react'
import Field from '@/components/Field'
import Modal from '@/components/Modal'
import { FormError } from '@/components/Notice'
import { apiRequest, fieldErrorsOf } from '@/lib/client-api'

/** @typedef {import('@/lib/houses').HouseItem} HouseItem */

/**
 * @param {{
 *   state: { mode: 'create' } | { mode: 'edit', house: HouseItem } | null,
 *   onClose: () => void,
 *   onSaved: (house: HouseItem, mode: 'create' | 'edit') => void,
 * }} props
 */
export default function HouseFormModal({ state, onClose, onSaved }) {
  const [pending, setPending] = useState(false)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState(/** @type {Record<string, string>} */ ({}))
  const editing = state?.mode === 'edit' ? state.house : null

  function close() {
    setFormError('')
    setFieldErrors({})
    onClose()
  }

  /** @param {React.FormEvent<HTMLFormElement>} event */
  async function handleSubmit(event) {
    event.preventDefault()
    if (!state) return
    const form = new FormData(event.currentTarget)
    const body = {
      name: String(form.get('name') ?? ''),
      address: String(form.get('address') ?? ''),
    }

    setPending(true)
    setFormError('')
    setFieldErrors({})
    const res = editing
      ? await apiRequest(`/api/houses/${editing.id}`, { method: 'PATCH', body })
      : await apiRequest('/api/houses', { method: 'POST', body })
    setPending(false)

    if (res.ok) {
      onSaved(res.data, state.mode)
      close()
      return
    }
    const fields = fieldErrorsOf(res.error)
    setFieldErrors(fields)
    if (!Object.keys(fields).length || fields._) setFormError(fields._ ?? res.error.message)
  }

  return (
    <Modal open={state !== null} title={editing ? `แก้ไขข้อมูลบ้าน` : 'เพิ่มบ้านใหม่'} onClose={close}>
      {/* key: reset the inputs when switching between houses */}
      <form key={editing?.id ?? 'new'} onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormError message={formError} />
        <Field id="house-name" label="ชื่อบ้าน" error={fieldErrors.name}>
          <input
            id="house-name"
            name="name"
            defaultValue={editing?.name ?? ''}
            placeholder="เช่น บ้านคุณสมชาย"
            required
            maxLength={120}
            className="sedap-input"
            aria-invalid={Boolean(fieldErrors.name)}
          />
        </Field>
        <Field id="house-address" label="ที่อยู่" error={fieldErrors.address}>
          <textarea
            id="house-address"
            name="address"
            defaultValue={editing?.address ?? ''}
            rows={3}
            required
            maxLength={300}
            className="sedap-input h-auto py-3"
            aria-invalid={Boolean(fieldErrors.address)}
          />
        </Field>
        <p className="text-xs text-[#a3a3a3]">วันที่เพิ่มบ้านจะบันทึกโดยอัตโนมัติ</p>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="sedap-btn-outline" onClick={close} disabled={pending}>
            ยกเลิก
          </button>
          <button type="submit" className="sedap-btn-primary h-11" disabled={pending}>
            {pending ? 'กำลังบันทึก…' : 'บันทึก'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
