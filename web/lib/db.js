// Prisma client singleton
// Import this in every API route handler: import { db } from '@/lib/db'

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

/** @type {PrismaClient} */
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
