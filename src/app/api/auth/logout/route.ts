import { NextResponse } from 'next/server'
import { isDevAuth, AUTH_COOKIE_NAME } from '@/lib/auth/config'
import { createClient } from '@/lib/auth/supabase/server'

export async function POST() {
  const response = NextResponse.json({ success: true })

  if (isDevAuth) {
    // Clear dev auth cookie
    response.cookies.set(AUTH_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })
  } else {
    // Sign out of Supabase
    const supabase = await createClient()
    await supabase.auth.signOut()
  }

  return response
}
