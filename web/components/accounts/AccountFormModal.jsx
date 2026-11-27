'use client'

// Add admin (WA-1) or user (WA-3) account
import { useState } from 'react'
import Modal from '@/components/Modal'

const FIELD_LABELS = {
  username: 'ชื่อผู้ใช้ (Username)',
  password: 'รหัสผ่าน',
  fullName: 'ชื่อ-นามสกุล',
  phone: 'เบอร์โทรศัพท์',
  email: 'อีเมลติดต่อ',
  address: 'ที่อยู่',
}

const CONFLICT_MESSAGES = {
  username: 'ชื่อผู้ใช้นี้ถูกใช้แล้ว',
  email: 'อีเมลนี้ถูกใช้แล้ว',
}

/**
 * @param {{
 *   role: 'admin' | 'user' | null,
 *   onClose: () => void,
 *   onCreated: (account: import('@/lib/accounts').AccountItem) => void,
 * }} props
 */
export default function AccountFormModal({ role, onClose, onCreated }) {
  const [pending, setPending] = useState(false)
  const [formError, setFormError] = useState('')
  /** @type {[Record<string, string>, Function]} */
  const [fieldErrors, setFieldErrors] = useState({})

  const isUser = role === 'user'
  const fields = isUser
    ? ['username', 'password', 'fullName', 'phone', 'email', 'address']
    : ['username', 'password', 'fullName', 'phone', 'email']

  function close() {
    setFormError('')
    setFieldErrors({})
    onClose()
  }

  /** @param {React.FormEvent<HTMLFormElement>} event */
  async function handleSubmit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const body = { role, ...Object.fromEntries(fields.map((f) => [f, String(form.get(f) ?? '')])) }

    setPending(true)
    setFormError('')
    setFieldErrors({})
    let res
    try {
      res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    } catch {
      setFormError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่')
      return
    } finally {
      setPending(false)
    }

    if (res.ok) {
      onCreated(await res.json())
      close()
      return
    }
    const { error } = await res.json().catch(() => ({ error: {} }))
    if (error?.code === 'VALIDATION_FAILED') {
      setFieldErrors(Object.fromEntries((error.fields ?? []).map((f) => [f.path, f.message])))
    } else if (error?.code === 'CONFLICT') {
      const taken = (error.fields ?? []).filter((f) => f in CONFLICT_MESSAGES)
      setFieldErrors(Object.fromEntries(taken.map((f) => [f, CONFLICT_MESSAGES[f]])))
      if (!taken.length) setFormError(error.message)
    } else {
      setFormError(error?.message ?? 'บันทึกไม่สำเร็จ กรุณาลองใหม่')
    }
  }

  return (
    <Modal open={role !== null} title={isUser ? 'เพิ่มบัญชีผู้ใช้งาน' : 'เพิ่มบัญชีผู้ดูแลระบบ'} onClose={close}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && (
          <p
            role="alert"
            className="rounded-[14px] bg-[#ff5b5b]/15 px-4 py-3 text-sm text-[#e64545]"
          >
            {formError}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((name) => (
            <div key={name} className={name === 'address' ? 'sm:col-span-2' : ''}>
              <label
                htmlFor={`acc-${name}`}
                className="mb-1.5 block text-xs font-medium text-[#464255]"
              >
                {FIELD_LABELS[name]}
              </label>
              {name === 'address' ? (
                <textarea
                  id={`acc-${name}`}
                  name={name}
                  rows={2}
                  required
                  className="sedap-input h-auto py-3"
                  aria-invalid={Boolean(fieldErrors[name])}
                />
              ) : (
                <input
                  id={`acc-${name}`}
                  name={name}
                  type={
                    name === 'password'
                      ? 'password'
                      : name === 'email'
                        ? 'email'
                        : name === 'phone'
                          ? 'tel'
                          : 'text'
                  }
                  autoComplete={name === 'password' ? 'new-password' : 'off'}
                  placeholder={
                    name === 'phone' ? '0812345678' : name === 'username' ? 'เช่น somchai01' : ''
                  }
                  required
                  className="sedap-input"
                  aria-invalid={Boolean(fieldErrors[name])}
                />
              )}
              {fieldErrors[name] && (
                <p className="mt-1 text-xs text-[#e64545]">{fieldErrors[name]}</p>
              )}
            </div>
          ))}
        </div>

        <p className="text-xs text-[#a3a3a3]">
          ชื่อผู้ใช้ใช้ได้เฉพาะ a-z, 0-9, _ และ . (3–30 ตัวอักษร) รหัสผ่านอย่างน้อย 8 ตัวอักษร
        </p>

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
