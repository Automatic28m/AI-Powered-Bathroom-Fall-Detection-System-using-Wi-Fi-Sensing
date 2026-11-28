'use client'

// /admin/bathrooms: list + calibration status (WA-10, WA-11), add (WA-9), edit + baseline (WA-12)
import { useState } from 'react'
import { Pencil, Plus, Search } from 'lucide-react'
import Notice, { useNotice } from '@/components/Notice'
import Pagination from '@/components/Pagination'
import TableStates, { TD, TH } from '@/components/TableStates'
import { useHouseOptions } from '@/components/houses/useHouseOptions'
import { formatDate } from '@/lib/format'
import { useDebouncedSearch, useList } from '@/lib/use-list'
import BathroomFormModal from './BathroomFormModal'
import CalibrationBadge from './CalibrationBadge'

const PAGE_SIZE = 20

/** @typedef {import('@/lib/bathrooms').BathroomItem} BathroomItem */

export default function BathroomsManager() {
  const [page, setPage] = useState(1)
  const [houseId, setHouseId] = useState('')
  const { query, setQuery, search } = useDebouncedSearch(() => setPage(1))
  const { data, setData, loading, error, reload } = useList(
    '/api/bathrooms',
    { page, pageSize: PAGE_SIZE, houseId, q: search },
    'โหลดรายการห้องน้ำไม่สำเร็จ'
  )
  const { houses, error: housesError } = useHouseOptions()
  const [notice, flash] = useNotice()
  /** @type {[{ mode: 'create' } | { mode: 'edit', bathroom: BathroomItem } | null, Function]} */
  const [form, setForm] = useState(null)
  const months = /** @type {any} */ (data).recalibrationMonths ?? 6

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#464255] sm:text-[2rem]">จัดการข้อมูลห้องน้ำ</h1>
          <p className="mt-1 text-sm text-[#a3a3a3]">
            เพิ่มห้องน้ำ แก้ไข Rx MAC และอัปโหลด baseline (ควรปรับเทียบใหม่ทุก {months} เดือน)
          </p>
        </div>
        <button
          type="button"
          className="sedap-btn-primary"
          onClick={() => setForm({ mode: 'create' })}
          disabled={houses.length === 0}
          title={houses.length === 0 ? 'ต้องเพิ่มบ้านก่อน' : undefined}
        >
          <Plus className="size-4" /> เพิ่มห้องน้ำ
        </button>
      </div>

      <Notice notice={notice} />
      {housesError && <Notice notice={{ message: housesError, tone: 'error' }} />}

      <div className="sedap-card p-0">
        <div className="flex flex-col gap-3 border-b border-[#ebebeb] p-4 sm:flex-row sm:items-center sm:p-6">
          <div className="relative flex-1">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาชื่อห้อง / Rx MAC / ชื่อบ้าน..."
              className="sedap-input pr-11"
              aria-label="ค้นหาห้องน้ำ"
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
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-[#f3f2f7]/60 text-xs font-semibold uppercase text-[#464255]">
              <tr>
                <th className={TH}>ชื่อห้อง</th>
                <th className={TH}>บ้าน</th>
                <th className={TH}>Rx MAC</th>
                <th className={TH}>ปรับเทียบล่าสุด</th>
                <th className={TH}>การปรับเทียบ</th>
                <th className={`${TH} text-center`}>ผู้ติดตาม</th>
                <th className={TH}>วันที่เพิ่ม</th>
                <th className={`${TH} text-right`}>จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebebeb]">
              <TableStates
                colSpan={8}
                loading={loading}
                error={error}
                empty={data.items.length === 0}
                emptyText={search || houseId ? 'ไม่พบห้องน้ำที่ตรงกับเงื่อนไข' : 'ยังไม่มีห้องน้ำในระบบ'}
              />
              {data.items.map((/** @type {BathroomItem} */ b) => (
                <tr key={b.id} className="hover:bg-[#f3f2f7]/50">
                  <td className={`${TD} font-semibold text-[#464255]`}>{b.name}</td>
                  <td className={`${TD} text-[#333333]`}>{b.house.name}</td>
                  <td className={`${TD} font-mono text-xs text-[#333333]`}>{b.rxMac}</td>
                  <td className={`${TD} text-[#333333]`}>
                    {b.lastCalibratedAt ? formatDate(b.lastCalibratedAt) : '—'}
                  </td>
                  <td className={TD}>
                    <CalibrationBadge calibration={b.calibration} showDue />
                  </td>
                  <td className={`${TD} text-center text-[#333333]`}>{b.watcherCount}</td>
                  <td className={`${TD} text-[#a3a3a3]`}>{formatDate(b.createdAt)}</td>
                  <td className={`${TD} text-right`}>
                    <button
                      type="button"
                      onClick={() => setForm({ mode: 'edit', bathroom: b })}
                      className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-xs font-semibold text-[#00b074] transition-colors hover:bg-[#00b074]/15"
                      aria-label={`แก้ไขหรืออัปโหลด baseline ของ ${b.name}`}
                    >
                      <Pencil className="size-4" /> แก้ไข / Baseline
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={data.total}
          unit="ห้อง"
          disabled={loading}
          onPage={setPage}
        />
      </div>

      <BathroomFormModal
        state={form}
        houses={houses}
        onClose={() => setForm(null)}
        onSaved={(bathroom, message) => {
          flash(message)
          if (form?.mode === 'create') reload()
          else {
            setData((d) => ({
              ...d,
              items: d.items.map((b) => (b.id === bathroom.id ? bathroom : b)),
            }))
          }
        }}
        onError={(message) => flash(message, 'error')}
      />
    </div>
  )
}
