'use client'

// /admin/accounts: list (WA-4), add admin/user (WA-1, WA-3), on/off (WA-5), delete admin (WA-2)
import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Search, Trash2 } from 'lucide-react'
import ConfirmDialog from '@/components/ConfirmDialog'
import { formatDate } from '@/lib/format'
import AccountFormModal from './AccountFormModal'

const PAGE_SIZE = 20

const ROLE_BADGE = {
  admin: { label: 'ผู้ดูแลระบบ', className: 'bg-[#2d9cdb]/15 text-[#2d9cdb]' },
  user: { label: 'ผู้ใช้งาน', className: 'bg-[#00b074]/15 text-[#009663]' },
}

/**
 * @typedef {import('@/lib/accounts').AccountItem} AccountItem
 * @typedef {{ kind: 'delete' | 'disable', account: AccountItem } | null} PendingAction
 */

/** @param {{ currentUserId: number }} props */
export default function AccountsManager({ currentUserId }) {
  const [role, setRole] = useState('')
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  /** @type {[{ items: AccountItem[], total: number }, Function]} */
  const [data, setData] = useState({ items: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  /** @type {['admin' | 'user' | null, Function]} */
  const [formRole, setFormRole] = useState(null)
  /** @type {[PendingAction, Function]} */
  const [pendingAction, setPendingAction] = useState(null)
  const [actionBusy, setActionBusy] = useState(false)
  const [actionError, setActionError] = useState('')
  const [toggling, setToggling] = useState(/** @type {number | null} */ (null))
  const [notice, setNotice] = useState('')

  // Wait for typing to pause before searching
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(query.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
    if (role) params.set('role', role)
    if (search) params.set('q', search)
    const res = await fetch(`/api/accounts?${params}`, { cache: 'no-store' })
    if (res.ok) setData(await res.json())
    else setLoadError('โหลดรายชื่อบัญชีไม่สำเร็จ')
    setLoading(false)
  }, [page, role, search])

  useEffect(() => {
    load()
  }, [load])

  /** @param {string} message */
  function flash(message) {
    setNotice(message)
    setTimeout(() => setNotice(''), 3000)
  }

  /** @param {AccountItem} account @param {boolean} isActive */
  async function setActive(account, isActive) {
    setToggling(account.id)
    const res = await fetch(`/api/accounts/${account.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive }),
    })
    setToggling(null)
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: {} }))
      return error?.message ?? 'บันทึกไม่สำเร็จ'
    }
    const updated = await res.json()
    setData((d) => ({ ...d, items: d.items.map((a) => (a.id === updated.id ? updated : a)) }))
    flash(isActive ? `เปิดใช้งานบัญชี ${account.username} แล้ว` : `ปิดใช้งานบัญชี ${account.username} แล้ว`)
    return ''
  }

  async function confirmAction() {
    if (!pendingAction) return
    const { kind, account } = pendingAction
    setActionBusy(true)
    setActionError('')
    let error = ''
    if (kind === 'disable') {
      error = await setActive(account, false)
    } else {
      const res = await fetch(`/api/accounts/${account.id}`, { method: 'DELETE' })
      if (res.ok) {
        flash(`ลบบัญชี ${account.username} แล้ว`)
        await load()
      } else {
        const body = await res.json().catch(() => ({ error: {} }))
        error = body.error?.message ?? 'ลบไม่สำเร็จ'
      }
    }
    setActionBusy(false)
    if (error) setActionError(error)
    else setPendingAction(null)
  }

  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#464255] sm:text-[2rem]">จัดการบัญชีผู้ใช้งาน</h1>
          <p className="mt-1 text-sm text-[#a3a3a3]">เพิ่มบัญชีผู้ดูแลระบบและผู้ใช้งาน เปิดหรือปิดการใช้งานบัญชี</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="sedap-btn-outline h-12"
            onClick={() => setFormRole('admin')}
          >
            <Plus className="size-4" /> เพิ่ม Admin
          </button>
          <button type="button" className="sedap-btn-primary" onClick={() => setFormRole('user')}>
            <Plus className="size-4" /> เพิ่ม User
          </button>
        </div>
      </div>

      {notice && (
        <p
          role="status"
          className="rounded-[14px] bg-[#00b074]/15 px-4 py-3 text-sm font-medium text-[#009663]"
        >
          {notice}
        </p>
      )}

      <div className="sedap-card p-0">
        {/* Filters */}
        <div className="flex flex-col gap-3 border-b border-[#ebebeb] p-4 sm:flex-row sm:items-center sm:p-6">
          <div className="relative flex-1">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาชื่อผู้ใช้ / ชื่อ / อีเมล..."
              className="sedap-input pr-11"
              aria-label="ค้นหาบัญชี"
            />
            <Search className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-[#a3a3a3]" />
          </div>
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value)
              setPage(1)
            }}
            className="sedap-input sm:w-48"
            aria-label="กรองตามบทบาท"
          >
            <option value="">ทุกบทบาท</option>
            <option value="admin">ผู้ดูแลระบบ</option>
            <option value="user">ผู้ใช้งาน</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="bg-[#f3f2f7]/60 text-xs font-semibold uppercase text-[#464255]">
              <tr>
                <th className="px-6 py-3">ชื่อผู้ใช้</th>
                <th className="px-4 py-3">อีเมล</th>
                <th className="px-4 py-3">บทบาท</th>
                <th className="px-4 py-3">บ้านที่ผูก</th>
                <th className="px-4 py-3 text-center">ห้องที่ติดตาม</th>
                <th className="px-4 py-3">วันที่เพิ่ม</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-6 py-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebebeb]">
              {loading && data.items.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-[#a3a3a3]">
                    กำลังโหลด…
                  </td>
                </tr>
              )}
              {loadError && (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-[#e64545]">
                    {loadError}
                  </td>
                </tr>
              )}
              {!loading && !loadError && data.items.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-[#a3a3a3]">
                    ไม่พบบัญชีที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              )}
              {data.items.map((a) => {
                const isSelf = a.id === currentUserId
                const badge = ROLE_BADGE[a.role]
                return (
                  <tr key={a.id} className="hover:bg-[#f3f2f7]/50">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-[#464255]">
                        {a.username}
                        {isSelf && (
                          <span className="ml-2 text-xs font-normal text-[#a3a3a3]">(คุณ)</span>
                        )}
                      </p>
                      <p className="text-xs text-[#a3a3a3]">{a.fullName}</p>
                    </td>
                    <td className="px-4 py-4 text-[#333333]">{a.email}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[#333333]">
                      {a.role === 'user' ? (a.house?.name ?? '—') : '—'}
                    </td>
                    <td className="px-4 py-4 text-center text-[#333333]">
                      {a.role === 'user' ? a.watchedCount : '—'}
                    </td>
                    <td className="px-4 py-4 text-[#a3a3a3]">{formatDate(a.createdAt)}</td>
                    <td className="px-4 py-4">
                      {a.role === 'user' ? (
                        <button
                          type="button"
                          role="switch"
                          aria-checked={a.isActive}
                          aria-label={`${a.isActive ? 'ปิด' : 'เปิด'}การใช้งานบัญชี ${a.username}`}
                          disabled={toggling === a.id}
                          onClick={() =>
                            a.isActive
                              ? (setActionError(''),
                                setPendingAction({ kind: 'disable', account: a }))
                              : setActive(a, true)
                          }
                          className="flex items-center gap-2 disabled:opacity-50"
                        >
                          <span
                            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
                              a.isActive ? 'bg-[#00b074]' : 'bg-[#d0d6de]'
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform ${
                                a.isActive ? 'translate-x-[22px]' : 'translate-x-0.5'
                              }`}
                            />
                          </span>
                          <span
                            className={`text-xs font-semibold ${a.isActive ? 'text-[#009663]' : 'text-[#5e6c93]'}`}
                          >
                            {a.isActive ? 'เปิด' : 'ปิด'}
                          </span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-[#00b074]/15 px-3 py-1 text-xs font-semibold text-[#009663]">
                          ใช้งาน
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {/* WA-2: only other admins can be deleted. No button on your own row. */}
                      {a.role === 'admin' && !isSelf && (
                        <button
                          type="button"
                          onClick={() => {
                            setActionError('')
                            setPendingAction({ kind: 'delete', account: a })
                          }}
                          className="inline-flex size-9 items-center justify-center rounded-[10px] text-[#ff5b5b] transition-colors hover:bg-[#ff5b5b]/15"
                          aria-label={`ลบบัญชี ${a.username}`}
                          title="ลบบัญชี"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between gap-4 border-t border-[#ebebeb] px-4 py-4 text-sm text-[#a3a3a3] sm:px-6">
          <span>ทั้งหมด {data.total} บัญชี</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="sedap-btn-outline h-9 px-3 disabled:opacity-40"
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1 || loading}
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
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages || loading}
              aria-label="หน้าถัดไป"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <AccountFormModal
        role={formRole}
        onClose={() => setFormRole(null)}
        onCreated={(account) => {
          flash(`เพิ่มบัญชี ${account.username} แล้ว`)
          load()
        }}
      />

      <ConfirmDialog
        open={pendingAction !== null}
        title={pendingAction?.kind === 'delete' ? 'ลบบัญชีผู้ดูแลระบบ' : 'ปิดการใช้งานบัญชี'}
        message={
          pendingAction?.kind === 'delete' ? (
            <>
              ต้องการลบบัญชี <b>{pendingAction.account.username}</b> ใช่หรือไม่?
              <br />
              ประวัติการใช้งานของบัญชีนี้จะยังอยู่ในบันทึกการใช้งาน
            </>
          ) : (
            <>
              ต้องการปิดการใช้งานบัญชี <b>{pendingAction?.account.username}</b> ใช่หรือไม่?
              <br />
              ผู้ใช้จะถูกออกจากระบบทันที และเข้าสู่ระบบไม่ได้จนกว่าจะเปิดใช้งานอีกครั้ง
            </>
          )
        }
        confirmLabel={pendingAction?.kind === 'delete' ? 'ลบบัญชี' : 'ปิดการใช้งาน'}
        destructive
        pending={actionBusy}
        error={actionError}
        onConfirm={confirmAction}
        onClose={() => setPendingAction(null)}
      />
    </div>
  )
}
