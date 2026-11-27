// Admin section layout using Sedap AppShell
import AppShell from '@/components/AppShell'

/**
 * @param {{ children: React.ReactNode }} props
 */
export default function AdminLayout({ children }) {
  // TODO(phonlakrit): verify admin session on the server before rendering
  return (
    <AppShell role="admin" userName="Admin">
      {children}
    </AppShell>
  )
}
