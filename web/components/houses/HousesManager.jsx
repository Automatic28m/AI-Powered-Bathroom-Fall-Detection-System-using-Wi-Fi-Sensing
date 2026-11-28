'use client'

// /admin/houses: list (WA-7), add (WA-6), edit (WA-8), details (WA-7)
import { useState } from 'react'
import { Eye, Pencil, Plus, Search } from 'lucide-react'
import Notice, { useNotice } from '@/components/Notice'
import Pagination from '@/components/Pagination'
import TableStates, { TD, TH } from '@/components/TableStates'
import { formatDate } from '@/lib/format'
import { useDebouncedSearch, useList } from '@/lib/use-list'
import HouseDetailModal from './HouseDetailModal'
import HouseFormModal from './HouseFormModal'

const PAGE_SIZE = 20

/** @typedef {import('@/lib/houses').HouseItem} HouseItem */

export default function HousesManager() {
  const [page, setPage] = useState(1)
  const { query, setQuery, search } = useDebouncedSearch(() => setPage(1))
  const { data, setData, loading, error, reload } = useList(
    '/api/houses',
    { page, pageSize: PAGE_SIZE, q: search },
    'โหลดรายการบ้านไม่สำเร็จ'
  )
  const [notice, flash] = useNotice()
  /** @type {[{ mode: 'create' } | { mode: 'edit', house: HouseItem } | null, Function]} */
  const [form, setForm] = useState(null)
  const [detailId, setDetailId] = useState(/** @type {number | null} */ (null))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#464255] sm:text-[2rem]">จัดการข้อมูลบ้าน</h1>
          <p className="mt-1 text-sm text-[#a3a3a3]">เพิ่มบ้าน ดูรายละเอียด และแก้ไขข้อมูลบ้าน</p>
        </div>
        <button
          type="button"
          className="sedap-btn-primary"
          onClick={() => setForm({ mode: 'create' })}
        >
          <Plus className="size-4" /> เพิ่มบ้านใหม่
        </button>
      </div>

      <Notice notice={notice} />

      <div className="sedap-card p-0">
        <div className="border-b border-[#ebebeb] p-4 sm:p-6">
          <div className="relative">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาชื่อบ้าน / ที่อยู่..."
              className="sedap-input pr-11"
              aria-label="ค้นหาบ้าน"
            />
            <Search className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-[#a3a3a3]" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-[#f3f2f7]/60 text-xs font-semibold uppercase text-[#464255]">
              <tr>
                <th className={TH}>ชื่อบ้าน</th>
                <th className={TH}>ที่อยู่</th>
                <th className={`${TH} text-center`}>ห้องน้ำ</th>
                <th className={`${TH} text-center`}>ผู้ใช้</th>
                <th className={TH}>วันที่เพิ่ม</th>
                <th className={`${TH} text-right`}>จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebebeb]">
              <TableStates
                colSpan={6}
                loading={loading}
                error={error}
                empty={data.items.length === 0}
                emptyText={search ? 'ไม่พบบ้านที่ตรงกับคำค้นหา' : 'ยังไม่มีบ้านในระบบ'}
              />
              {data.items.map((/** @type {HouseItem} */ h) => (
                <tr key={h.id} className="hover:bg-[#f3f2f7]/50">
                  <td className={`${TD} font-semibold text-[#464255]`}>{h.name}</td>
                  <td className={`${TD} max-w-xs text-[#333333]`}>
                    <span className="line-clamp-2">{h.address}</span>
                  </td>
                  <td className={`${TD} text-center text-[#333333]`}>{h.bathroomCount}</td>
                  <td className={`${TD} text-center text-[#333333]`}>{h.userCount}</td>
                  <td className={`${TD} text-[#a3a3a3]`}>{formatDate(h.createdAt)}</td>
                  <td className={`${TD} text-right`}>
                    <div className="inline-flex gap-1">
                      <button
                        type="button"
                        onClick={() => setDetailId(h.id)}
                        className="inline-flex size-9 items-center justify-center rounded-[10px] text-[#2d9cdb] transition-colors hover:bg-[#2d9cdb]/15"
                        aria-label={`ดูรายละเอียด ${h.name}`}
                        title="ดูรายละเอียด"
                      >
                        <Eye className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm({ mode: 'edit', house: h })}
                        className="inline-flex size-9 items-center justify-center rounded-[10px] text-[#00b074] transition-colors hover:bg-[#00b074]/15"
                        aria-label={`แก้ไข ${h.name}`}
                        title="แก้ไข"
                      >
                        <Pencil className="size-4" />
                      </button>
                    </div>
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
          unit="บ้าน"
          disabled={loading}
          onPage={setPage}
        />
      </div>

      <HouseFormModal
        state={form}
        onClose={() => setForm(null)}
        onSaved={(house, mode) => {
          if (mode === 'create') {
            flash(`เพิ่มบ้าน ${house.name} แล้ว`)
            reload()
          } else {
            flash(`บันทึกข้อมูลบ้าน ${house.name} แล้ว`)
            setData((d) => ({
              ...d,
              items: d.items.map((h) => (h.id === house.id ? house : h)),
            }))
          }
        }}
      />

      <HouseDetailModal houseId={detailId} onClose={() => setDetailId(null)} />
    </div>
  )
}
