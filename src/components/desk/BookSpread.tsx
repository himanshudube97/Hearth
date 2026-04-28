'use client'

import React, { useCallback, useEffect, useRef, useState, memo, forwardRef } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import { useDeskStore } from '@/store/desk'
import { getGlassDiaryColors, GlassDiaryColors } from '@/lib/glassDiaryColors'
import LeftPage from './LeftPage'
import RightPage from './RightPage'
import EntrySelector from './EntrySelector'
import { RibbonBookmark } from './interactive/RibbonBookmark'
import RibbonTag from './interactive/RibbonTag'
import ThemeOrnament from './decorations/ThemeOrnament'
import WhisperFooter from './WhisperFooter'
import SpineOrnaments from './SpineOrnaments'
import { StrokeData, useJournalStore } from '@/store/journal'
import { useAutosaveEntry, AutosaveDraft } from '@/hooks/useAutosaveEntry'
import { isEntryLocked } from '@/lib/entry-lock-client'
import { htmlToPlainText, splitTextForSpread } from '@/lib/text-utils'

const HTMLFlipBook = dynamic(() => import('react-pageflip'), { ssr: false })

interface Photo {
  id?: string
  url: string
  rotation: number
  position: 1 | 2
}

interface Entry {
  id: string
  text: string
  mood: number
  song?: string | null
  photos?: Photo[]
  doodles?: Array<{ strokes: StrokeData[] }>
  createdAt: string
}

// Fixed page dimensions for the flipbook
const PAGE_WIDTH = 650
const PAGE_HEIGHT = 820


const PageWrapper = memo(
  forwardRef<HTMLDivElement, {
    children: React.ReactNode
    side: 'left' | 'right'
    colors: GlassDiaryColors
  }>(function PageWrapper({ children, side, colors }, ref) {
    const isLeft = side === 'left'
    // Inline styles get wiped by the library mid-flip, so background/border/
    // shadow live in CSS classes (see globals.css .diary-page). Width and
    // height stay inline because the library overrides them anyway.
    return (
      <div
        ref={ref}
        className={`diary-page ${isLeft ? 'diary-page--left' : 'diary-page--right'}`}
        style={{
          width: `${PAGE_WIDTH}px`,
          height: `${PAGE_HEIGHT}px`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
            zIndex: 10,
            padding: isLeft ? '20px 20px 20px 50px' : '20px 50px 20px 20px',
          }}
        >
          {children}
        </div>
      </div>
    )
  })
)

function combineDraftHtml(left: string, right: string): string {
  // Mirrors the conversion the old handleSave did: plain newline-separated
  // text per page → <p>-wrapped HTML, concatenated with no page-break marker.
  const leftHtml = left.trim() ? `<p>${left.replace(/\n/g, '</p><p>')}</p>` : ''
  const rightHtml = right.trim() ? `<p>${right.replace(/\n/g, '</p><p>')}</p>` : ''
  return leftHtml + rightHtml
}

export default function BookSpread() {
  const { theme, themeName } = useThemeStore()
  const setCurrentSong = useJournalStore((s) => s.setCurrentSong)
  const setCurrentMood = useJournalStore((s) => s.setCurrentMood)
  const setDoodleStrokes = useJournalStore((s) => s.setDoodleStrokes)
  const colors = getGlassDiaryColors(theme)
  // Subscribe via selectors so BookSpread does NOT re-render when
  // leftPageDraft/rightPageDraft change in the desk store. If it did,
  // react-pageflip would rebuild page DOM on every keystroke and kill focus.
  const globalCurrentSpread = useDeskStore((s) => s.currentSpread)
  const totalSpreads = useDeskStore((s) => s.totalSpreads)
  const setTotalSpreads = useDeskStore((s) => s.setTotalSpreads)
  const goToSpread = useDeskStore((s) => s.goToSpread)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const flipBookRef = useRef<any>(null)
  const diaryRootRef = useRef<HTMLDivElement>(null)

  const autosave = useAutosaveEntry()
  const autosaveRef = useRef(autosave)
  autosaveRef.current = autosave

  const [entries, setEntries] = useState<Entry[]>([])
  const [todayEntries, setTodayEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null)
  const [pendingPhotos, setPendingPhotos] = useState<Photo[]>([])
  const [rightTextareaFocusTrigger, setRightTextareaFocusTrigger] = useState(0)
  const [leftTextareaFocusTrigger, setLeftTextareaFocusTrigger] = useState(0)

  // Track pendingPhotos via ref so the autosave-trigger callback (which is
  // wired via store .subscribe outside React's render cycle) sees fresh data.
  const pendingPhotosRef = useRef(pendingPhotos)
  pendingPhotosRef.current = pendingPhotos

  // Fetch entries on mount. If there's an unlocked today-entry, pluck the
  // most recent one to be the "active editing target" — bound to the
  // new-entry spread, with autosave configured to PUT to its id. The rest
  // (including any older today entries) stay in the regular flipbook list.
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const res = await fetch('/api/entries?limit=50')
        if (!res.ok) return
        const data = await res.json()
        const fetched: Entry[] = data.entries || []
        if (cancelled) return

        const startOfToday = new Date()
        startOfToday.setHours(0, 0, 0, 0)
        const isToday = (e: Entry) => new Date(e.createdAt) >= startOfToday
        const isUnlocked = (e: Entry) => !isEntryLocked(e.createdAt)

        // Most recent unlocked today entry, if any → hydrate as active.
        const activeIdx = fetched.findIndex((e) => isToday(e) && isUnlocked(e))
        const active = activeIdx >= 0 ? fetched[activeIdx] : null
        const remainder = activeIdx >= 0
          ? [...fetched.slice(0, activeIdx), ...fetched.slice(activeIdx + 1)]
          : fetched

        setEntries(remainder)
        setTotalSpreads(remainder.length + 1)

        const todays = fetched.filter(isToday)
        setTodayEntries(todays)

        if (active) {
          // Hydrate active state from the entry.
          const plain = htmlToPlainText(active.text || '')
          const [leftPlain, rightPlain] = splitTextForSpread(plain)
          useDeskStore.getState().setDrafts(leftPlain, rightPlain)
          setCurrentSong(active.song || '')
          setCurrentMood(active.mood ?? 2)
          const doodleStrokes = active.doodles?.[0]?.strokes ?? []
          setDoodleStrokes(doodleStrokes)
          // Photos: map the entry's photos to the local pending shape.
          const activePhotos: Photo[] = (active.photos || []).map((p) => ({
            id: p.id,
            url: p.url,
            rotation: p.rotation,
            position: p.position,
          }))
          setPendingPhotos(activePhotos)
          setCurrentEntryId(active.id)
          autosaveRef.current.reset(active.id)
        }
      } catch (error) {
        console.error('Failed to fetch entries:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [setTotalSpreads, setCurrentSong, setCurrentMood, setDoodleStrokes])

  // After loading, jump to the new-entry spread (last)
  useEffect(() => {
    if (!loading) {
      goToSpread(entries.length)
    }
  }, [loading, entries.length, goToSpread])

  // Build the current draft from all the places its parts live.
  const buildDraft = useCallback((): AutosaveDraft => {
    const desk = useDeskStore.getState()
    const journal = useJournalStore.getState()
    const text = combineDraftHtml(desk.leftPageDraft, desk.rightPageDraft)
    return {
      text,
      mood: journal.currentMood,
      song: journal.currentSong || null,
      photos: pendingPhotosRef.current.map((p) => ({
        url: p.url,
        position: p.position,
        rotation: p.rotation,
        spread: 1,
      })),
      doodles: journal.currentDoodleStrokes.length > 0
        ? [{ strokes: journal.currentDoodleStrokes, spread: 1 }]
        : [],
    }
  }, [])

  // Subscribe to draft + journal store changes WITHOUT re-rendering
  // BookSpread (which would tear down the flipbook). Each change kicks the
  // debounced autosave trigger.
  useEffect(() => {
    if (loading) return
    const unsubDesk = useDeskStore.subscribe((state, prev) => {
      if (
        state.leftPageDraft !== prev.leftPageDraft ||
        state.rightPageDraft !== prev.rightPageDraft
      ) {
        autosaveRef.current.trigger(buildDraft())
      }
    })
    const unsubJournal = useJournalStore.subscribe((state, prev) => {
      if (
        state.currentSong !== prev.currentSong ||
        state.currentMood !== prev.currentMood ||
        state.currentDoodleStrokes !== prev.currentDoodleStrokes
      ) {
        autosaveRef.current.trigger(buildDraft())
      }
    })
    return () => {
      unsubDesk()
      unsubJournal()
    }
  }, [loading, buildDraft])

  // Photos live in BookSpread state, so a normal effect catches them.
  useEffect(() => {
    if (loading) return
    autosaveRef.current.trigger(buildDraft())
    // Only fire on photo changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPhotos, loading])

  // Library's onFlip event: convert page index -> spread index and sync store
  const handleFlip = useCallback((e: { data: number }) => {
    goToSpread(Math.floor(e.data / 2))
  }, [goToSpread])

  // Programmatic external goToSpread() calls (e.g. EntrySelector clicks)
  // need to be pushed back to the library so its visible page matches.
  useEffect(() => {
    const pageFlip = flipBookRef.current?.pageFlip?.()
    if (!pageFlip) return
    const targetPage = globalCurrentSpread * 2
    if (pageFlip.getCurrentPageIndex?.() !== targetPage) {
      pageFlip.turnToPage?.(targetPage)
    }
  }, [globalCurrentSpread])

  const handlePrevPage = useCallback(() => {
    flipBookRef.current?.pageFlip()?.flipPrev()
  }, [])

  const handleNextPage = useCallback(() => {
    flipBookRef.current?.pageFlip()?.flipNext()
  }, [])

  // Two-finger scroll = arrow click. Accumulate wheel delta and fire the
  // library's full flip animation past a threshold; lock out further flips
  // for the duration of the animation so one swipe == one page.
  useEffect(() => {
    const el = diaryRootRef.current
    if (!el) return

    const THRESHOLD = 60
    const FLIP_LOCK_MS = 1300

    let accumulated = 0
    let isFlipping = false

    const handler = (e: WheelEvent) => {
      const dominant =
        Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) e.preventDefault()
      if (isFlipping || dominant === 0) return

      accumulated += dominant
      if (Math.abs(accumulated) < THRESHOLD) return

      isFlipping = true
      const pf = flipBookRef.current?.pageFlip?.()
      if (accumulated > 0) pf?.flipNext()
      else pf?.flipPrev()
      accumulated = 0
      setTimeout(() => {
        isFlipping = false
      }, FLIP_LOCK_MS)
    }

    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  const handleLeftPageFull = useCallback((overflowText: string) => {
    if (overflowText) {
      useDeskStore.getState().setRightPageDraft((prev) => overflowText + prev)
    }
    setRightTextareaFocusTrigger(prev => prev + 1)
  }, [])

  const handleNavigateRight = useCallback(() => {
    setRightTextareaFocusTrigger(prev => prev + 1)
  }, [])

  const handleNavigateLeft = useCallback(() => {
    setLeftTextareaFocusTrigger(prev => prev + 1)
  }, [])

  // Hydrate the new-entry spread with an existing entry's data so the user
  // can keep editing it. Flushes any pending autosave for the previous
  // active entry first, then re-targets autosave at the chosen entry.
  const hydrateActive = useCallback(async (entry: Entry) => {
    await autosaveRef.current.flush()
    const plain = htmlToPlainText(entry.text || '')
    const [leftPlain, rightPlain] = splitTextForSpread(plain)
    useDeskStore.getState().setDrafts(leftPlain, rightPlain)
    setCurrentSong(entry.song || '')
    setCurrentMood(entry.mood ?? 2)
    setDoodleStrokes(entry.doodles?.[0]?.strokes ?? [])
    setPendingPhotos((entry.photos || []).map((p) => ({
      id: p.id,
      url: p.url,
      rotation: p.rotation,
      position: p.position,
    })))
    setCurrentEntryId(entry.id)
    autosaveRef.current.reset(entry.id)
  }, [setCurrentSong, setCurrentMood, setDoodleStrokes])

  const handleEntrySelect = useCallback(async (entryId: string | null) => {
    if (!entryId) return
    const target = todayEntries.find((e) => e.id === entryId)
      ?? entries.find((e) => e.id === entryId)
    if (!target) return

    if (!isEntryLocked(target.createdAt)) {
      // Today entry, still editable → hydrate onto the new-entry spread.
      await hydrateActive(target)
      goToSpread(entries.length)
      return
    }
    // Locked entry → just navigate to its read-only spread.
    setCurrentEntryId(entryId)
    const idx = entries.findIndex((e) => e.id === entryId)
    if (idx >= 0) goToSpread(idx)
  }, [todayEntries, entries, hydrateActive, goToSpread])

  const handleNewEntry = useCallback(async () => {
    await autosaveRef.current.flush()
    autosaveRef.current.reset(null)
    setCurrentEntryId(null)
    useDeskStore.getState().clearDrafts()
    setPendingPhotos([])
    setCurrentSong('')
    setCurrentMood(2)
    setDoodleStrokes([])
    goToSpread(entries.length)
  }, [entries.length, goToSpread, setCurrentSong, setCurrentMood, setDoodleStrokes])

  const handlePhotoAdd = useCallback((position: 1 | 2, dataUrl: string) => {
    const rotation = position === 1 ? -8 + Math.floor(Math.random() * 6) : 5 + Math.floor(Math.random() * 6)
    const newPhoto: Photo = {
      url: dataUrl,
      position,
      rotation,
    }
    setPendingPhotos(prev => [...prev.filter(p => p.position !== position), newPhoto])
  }, [])

  const isNewEntrySpread = globalCurrentSpread === entries.length

  // Floating date pill: derive from the spread currently visible
  const visibleEntry = !isNewEntrySpread && globalCurrentSpread < entries.length
    ? entries[globalCurrentSpread]
    : null
  const spreadDate = visibleEntry ? new Date(visibleEntry.createdAt) : new Date()

  return (
    <div
      ref={diaryRootRef}
      className="relative"
      style={{
        perspective: '2500px',
        perspectiveOrigin: 'center center',
        overscrollBehaviorX: 'contain',
      }}
    >
      {/* Top controls */}
      <motion.div
        className="absolute -top-14 left-0 z-20 flex items-center gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div
          className="px-4 py-2 rounded-full text-xs"
          style={{
            background: theme.glass.bg,
            color: theme.text.muted,
            border: `1px solid ${theme.glass.border}`,
          }}
        >
          {isNewEntrySpread
            ? 'New Entry'
            : `Entry ${entries.length - globalCurrentSpread} of ${entries.length}`}
        </div>

        {(todayEntries.length > 0 || isNewEntrySpread) && (
          <EntrySelector
            entries={todayEntries}
            currentEntryId={currentEntryId}
            onEntrySelect={handleEntrySelect}
            onNewEntry={handleNewEntry}
          />
        )}
      </motion.div>

      {/* Book frame: positions a decorative hardcover background behind the
          spread so the pages read as set inside an open hardback diary.
          inline-block shrink-wraps to the inner motion.div's size so the
          cover's negative-inset extension is anchored to the page edges,
          not the outer page width. */}
      <div
        className="relative inline-block"
        style={{
          ['--book-cover-bg' as string]: colors.cover,
          ['--book-cover-border' as string]: colors.coverBorder,
        } as React.CSSProperties}
      >
        <div className="book-cover" />
      {/* Book wrapper. Sized for the spread (1300x820), relative so chrome
          can be positioned absolutely on top. The --page-bg CSS variable is
          inherited by the .diary-page children so each page tints to the
          current theme without setting it inline (the library would wipe
          inline styles mid-flip). */}
      <motion.div
        className="relative"
        style={{
          width: `${PAGE_WIDTH * 2}px`,
          height: `${PAGE_HEIGHT}px`,
          transformStyle: 'preserve-3d',
          ['--page-bg' as string]: colors.pageBg,
          ['--page-bg-solid' as string]: colors.pageBgSolid,
        } as React.CSSProperties}
        initial={{ rotateX: 5, opacity: 0 }}
        animate={{ rotateX: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Ribbon bookmark with brass swivel clasp + oval hangtag dangling beneath */}
        <RibbonBookmark color={colors.ribbon}>
          <RibbonTag date={spreadDate} colors={colors} />
        </RibbonBookmark>

        {/* Whisper + ornaments below the spread */}
        <div className="absolute -bottom-12 left-0 right-0 flex items-center justify-center gap-4 pointer-events-none z-10">
          <ThemeOrnament themeName={themeName} color={colors.ribbon} size={28} flip />
          <WhisperFooter color={colors.prompt} />
          <ThemeOrnament themeName={themeName} color={colors.ribbon} size={28} />
        </div>

        {/* Top flourish — chapter-opener ornament that adapts per theme.
            Replaces the date pill (date now lives on the bookmark hangtag). */}
        <div
          className="absolute -top-1 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 pointer-events-none"
        >
          <div style={{ width: '36px', height: '1px', background: colors.pageBorder }} />
          <ThemeOrnament themeName={themeName} color={colors.ribbon} size={20} />
          <div style={{ width: '36px', height: '1px', background: colors.pageBorder }} />
        </div>

        {/* Flipbook (only after entries are loaded so startPage is correct).
            Page count is stable across the autosave lifecycle (the active
            entry stays bound to the new-entry spread instead of getting
            appended), so no remount-on-save key is needed. */}
        {!loading && (
          <HTMLFlipBook
            ref={flipBookRef}
            width={PAGE_WIDTH}
            height={PAGE_HEIGHT}
            size="fixed"
            minWidth={PAGE_WIDTH}
            maxWidth={PAGE_WIDTH}
            minHeight={PAGE_HEIGHT}
            maxHeight={PAGE_HEIGHT}
            drawShadow={true}
            maxShadowOpacity={0.5}
            flippingTime={1200}
            useMouseEvents={false}
            mobileScrollSupport={false}
            showCover={false}
            startPage={entries.length * 2}
            onFlip={handleFlip}
            className=""
            style={{}}
            startZIndex={0}
            autoSize={false}
            clickEventForward={true}
            usePortrait={false}
            swipeDistance={30}
            showPageCorners={false}
            disableFlipByClick={true}
          >
            {/* Existing entries: oldest first so the newest sits next to the
                new-entry spread at the back of the book. Reverse-chronological
                navigation: ‹ goes to older entries, › advances toward the new-entry. */}
            {[...entries].reverse().flatMap((entry) => [
              <PageWrapper key={`${entry.id}-L`} side="left" colors={colors}>
                <LeftPage
                  entry={entry}
                  isNewEntry={false}
                />
              </PageWrapper>,
              <PageWrapper key={`${entry.id}-R`} side="right" colors={colors}>
                <RightPage
                  entry={entry}
                  isNewEntry={false}
                  photos={entry.photos || []}
                />
              </PageWrapper>,
            ])}

            {/* New-entry spread (always last) */}
            <PageWrapper key="new-L" side="left" colors={colors}>
              <LeftPage
                entry={null}
                isNewEntry={true}
                onPageFull={handleLeftPageFull}
                onNavigateRight={handleNavigateRight}
                focusTrigger={leftTextareaFocusTrigger}
              />
            </PageWrapper>
            <PageWrapper key="new-R" side="right" colors={colors}>
              <RightPage
                entry={null}
                isNewEntry={true}
                photos={pendingPhotos}
                onPhotoAdd={handlePhotoAdd}
                autosaveStatus={autosave.status}
                focusTrigger={rightTextareaFocusTrigger}
                onNavigateLeft={handleNavigateLeft}
              />
            </PageWrapper>
          </HTMLFlipBook>
        )}

        {/* Binding spine: slim kraft band + twine wrap + dated hangtag.
            Rendered as a sibling of HTMLFlipBook so flip animation is untouched. */}
        <SpineOrnaments colors={colors} />

        {/* Left edge clicker */}
        {globalCurrentSpread > 0 && (
          <motion.div
            onClick={handlePrevPage}
            className="absolute left-0 top-0 bottom-0 w-14 cursor-pointer z-30 flex items-center justify-center"
            style={{
              background: 'linear-gradient(90deg, rgba(0,0,0,0.03) 0%, transparent 100%)',
            }}
            whileHover={{
              background: 'linear-gradient(90deg, rgba(0,0,0,0.08) 0%, transparent 100%)',
            }}
          >
            <motion.div
              className="text-3xl"
              style={{ color: theme.text.muted }}
              animate={{ x: [-4, 4, -4], opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ‹
            </motion.div>
          </motion.div>
        )}

        {/* Right edge clicker */}
        {globalCurrentSpread < totalSpreads - 1 && (
          <motion.div
            onClick={handleNextPage}
            className="absolute right-0 top-0 bottom-0 w-14 cursor-pointer z-30 flex items-center justify-center"
            style={{
              background: 'linear-gradient(270deg, rgba(0,0,0,0.03) 0%, transparent 100%)',
            }}
            whileHover={{
              background: 'linear-gradient(270deg, rgba(0,0,0,0.08) 0%, transparent 100%)',
            }}
          >
            <motion.div
              className="text-3xl"
              style={{ color: theme.text.muted }}
              animate={{ x: [4, -4, 4], opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ›
            </motion.div>
          </motion.div>
        )}

      </motion.div>
      </div>
    </div>
  )
}
