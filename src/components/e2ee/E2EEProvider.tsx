'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { useE2EEStore } from '@/store/e2ee'
import SetupModal from './SetupModal'
import UnlockModal from './UnlockModal'
import RecoveryModal from './RecoveryModal'

interface E2EEProviderProps {
  children: React.ReactNode
}

export default function E2EEProvider({ children }: E2EEProviderProps) {
  const { user } = useAuthStore()
  const { initialize, initialized, clearMasterKey } = useE2EEStore()

  // Initialize E2EE when user logs in
  useEffect(() => {
    if (user && !initialized) {
      initialize()
    }
  }, [user, initialized, initialize])

  // Clear master key when user logs out
  useEffect(() => {
    if (!user && initialized) {
      clearMasterKey()
    }
  }, [user, initialized, clearMasterKey])

  return (
    <>
      {children}
      <SetupModal />
      <UnlockModal />
      <RecoveryModal />
    </>
  )
}
