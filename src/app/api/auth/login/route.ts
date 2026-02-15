import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isDevAuth, AUTH_COOKIE_NAME } from '@/lib/auth/config'
import { createDevToken } from '@/lib/auth/dev-auth'
import { createClient } from '@/lib/auth/supabase/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { email, redirectTo } = body

  if (isDevAuth) {
    return handleDevLogin(email, redirectTo)
  }

  return handleSupabaseLogin(redirectTo)
}

async function handleDevLogin(email: string, redirectTo?: string) {
  if (!email || typeof email !== 'string') {
    return NextResponse.json(
      { error: 'Email is required' },
      { status: 400 }
    )
  }

  // Find or create user
  let user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: email.split('@')[0],
        provider: 'dev',
      },
    })
  }

  // Create JWT token
  const token = await createDevToken({
    id: user.id,
    email: user.email,
    name: user.name || email.split('@')[0],
  })

  const response = NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
    },
    redirectTo: redirectTo || '/',
  })

  // Set httpOnly cookie
  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })

  return response
}

async function handleSupabaseLogin(redirectTo?: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/callback?redirect=${redirectTo || '/'}`,
    },
  })

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }

  return NextResponse.json({
    success: true,
    url: data.url,
  })
}
