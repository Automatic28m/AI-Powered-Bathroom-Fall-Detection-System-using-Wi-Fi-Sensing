// Fast gate for protected pages: no session cookie → /login.
// This only checks that a cookie exists. The real session + role check runs on
// the server in each layout (lib/session.js requirePageRole) and API route.
import { NextResponse } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

/** @param {import('next/server').NextRequest} request */
export function middleware(request) {
  if (!getSessionCookie(request)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/home/:path*'],
}
