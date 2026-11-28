// /api/houses: GET list (WA-7), POST add a house (WA-6). Admin only.
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parsePaging, readJson, withApi } from '@/lib/api'
import { writeAudit } from '@/lib/audit'
import { HOUSE_LIST_SELECT, toHouseItem } from '@/lib/houses'
import { requireApiRole } from '@/lib/session'
import { createHouseSchema, listHousesQuerySchema } from '@/lib/validators/house'

export const GET = withApi(async (request) => {
  await requireApiRole('admin')
  const params = new URL(request.url).searchParams
  const { q } = listHousesQuerySchema.parse({ q: params.get('q') || undefined })
  const { page, pageSize, skip, take } = parsePaging(params)

  /** @type {import('@prisma/client').Prisma.HouseWhereInput} */
  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { address: { contains: q, mode: 'insensitive' } },
        ],
      }
    : {}

  const [rows, total] = await db.$transaction([
    db.house.findMany({
      where,
      select: HOUSE_LIST_SELECT,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip,
      take,
    }),
    db.house.count({ where }),
  ])

  return NextResponse.json({ items: rows.map(toHouseItem), total, page, pageSize })
})

export const POST = withApi(async (request) => {
  const actor = await requireApiRole('admin')
  const input = createHouseSchema.parse(await readJson(request))

  const created = await db.$transaction(async (tx) => {
    const house = await tx.house.create({ data: input, select: HOUSE_LIST_SELECT })
    await writeAudit(tx, actor, 'create', 'house', house.id, input)
    return house
  })

  return NextResponse.json(toHouseItem(created), { status: 201 })
})
