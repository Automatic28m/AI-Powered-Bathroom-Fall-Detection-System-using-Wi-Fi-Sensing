'use client'

// Table footer: total count + previous / next page
import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * @param {{
 *   page: number,
 *   pageSize: number,
 *   total: number,
 *   unit: string,
 *   disabled?: boolean,
 *   onPage: (page: number) => void,
 * }} props
 */
export default function Pagination({ page, pageSize, total, unit, disabled = false, onPage }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  return (
    <div className="flex items-center justify-between gap-4 border-t border-[#ebebeb] px-4 py-4 text-sm text-[#a3a3a3] sm:px-6">
      <span>
        ทั้งหมด {total} {unit}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="sedap-btn-outline h-9 px-3 disabled:opacity-40"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1 || disabled}
          aria-label="หน้าก่อนหน้า"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="text-[#464255]">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          className="sedap-btn-outline h-9 px-3 disabled:opacity-40"
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages || disabled}
          aria-label="หน้าถัดไป"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
