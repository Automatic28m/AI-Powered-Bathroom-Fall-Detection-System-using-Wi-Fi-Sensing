// Root page: send each role to its own dashboard, or to /login
import { redirect } from 'next/navigation'
import { getCurrentUser, HOME_BY_ROLE } from '@/lib/session'

export default async function RootPage() {
  const user = await getCurrentUser()
  redirect(user ? HOME_BY_ROLE[user.role] : '/login')
}
