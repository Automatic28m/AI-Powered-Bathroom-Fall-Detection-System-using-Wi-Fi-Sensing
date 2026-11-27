// Admin dashboard stub — WA-16, adapted to Sedap card & stat layout
// TODO(phonlakrit): wire real Prisma queries, Recharts, and SSE (W8–W10)

import { AlertTriangle, Building2, Home, ShowerHead } from 'lucide-react'

const STATS = [
  {
    label: 'เหตุการณ์ล้มวันนี้',
    value: '0',
    icon: AlertTriangle,
    tone: 'bg-[#ff5b5b]/15 text-[#ff5b5b]',
  },
  { label: 'บ้านทั้งหมด', value: '0', icon: Home, tone: 'bg-[#00b074]/15 text-[#00b074]' },
  { label: 'ห้องน้ำทั้งหมด', value: '0', icon: ShowerHead, tone: 'bg-[#2d9cdb]/15 text-[#2d9cdb]' },
  { label: 'ควรปรับเทียบใหม่', value: '0', icon: Building2, tone: 'bg-[#f7c604]/15 text-[#d6ab00]' },
]

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#464255] sm:text-[2rem]">ภาพรวมระบบ</h1>
        <p className="mt-1 text-sm text-[#a3a3a3]">ติดตามเหตุการณ์การล้มแบบเรียลไทม์และสถานะอุปกรณ์ทุกบ้าน</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="sedap-card flex items-center gap-5">
              <span
                className={`flex size-16 shrink-0 items-center justify-center rounded-full ${stat.tone}`}
              >
                <Icon className="size-7" />
              </span>
              <div>
                <p className="text-3xl font-bold leading-none text-[#464255]">{stat.value}</p>
                <p className="mt-2 text-sm text-[#464255]">{stat.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Latest falls placeholder */}
      <div className="sedap-card">
        <h2 className="text-lg font-bold text-[#464255]">เหตุการณ์การล้มล่าสุด (ทุกบ้าน)</h2>
        <p className="mt-2 text-sm text-[#a3a3a3]">
          ยังไม่มีข้อมูล ส่วนนี้จะแสดงเหตุการณ์ล่าสุดอย่างน้อย 10 รายการ กราฟย้อนหลัง 7 วัน และภาพ DAPD Heatmap
        </p>
      </div>
    </div>
  )
}
