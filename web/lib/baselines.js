// Baseline file upload (WA-9, WA-12, Design.md §5.2 and §7)
//
// Files live at DATA_DIR/baselines/<bathroom_id>/<timestamp>.npy.
// baselines.file_path stores the path RELATIVE to DATA_DIR with forward slashes
// (e.g. "baselines/3/20261128T074205123Z.npy"), so the web and ai-service
// containers each join it with their own DATA_DIR.

import { mkdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { ApiError } from '@/lib/api'
import { writeAudit } from '@/lib/audit'

export const MAX_BASELINE_BYTES = 20 * 1024 * 1024 // 20 MB

// Every .npy file starts with the bytes \x93 N U M P Y
const NPY_MAGIC = Buffer.from([0x93, 0x4e, 0x55, 0x4d, 0x50, 0x59])

/** Absolute DATA_DIR. Local dev on Windows should set DATA_DIR="./data". */
export function dataDir() {
  return path.resolve(process.env.DATA_DIR || './data')
}

/**
 * Check an uploaded baseline and return its bytes, or throw 400/413.
 * @param {FormDataEntryValue | null} entry  form.get('baseline')
 */
export async function readBaselineFile(entry) {
  if (!entry || typeof entry === 'string' || entry.size === 0) {
    throw new ApiError(400, 'BASELINE_REQUIRED', 'กรุณาเลือกไฟล์ baseline (.npy)')
  }
  if (!entry.name.toLowerCase().endsWith('.npy')) {
    throw new ApiError(400, 'BASELINE_INVALID', 'ไฟล์ baseline ต้องเป็นไฟล์ .npy')
  }
  if (entry.size > MAX_BASELINE_BYTES) {
    throw new ApiError(413, 'BASELINE_TOO_LARGE', 'ไฟล์ baseline ต้องมีขนาดไม่เกิน 20 MB')
  }
  const bytes = Buffer.from(await entry.arrayBuffer())
  if (!bytes.subarray(0, NPY_MAGIC.length).equals(NPY_MAGIC)) {
    throw new ApiError(400, 'BASELINE_INVALID', 'ไฟล์นี้ไม่ใช่ไฟล์ NumPy (.npy) ที่ถูกต้อง')
  }
  return bytes
}

/**
 * Write the file and make it the bathroom's current baseline. Call it inside the
 * transaction of the change; the absolute path is pushed to `written`, and the
 * caller passes `written` to removeFiles() if the transaction fails.
 *
 * In one transaction: old baseline is_current = false, the new row, the bathroom's
 * last_calibrated_at, NOTIFY baseline_changed (sent on commit) and the audit row.
 *
 * @param {import('@prisma/client').Prisma.TransactionClient} tx
 * @param {{
 *   bathroom: { id: number, name: string },
 *   bytes: Buffer,
 *   recordedAt: Date,
 *   actor: { id: number, username: string },
 *   written: string[],
 * }} args
 */
export async function saveBaseline(tx, { bathroom, bytes, recordedAt, actor, written }) {
  const stamp = new Date().toISOString().replace(/[-:.]/g, '')
  const relPath = `baselines/${bathroom.id}/${stamp}.npy`
  const absPath = path.join(dataDir(), ...relPath.split('/'))

  await mkdir(path.dirname(absPath), { recursive: true })
  await writeFile(absPath, bytes, { flag: 'wx' }) // never overwrite an old baseline
  written.push(absPath)

  // The partial unique index allows only one current baseline per bathroom
  await tx.baseline.updateMany({
    where: { bathroomId: bathroom.id, isCurrent: true },
    data: { isCurrent: false },
  })
  const baseline = await tx.baseline.create({
    data: {
      bathroomId: bathroom.id,
      filePath: relPath,
      recordedAt,
      uploadedById: actor.id,
      isCurrent: true,
    },
  })
  await tx.bathroom.update({
    where: { id: bathroom.id },
    data: { lastCalibratedAt: recordedAt },
  })
  // ai-service reloads its cached baseline (Design.md §4). Postgres sends it on commit.
  await tx.$executeRaw`SELECT pg_notify('baseline_changed', ${String(bathroom.id)})`
  await writeAudit(tx, actor, 'create', 'baseline', baseline.id, {
    bathroomId: bathroom.id,
    bathroomName: bathroom.name,
    filePath: relPath,
    recordedAt: recordedAt.toISOString(),
    sizeBytes: bytes.length,
  })
  return baseline
}

/**
 * Remove files written by a transaction that failed. Never throws.
 * @param {string[]} absPaths
 */
export async function removeFiles(absPaths) {
  await Promise.all(absPaths.map((p) => unlink(p).catch(() => {})))
}
