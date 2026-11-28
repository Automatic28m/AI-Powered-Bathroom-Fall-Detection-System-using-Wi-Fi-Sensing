// zod schemas for /api/bathrooms (WA-9 to WA-12)
import { z } from 'zod'
import { hasAnyField, idSchema, searchSchema } from './common'

// Rx MAC is stored lowercase with colons (CONVENTIONS.md), e.g. a4:cf:12:3b:9e:01.
// Accepts "A4-CF-12-3B-9E-01", "a4cf.123b.9e01" or "A4CF123B9E01" too.
export const macSchema = z
  .string()
  .transform((s) =>
    s
      .trim()
      .toLowerCase()
      .replace(/[:\-.\s]/g, '')
  )
  .pipe(z.string().regex(/^[0-9a-f]{12}$/, 'Rx MAC ไม่ถูกต้อง (เช่น a4:cf:12:3b:9e:01)'))
  .transform((hex) => /** @type {string[]} */ (hex.match(/../g)).join(':'))

const nameSchema = z.string().trim().min(1, 'กรุณากรอกชื่อห้องน้ำ').max(120)

// When the baseline was recorded. Defaults to now; can't be in the future.
export const recordedAtSchema = z.coerce
  .date({ error: 'วันเวลาไม่ถูกต้อง' })
  .refine((d) => d.getTime() <= Date.now() + 5 * 60 * 1000, {
    message: 'วันเวลาที่บันทึกต้องไม่เป็นอนาคต',
  })
  .refine((d) => d.getUTCFullYear() >= 2020, { message: 'วันเวลาไม่ถูกต้อง' })
  .optional()

// WA-9: house, room name, Rx MAC (+ the baseline file, checked separately)
export const createBathroomSchema = z.object({
  houseId: idSchema,
  name: nameSchema,
  rxMac: macSchema,
  recordedAt: recordedAtSchema,
})

// WA-12: room name and Rx MAC. A new baseline goes to POST /api/bathrooms/:id/baseline.
// The house can't change: watchers must stay inside the bathroom's house.
export const updateBathroomSchema = z
  .object({ name: nameSchema.optional(), rxMac: macSchema.optional() })
  .refine(hasAnyField, { message: 'ไม่มีข้อมูลที่จะแก้ไข' })

export const baselineUploadSchema = z.object({ recordedAt: recordedAtSchema })

export const listBathroomsQuerySchema = z.object({
  houseId: idSchema.optional(),
  q: searchSchema,
})
