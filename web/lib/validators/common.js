// zod pieces shared by several validators
import { z } from 'zod'

/** A positive integer id, from JSON or from a query/form string. */
export const idSchema = z.coerce
  .number({ error: 'ต้องเป็นตัวเลข' })
  .int('ต้องเป็นตัวเลข')
  .positive('ต้องเป็นตัวเลข')

/** Optional free-text search box (?q=). */
export const searchSchema = z.string().trim().max(100).optional()

/**
 * An optional update object must change at least one field.
 * @param {Record<string, unknown>} obj
 */
export const hasAnyField = (obj) => Object.values(obj).some((v) => v !== undefined)
