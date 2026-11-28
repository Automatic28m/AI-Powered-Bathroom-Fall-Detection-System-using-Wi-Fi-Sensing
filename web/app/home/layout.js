// User section: user accounts only, checked on the server
import AppShell from '@/components/AppShell'
import { requirePageRole } from '@/lib/session'

/**
 * @param {{ children: React.ReactNode }} props
 */
export default async function UserLayout({ children }) {
  const user = await requirePageRole('user')
  return (
    <AppShell role="user" userName={user.fullName}>
      {children}
    </AppShell>
  )
}
