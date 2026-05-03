import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import * as jose from 'jose'
import { isEmailVerified } from '@/lib/auth/email-verified'

const PUBLIC_PATHS = ['/login', '/api/auth', '/api/webhooks', '/api/webhooks/lemonsqueezy']
const PUBLIC_EXACT_PATHS = ['/', '/pricing', '/forgot', '/reset', '/verify']
const STATIC_PATHS = ['/_next', '/favicon.ico', '/images', '/icons', '/manifest.json', '/sw.js', '/workbox']

const isDevAuth = process.env.USE_DEV_AUTH === 'true'
const DEV_JWT_SECRET = process.env.DEV_JWT_SECRET || 'dev-secret-key-for-local-development-only-min-32-chars'
const AUTH_COOKIE_NAME = 'hearth-auth-token'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (STATIC_PATHS.some(path => pathname.startsWith(path))) return NextResponse.next()
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) return NextResponse.next()
  if (PUBLIC_EXACT_PATHS.includes(pathname)) return NextResponse.next()

  if (isDevAuth) {
    const authenticated = await checkDevAuth(request)
    if (!authenticated) return unauthorized(request, pathname)
    return NextResponse.next()
  }

  return checkSupabaseAuth(request, pathname)
}

async function checkDevAuth(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
  if (!token) return false
  try {
    const secret = new TextEncoder().encode(DEV_JWT_SECRET)
    await jose.jwtVerify(token, secret)
    return true
  } catch {
    return false
  }
}

async function checkSupabaseAuth(request: NextRequest, pathname: string): Promise<NextResponse> {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return unauthorized(request, pathname)

  if (!isEmailVerified(user)) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Email not verified' }, { status: 403 })
    }
    const verifyUrl = new URL('/verify', request.url)
    return NextResponse.redirect(verifyUrl)
  }

  return response
}

function unauthorized(request: NextRequest, pathname: string): NextResponse {
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('redirect', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest\\.json|sw\\.js|workbox-.*\\.js|icons/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
