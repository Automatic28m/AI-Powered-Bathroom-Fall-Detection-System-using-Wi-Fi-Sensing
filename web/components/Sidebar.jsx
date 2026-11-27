'use client'

// Sedap-style white sidebar with green active indicator bar
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Activity,
  Bell,
  Building2,
  ClipboardList,
  Eye,
  Home,
  ShowerHead,
  Users,
  X,
} from 'lucide-react'

const ADMIN_NAV = [
  { href: '/admin', label: 'ภาพรวมระบบ', icon: Activity },
  { href: '/admin/accounts', label: 'บัญชีผู้ใช้งาน', icon: Users },
  { href: '/admin/houses', label: 'ข้อมูลบ้าน', icon: Home },
  { href: '/admin/bathrooms', label: 'ข้อมูลห้องน้ำ', icon: ShowerHead },
  { href: '/admin/watchers', label: 'ผู้ติดตามห้องน้ำ', icon: Eye },
  { href: '/admin/audit-log', label: 'บันทึกการใช้งาน', icon: ClipboardList },
]

const USER_NAV = [
  { href: '/home', label: 'บ้านของฉัน', icon: Building2 },
  { href: '/home/alerts', label: 'ตั้งค่าการแจ้งเตือน', icon: Bell },
]

/**
 * @param {{ role: 'admin' | 'user', open?: boolean, onClose?: () => void }} props
 */
export default function Sidebar({ role, open = false, onClose }) {
  const pathname = usePathname()
  const navItems = role === 'admin' ? ADMIN_NAV : USER_NAV

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:h-dvh lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Main navigation"
      >
        <div className="flex h-full flex-col overflow-y-auto px-6 pb-8 pt-10">
          {/* Brand */}
          <div className="flex items-start justify-between px-3">
            <div>
              <Link
                href={role === 'admin' ? '/admin' : '/home'}
                className="font-brand text-3xl font-bold tracking-tight text-[#333333] no-underline"
              >
                FallWatch<span className="text-[#00b074]">.</span>
              </Link>
              <p className="mt-1.5 text-xs text-[#a3a3a3]">ระบบตรวจจับการล้มอัจฉริยะ</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-[#464255] hover:bg-[#f3f2f7] lg:hidden"
              aria-label="ปิดเมนู"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="mt-10 flex-1 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive =
                item.href === '/admin' || item.href === '/home'
                  ? pathname === item.href
                  : pathname.startsWith(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`relative flex h-12 items-center gap-4 rounded-lg px-4 text-sm transition-colors ${
                    isActive
                      ? 'bg-[#00b074]/15 font-bold text-[#00b074]'
                      : 'font-medium text-[#464255] hover:bg-[#f3f2f7]'
                  }`}
                >
                  {isActive && (
                    <span
                      className="absolute -left-6 top-1.5 bottom-1.5 w-1.5 rounded-r-md bg-[#00b074]"
                      aria-hidden="true"
                    />
                  )}
                  <Icon className="size-5 shrink-0 stroke-[1.75]" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Privacy badge card (adapted from Sedap promo card) */}
          <div className="mt-8 rounded-[14px] bg-[#00b074] p-5 text-white shadow-[0_14px_24px_-10px_rgba(0,176,116,0.45)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
              Wi-Fi CSI Privacy
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-white/95">
              ตรวจจับการล้มแบบเรียลไทม์ ไร้กล้อง ไร้สายรัดข้อมือ รักษาความเป็นส่วนตัว 100%
            </p>
          </div>

          {/* Credits */}
          <div className="mt-8 px-3 text-xs leading-relaxed text-[#a3a3a3]">
            <p className="font-semibold text-[#464255]/75">FallWatch Admin (C2)</p>
            <p>© 2569 Computer Engineering, RMUTT</p>
          </div>
        </div>
      </aside>
    </>
  )
}
