// /admin/houses — WA-6 to WA-8 (Wireframes.md §4)
import HousesManager from '@/components/houses/HousesManager'
import { requirePageRole } from '@/lib/session'

export const metadata = { title: 'ข้อมูลบ้าน — FallWatch.' }

export default async function HousesPage() {
  await requirePageRole('admin')
  return <HousesManager />
}
