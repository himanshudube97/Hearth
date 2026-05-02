'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { useE2EEStore } from '@/store/e2ee'
import { useBackfill } from '@/hooks/useBackfill'
import SetupModal from './SetupModal'
import UnlockModal from './UnlockModal'
import RecoveryModal from './RecoveryModal'
import BackfillToast from './BackfillToast'

interface E2EEProviderProps {
  children: React.ReactNode
}

export default function E2EEProvider({ children }: E2EEProviderProps) {
  const { user } = useAuthStore()
  const { initialize, initialized, clearMasterKey } = useE2EEStore()
  const { runBackfill } = useBackfill()
  const backfillStatus = useE2EEStore(s => s.backfillProgress.status)
  const isUnlocked = useE2EEStore(s => s.isUnlocked)

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

  // Auto-resume backfill if it was previously running or paused
  useEffect(() => {
    if (isUnlocked && (backfillStatus === 'running' || backfillStatus === 'paused')) {
      runBackfill().catch(console.error)
    }
  }, [isUnlocked, backfillStatus, runBackfill])

  return (
    <>
      {children}
      <SetupModal />
      <UnlockModal />
      <RecoveryModal />
      <BackfillToast />
    </>
  )
}
