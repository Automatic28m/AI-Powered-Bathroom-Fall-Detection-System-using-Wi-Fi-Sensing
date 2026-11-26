// Root page — redirect to login if not signed in, or to the right dashboard
import { redirect } from 'next/navigation'

export default function RootPage() {
  // TODO: check session with Better Auth and redirect accordingly
  // Admin  → /admin
  // User   → /home
  // No session → /login
  redirect('/login')
}
