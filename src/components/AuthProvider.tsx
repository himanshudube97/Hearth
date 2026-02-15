'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth'

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const fetchUser = useAuthStore((state) => state.fetchUser)

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  return <>{children}</>
}
