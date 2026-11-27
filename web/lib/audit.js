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
