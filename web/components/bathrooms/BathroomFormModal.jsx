'use client'

// Add a bathroom with an optional first baseline (WA-9), or edit the name / Rx MAC
// and upload a new baseline (WA-12)
import { useState } from 'react'
import Field from '@/components/Field'
import Modal from '@/components/Modal'
import { FormError } from '@/components/Notice'
import { apiRequest, fieldErrorsOf } from '@/lib/client-api'
import { formatDateTime } from '@/lib/format'

/** @typedef {import('@/lib/bathrooms').BathroomItem} BathroomItem */

const MAX_MB = 20

/**
 * datetime-local value ("2026-11-28T14:30", browser time zone) → ISO, or '' if empty
 * @param {FormDataEntryValue | null} value
 */
function toIso(value) {
  if (typeof value !== 'string' || !value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '' : d.toISOString()
}

/** "now" as a datetime-local value in the browser's time zone */
function nowLocal() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

/**
 * @param {ApiErrorLike} error
 * @returns {Record<string, string>}
 * @typedef {import('@/lib/client-api').ApiErrorBody} ApiErrorLike
 */
function errorsByField(error) {
  if (error.code === 'CONFLICT') return { rxMac: 'Rx MAC นี้ถูกใช้กับห้องน้ำอื่นแล้ว' }
  if (error.code?.startsWith('BASELINE_')) return { baseline: error.message }
  if (error.code === 'HOUSE_NOT_FOUND') return { houseId: error.message }
  return fieldErrorsOf(error)
}

/**
 * @param {{
 *   state: { mode: 'create' } | { mode: 'edit', bathroom: BathroomItem } | null,
 *   houses: { id: number, name: string }[],
 *   onClose: () => void,
 *   onSaved: (bathroom: BathroomItem, message: string) => void,
 *   onError: (message: string) => void,
 * }} props
 */
export default function BathroomFormModal({ state, houses, onClose, onSaved, onError }) {
  const [pending, setPending] = useState(false)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState(/** @type {Record<string, string>} */ ({}))
  const editing = state?.mode === 'edit' ? state.bathroom : null

  function close() {
    setFormError('')
    setFieldErrors({})
    onClose()
  }

  /** @param {import('@/lib/client-api').ApiErrorBody} error */
  function showError(error) {
    const fields = errorsByField(error)
    setFieldErrors(fields)
    if (!Object.keys(fields).length || fields._) setFormError(fields._ ?? error.message)
  }

  /** @param {React.FormEvent<HTMLFormElement>} event */
  async function handleSubmit(event) {
    event.preventDefault()
    if (!state) return
    const form = new FormData(event.currentTarget)
    const file = form.get('baseline')
    const hasFile = file instanceof File && file.size > 0
    if (hasFile && file.size > MAX_MB * 1024 * 1024) {
      setFieldErrors({ baseline: `ไฟล์ baseline ต้องมีขนาดไม่เกิน ${MAX_MB} MB` })
      return
    }
    const recordedAt = toIso(form.get('recordedAt'))

    setPending(true)
    setFormError('')
    setFieldErrors({})

    if (!editing) {
      // WA-9: one request, so the bathroom and its first baseline are saved together
      const body = new FormData()
      body.set('houseId', String(form.get('houseId') ?? ''))
      body.set('name', String(form.get('name') ?? ''))
      body.set('rxMac', String(form.get('rxMac') ?? ''))
      if (hasFile) {
        body.set('baseline', file)
        if (recordedAt) body.set('recordedAt', recordedAt)
      }
      const res = await apiRequest('/api/bathrooms', { method: 'POST', body })
      setPending(false)
      if (!res.ok) return showError(res.error)
      onSaved(res.data, `เพิ่มห้องน้ำ ${res.data.name} แล้ว`)
      return close()
    }

    // WA-12: save name / Rx MAC first, then upload the new baseline if one was chosen
    const name = String(form.get('name') ?? '')
    const rxMac = String(form.get('rxMac') ?? '')
    /** @type {BathroomItem} */
    let latest = editing
    const detailsChanged =
      name.trim() !== editing.name || rxMac.trim().toLowerCase() !== editing.rxMac
    if (detailsChanged) {
      const res = await apiRequest(`/api/bathrooms/${editing.id}`, {
        method: 'PATCH',
        body: { name, rxMac },
      })
      if (!res.ok) {
        setPending(false)
        return showError(res.error)
      }
      latest = res.data
    }
    if (hasFile) {
      const body = new FormData()
      body.set('baseline', file)
      if (recordedAt) body.set('recordedAt', recordedAt)
      const res = await apiRequest(`/api/bathrooms/${editing.id}/baseline`, {
        method: 'POST',
        body,
      })
      if (!res.ok) {
        setPending(false)
        if (detailsChanged) {
          // The details were saved; keep the table in sync and say what failed
          onSaved(latest, `บันทึกข้อมูลห้อง ${latest.name} แล้ว`)
          close()
          return onError(`อัปโหลด baseline ไม่สำเร็จ: ${res.error.message}`)
        }
        return showError(res.error)
      }
      latest = res.data
    }
    setPending(false)
    if (!detailsChanged && !hasFile) return close()
    onSaved(
      latest,
      hasFile ? `อัปโหลด baseline ของ ${latest.name} แล้ว` : `บันทึกข้อมูลห้อง ${latest.name} แล้ว`
    )
    close()
  }

  return (
    <Modal
      open={state !== null}
      title={editing ? `แก้ไขห้องน้ำ: ${editing.name}` : 'เพิ่มห้องน้ำ'}
      onClose={close}
      maxWidth="max-w-xl"
    >
      <form key={editing?.id ?? 'new'} onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormError message={formError} />

        {editing ? (
          <p className="text-sm text-[#a3a3a3]">
            บ้าน: <span className="font-medium text-[#464255]">{editing.house.name}</span>
          </p>
        ) : (
          <Field id="bath-house" label="บ้าน" error={fieldErrors.houseId}>
            <select
              id="bath-house"
              name="houseId"
              required
              defaultValue=""
              className="sedap-input"
              aria-invalid={Boolean(fieldErrors.houseId)}
            >
              <option value="" disabled>
                เลือกบ้าน
              </option>
              {houses.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </Field>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="bath-name" label="ชื่อห้อง" error={fieldErrors.name}>
            <input
              id="bath-name"
              name="name"
              defaultValue={editing?.name ?? ''}
              placeholder="เช่น ห้องน้ำชั้น 1"
              required
              maxLength={120}
              className="sedap-input"
              aria-invalid={Boolean(fieldErrors.name)}
            />
          </Field>
          <Field
            id="bath-mac"
            label="Rx MAC Address"
            error={fieldErrors.rxMac}
            hint="MAC ของ ESP32 ตัวรับ เช่น a4:cf:12:3b:9e:01"
          >
            <input
              id="bath-mac"
              name="rxMac"
              defaultValue={editing?.rxMac ?? ''}
              placeholder="a4:cf:12:3b:9e:01"
              required
              autoComplete="off"
              spellCheck={false}
              className="sedap-input font-mono"
              aria-invalid={Boolean(fieldErrors.rxMac)}
            />
          </Field>
        </div>

        <fieldset className="space-y-4 rounded-[14px] border border-[#ebebeb] p-4">
          <legend className="px-1 text-xs font-semibold text-[#464255]">
            {editing ? 'อัปโหลด baseline ใหม่ (ไม่บังคับ)' : 'Baseline (ไม่บังคับ อัปโหลดภายหลังได้)'}
          </legend>
          {editing && (
            <p className="text-xs text-[#a3a3a3]">
              {editing.currentBaseline
                ? `baseline ปัจจุบันบันทึกเมื่อ ${formatDateTime(editing.currentBaseline.recordedAt)}`
                : 'ห้องนี้ยังไม่มี baseline'}
            </p>
          )}
          <Field
            id="bath-baseline"
            label="ไฟล์ baseline (.npy)"
            error={fieldErrors.baseline}
            hint={`ไฟล์ NumPy จากการบันทึกห้องว่าง ขนาดไม่เกิน ${MAX_MB} MB`}
          >
            <input
              id="bath-baseline"
              name="baseline"
              type="file"
              accept=".npy"
              className="block w-full text-sm text-[#464255] file:mr-4 file:rounded-[10px] file:border-0 file:bg-[#00b074]/15 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#009663] hover:file:bg-[#00b074]/25"
              aria-invalid={Boolean(fieldErrors.baseline)}
            />
          </Field>
          <Field
            id="bath-recorded"
            label="วันเวลาที่บันทึก baseline"
            error={fieldErrors.recordedAt}
            hint="เว้นว่างไว้ = ตอนนี้ ใช้คำนวณกำหนดการปรับเทียบครั้งถัดไป"
          >
            <input
              id="bath-recorded"
              name="recordedAt"
              type="datetime-local"
              max={nowLocal()}
              className="sedap-input"
              aria-invalid={Boolean(fieldErrors.recordedAt)}
            />
          </Field>
        </fieldset>

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
