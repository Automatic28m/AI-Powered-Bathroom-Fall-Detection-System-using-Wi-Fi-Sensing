// Shared bathroom shapes + calibration status (WA-10, WA-11)
import { db } from '@/lib/db'

export const DEFAULT_RECALIBRATION_MONTHS = 6

/** Fields the bathrooms table shows (WA-10) */
export const BATHROOM_LIST_SELECT = {
  id: true,
  name: true,
  rxMac: true,
  lastCalibratedAt: true,
  createdAt: true,
  house: { select: { id: true, name: true } },
  baselines: {
    where: { isCurrent: true },
    select: { id: true, recordedAt: true, createdAt: true },
    take: 1,
  },
  _count: { select: { watchers: true } },
}

/**
 * settings.recalibration_months (Design.md §5.2), or the default of 6.
 * @param {Pick<import('@prisma/client').PrismaClient, 'setting'>} [client]
 */
export async function getRecalibrationMonths(client = db) {
  const row = await client.setting.findUnique({ where: { key: 'recalibration_months' } })
  const months = Number(row?.value)
  return Number.isInteger(months) && months > 0 ? months : DEFAULT_RECALIBRATION_MONTHS
}

/**
 * @typedef {object} Calibration
 * @property {'never' | 'ok' | 'due'} status  never = no baseline uploaded yet
 * @property {string | null} dueAt  when "needs recalibration" starts (ISO)
 */

/**
 * WA-11: "needs recalibration" once `months` have passed since the last calibration.
 * Not stored; worked out on every read.
 * @param {Date | null} lastCalibratedAt
 * @param {number} months
 * @param {Date} [now]
 * @returns {Calibration}
 */
export function calibrationOf(lastCalibratedAt, months, now = new Date()) {
  if (!lastCalibratedAt) return { status: 'never', dueAt: null }
  const due = new Date(lastCalibratedAt)
  due.setUTCMonth(due.getUTCMonth() + months)
  return { status: now >= due ? 'due' : 'ok', dueAt: due.toISOString() }
}

/**
 * @typedef {object} BathroomItem
 * @property {number} id
 * @property {string} name
 * @property {string} rxMac
 * @property {Date | string | null} lastCalibratedAt
 * @property {Date | string} createdAt
 * @property {{ id: number, name: string }} house
 * @property {{ id: number, recordedAt: Date | string, createdAt: Date | string } | null} currentBaseline
 * @property {number} watcherCount
 * @property {Calibration} calibration
 */

/**
 * @param {any} row  a row selected with BATHROOM_LIST_SELECT
 * @param {number} months  from getRecalibrationMonths()
 * @returns {BathroomItem}
 */
export function toBathroomItem(row, months) {
  const { _count, baselines, ...rest } = row
  return {
    ...rest,
    currentBaseline: baselines[0] ?? null,
    watcherCount: _count.watchers,
    calibration: calibrationOf(row.lastCalibratedAt, months),
  }
}
