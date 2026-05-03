'use client'

import { useComeback } from '@/hooks/useComeback'
import ComebackWhisper from './ComebackWhisper'
import ComebackCard from './ComebackCard'
import ComebackModal from './ComebackModal'

export default function ComebackHost() {
  const decision = useComeback()
  if (!decision || !decision.tier) return null

  if (decision.tier === 'whisper') {
    return <ComebackWhisper gapDays={decision.gapDays} onShown={decision.markShown} />
  }
  if (decision.tier === 'card') {
    return <ComebackCard gapDays={decision.gapDays} onShown={decision.markShown} />
  }
  return <ComebackModal gapDays={decision.gapDays} onShown={decision.markShown} />
}
