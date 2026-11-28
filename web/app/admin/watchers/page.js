// /admin/watchers — WA-13 to WA-15 (Wireframes.md §6)
import WatchersManager from '@/components/watchers/WatchersManager'
import { requirePageRole } from '@/lib/session'

export const metadata = { title: 'ผู้ติดตามห้องน้ำ — FallWatch.' }

export default async function WatchersPage() {
  await requirePageRole('admin')
  return <WatchersManager />
}
