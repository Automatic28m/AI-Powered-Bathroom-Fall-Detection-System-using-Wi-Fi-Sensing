// Browser-side fetch helper for our JSON API (CONVENTIONS.md §4 error shape)

/**
 * @typedef {{ code: string, message: string, fields?: any[] }} ApiErrorBody
 * @typedef {{ ok: true, data: any } | { ok: false, error: ApiErrorBody }} ApiResult
 */

const NETWORK_ERROR = { code: 'NETWORK', message: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่' }

/**
 * fetch() that never throws. A plain object body is sent as JSON; FormData is
 * sent as multipart.
 * @param {string} url
 * @param {{ method?: string, body?: object | FormData }} [options]
 * @returns {Promise<ApiResult>}
 */
export async function apiRequest(url, { method = 'GET', body } = {}) {
  /** @type {RequestInit} */
  const init = { method, cache: 'no-store' }
  if (body instanceof FormData) init.body = body
  else if (body !== undefined) {
    init.body = JSON.stringify(body)
    init.headers = { 'Content-Type': 'application/json' }
  }

  let res
  try {
    res = await fetch(url, init)
  } catch {
    return { ok: false, error: NETWORK_ERROR }
  }
  if (res.status === 204) return { ok: true, data: null }
  const json = await res.json().catch(() => null)
  if (res.ok) return { ok: true, data: json }
  return {
    ok: false,
    error: json?.error ?? { code: 'HTTP_' + res.status, message: 'เกิดข้อผิดพลาด กรุณาลองใหม่' },
  }
}

/**
 * VALIDATION_FAILED field errors as { fieldName: message }.
 * @param {ApiErrorBody} error
 * @returns {Record<string, string>}
 */
export function fieldErrorsOf(error) {
  if (error.code !== 'VALIDATION_FAILED') return {}
  return Object.fromEntries((error.fields ?? []).map((f) => [f.path || '_', f.message]))
}
