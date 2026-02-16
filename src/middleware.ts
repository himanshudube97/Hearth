import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import * as jose from 'jose'

const PUBLIC_PATHS = ['/login', '/api/auth']
const PUBLIC_EXACT_PATHS = ['/']
const STATIC_PATHS = ['/_next', '/favicon.ico', '/images']

const isDevAuth = process.env.USE_DEV_AUTH === 'true'
const DEV_JWT_SECRET = process.env.DEV_JWT_SECRET || 'dev-secret-key-for-local-development-only-min-32-chars'
const AUTH_COOKIE_NAME = 'hearth-auth-token'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip static files and public paths
  if (STATIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Allow exact public paths (like landing page)
  if (PUBLIC_EXACT_PATHS.includes(pathname)) {
    return NextResponse.next()
  }

  // Check authentication
  const isAuthenticated = await checkAuth(request)

  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

async function checkAuth(request: NextRequest): Promise<boolean> {
  if (isDevAuth) {
    return checkDevAuth(request)
  }
  return checkSupabaseAuth(request)
}

async function checkDevAuth(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value

  if (!token) {
    return false
  }

  try {
    const secret = new TextEncoder().encode(DEV_JWT_SECRET)
    await jose.jwtVerify(token, secret)
    return true
  } catch {
    return false
  }
}

async function checkSupabaseAuth(request: NextRequest): Promise<boolean> {
  // Check for Supabase session cookies
  const supabaseAuthToken = request.cookies.get('sb-access-token')?.value
    || request.cookies.getAll().find(c => c.name.includes('auth-token'))?.value

  return !!supabaseAuthToken
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
