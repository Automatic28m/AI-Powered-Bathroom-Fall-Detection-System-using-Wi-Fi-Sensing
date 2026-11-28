// /admin/bathrooms — WA-9 to WA-12 (Wireframes.md §5)
import BathroomsManager from '@/components/bathrooms/BathroomsManager'
import { requirePageRole } from '@/lib/session'

export const metadata = { title: 'ข้อมูลห้องน้ำ — FallWatch.' }

export default async function BathroomsPage() {
  await requirePageRole('admin')
  return <BathroomsManager />
}
