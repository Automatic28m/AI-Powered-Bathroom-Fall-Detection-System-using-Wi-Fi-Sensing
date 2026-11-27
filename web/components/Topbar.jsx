'use client'

// Sedap-style top bar with search, alert counters, and user greeting
import { AlertTriangle, Bell, Menu, Search } from 'lucide-react'

/**
 * @param {{ userName?: string, roleLabel?: string, onMenuOpen?: () => void }} props
 */
export default function Topbar({ userName = 'ผู้ใช้งาน', roleLabel = 'Admin', onMenuOpen }) {
  return (
    <header className="flex flex-wrap items-center gap-4 pb-6">
      {/* Mobile menu toggle */}
      <button
        type="button"
        onClick={onMenuOpen}
        className="flex size-11 items-center justify-center rounded-[14px] bg-white text-[#464255] shadow-[0_4px_8px_0_rgb(0_0_0/0.04)] lg:hidden"
        aria-label="เปิดเมนู"
      >
        <Menu className="size-5" />
      </button>

      {/* Search bar */}
      <div className="relative hidden min-w-0 flex-1 md:block">
        <input
          type="search"
          placeholder="ค้นหาบ้าน, ห้องน้ำ, ผู้ใช้งาน..."
          className="h-12 w-full rounded-[14px] border border-[#ebebeb] bg-[#fdfdfd] pl-5 pr-12 text-sm text-[#333333] placeholder-[#a3a3a3] focus:border-[#00b074] focus:outline-none"
        />
        <Search className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-[#a3a3a3]" />
      </div>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-3 sm:gap-5">
        {/* Fall notification quick counter */}
        <button
          type="button"
          className="relative flex size-11 items-center justify-center rounded-[14px] bg-[#ff5b5b]/15 text-[#ff5b5b] transition-colors hover:bg-[#ff5b5b]/25"
          aria-label="แจ้งเตือนการล้ม"
        >
          <Bell className="size-5" />
          <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full border-2 border-[#f3f2f7] bg-[#ff5b5b] text-[10px] font-bold text-white">
            0
          </span>
        </button>

        {/* Calibration warning counter */}
        <button
          type="button"
          className="relative hidden size-11 items-center justify-center rounded-[14px] bg-[#2d9cdb]/15 text-[#2d9cdb] transition-colors hover:bg-[#2d9cdb]/25 sm:flex"
          aria-label="สถานะการปรับเทียบ"
        >
          <AlertTriangle className="size-5" />
          <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full border-2 border-[#f3f2f7] bg-[#2d9cdb] text-[10px] font-bold text-white">
            0
          </span>
        </button>

        <span className="hidden h-10 w-px bg-[#d0d6de] sm:block" aria-hidden="true" />

        {/* User profile pill */}
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm text-[#464255]">
              สวัสดี, <span className="font-semibold">{userName}</span>
            </p>
            <p className="text-xs text-[#a3a3a3]">{roleLabel}</p>
          </div>
          <div className="flex size-11 items-center justify-center rounded-full bg-[#00b074] text-sm font-bold text-white shadow-sm">
            {userName.slice(0, 1).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  )
}
