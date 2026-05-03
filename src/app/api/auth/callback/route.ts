import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/auth/supabase/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const redirect = searchParams.get('redirect') || '/'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user?.email) {
      // Sync user to our database
      const existingUser = await prisma.user.findUnique({
        where: { email: data.user.email },
      })

      if (!existingUser) {
        const provider = data.user.app_metadata?.provider || 'email'
        await prisma.user.create({
          data: {
            email: data.user.email,
            name: data.user.user_metadata?.full_name || data.user.email.split('@')[0],
            avatar: data.user.user_metadata?.avatar_url || null,
            provider,
          },
        })
      }

      return NextResponse.redirect(`${origin}${redirect}`)
    }
  }

  // Auth failed, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
