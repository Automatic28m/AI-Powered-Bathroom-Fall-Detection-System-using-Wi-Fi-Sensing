// /api/accounts: GET list (WA-4), POST create admin (WA-1) or user (WA-3). Admin only.
import { NextResponse } from 'next/server'
import { hashPassword } from 'better-auth/crypto'
import { db } from '@/lib/db'
import { ACCOUNT_LIST_SELECT, toAccountItem } from '@/lib/accounts'
import { withApi, parsePaging } from '@/lib/api'
import { writeAudit } from '@/lib/audit'
import { requireApiRole } from '@/lib/session'
import { createAccountSchema, listAccountsQuerySchema } from '@/lib/validators/account'

export const GET = withApi(async (request) => {
  await requireApiRole('admin')
  const params = new URL(request.url).searchParams
  const { role, q } = listAccountsQuerySchema.parse({
    role: params.get('role') || undefined,
    q: params.get('q') || undefined,
  })
  const { page, pageSize, skip, take } = parsePaging(params)

  /** @type {import('@prisma/client').Prisma.AccountWhereInput} */
  const where = {
    ...(role ? { role } : {}),
    ...(q
      ? {
          OR: [
            { username: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { fullName: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
  }

  const [rows, total] = await db.$transaction([
    db.account.findMany({
      where,
      select: ACCOUNT_LIST_SELECT,
      orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
      skip,
      take,
    }),
    db.account.count({ where }),
  ])

  return NextResponse.json({ items: rows.map(toAccountItem), total, page, pageSize })
})

export const POST = withApi(async (request) => {
  const actor = await requireApiRole('admin')
  const input = createAccountSchema.parse(await request.json())
  const passwordHash = await hashPassword(input.password)

  // Account + credential + audit row in one transaction (Design.md §5.2)
  const created = await db.$transaction(async (tx) => {
    const account = await tx.account.create({
      data: {
        role: input.role,
        username: input.username,
        displayUsername: input.username,
        email: input.email,
        fullName: input.fullName,
        phone: input.phone,
        address: input.role === 'user' ? input.address : null,
        createdById: actor.id,
      },
      select: ACCOUNT_LIST_SELECT,
    })
    await tx.authAccount.create({
      data: {
        userId: account.id,
        accountId: String(account.id),
        providerId: 'credential',
        password: passwordHash,
      },
    })
    await writeAudit(tx, actor, 'create', 'account', account.id, {
      role: account.role,
      username: account.username,
      email: account.email,
    })
    return account
  })

  return NextResponse.json(toAccountItem(created), { status: 201 })
})
