// /api/watchers: who watches which bathroom (WA-13 to WA-15). Admin only.
//   GET     list user accounts with their house and watched bathrooms
//   POST    { accountId, houseId, bathroomIds } set a user's house (WA-13) and the
//           full list of bathrooms they watch (WA-14, WA-15). Bathrooms left out stop
//           being watched; ones kept keep their alerts on/off setting.
//   DELETE  ?accountId=&bathroomId= remove one pairing (WA-15)
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ApiError, parsePaging, readJson, withApi } from '@/lib/api'
import { writeAudit } from '@/lib/audit'
import { requireApiRole } from '@/lib/session'
import {
  deleteWatcherQuerySchema,
  listWatchersQuerySchema,
  setWatchersSchema,
} from '@/lib/validators/watcher'

const WATCHER_ITEM_SELECT = {
  id: true,
  username: true,
  fullName: true,
  isActive: true,
  house: { select: { id: true, name: true } },
  watchedBathrooms: {
    select: {
      alertsEnabled: true,
      createdAt: true,
      bathroom: { select: { id: true, name: true, houseId: true } },
    },
    orderBy: { bathroom: { name: 'asc' } },
  },
}

/**
 * @typedef {object} WatcherItem  one user account and the bathrooms they watch
 * @property {number} id
 * @property {string} username
 * @property {string} fullName
 * @property {boolean} isActive
 * @property {{ id: number, name: string } | null} house
 * @property {{ bathroom: { id: number, name: string, houseId: number }, alertsEnabled: boolean, createdAt: Date | string }[]} watches
 */

/** @param {any} row @returns {WatcherItem} */
function toWatcherItem(row) {
  const { watchedBathrooms, ...rest } = row
  return { ...rest, watches: watchedBathrooms }
}

/** @param {number} accountId @param {number} bathroomId */
const watcherEntityId = (accountId, bathroomId) => `${accountId}:${bathroomId}`

export const GET = withApi(async (request) => {
  await requireApiRole('admin')
  const params = new URL(request.url).searchParams
  const { houseId, q } = listWatchersQuerySchema.parse({
    houseId: params.get('houseId') || undefined,
    q: params.get('q') || undefined,
  })
  const { page, pageSize, skip, take } = parsePaging(params)

  /** @type {import('@prisma/client').Prisma.AccountWhereInput} */
  const where = {
    role: 'user',
    ...(houseId ? { houseId } : {}),
    ...(q
      ? {
          OR: [
            { username: { contains: q, mode: 'insensitive' } },
            { fullName: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
  }

  const [rows, total] = await db.$transaction([
    db.account.findMany({
      where,
      select: WATCHER_ITEM_SELECT,
      orderBy: [{ house: { name: 'asc' } }, { username: 'asc' }],
      skip,
      take,
    }),
    db.account.count({ where }),
  ])

  return NextResponse.json({ items: rows.map(toWatcherItem), total, page, pageSize })
})

export const POST = withApi(async (request) => {
  const actor = await requireApiRole('admin')
  const { accountId, houseId, bathroomIds } = setWatchersSchema.parse(await readJson(request))

  await db.$transaction(async (tx) => {
    const account = await tx.account.findUnique({
      where: { id: accountId },
      select: {
        id: true,
        role: true,
        username: true,
        houseId: true,
        house: { select: { name: true } },
        watchedBathrooms: { select: { bathroom: { select: { id: true, name: true } } } },
      },
    })
    if (!account) throw new ApiError(404, 'NOT_FOUND', 'ไม่พบบัญชีนี้')
    if (account.role !== 'user') {
      throw new ApiError(400, 'NOT_A_USER_ACCOUNT', 'จับคู่ห้องน้ำได้เฉพาะบัญชีผู้ใช้งาน')
    }

    const house = houseId
      ? await tx.house.findUnique({ where: { id: houseId }, select: { id: true, name: true } })
      : null
    if (houseId && !house) throw new ApiError(404, 'HOUSE_NOT_FOUND', 'ไม่พบบ้านที่เลือก')

    // A user can only watch bathrooms in their own house
    const bathrooms = await tx.bathroom.findMany({
      where: { id: { in: bathroomIds } },
      select: { id: true, name: true, houseId: true },
    })
    if (bathrooms.length !== bathroomIds.length || bathrooms.some((b) => b.houseId !== houseId)) {
      throw new ApiError(400, 'BATHROOM_NOT_IN_HOUSE', 'เลือกได้เฉพาะห้องน้ำในบ้านของผู้ใช้งาน')
    }

    // WA-13: link the account to the house
    if (account.houseId !== houseId) {
      await tx.account.update({ where: { id: accountId }, data: { houseId } })
      await writeAudit(tx, actor, 'update', 'account', accountId, {
        username: account.username,
        houseId: { from: account.houseId, to: houseId },
        houseName: { from: account.house?.name ?? null, to: house?.name ?? null },
      })
    }

    // WA-14 / WA-15: add and remove pairings
    const wanted = new Set(bathroomIds)
    const current = new Set(account.watchedBathrooms.map((w) => w.bathroom.id))
    const removed = account.watchedBathrooms.filter((w) => !wanted.has(w.bathroom.id))
    const added = bathrooms.filter((b) => !current.has(b.id))

    if (removed.length) {
      await tx.bathroomWatcher.deleteMany({
        where: { accountId, bathroomId: { in: removed.map((w) => w.bathroom.id) } },
      })
    }
    if (added.length) {
      await tx.bathroomWatcher.createMany({
        data: added.map((b) => ({ accountId, bathroomId: b.id })),
      })
    }
    for (const { bathroom } of removed) {
      await writeAudit(
        tx,
        actor,
        'delete',
        'bathroom_watcher',
        watcherEntityId(accountId, bathroom.id),
        {
          username: account.username,
          bathroomId: bathroom.id,
          bathroomName: bathroom.name,
        }
      )
    }
    for (const bathroom of added) {
      await writeAudit(
        tx,
        actor,
        'create',
        'bathroom_watcher',
        watcherEntityId(accountId, bathroom.id),
        {
          username: account.username,
          bathroomId: bathroom.id,
          bathroomName: bathroom.name,
          houseName: house?.name ?? null,
        }
      )
    }
  })

  const row = await db.account.findUniqueOrThrow({
    where: { id: accountId },
    select: WATCHER_ITEM_SELECT,
  })
  return NextResponse.json(toWatcherItem(row))
})

export const DELETE = withApi(async (request) => {
  const actor = await requireApiRole('admin')
  const params = new URL(request.url).searchParams
  const { accountId, bathroomId } = deleteWatcherQuerySchema.parse({
    accountId: params.get('accountId') ?? undefined,
    bathroomId: params.get('bathroomId') ?? undefined,
  })

  await db.$transaction(async (tx) => {
    const watcher = await tx.bathroomWatcher.findUnique({
      where: { accountId_bathroomId: { accountId, bathroomId } },
      select: {
        account: { select: { username: true } },
        bathroom: { select: { name: true } },
      },
    })
    if (!watcher) throw new ApiError(404, 'NOT_FOUND', 'ไม่พบการจับคู่นี้')
    await tx.bathroomWatcher.delete({
      where: { accountId_bathroomId: { accountId, bathroomId } },
    })
    await writeAudit(
      tx,
      actor,
      'delete',
      'bathroom_watcher',
      watcherEntityId(accountId, bathroomId),
      {
        username: watcher.account.username,
        bathroomId,
        bathroomName: watcher.bathroom.name,
      }
    )
  })

  return new NextResponse(null, { status: 204 })
})
