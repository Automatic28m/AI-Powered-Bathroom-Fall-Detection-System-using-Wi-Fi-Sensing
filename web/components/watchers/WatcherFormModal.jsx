'use client'

// Pick a user, link them to a house (WA-13) and tick the bathrooms they watch (WA-14, WA-15)
import { useEffect, useState } from 'react'
import Field from '@/components/Field'
import Modal from '@/components/Modal'
import { FormError } from '@/components/Notice'
import { useHouseOptions } from '@/components/houses/useHouseOptions'
import { apiRequest } from '@/lib/client-api'

/** @typedef {import('./WatchersManager').WatcherItem} WatcherItem */

/**
 * @param {{
 *   state: { account: WatcherItem | null } | null,
 *   onClose: () => void,
 *   onSaved: (account: WatcherItem) => void,
 * }} props
 */
export default function WatcherFormModal({ state, onClose, onSaved }) {
  const open = state !== null
  const fixedAccount = state?.account ?? null
  const { houses } = useHouseOptions()

  // The user list, only needed when no account was given ("+ จับคู่")
  const [users, setUsers] = useState(/** @type {WatcherItem[]} */ ([]))
  const [accountId, setAccountId] = useState('')
  const [houseId, setHouseId] = useState('')
  const [checked, setChecked] = useState(/** @type {Set<number>} */ (new Set()))
  const [bathrooms, setBathrooms] = useState(
    /** @type {{ id: number, name: string }[] | null} */ (null)
  )
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const account = fixedAccount ?? users.find((u) => String(u.id) === accountId) ?? null

  // Start from the account's current house and bathrooms
  /** @param {WatcherItem | null} a */
  function selectAccount(a) {
    setAccountId(a ? String(a.id) : '')
    setHouseId(a?.house ? String(a.house.id) : '')
    setChecked(new Set(a?.watches.map((w) => w.bathroom.id) ?? []))
  }

  useEffect(() => {
    if (!open) return
    setError('')
    selectAccount(fixedAccount)
    if (fixedAccount) return
    apiRequest('/api/watchers?pageSize=100').then((res) => {
      if (res.ok) setUsers(res.data.items)
      else setError('โหลดรายชื่อผู้ใช้งานไม่สำเร็จ')
    })
  }, [open, fixedAccount])

  // Bathrooms of the chosen house
  useEffect(() => {
    if (!open || !houseId) {
      setBathrooms(null)
      return undefined
    }
    let cancelled = false
    setBathrooms(null)
    apiRequest(`/api/bathrooms?houseId=${houseId}&pageSize=100`).then((res) => {
      if (cancelled) return
      if (res.ok)
        setBathrooms(res.data.items.map((/** @type {any} */ b) => ({ id: b.id, name: b.name })))
      else setError('โหลดรายการห้องน้ำไม่สำเร็จ')
    })
    return () => {
      cancelled = true
    }
  }, [open, houseId])

  const houseChanged = account !== null && String(account.house?.id ?? '') !== houseId

  /** @param {string} value */
  function changeHouse(value) {
    setHouseId(value)
    // Bathrooms belong to one house, so a new house starts with nothing ticked
    setChecked(
      account && String(account.house?.id ?? '') === value
        ? new Set(account.watches.map((w) => w.bathroom.id))
        : new Set()
    )
  }

  /** @param {number} id */
  function toggle(id) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  /** @param {React.FormEvent<HTMLFormElement>} event */
  async function handleSubmit(event) {
    event.preventDefault()
    if (!account) return setError('กรุณาเลือกผู้ใช้งาน')
    setPending(true)
    setError('')
    const res = await apiRequest('/api/watchers', {
      method: 'POST',
      body: {
        accountId: account.id,
        houseId: houseId ? Number(houseId) : null,
        bathroomIds: houseId ? [...checked] : [],
      },
    })
    setPending(false)
    if (!res.ok) return setError(res.error.fields?.[0]?.message ?? res.error.message)
    onSaved(res.data)
    onClose()
  }

  return (
    <Modal
      open={open}
      title={fixedAccount ? `แก้ไขการจับคู่: ${fixedAccount.username}` : 'จับคู่ผู้ใช้งานกับห้องน้ำ'}
      onClose={onClose}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormError message={error} />

        {!fixedAccount && (
          <Field id="watch-user" label="ผู้ใช้งาน">
            <select
              id="watch-user"
              value={accountId}
              onChange={(e) =>
                selectAccount(users.find((u) => String(u.id) === e.target.value) ?? null)
              }
              required
              className="sedap-input"
            >
              <option value="" disabled>
                เลือกผู้ใช้งาน
              </option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username} — {u.fullName}
                  {u.house ? ` (${u.house.name})` : ''}
                </option>
              ))}
            </select>
          </Field>
        )}

        {account && (
          <>
            <Field
              id="watch-house"
              label="บ้านของผู้ใช้งาน"
              hint={
                houseChanged && account.house
                  ? `ผู้ใช้จะย้ายจาก ${account.house.name} และเลิกติดตามห้องน้ำทุกห้องของบ้านเดิม`
                  : 'ผู้ใช้งานติดตามได้เฉพาะห้องน้ำในบ้านของตัวเอง'
              }
            >
              <select
                id="watch-house"
                value={houseId}
                onChange={(e) => changeHouse(e.target.value)}
                className="sedap-input"
              >
                <option value="">— ไม่ผูกบ้าน —</option>
                {houses.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </Field>

            {houseId && (
              <fieldset className="rounded-[14px] border border-[#ebebeb] p-4">
                <legend className="px-1 text-xs font-semibold text-[#464255]">ห้องน้ำที่ติดตาม</legend>
                {bathrooms === null && <p className="text-sm text-[#a3a3a3]">กำลังโหลด…</p>}
                {bathrooms?.length === 0 && (
                  <p className="text-sm text-[#a3a3a3]">
                    บ้านนี้ยังไม่มีห้องน้ำ เพิ่มได้ที่หน้า &quot;ข้อมูลห้องน้ำ&quot;
                  </p>
                )}
                <div className="space-y-2">
                  {bathrooms?.map((b) => (
                    <label
                      key={b.id}
                      className="flex cursor-pointer items-center gap-3 rounded-[10px] px-2 py-2 text-sm text-[#333333] hover:bg-[#f3f2f7]"
                    >
                      <input
                        type="checkbox"
                        checked={checked.has(b.id)}
                        onChange={() => toggle(b.id)}
                        className="size-4 accent-[#00b074]"
                      />
                      {b.name}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            <p className="text-xs text-[#a3a3a3]">
              ห้องที่เพิ่มใหม่จะเปิดการแจ้งเตือนไว้ ผู้ใช้งานปิดเองได้ในหน้าตั้งค่าการแจ้งเตือน
            </p>
          </>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="sedap-btn-outline" onClick={onClose} disabled={pending}>
            ยกเลิก
          </button>
          <button type="submit" className="sedap-btn-primary h-11" disabled={pending || !account}>
            {pending ? 'กำลังบันทึก…' : 'บันทึก'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
