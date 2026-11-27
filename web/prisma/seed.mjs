// Seed default system settings (Design.md §4 & §5.2)
// Run: npx prisma db seed

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DEFAULT_SETTINGS = [
  { key: 'window_s', value: 3 },
  { key: 'hop_s', value: 1 },
  { key: 'confidence_threshold', value: 0.7 },
  { key: 'cooldown_s', value: 60 },
  { key: 'recalibration_months', value: 6 },
]

async function main() {
  for (const item of DEFAULT_SETTINGS) {
    await prisma.setting.upsert({
      where: { key: item.key },
      update: {},
      create: { key: item.key, value: item.value },
    })
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
