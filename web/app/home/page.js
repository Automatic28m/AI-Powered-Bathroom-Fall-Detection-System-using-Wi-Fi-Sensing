// User home stub — WU-2, adapted to Sedap card layout
// TODO(phonlakrit): wire real house data, latest falls, and SSE (W9–W10)

import { ShowerHead, Users } from 'lucide-react'

export default function UserHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#464255] sm:text-[2rem]">บ้านของฉัน</h1>
        <p className="mt-1 text-sm text-[#a3a3a3]">ภาพรวมห้องน้ำที่ติดตามและเหตุการณ์การล้มล่าสุด</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="sedap-card flex items-center gap-5">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[#00b074]/15 text-[#00b074]">
            <ShowerHead className="size-7" />
          </span>
          <div>
            <p className="text-3xl font-bold leading-none text-[#464255]">0</p>
            <p className="mt-2 text-sm text-[#464255]">ห้องน้ำที่ติดตาม</p>
          </div>
        </div>

        <div className="sedap-card flex items-center gap-5">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[#2d9cdb]/15 text-[#2d9cdb]">
            <Users className="size-7" />
          </span>
          <div>
            <p className="text-3xl font-bold leading-none text-[#464255]">0</p>
            <p className="mt-2 text-sm text-[#464255]">ญาติในบ้านเดียวกัน</p>
          </div>
        </div>
      </div>

      <div className="sedap-card">
        <h2 className="text-lg font-bold text-[#464255]">เหตุการณ์การล้มล่าสุด (อย่างน้อย 10 รายการ)</h2>
        <p className="mt-2 text-sm text-[#a3a3a3]">
          ยังไม่มีข้อมูล ส่วนนี้จะแสดงประวัติเหตุการณ์การล้มในบ้านของคุณ พร้อมภาพ DAPD Heatmap
        </p>
      </div>
    </div>
  )
}
