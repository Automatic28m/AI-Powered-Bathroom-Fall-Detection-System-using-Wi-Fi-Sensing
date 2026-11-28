// Shared account shapes for /api/accounts and the accounts page

/** Fields the accounts table shows. Never select password data. */
export const ACCOUNT_LIST_SELECT = {
  id: true,
  role: true,
  username: true,
  email: true,
  fullName: true,
  phone: true,
  address: true,
  isActive: true,
  createdAt: true,
  house: { select: { id: true, name: true } },
  _count: { select: { watchedBathrooms: true } },
}

/**
 * @typedef {object} AccountItem
 * @property {number} id
 * @property {'admin' | 'user'} role
 * @property {string} username
 * @property {string} email
 * @property {string} fullName
 * @property {string} phone
 * @property {string | null} address
 * @property {boolean} isActive
 * @property {Date | string} createdAt
 * @property {{ id: number, name: string } | null} house
 * @property {number} watchedCount  number of bathrooms watched (WA-4)
 */

/**
 * @param {any} row  a row selected with ACCOUNT_LIST_SELECT
 * @returns {AccountItem}
 */
export function toAccountItem(row) {
  const { _count, ...rest } = row
  return { ...rest, watchedCount: _count.watchedBathrooms }
}
