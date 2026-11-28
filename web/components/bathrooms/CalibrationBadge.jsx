// Calibration status badge (WA-11)
import { formatDate } from '@/lib/format'

const STYLES = {
  ok: { label: 'ปกติ', className: 'bg-[#00b074]/15 text-[#009663]' },
  due: { label: 'ควรปรับเทียบใหม่', className: 'bg-[#f7c604]/20 text-[#a68500]' },
  never: { label: 'ยังไม่ได้ปรับเทียบ', className: 'bg-[#d0d6de]/40 text-[#5e6c93]' },
}

/**
 * @param {{ calibration: import('@/lib/bathrooms').Calibration, showDue?: boolean }} props
 */
export default function CalibrationBadge({ calibration, showDue = false }) {
  const style = STYLES[calibration.status]
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <span
        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${style.className}`}
      >
        {calibration.status === 'due' && <span aria-hidden="true">⚠️&nbsp;</span>}
        {style.label}
      </span>
      {showDue && calibration.dueAt && (
        <span className="text-xs text-[#a3a3a3]">
          {calibration.status === 'due' ? 'ครบกำหนดเมื่อ' : 'ครบกำหนด'}{' '}
          {formatDate(calibration.dueAt)}
        </span>
      )}
    </span>
  )
}
