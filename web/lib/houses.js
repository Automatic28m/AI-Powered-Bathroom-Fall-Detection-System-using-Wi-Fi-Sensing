// Shared house shapes for /api/houses and the houses page

/** Fields the houses table shows (WA-7) */
export const HOUSE_LIST_SELECT = {
  id: true,
  name: true,
  address: true,
  createdAt: true,
  _count: { select: { bathrooms: true, accounts: { where: { role: 'user' } } } },
}

/**
 * @typedef {object} HouseItem
 * @property {number} id
 * @property {string} name
 * @property {string} address
 * @property {Date | string} createdAt
 * @property {number} bathroomCount
 * @property {number} userCount  user accounts linked to this house (WA-13)
 */

/**
 * @param {any} row  a row selected with HOUSE_LIST_SELECT
 * @returns {HouseItem}
 */
export function toHouseItem(row) {
  const { _count, ...rest } = row
  return { ...rest, bathroomCount: _count.bathrooms, userCount: _count.accounts }
}
