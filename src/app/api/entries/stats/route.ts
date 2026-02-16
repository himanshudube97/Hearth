import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

interface MonthStats {
  month: string // "2024-02"
  entryCount: number
  avgMood: number
  daysWithEntries: number
}

interface YearStats {
  year: number
  entryCount: number
  avgMood: number
  months: MonthStats[]
}

// GET - Fetch entry statistics for navigation and insights
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all entries with minimal data for stats calculation
    const entries = await prisma.journalEntry.findMany({
      where: { userId: user.id },
      select: {
        createdAt: true,
        mood: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    if (entries.length === 0) {
      return NextResponse.json({
        totalEntries: 0,
        years: [],
        firstEntryDate: null,
        lastEntryDate: null,
        currentStreak: 0,
        longestStreak: 0,
      })
    }

    // Group entries by year and month
    const yearMap = new Map<number, Map<string, { entries: typeof entries; days: Set<string> }>>()

    entries.forEach(entry => {
      const date = new Date(entry.createdAt)
      const year = date.getFullYear()
      const month = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const day = date.toDateString()

      if (!yearMap.has(year)) {
        yearMap.set(year, new Map())
      }
      const monthMap = yearMap.get(year)!

      if (!monthMap.has(month)) {
        monthMap.set(month, { entries: [], days: new Set() })
      }
      const monthData = monthMap.get(month)!
      monthData.entries.push(entry)
      monthData.days.add(day)
    })

    // Calculate year stats
    const years: YearStats[] = []

    yearMap.forEach((monthMap, year) => {
      const months: MonthStats[] = []
      let yearEntryCount = 0
      let yearMoodSum = 0

      monthMap.forEach((data, month) => {
        const entryCount = data.entries.length
        const avgMood = data.entries.reduce((sum, e) => sum + e.mood, 0) / entryCount

        months.push({
          month,
          entryCount,
          avgMood: Math.round(avgMood * 10) / 10,
          daysWithEntries: data.days.size,
        })

        yearEntryCount += entryCount
        yearMoodSum += data.entries.reduce((sum, e) => sum + e.mood, 0)
      })

      // Sort months in descending order
      months.sort((a, b) => b.month.localeCompare(a.month))

      years.push({
        year,
        entryCount: yearEntryCount,
        avgMood: Math.round((yearMoodSum / yearEntryCount) * 10) / 10,
        months,
      })
    })

    // Sort years in descending order
    years.sort((a, b) => b.year - a.year)

    // Calculate streaks
    const sortedDates = [...new Set(entries.map(e => new Date(e.createdAt).toDateString()))]
      .map(d => new Date(d))
      .sort((a, b) => b.getTime() - a.getTime())

    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 1

    // Check current streak (from today)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (sortedDates.length > 0) {
      const lastEntry = new Date(sortedDates[0])
      lastEntry.setHours(0, 0, 0, 0)

      if (lastEntry.getTime() === today.getTime() || lastEntry.getTime() === yesterday.getTime()) {
        currentStreak = 1
        for (let i = 1; i < sortedDates.length; i++) {
          const curr = new Date(sortedDates[i])
          const prev = new Date(sortedDates[i - 1])
          curr.setHours(0, 0, 0, 0)
          prev.setHours(0, 0, 0, 0)

          const diffDays = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24)
          if (diffDays === 1) {
            currentStreak++
          } else {
            break
          }
        }
      }

      // Calculate longest streak
      for (let i = 1; i < sortedDates.length; i++) {
        const curr = new Date(sortedDates[i])
        const prev = new Date(sortedDates[i - 1])
        curr.setHours(0, 0, 0, 0)
        prev.setHours(0, 0, 0, 0)

        const diffDays = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24)
        if (diffDays === 1) {
          tempStreak++
        } else {
          longestStreak = Math.max(longestStreak, tempStreak)
          tempStreak = 1
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak)
    }

    return NextResponse.json({
      totalEntries: entries.length,
      years,
      firstEntryDate: entries[entries.length - 1].createdAt,
      lastEntryDate: entries[0].createdAt,
      currentStreak,
      longestStreak,
    })
  } catch (error) {
    console.error('Error fetching entry stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch entry stats' },
      { status: 500 }
    )
  }
}
