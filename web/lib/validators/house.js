// zod schemas for /api/houses (WA-6 to WA-8)
import { z } from 'zod'
import { hasAnyField, searchSchema } from './common'

const houseFields = {
  name: z.string().trim().min(1, 'กรุณากรอกชื่อบ้าน').max(120),
  address: z.string().trim().min(1, 'กรุณากรอกที่อยู่').max(300),
}

// WA-6: name + address. "Date added" is created_at, set by the database.
export const createHouseSchema = z.object(houseFields)

// WA-8: change the name, the address or both
export const updateHouseSchema = z
  .object(houseFields)
  .partial()
  .refine(hasAnyField, { message: 'ไม่มีข้อมูลที่จะแก้ไข' })

export const listHousesQuerySchema = z.object({ q: searchSchema })
