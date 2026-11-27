// Admin section: admins only, checked on the server
import AppShell from '@/components/AppShell'
import { requirePageRole } from '@/lib/session'

/**
 * @param {{ children: React.ReactNode }} props
 */
export default async function AdminLayout({ children }) {
  const user = await requirePageRole('admin')
  return (
    <AppShell role="admin" userName={user.fullName}>
      {children}
    </AppShell>
  )
}
