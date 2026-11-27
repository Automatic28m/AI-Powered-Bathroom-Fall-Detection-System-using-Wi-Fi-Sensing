// Better Auth endpoints: /api/auth/sign-in/*, /api/auth/sign-out, /api/auth/get-session ...
import { toNextJsHandler } from 'better-auth/next-js'
import { auth } from '@/lib/auth'

export const { GET, POST } = toNextJsHandler(auth)
