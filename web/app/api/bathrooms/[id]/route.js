// /api/bathrooms/:id: GET one (WA-10), PATCH name / Rx MAC (WA-12). Admin only.
// A new baseline file goes to POST /api/bathrooms/:id/baseline.
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ApiError, parseId, readJson, withApi } from '@/lib/api'
import { changesOf, writeAudit } from '@/lib/audit'
import { BATHROOM_LIST_SELECT, getRecalibrationMonths, toBathroomItem } from '@/lib/bathrooms'
import { requireApiRole } from '@/lib/session'
import { updateBathroomSchema } from '@/lib/validators/bathroom'

export const GET = withApi(async (_request, { params }) => {
  await requireApiRole('admin')
  const id = parseId((await params).id)
  const [row, months] = await Promise.all([
    db.bathroom.findUnique({ where: { id }, select: BATHROOM_LIST_SELECT }),
    getRecalibrationMonths(),
  ])
  if (!row) throw new ApiError(404, 'NOT_FOUND', 'ไม่พบห้องน้ำนี้')
  return NextResponse.json(toBathroomItem(row, months))
})

export const PATCH = withApi(async (request, { params }) => {
  const actor = await requireApiRole('admin')
  const id = parseId((await params).id)
  const input = updateBathroomSchema.parse(await readJson(request))

  await db.$transaction(async (tx) => {
    const before = await tx.bathroom.findUnique({ where: { id } })
    if (!before) throw new ApiError(404, 'NOT_FOUND', 'ไม่พบห้องน้ำนี้')
    const changes = changesOf(before, input)
    if (Object.keys(changes).length === 0) return
    await tx.bathroom.update({ where: { id }, data: input })
    await writeAudit(tx, actor, 'update', 'bathroom', id, {
      name: input.name ?? before.name,
      ...changes,
    })
  })

  const [row, months] = await Promise.all([
    db.bathroom.findUniqueOrThrow({ where: { id }, select: BATHROOM_LIST_SELECT }),
    getRecalibrationMonths(),
  ])
  return NextResponse.json(toBathroomItem(row, months))
})
