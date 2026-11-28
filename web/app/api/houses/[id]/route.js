// /api/houses/:id: GET details (WA-7), PATCH edit (WA-8). Admin only.
// There is no DELETE: the PRD has no "delete a house" requirement.
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ApiError, parseId, readJson, withApi } from '@/lib/api'
import { changesOf, writeAudit } from '@/lib/audit'
import { getRecalibrationMonths, calibrationOf } from '@/lib/bathrooms'
import { HOUSE_LIST_SELECT, toHouseItem } from '@/lib/houses'
import { requireApiRole } from '@/lib/session'
import { updateHouseSchema } from '@/lib/validators/house'

export const GET = withApi(async (_request, { params }) => {
  await requireApiRole('admin')
  const id = parseId((await params).id)

  const [house, months] = await Promise.all([
    db.house.findUnique({
      where: { id },
      select: {
        ...HOUSE_LIST_SELECT,
        bathrooms: {
          select: { id: true, name: true, rxMac: true, lastCalibratedAt: true },
          orderBy: { name: 'asc' },
        },
        accounts: {
          where: { role: 'user' },
          select: { id: true, username: true, fullName: true, phone: true, isActive: true },
          orderBy: { username: 'asc' },
        },
      },
    }),
    getRecalibrationMonths(),
  ])
  if (!house) throw new ApiError(404, 'NOT_FOUND', 'ไม่พบบ้านนี้')

  const { bathrooms, accounts, ...rest } = house
  return NextResponse.json({
    ...toHouseItem(rest),
    bathrooms: bathrooms.map((b) => ({
      ...b,
      calibration: calibrationOf(b.lastCalibratedAt, months),
    })),
    users: accounts,
  })
})

export const PATCH = withApi(async (request, { params }) => {
  const actor = await requireApiRole('admin')
  const id = parseId((await params).id)
  const input = updateHouseSchema.parse(await readJson(request))

  const updated = await db.$transaction(async (tx) => {
    const before = await tx.house.findUnique({ where: { id } })
    if (!before) throw new ApiError(404, 'NOT_FOUND', 'ไม่พบบ้านนี้')
    const changes = changesOf(before, input)
    if (Object.keys(changes).length === 0) {
      return tx.house.findUniqueOrThrow({ where: { id }, select: HOUSE_LIST_SELECT })
    }
    const house = await tx.house.update({ where: { id }, data: input, select: HOUSE_LIST_SELECT })
    await writeAudit(tx, actor, 'update', 'house', id, { name: house.name, ...changes })
    return house
  })

  return NextResponse.json(toHouseItem(updated))
})
