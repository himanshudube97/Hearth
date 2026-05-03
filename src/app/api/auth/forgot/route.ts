import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase/server'
import { isDevAuth } from '@/lib/auth/config'

export async function POST(request: NextRequest) {
  if (isDevAuth) {
    return NextResponse.json({ success: true, message: 'Dev auth — no password reset' })
  }

  const { email } = await request.json()
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset`,
  })

  // Don't leak whether the email exists — always return success to the caller.
  if (error) console.error('reset password error:', error.message)
  return NextResponse.json({ success: true })
}
