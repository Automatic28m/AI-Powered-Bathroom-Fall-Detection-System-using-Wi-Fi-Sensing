'use client'

// House details (WA-7): address, bathrooms with calibration status, linked users
import { useEffect, useState } from 'react'
import Modal from '@/components/Modal'
import { FormError } from '@/components/Notice'
import CalibrationBadge from '@/components/bathrooms/CalibrationBadge'
import { apiRequest } from '@/lib/client-api'
import { formatDate } from '@/lib/format'

/** @param {{ houseId: number | null, onClose: () => void }} props */
export default function HouseDetailModal({ houseId, onClose }) {
  const [house, setHouse] = useState(/** @type {any} */ (null))
  const [error, setError] = useState('')

  useEffect(() => {
    if (houseId === null) return undefined
    let cancelled = false
    setHouse(null)
    setError('')
    apiRequest(`/api/houses/${houseId}`).then((res) => {
      if (cancelled) return
      if (res.ok) setHouse(res.data)
      else setError(res.error.message)
    })
    return () => {
      cancelled = true
    }
  }, [houseId])

  return (
    <Modal
      open={houseId !== null}
      title={house?.name ?? 'รายละเอียดบ้าน'}
      onClose={onClose}
      maxWidth="max-w-2xl"
    >
      <FormError message={error} />
      {!house && !error && <p className="text-sm text-[#a3a3a3]">กำลังโหลด…</p>}
      {house && (
        <div className="space-y-6 text-sm">
          <dl className="grid gap-4 sm:grid-cols-[8rem_1fr]">
            <dt className="text-[#a3a3a3]">ที่อยู่</dt>
            <dd className="whitespace-pre-line text-[#333333]">{house.address}</dd>
            <dt className="text-[#a3a3a3]">วันที่เพิ่ม</dt>
            <dd className="text-[#333333]">{formatDate(house.createdAt)}</dd>
          </dl>

          <section>
            <h3 className="mb-2 font-semibold text-[#464255]">ห้องน้ำ ({house.bathrooms.length})</h3>
            {house.bathrooms.length === 0 ? (
              <p className="text-[#a3a3a3]">ยังไม่มีห้องน้ำ เพิ่มได้ที่หน้า &quot;ข้อมูลห้องน้ำ&quot;</p>
            ) : (
              <ul className="divide-y divide-[#ebebeb] rounded-[14px] border border-[#ebebeb]">
                {house.bathrooms.map((/** @type {any} */ b) => (
                  <li
                    key={b.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-[#464255]">{b.name}</p>
                      <p className="font-mono text-xs text-[#a3a3a3]">{b.rxMac}</p>
                    </div>
                    <CalibrationBadge calibration={b.calibration} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="mb-2 font-semibold text-[#464255]">ผู้ใช้งาน ({house.users.length})</h3>
            {house.users.length === 0 ? (
              <p className="text-[#a3a3a3]">ยังไม่มีผู้ใช้งานผูกกับบ้านนี้ ผูกได้ที่หน้า &quot;ผู้ติดตามห้องน้ำ&quot;</p>
            ) : (
              <ul className="divide-y divide-[#ebebeb] rounded-[14px] border border-[#ebebeb]">
                {house.users.map((/** @type {any} */ u) => (
                  <li
                    key={u.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-[#464255]">{u.fullName}</p>
                      <p className="text-xs text-[#a3a3a3]">
                        {u.username} · {u.phone}
                      </p>
                    </div>
                    {!u.isActive && (
                      <span className="rounded-full bg-[#d0d6de]/40 px-3 py-1 text-xs font-semibold text-[#5e6c93]">
                        ปิดใช้งาน
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </Modal>
  )
}
