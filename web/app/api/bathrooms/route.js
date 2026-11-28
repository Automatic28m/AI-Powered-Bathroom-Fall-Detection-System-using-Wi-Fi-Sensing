// /api/bathrooms: GET list (WA-10, WA-11), POST add a bathroom to a house (WA-9). Admin only.
//
// POST takes multipart/form-data: houseId, name, rxMac, optional recordedAt and an
// optional "baseline" .npy file. With a file, the bathroom and its first baseline
// are saved in one transaction.
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ApiError, formFields, parsePaging, readForm, withApi } from '@/lib/api'
import { writeAudit } from '@/lib/audit'
import { readBaselineFile, removeFiles, saveBaseline } from '@/lib/baselines'
import { BATHROOM_LIST_SELECT, getRecalibrationMonths, toBathroomItem } from '@/lib/bathrooms'
import { requireApiRole } from '@/lib/session'
import { createBathroomSchema, listBathroomsQuerySchema } from '@/lib/validators/bathroom'

export const GET = withApi(async (request) => {
  await requireApiRole('admin')
  const params = new URL(request.url).searchParams
  const { houseId, q } = listBathroomsQuerySchema.parse({
    houseId: params.get('houseId') || undefined,
    q: params.get('q') || undefined,
  })
  const { page, pageSize, skip, take } = parsePaging(params)

  /** @type {import('@prisma/client').Prisma.BathroomWhereInput} */
  const where = {
    ...(houseId ? { houseId } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { rxMac: { contains: q.toLowerCase().replace(/-/g, ':') } },
            { house: { name: { contains: q, mode: 'insensitive' } } },
          ],
        }
      : {}),
  }

  const [rows, total, months] = await Promise.all([
    db.bathroom.findMany({
      where,
      select: BATHROOM_LIST_SELECT,
      orderBy: [{ house: { name: 'asc' } }, { name: 'asc' }, { id: 'asc' }],
      skip,
      take,
    }),
    db.bathroom.count({ where }),
    getRecalibrationMonths(),
  ])

  return NextResponse.json({
    items: rows.map((r) => toBathroomItem(r, months)),
    total,
    page,
    pageSize,
    recalibrationMonths: months,
  })
})

export const POST = withApi(async (request) => {
  const actor = await requireApiRole('admin')
  const form = await readForm(request)
  const input = createBathroomSchema.parse(
    formFields(form, ['houseId', 'name', 'rxMac', 'recordedAt'])
  )
  const file = form.get('baseline')
  const bytes =
    file && typeof file !== 'string' && file.size > 0 ? await readBaselineFile(file) : null

  const house = await db.house.findUnique({
    where: { id: input.houseId },
    select: { id: true, name: true },
  })
  if (!house) throw new ApiError(404, 'HOUSE_NOT_FOUND', 'ไม่พบบ้านที่เลือก')

  /** @type {string[]} */
  const written = []
  let id
  try {
    id = await db.$transaction(
      async (tx) => {
        const bathroom = await tx.bathroom.create({
          data: { houseId: house.id, name: input.name, rxMac: input.rxMac },
          select: { id: true, name: true },
        })
        await writeAudit(tx, actor, 'create', 'bathroom', bathroom.id, {
          name: input.name,
          rxMac: input.rxMac,
          houseId: house.id,
          houseName: house.name,
        })
        if (bytes) {
          await saveBaseline(tx, {
            bathroom,
            bytes,
            recordedAt: input.recordedAt ?? new Date(),
            actor,
            written,
          })
        }
        return bathroom.id
      },
      { timeout: 15000 }
    )
  } catch (err) {
    await removeFiles(written)
    throw err
  }

  const [row, months] = await Promise.all([
    db.bathroom.findUniqueOrThrow({ where: { id }, select: BATHROOM_LIST_SELECT }),
    getRecalibrationMonths(),
  ])
  return NextResponse.json(toBathroomItem(row, months), { status: 201 })
})
