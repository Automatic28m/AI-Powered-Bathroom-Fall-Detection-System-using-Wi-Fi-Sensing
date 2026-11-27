'use client'

// Better Auth browser client (login form, logout button)
import { usernameClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  plugins: [usernameClient()],
})
