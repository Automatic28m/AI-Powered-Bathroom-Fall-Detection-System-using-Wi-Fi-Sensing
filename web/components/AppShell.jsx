'use client'

// Shared Sedap AppShell (Sidebar + Topbar + Main Canvas)
import { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

/**
 * @param {{ role: 'admin' | 'user', userName?: string, children: React.ReactNode }} props
 */
export default function AppShell({ role, userName, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-dvh bg-[#f3f2f7] lg:grid lg:grid-cols-[18rem_1fr]">
      <Sidebar role={role} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="min-w-0 px-4 pb-10 pt-6 sm:px-6 lg:px-10 lg:pt-8">
        <Topbar
          userName={userName}
          roleLabel={role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งาน'}
          onMenuOpen={() => setSidebarOpen(true)}
        />
        <main>{children}</main>
      </div>
    </div>
  )
}
