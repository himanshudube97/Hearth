import { cookies } from 'next/headers'
import { isDevAuth, AUTH_COOKIE_NAME } from './config'
import { verifyDevToken } from './dev-auth'
import { createClient as createSupabaseClient } from './supabase/server'
import { isEmailVerified } from './email-verified'
import { prisma } from '@/lib/db'

export interface AuthUser {
  id: string
  email: string
  name: string | null
  avatar: string | null
  provider: string
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (isDevAuth) {
    return getDevUser()
  }
  return getSupabaseUser()
}

async function getDevUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  const payload = await verifyDevToken(token)
  if (!payload) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
  })

  if (!user) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    provider: user.provider,
  }
}

async function getSupabaseUser(): Promise<AuthUser | null> {
  const supabase = await createSupabaseClient()
  const { data: { user: supabaseUser } } = await supabase.auth.getUser()

  if (!supabaseUser?.email) {
    return null
  }

  // Block API access until the email is verified. Middleware redirects
  // page navigation to /verify; API callers see null user and respond 401.
  if (!isEmailVerified(supabaseUser)) {
    return null
  }

  // Find or create user in our database
  let user = await prisma.user.findUnique({
    where: { email: supabaseUser.email },
  })

  if (!user) {
    const provider = supabaseUser.app_metadata?.provider || 'email'
    user = await prisma.user.create({
      data: {
        email: supabaseUser.email,
        name: supabaseUser.user_metadata?.full_name || supabaseUser.email.split('@')[0],
        avatar: supabaseUser.user_metadata?.avatar_url || null,
        provider,
      },
    })
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    provider: user.provider,
  }
}

export { isDevAuth } from './config'
