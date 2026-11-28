// Test accounts for local development ONLY: one admin and one user, both with
// the password 123456789. See README.md "Test accounts".
// Run: npm run db:seed:test   (safe to run again: it resets both passwords)
//
// Never run this on the public server. The password is written in the README,
// so anyone could log in. The script refuses to run when NODE_ENV=production.

import { PrismaClient } from '@prisma/client'
import { hashPassword } from 'better-auth/crypto'

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to create test accounts with NODE_ENV=production.')
  process.exit(1)
}

const PASSWORD = '123456789'

const TEST_ACCOUNTS = [
  {
    role: 'admin',
    username: 'testadmin',
    email: 'testadmin@fallwatch.local',
    fullName: 'แอดมิน ทดสอบ',
    phone: '0800000001',
    address: null,
  },
  {
    role: 'user',
    username: 'testuser',
    email: 'testuser@fallwatch.local',
    fullName: 'ผู้ใช้ ทดสอบ',
    phone: '0800000002',
    address: '1 ถนนทดสอบ ปทุมธานี',
  },
]

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await hashPassword(PASSWORD)

  for (const data of TEST_ACCOUNTS) {
    await prisma.$transaction(async (tx) => {
      // Create it, or put it back the way it was (turned on, same role and details)
      const account = await tx.account.upsert({
        where: { username: data.username },
        create: { ...data, displayUsername: data.username },
        update: { ...data, displayUsername: data.username, isActive: true },
      })
      const credential = await tx.authAccount.findFirst({
        where: { userId: account.id, providerId: 'credential' },
      })
      if (credential) {
        await tx.authAccount.update({
          where: { id: credential.id },
          data: { password: passwordHash },
        })
      } else {
        await tx.authAccount.create({
          data: {
            userId: account.id,
            accountId: String(account.id),
            providerId: 'credential',
            password: passwordHash,
          },
        })
      }
    })
    console.log(`Test ${data.role}: ${data.username} / ${PASSWORD}`)
  }
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
