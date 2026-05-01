'use client'

import { useEffect, useMemo, useState } from 'react'
import PostalSky from './PostalSky'
import Lamp from './Lamp'
import Postbox from './Postbox'
import PostboxControls from './PostboxControls'
import WriteCard from './WriteCard'
import TopHint from './TopHint'
import NewLetterTag from './NewLetterTag'
import LetterFanout from './LetterFanout'
import RevealModal from './RevealModal'
import ComposeModal from '../compose/ComposeModal'
import { MONTHS, MONTH_NAMES, groupInboxByMonth, countUnread } from '../lettersData'
import type { InboxLetter } from '../letterTypes'

interface Props {
  onUnreadCountChange: (n: number) => void
}

export default function InboxView({ onUnreadCountChange }: Props) {
  const [letters, setLetters] = useState<InboxLetter[]>([])
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [monthIdx, setMonthIdx] = useState(today.getMonth())
  const [fanTriggerKey, setFanTriggerKey] = useState(0)
  const [revealLetter, setRevealLetter] = useState<InboxLetter | null>(null)
  const [composing, setComposing] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/letters/inbox')
      .then(r => r.json())
      .then(d => { if (!cancelled) setLetters(d.letters || []) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const grouped = useMemo(() => groupInboxByMonth(letters), [letters])

  const yearsWithLetters = Object.keys(grouped).map(Number)
  const yearMin = yearsWithLetters.length ? Math.min(...yearsWithLetters) : today.getFullYear()
  const yearMax = today.getFullYear()
  const monthMaxForCurrentYear = today.getMonth()

  const currentLetters: InboxLetter[] =
    grouped[year]?.[MONTHS[monthIdx]] ?? []

  const newCountTotal = countUnread(letters)
  const newInCurrent = currentLetters.filter(l => !l.isViewed).length

  useEffect(() => { onUnreadCountChange(newCountTotal) }, [newCountTotal, onUnreadCountChange])

  // re-fan when month/year/letters count changes
  useEffect(() => { setFanTriggerKey(k => k + 1) }, [year, monthIdx, letters.length])

  return (
    <section
      className="relative min-h-screen overflow-hidden"
      style={{ background: 'linear-gradient(180deg, var(--bg-1), var(--bg-2))' }}
    >
      <PostalSky />
      <TopHint newCount={newCountTotal} />

      <div
        className="relative z-[5] flex items-end justify-center w-full pt-[8%] pb-[8%]"
        style={{ minHeight: '100vh' }}
      >
        <div className="flex items-end gap-[60px] w-full px-[80px] justify-center">
          <WriteCard onBegin={() => setComposing(true)} />

          <div className="flex items-end gap-[80px]">
            <Lamp />
            <Postbox onClick={() => setFanTriggerKey(k => k + 1)}>
              <PostboxControls
                year={year}
                monthIdx={monthIdx}
                yearMin={yearMin}
                yearMax={yearMax}
                monthMaxForCurrentYear={monthMaxForCurrentYear}
                onYearChange={setYear}
                onMonthChange={setMonthIdx}
              />
              <NewLetterTag count={newInCurrent} />
            </Postbox>
          </div>
        </div>
      </div>

      <div
        className="absolute bottom-[20px] left-1/2 -translate-x-1/2 text-center italic"
        style={{
          fontFamily: 'Cormorant Garamond, serif',
          color: 'var(--text-secondary)',
          fontSize: 13,
          letterSpacing: 1.2,
        }}
      >
        — {MONTH_NAMES[monthIdx]} · {year} · {captionFor(currentLetters)} —
      </div>

      <LetterFanout
        letters={currentLetters}
        triggerKey={fanTriggerKey}
        onLetterClick={setRevealLetter}
      />
      <RevealModal
        letter={revealLetter}
        onClose={() => setRevealLetter(null)}
        onMarkRead={(id) => {
          fetch(`/api/letters/${id}/read`, { method: 'POST' }).catch(() => {})
          setLetters(ls => ls.map(l => l.id === id ? { ...l, isViewed: true } : l))
        }}
      />
      <ComposeModal
        open={composing}
        onClose={() => setComposing(false)}
        onSealed={() => {
          // Re-fetch inbox in case the new letter has an unlock date in the past
          // (rare edge case — minimum unlock is 1 week typically, but cheap to refetch).
          fetch('/api/letters/inbox')
            .then(r => r.json())
            .then(d => setLetters(d.letters || []))
            .catch(() => {})
        }}
      />
    </section>
  )
}

function captionFor(letters: InboxLetter[]) {
  const total = letters.length
  const newC = letters.filter(l => !l.isViewed).length
  if (total === 0) return 'the box was empty'
  if (newC === total) return `${newC} new letter${newC === 1 ? '' : 's'} ✦ unread`
  if (newC > 0)      return `${newC} new · ${total - newC} read`
  return `${total} letter${total === 1 ? '' : 's'} arrived`
}
