import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/api/auth']
const PUBLIC_EXACT_PATHS = ['/']
const STATIC_PATHS = ['/_next', '/favicon.ico', '/images']

const isDevAuth = process.env.USE_DEV_AUTH === 'true'
const DEV_JWT_SECRET = process.env.DEV_JWT_SECRET || 'dev-secret-key-for-local-development-only-min-32-chars'
const AUTH_COOKIE_NAME = 'hearth-auth-token'

function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const decoded = atob(base64 + padding)
  return Uint8Array.from(decoded, c => c.charCodeAt(0))
}

async function verifyJwtSignature(token: string, secret: string): Promise<boolean> {
  const parts = token.split('.')
  if (parts.length !== 3) return false

  const [headerB64, payloadB64, signatureB64] = parts

  try {
    // Import the secret key
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secret)
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    // Verify signature
    const signatureInput = encoder.encode(`${headerB64}.${payloadB64}`)
    const signature = base64UrlDecode(signatureB64)

    const isValid = await crypto.subtle.verify(
      'HMAC',
      cryptoKey,
      signature,
      signatureInput
    )

    if (!isValid) return false

    // Check expiration
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64)))
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return false
    }

    return true
  } catch {
    return false
  }
}

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

  return verifyJwtSignature(token, DEV_JWT_SECRET)
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
