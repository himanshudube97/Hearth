import { useState, useEffect, useCallback } from 'react'
import { JournalEntry } from '@/store/journal'
import { useE2EE } from './useE2EE'

interface Pagination {
  hasMore: boolean
  nextCursor: string | null
  limit: number
}

interface EntriesResponse {
  entries: JournalEntry[]
  pagination: Pagination
}

interface MonthStats {
  month: string
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

interface StatsResponse {
  totalEntries: number
  years: YearStats[]
  firstEntryDate: string | null
  lastEntryDate: string | null
  currentStreak: number
  longestStreak: number
}

interface UseEntriesOptions {
  month?: string // "2024-02"
  year?: string
  mood?: number[]
  search?: string
  today?: boolean
  limit?: number
  includeDoodles?: boolean
}

export function useEntries(options: UseEntriesOptions = {}) {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<Pagination>({
    hasMore: false,
    nextCursor: null,
    limit: 20,
  })
  const { decryptEntriesFromServer, isE2EEReady } = useE2EE()

  const buildUrl = useCallback((cursor?: string) => {
    const params = new URLSearchParams()

    if (options.month) params.set('month', options.month)
    if (options.year) params.set('year', options.year)
    if (options.mood && options.mood.length > 0) params.set('mood', options.mood.join(','))
    if (options.search) params.set('search', options.search)
    if (options.today) params.set('today', 'true')
    if (options.limit) params.set('limit', options.limit.toString())
    if (options.includeDoodles === false) params.set('includeDoodles', 'false')
    if (cursor) params.set('cursor', cursor)

    return `/api/entries?${params.toString()}`
  }, [options.month, options.year, options.mood, options.search, options.today, options.limit, options.includeDoodles])

  const fetchEntries = useCallback(async (reset = true) => {
    try {
      if (reset) {
        setLoading(true)
        setEntries([])
      } else {
        setLoadingMore(true)
      }

      const cursor = reset ? undefined : pagination.nextCursor ?? undefined
      const res = await fetch(buildUrl(cursor))

      if (!res.ok) {
        throw new Error('Failed to fetch entries')
      }

      const data: EntriesResponse = await res.json()

      // Decrypt E2EE entries client-side
      const decryptedEntries = await decryptEntriesFromServer(data.entries)

      setEntries(prev => reset ? decryptedEntries : [...prev, ...decryptedEntries])
      setPagination(data.pagination)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [buildUrl, pagination.nextCursor, decryptEntriesFromServer])

  const loadMore = useCallback(() => {
    if (!loadingMore && pagination.hasMore) {
      fetchEntries(false)
    }
  }, [fetchEntries, loadingMore, pagination.hasMore])

  const refresh = useCallback(() => {
    fetchEntries(true)
  }, [fetchEntries])

  // Fetch when options change or E2EE state changes
  useEffect(() => {
    fetchEntries(true)
  }, [options.month, options.year, options.mood?.join(','), options.search, options.today, isE2EEReady])

  return {
    entries,
    loading,
    loadingMore,
    error,
    hasMore: pagination.hasMore,
    loadMore,
    refresh,
  }
}

export function useEntryStats() {
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/entries/stats')

      if (!res.ok) {
        throw new Error('Failed to fetch stats')
      }

      const data: StatsResponse = await res.json()
      setStats(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    refresh: fetchStats,
  }
}

// Hook for fetching a single entry (for expanded view)
export function useEntry(id: string | null) {
  const [entry, setEntry] = useState<JournalEntry | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { decryptEntryFromServer, isE2EEReady } = useE2EE()

  useEffect(() => {
    if (!id) {
      setEntry(null)
      return
    }

    const fetchEntry = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/entries/${id}`)

        if (!res.ok) {
          throw new Error('Failed to fetch entry')
        }

        const data = await res.json()
        // Decrypt E2EE entry client-side
        const decryptedEntry = await decryptEntryFromServer(data)
        setEntry(decryptedEntry)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchEntry()
  }, [id, isE2EEReady, decryptEntryFromServer])

  return { entry, loading, error }
}
