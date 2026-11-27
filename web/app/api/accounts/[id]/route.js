// /api/accounts/:id: PATCH turn a user on/off (WA-5), DELETE another admin (WA-2). Admin only.
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ACCOUNT_LIST_SELECT, toAccountItem } from '@/lib/accounts'
import { ApiError, parseId, withApi } from '@/lib/api'
import { writeAudit } from '@/lib/audit'
import { requireApiRole } from '@/lib/session'
import { updateAccountSchema } from '@/lib/validators/account'

/** @param {number} id */
async function findTarget(id) {
  const target = await db.account.findUnique({
    where: { id },
    select: { id: true, role: true, username: true, isActive: true },
  })
  if (!target) throw new ApiError(404, 'NOT_FOUND', 'ไม่พบบัญชีนี้')
  return target
}

export const PATCH = withApi(async (request, { params }) => {
  const actor = await requireApiRole('admin')
  const id = parseId((await params).id)
  const { isActive } = updateAccountSchema.parse(await request.json())
  const target = await findTarget(id)

  // WA-5 covers user accounts only
  if (target.role !== 'user') {
    throw new ApiError(403, 'NOT_A_USER_ACCOUNT', 'เปิด/ปิดได้เฉพาะบัญชีผู้ใช้งาน')
  }

  const updated = await db.$transaction(async (tx) => {
    const account = await tx.account.update({
      where: { id },
      data: { isActive },
      select: ACCOUNT_LIST_SELECT,
    })
    // Turning an account off logs it out everywhere
    if (!isActive) await tx.session.deleteMany({ where: { userId: id } })
    await writeAudit(tx, actor, 'update', 'account', id, {
      username: target.username,
      isActive: { from: target.isActive, to: isActive },
    })
    return account
  })

  return NextResponse.json(toAccountItem(updated))
})

export const DELETE = withApi(async (_request, { params }) => {
  const actor = await requireApiRole('admin')
  const id = parseId((await params).id)

  // WA-2: an admin can't delete their own account
  if (id === actor.id) {
    throw new ApiError(403, 'CANNOT_DELETE_SELF', 'ไม่สามารถลบบัญชีของตัวเองได้')
  }
  const target = await findTarget(id)
  // WA-2 covers admin accounts; user accounts are turned off instead (WA-5)
  if (target.role !== 'admin') {
    throw new ApiError(403, 'NOT_AN_ADMIN_ACCOUNT', 'ลบได้เฉพาะบัญชีผู้ดูแลระบบ')
  }

  await db.$transaction(async (tx) => {
    // Write the audit row first; its actor is the deleting admin, not the target.
    await writeAudit(tx, actor, 'delete', 'account', id, {
      role: target.role,
      username: target.username,
    })
    // Sessions and credentials cascade. audit_logs.actor_id and
    // baselines.uploaded_by of the deleted admin become NULL.
    await tx.account.delete({ where: { id } })
  })

  return new NextResponse(null, { status: 204 })
})
