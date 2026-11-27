// /admin/accounts — WA-1 to WA-5 (Wireframes.md §3)
import AccountsManager from '@/components/accounts/AccountsManager'
import { requirePageRole } from '@/lib/session'

export const metadata = { title: 'บัญชีผู้ใช้งาน — FallWatch.' }

export default async function AccountsPage() {
  const user = await requirePageRole('admin')
  return <AccountsManager currentUserId={user.id} />
}
