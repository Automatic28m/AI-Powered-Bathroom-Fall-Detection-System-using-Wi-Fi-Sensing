// zod schemas for /api/watchers (WA-13 to WA-15)
import { z } from 'zod'
import { idSchema, searchSchema } from './common'

// Set a user's house (WA-13) and the full list of bathrooms they watch (WA-14, WA-15).
// Bathrooms left out of the list stop being watched.
export const setWatchersSchema = z
  .object({
    accountId: idSchema,
    houseId: idSchema.nullable(),
    bathroomIds: z
      .array(idSchema)
      .max(50)
      .transform((ids) => [...new Set(ids)]),
  })
  .refine((v) => v.houseId !== null || v.bathroomIds.length === 0, {
    message: 'ต้องเลือกบ้านก่อนเลือกห้องน้ำ',
    path: ['houseId'],
  })

// WA-15: remove one user-bathroom pairing
export const deleteWatcherQuerySchema = z.object({ accountId: idSchema, bathroomId: idSchema })

export const listWatchersQuerySchema = z.object({
  houseId: idSchema.optional(),
  q: searchSchema,
})
