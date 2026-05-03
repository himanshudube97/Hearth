import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase/server'

export async function POST(request: NextRequest) {
  const { password } = await request.json()
  if (!password || typeof password !== 'string' || password.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters' },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  // The recovery session was set by Supabase when the user clicked the email
  // link. updateUser writes the new password against the recovered session.
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
