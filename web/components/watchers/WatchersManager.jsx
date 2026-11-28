'use client'

// /admin/watchers: link users to a house (WA-13), choose watched bathrooms (WA-14),
// change or remove a pairing (WA-15)
import { Fragment, useState } from 'react'
import { BellOff, BellRing, Link2, Pencil, Search, Trash2 } from 'lucide-react'
import ConfirmDialog from '@/components/ConfirmDialog'
import Notice, { useNotice } from '@/components/Notice'
import Pagination from '@/components/Pagination'
import TableStates, { TD, TH } from '@/components/TableStates'
import { useHouseOptions } from '@/components/houses/useHouseOptions'
import { apiRequest } from '@/lib/client-api'
import { useDebouncedSearch, useList } from '@/lib/use-list'
import WatcherFormModal from './WatcherFormModal'

const PAGE_SIZE = 20

/**
 * @typedef {object} WatcherItem
 * @property {number} id
 * @property {string} username
 * @property {string} fullName
 * @property {boolean} isActive
 * @property {{ id: number, name: string } | null} house
 * @property {{ bathroom: { id: number, name: string }, alertsEnabled: boolean }[]} watches
 */

export default function WatchersManager() {
  const [page, setPage] = useState(1)
  const [houseId, setHouseId] = useState('')
  const { query, setQuery, search } = useDebouncedSearch(() => setPage(1))
  const { data, setData, loading, error, reload } = useList(
    '/api/watchers',
    { page, pageSize: PAGE_SIZE, houseId, q: search },
    'โหลดรายการผู้ติดตามไม่สำเร็จ'
  )
  const { houses } = useHouseOptions()
  const [notice, flash] = useNotice()
  /** @type {[{ account: WatcherItem | null } | null, Function]} */
  const [form, setForm] = useState(null)
  /** @type {[{ account: WatcherItem, bathroom: { id: number, name: string } } | null, Function]} */
  const [removing, setRemoving] = useState(null)
  const [removeBusy, setRemoveBusy] = useState(false)
  const [removeError, setRemoveError] = useState('')

  /** @param {WatcherItem} updated */
  function replaceRow(updated) {
    setData((d) => ({ ...d, items: d.items.map((a) => (a.id === updated.id ? updated : a)) }))
  }

  async function confirmRemove() {
    if (!removing) return
    const { account, bathroom } = removing
    setRemoveBusy(true)
    setRemoveError('')
    const params = new URLSearchParams({
      accountId: String(account.id),
      bathroomId: String(bathroom.id),
    })
    const res = await apiRequest(`/api/watchers?${params}`, { method: 'DELETE' })
    setRemoveBusy(false)
    if (!res.ok) return setRemoveError(res.error.message)
    replaceRow({
      ...account,
      watches: account.watches.filter((w) => w.bathroom.id !== bathroom.id),
    })
    flash(`เลิกจับคู่ ${account.username} กับ ${bathroom.name} แล้ว`)
    setRemoving(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#464255] sm:text-[2rem]">
            กำหนดห้องที่ผู้ใช้งานติดตาม
          </h1>
          <p className="mt-1 text-sm text-[#a3a3a3]">
            ผูกผู้ใช้งานกับบ้าน และเลือกห้องน้ำที่ผู้ใช้งานจะได้รับการแจ้งเตือน
          </p>
        </div>
        <button
          type="button"
          className="sedap-btn-primary"
          onClick={() => setForm({ account: null })}
        >
          <Link2 className="size-4" /> จับคู่ผู้ใช้งานกับห้องน้ำ
        </button>
      </div>

      <Notice notice={notice} />

      <div className="sedap-card p-0">
        <div className="flex flex-col gap-3 border-b border-[#ebebeb] p-4 sm:flex-row sm:items-center sm:p-6">
          <div className="relative flex-1">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาชื่อผู้ใช้ / ชื่อ-นามสกุล..."
              className="sedap-input pr-11"
              aria-label="ค้นหาผู้ใช้งาน"
            />
            <Search className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-[#a3a3a3]" />
          </div>
          <select
            value={houseId}
            onChange={(e) => {
              setHouseId(e.target.value)
              setPage(1)
            }}
            className="sedap-input sm:w-56"
            aria-label="กรองตามบ้าน"
          >
            <option value="">ทุกบ้าน</option>
            {houses.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-[#f3f2f7]/60 text-xs font-semibold uppercase text-[#464255]">
              <tr>
                <th className={TH}>ผู้ใช้งาน</th>
                <th className={TH}>บ้าน</th>
                <th className={TH}>ห้องน้ำที่ติดตาม</th>
                <th className={TH}>แจ้งเตือน</th>
                <th className={`${TH} text-right`}>จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebebeb]">
              <TableStates
                colSpan={5}
                loading={loading}
                error={error}
                empty={data.items.length === 0}
                emptyText={search || houseId ? 'ไม่พบผู้ใช้งานที่ตรงกับเงื่อนไข' : 'ยังไม่มีบัญชีผู้ใช้งาน'}
              />
              {data.items.map((/** @type {WatcherItem} */ a) => {
                const rows = a.watches.length ? a.watches : [null]
                return (
                  <Fragment key={a.id}>
                    {rows.map((w, i) => (
                      <tr key={w ? w.bathroom.id : 'none'} className={i > 0 ? 'border-t-0' : ''}>
                        {i === 0 && (
                          <>
                            <td className={`${TD} align-top`} rowSpan={rows.length}>
                              <p className="font-semibold text-[#464255]">{a.username}</p>
                              <p className="text-xs text-[#a3a3a3]">{a.fullName}</p>
                              {!a.isActive && (
                                <span className="mt-1 inline-block rounded-full bg-[#d0d6de]/40 px-2 py-0.5 text-xs font-semibold text-[#5e6c93]">
                                  ปิดใช้งาน
                                </span>
                              )}
                            </td>
                            <td className={`${TD} align-top text-[#333333]`} rowSpan={rows.length}>
                              {a.house?.name ?? <span className="text-[#a3a3a3]">ยังไม่ผูกบ้าน</span>}
                            </td>
                          </>
                        )}
                        <td className={`${TD} text-[#333333]`}>
                          {w ? w.bathroom.name : <span className="text-[#a3a3a3]">—</span>}
                        </td>
                        <td className={TD}>
                          {w &&
                            (w.alertsEnabled ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#009663]">
                                <BellRing className="size-4" /> เปิด
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5e6c93]">
                                <BellOff className="size-4" /> ปิด
                              </span>
                            ))}
                        </td>
                        <td className={`${TD} text-right`}>
                          <div className="inline-flex gap-1">
                            {i === 0 && (
                              <button
                                type="button"
                                onClick={() => setForm({ account: a })}
                                className="inline-flex size-9 items-center justify-center rounded-[10px] text-[#00b074] transition-colors hover:bg-[#00b074]/15"
                                aria-label={`แก้ไขการจับคู่ของ ${a.username}`}
                                title="แก้ไขการจับคู่"
                              >
                                <Pencil className="size-4" />
                              </button>
                            )}
                            {w && (
                              <button
                                type="button"
                                onClick={() => {
                                  setRemoveError('')
                                  setRemoving({ account: a, bathroom: w.bathroom })
                                }}
                                className="inline-flex size-9 items-center justify-center rounded-[10px] text-[#ff5b5b] transition-colors hover:bg-[#ff5b5b]/15"
                                aria-label={`เลิกจับคู่ ${a.username} กับ ${w.bathroom.name}`}
                                title="ลบการจับคู่"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={data.total}
          unit="ผู้ใช้งาน"
          disabled={loading}
          onPage={setPage}
        />
      </div>

      <WatcherFormModal
        state={form}
        onClose={() => setForm(null)}
        onSaved={(updated) => {
          flash(`บันทึกการจับคู่ของ ${updated.username} แล้ว`)
          // A changed house can move the row out of the current filter, so reload
          if (houseId) reload()
          else replaceRow(updated)
        }}
      />

      <ConfirmDialog
        open={removing !== null}
        title="ลบการจับคู่"
        message={
          <>
            ต้องการเลิกให้ <b>{removing?.account.username}</b> ติดตาม <b>{removing?.bathroom.name}</b>{' '}
            ใช่หรือไม่?
            <br />
            ผู้ใช้จะไม่ได้รับการแจ้งเตือนจากห้องนี้อีก
          </>
        }
        confirmLabel="ลบการจับคู่"
        destructive
        pending={removeBusy}
        error={removeError}
        onConfirm={confirmRemove}
        onClose={() => setRemoving(null)}
      />
    </div>
  )
}
