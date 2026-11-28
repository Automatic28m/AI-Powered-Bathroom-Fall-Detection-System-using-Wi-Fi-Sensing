// Seed default system settings (Design.md §4 & §5.2) and the first admin account.
// Run: npx prisma db seed   (safe to run again: nothing is overwritten)

import { PrismaClient } from '@prisma/client'
import { hashPassword } from 'better-auth/crypto'

const prisma = new PrismaClient()

const DEFAULT_SETTINGS = [
  { key: 'window_s', value: 3 },
  { key: 'hop_s', value: 1 },
  { key: 'confidence_threshold', value: 0.7 },
  { key: 'cooldown_s', value: 60 },
  { key: 'recalibration_months', value: 6 },
]

async function seedSettings() {
  for (const item of DEFAULT_SETTINGS) {
    await prisma.setting.upsert({
      where: { key: item.key },
      update: {},
      create: { key: item.key, value: item.value },
    })
  }
}

// Public sign-up is off, so someone has to create the first admin.
// It's only created when there is no admin yet, from the SEED_ADMIN_* variables.
async function seedFirstAdmin() {
  if ((await prisma.account.count({ where: { role: 'admin' } })) > 0) {
    console.log('Admin already exists: skipped first-admin seed')
    return
  }
  const env = process.env
  const missing = ['SEED_ADMIN_USERNAME', 'SEED_ADMIN_PASSWORD', 'SEED_ADMIN_EMAIL'].filter(
    (k) => !env[k]
  )
  if (missing.length) {
    console.warn(`No admin created. Set ${missing.join(', ')} in .env and run the seed again.`)
    return
  }
  if (env.SEED_ADMIN_PASSWORD.length < 8) throw new Error('SEED_ADMIN_PASSWORD needs 8+ characters')

  const username = env.SEED_ADMIN_USERNAME.trim().toLowerCase()
  const passwordHash = await hashPassword(env.SEED_ADMIN_PASSWORD)
  await prisma.$transaction(async (tx) => {
    const admin = await tx.account.create({
      data: {
        role: 'admin',
        username,
        displayUsername: username,
        email: env.SEED_ADMIN_EMAIL.trim().toLowerCase(),
        fullName: env.SEED_ADMIN_FULL_NAME || 'ผู้ดูแลระบบ',
        phone: env.SEED_ADMIN_PHONE || '0000000000',
      },
    })
    await tx.authAccount.create({
      data: {
        userId: admin.id,
        accountId: String(admin.id),
        providerId: 'credential',
        password: passwordHash,
      },
    })
    // No logged-in actor during seeding, so actor_id stays NULL
    await tx.auditLog.create({
      data: {
        action: 'create',
        entityType: 'account',
        entityId: String(admin.id),
        details: { actorUsername: 'seed', role: 'admin', username },
      },
    })
  })
  console.log(`Created first admin "${username}"`)
}

async function main() {
  await seedSettings()
  await seedFirstAdmin()
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
