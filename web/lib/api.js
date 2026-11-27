// JSON response helpers for route handlers (CONVENTIONS.md §4 "API route rules")
// Errors always look like: { "error": { "code": "NOT_FOUND", "message": "..." } }

import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'

export class ApiError extends Error {
  /**
   * @param {number} status   HTTP status
   * @param {string} code     machine-readable code, e.g. "FORBIDDEN"
   * @param {string} message  human-readable message (Thai is fine, shown in the UI)
   */
  constructor(status, code, message) {
    super(message)
    this.status = status
    this.code = code
  }
}

/**
 * @param {number} status
 * @param {string} code
 * @param {string} message
 * @param {object} [extra]
 */
export function errorResponse(status, code, message, extra) {
  return NextResponse.json({ error: { code, message, ...extra } }, { status })
}

/**
 * Wrap a route handler so thrown errors become the standard JSON error shape.
 * @template {(...args: any[]) => Promise<Response>} T
 * @param {T} handler
 * @returns {T}
 */
export function withApi(handler) {
  // @ts-ignore
  return async (...args) => {
    try {
      return await handler(...args)
    } catch (err) {
      if (err instanceof ApiError) return errorResponse(err.status, err.code, err.message)
      if (err instanceof ZodError) {
        return errorResponse(400, 'VALIDATION_FAILED', 'ข้อมูลไม่ถูกต้อง', {
          fields: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
        })
      }
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
          const target = /** @type {string[] | undefined} */ (err.meta?.target) ?? []
          return errorResponse(409, 'CONFLICT', 'ข้อมูลนี้มีอยู่ในระบบแล้ว', { fields: target })
        }
        if (err.code === 'P2025') return errorResponse(404, 'NOT_FOUND', 'ไม่พบข้อมูล')
      }
      console.error(err)
      return errorResponse(500, 'INTERNAL', 'เกิดข้อผิดพลาดในระบบ')
    }
  }
}

/**
 * Parse ?page=&pageSize= (CONVENTIONS.md §4: lists use page + pageSize).
 * @param {URLSearchParams} params
 */
export function parsePaging(params) {
  const page = Math.max(1, Number.parseInt(params.get('page') ?? '1', 10) || 1)
  const pageSize = Math.min(
    100,
    Math.max(1, Number.parseInt(params.get('pageSize') ?? '20', 10) || 20)
  )
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize }
}

/**
 * Parse a numeric route id, or throw 404.
 * @param {string} raw
 */
export function parseId(raw) {
  const id = Number(raw)
  if (!Number.isInteger(id) || id <= 0) throw new ApiError(404, 'NOT_FOUND', 'ไม่พบข้อมูล')
  return id
}
