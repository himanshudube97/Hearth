import { describe, it, expect } from 'vitest'
import { defaultSlotForDay, targetMinutesPastSeven, isCurrentWindowTarget } from '@/lib/reminder-schedule'

describe('defaultSlotForDay', () => {
  it('returns a slot in [0, 11] (12 fifteen-minute slots between 7pm and 10pm)', () => {
    const slot = defaultSlotForDay('user-abc', '2026-05-03')
    expect(slot).toBeGreaterThanOrEqual(0)
    expect(slot).toBeLessThan(12)
  })

  it('is deterministic for the same userId+date', () => {
    const a = defaultSlotForDay('user-abc', '2026-05-03')
    const b = defaultSlotForDay('user-abc', '2026-05-03')
    expect(a).toBe(b)
  })

  it('varies across days for the same user', () => {
    const slots = new Set<number>()
    for (let i = 1; i <= 30; i++) {
      const date = `2026-05-${String(i).padStart(2, '0')}`
      slots.add(defaultSlotForDay('user-abc', date))
    }
    // At least 6 distinct slots across 30 days — extremely high probability
    expect(slots.size).toBeGreaterThanOrEqual(6)
  })
})

describe('targetMinutesPastSeven', () => {
  it('default mode returns slot * 15 minutes past 7pm', () => {
    // slot 0 -> 0 min past 7pm -> 19:00
    // slot 11 -> 165 min -> 21:45 (last slot before 22:00)
    expect(targetMinutesPastSeven({ mode: 'default', userId: 'u', dateStr: '2026-05-03' }))
      .toBeGreaterThanOrEqual(0)
    expect(targetMinutesPastSeven({ mode: 'default', userId: 'u', dateStr: '2026-05-03' }))
      .toBeLessThanOrEqual(165)
  })

  it('override mode returns minutes-past-7pm for HH:MM in [19:00, 21:45]', () => {
    expect(targetMinutesPastSeven({ mode: 'override', time: '19:00' })).toBe(0)
    expect(targetMinutesPastSeven({ mode: 'override', time: '20:30' })).toBe(90)
    expect(targetMinutesPastSeven({ mode: 'override', time: '21:45' })).toBe(165)
  })

  it('override mode allows times outside the default window (returns negative or >180)', () => {
    expect(targetMinutesPastSeven({ mode: 'override', time: '08:00' })).toBe(-660)
    expect(targetMinutesPastSeven({ mode: 'override', time: '23:00' })).toBe(240)
  })
})

describe('isCurrentWindowTarget', () => {
  it('matches when nowLocal is in the same 15-min slot as target', () => {
    // target = 20:00 local (60 min past 7pm)
    // nowLocal = 20:07 local → same 15-min window
    expect(isCurrentWindowTarget({
      nowLocalISO: '2026-05-03T20:07:00',
      targetMinutesPastSeven: 60,
    })).toBe(true)
  })

  it('does not match when nowLocal is in a different 15-min slot', () => {
    expect(isCurrentWindowTarget({
      nowLocalISO: '2026-05-03T20:16:00',
      targetMinutesPastSeven: 60,
    })).toBe(false)
  })

  it('does not match when target is 19:00 and nowLocal is 18:59', () => {
    expect(isCurrentWindowTarget({
      nowLocalISO: '2026-05-03T18:59:00',
      targetMinutesPastSeven: 0,
    })).toBe(false)
  })
})
