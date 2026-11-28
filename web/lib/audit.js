// Audit log helper (Design.md §5.2, WA-17)
// Call it inside the same prisma.$transaction as the change it records.

/**
 * @typedef {import('@prisma/client').Prisma.TransactionClient} Tx
 * @typedef {'create' | 'update' | 'delete'} AuditAction
 */

/**
 * Write one audit_logs row.
 * `details.actorUsername` is always stored, so the log stays readable after the
 * actor's account is deleted (actor_id becomes NULL).
 *
 * @param {Tx} tx
 * @param {{ id: number, username: string }} actor
 * @param {AuditAction} action
 * @param {string} entityType   e.g. "account", "house", "bathroom"
 * @param {number | string} entityId
 * @param {Record<string, unknown>} [details]  never include passwords
 */
export function writeAudit(tx, actor, action, entityType, entityId, details = {}) {
  return tx.auditLog.create({
    data: {
      actorId: actor.id,
      action,
      entityType,
      entityId: String(entityId),
      details: { actorUsername: actor.username, ...details },
    },
  })
}

/**
 * The fields that changed, as { field: { from, to } }, for an update's audit details.
 * Only keys present in `input` are compared. Dates are compared by time.
 *
 * @param {Record<string, unknown>} before  the row before the update
 * @param {Record<string, unknown>} input   the validated update input
 * @returns {Record<string, { from: unknown, to: unknown }>}
 */
export function changesOf(before, input) {
  /** @type {Record<string, { from: unknown, to: unknown }>} */
  const changes = {}
  for (const [key, to] of Object.entries(input)) {
    if (to === undefined) continue
    const from = before[key]
    const same =
      from instanceof Date && to instanceof Date ? from.getTime() === to.getTime() : from === to
    if (!same) changes[key] = { from: from ?? null, to: to ?? null }
  }
  return changes
}
