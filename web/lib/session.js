// Server-side session + role checks (Design.md §10: a role check on every route, on the server)

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { ApiError } from '@/lib/api'

/**
 * @typedef {object} CurrentUser
 * @property {number} id
 * @property {'admin' | 'user'} role
 * @property {string} username
 * @property {string} fullName
 * @property {string} email
 * @property {number | null} houseId
 */

/**
 * The logged-in, active account, or null.
 * @returns {Promise<CurrentUser | null>}
 */
export async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null
  const u = /** @type {any} */ (session.user)
  if (u.isActive === false) return null
  return {
    id: Number(u.id),
    role: u.role,
    username: u.username,
    fullName: u.fullName ?? u.name,
    email: u.email,
    houseId: u.houseId ?? null,
  }
}

/** Where each role lands after login. */
export const HOME_BY_ROLE = { admin: '/admin', user: '/home' }

/**
 * For pages and layouts: redirect unless logged in with the given role.
 * @param {'admin' | 'user'} role
 * @returns {Promise<CurrentUser>}
 */
export async function requirePageRole(role) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role !== role) redirect(HOME_BY_ROLE[user.role])
  return user
}

/**
 * For API route handlers: throw 401/403 unless logged in with the given role.
 * @param {'admin' | 'user'} role
 * @returns {Promise<CurrentUser>}
 */
export async function requireApiRole(role) {
  const user = await getCurrentUser()
  if (!user) throw new ApiError(401, 'UNAUTHORIZED', 'กรุณาเข้าสู่ระบบ')
  if (user.role !== role) throw new ApiError(403, 'FORBIDDEN', 'ไม่มีสิทธิ์เข้าถึง')
  return user
}
