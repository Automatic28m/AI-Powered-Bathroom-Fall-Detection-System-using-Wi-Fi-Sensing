// User section layout using Sedap AppShell
import AppShell from '@/components/AppShell'

/**
 * @param {{ children: React.ReactNode }} props
 */
export default function UserLayout({ children }) {
  // TODO(phonlakrit): verify user session on the server before rendering
  return (
    <AppShell role="user" userName="ผู้ดูแล">
      {children}
    </AppShell>
  )
}
