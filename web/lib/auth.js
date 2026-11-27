// Better Auth server config (Design.md §6.2 /api/auth/*, §10 Security)
//
// Table mapping onto our Prisma schema:
//   Better Auth "user"         -> model Account     (accounts)
//   Better Auth "account"      -> model AuthAccount (auth_accounts, holds the password hash)
//   Better Auth "session"      -> model Session     (sessions)
//   Better Auth "verification" -> model Verification (verifications)

import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { APIError } from 'better-auth/api'
import { nextCookies } from 'better-auth/next-js'
import { username } from 'better-auth/plugins/username'
import { db } from '@/lib/db'

/** Error code sent to the login form when an admin has turned the account off (WA-5). */
export const ACCOUNT_DISABLED = 'ACCOUNT_DISABLED'

export const auth = betterAuth({
  appName: 'FallWatch.',
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  database: prismaAdapter(db, { provider: 'postgresql' }),

  // accounts.id and the auth tables use Postgres SERIAL ids
  advanced: {
    database: { generateId: 'serial' },
    // Behind Cloudflare Tunnel every request comes from cloudflared, so the login
    // rate limit must key on the visitor IP that Cloudflare forwards.
    ipAddress: { ipAddressHeaders: ['cf-connecting-ip', 'x-forwarded-for'] },
  },

  // Admins create every account (Scope 1.3.6), so public sign-up is off.
  emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: 8 },

  user: {
    modelName: 'account',
    fields: { name: 'fullName' },
    additionalFields: {
      role: { type: 'string', input: false, defaultValue: 'user' },
      phone: { type: 'string', input: false, required: false },
      address: { type: 'string', input: false, required: false },
      houseId: { type: 'number', input: false, required: false },
      isActive: { type: 'boolean', input: false, defaultValue: true },
    },
  },
  account: { modelName: 'authAccount' },
  session: {
    modelName: 'session',
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh the expiry at most once a day
  },
  verification: { modelName: 'verification' },

  // Rate limiting on login (Design.md §10): 5 tries per minute per IP
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      '/sign-in/email': { window: 60, max: 5 },
      '/sign-in/username': { window: 60, max: 5 },
    },
  },

  databaseHooks: {
    session: {
      create: {
        // Runs after the password check, so it only tells someone who knows the
        // password that the account is off.
        before: async (session) => {
          const account = await db.account.findUnique({
            where: { id: Number(session.userId) },
            select: { isActive: true },
          })
          if (!account?.isActive) {
            throw new APIError('FORBIDDEN', {
              code: ACCOUNT_DISABLED,
              message: 'This account has been turned off by an admin.',
            })
          }
        },
      },
    },
  },

  // nextCookies() must stay last so Server Actions can set the session cookie
  plugins: [username(), nextCookies()],
})
