'use client'

import { useMemo } from 'react'
import { useThemeStore } from '@/store/theme'
import { getGlassDiaryColors } from '@/lib/glassDiaryColors'
import LeftPage from '@/components/desk/LeftPage'
import RightPage from '@/components/desk/RightPage'
import type { JournalEntry } from '@/store/journal'
import ShareCardFrame from './ShareCardFrame'

const SPREAD_W = 1300 // a single open spread (left page + right page side-by-side)
const SPREAD_H = 820

interface JournalShareCardProps {
  entry: JournalEntry
  /** Optional small label rendered in the footer (e.g. "a memory from 3 weeks ago"). */
  subtitle?: string
}

/**
 * The diary share image. Renders the same LeftPage/RightPage spread the
 * user sees on screen, scaled down to fit inside ShareCardFrame's content
 * area. Used for both the live diary AND memory reveals.
 *
 * Intended to be rendered off-screen at fixed dimensions (the parent
 * container should position it at left:-9999px until capture).
 */
export default function JournalShareCard({ entry, subtitle }: JournalShareCardProps) {
  const { theme } = useThemeStore()
  const colors = getGlassDiaryColors(theme)

  // LeftPage/RightPage want a stricter Photo position type (1 | 2).
  // Same adapter shape as MemoryDiaryView.tsx.
  const entryForPages = useMemo(() => ({
    id: entry.id,
    text: entry.text,
    song: entry.song ?? null,
    createdAt: entry.createdAt,
    style: entry.style ?? null,
    photos: (entry.photos || []).map((p) => ({
      id: p.id,
      url: p.url,
      rotation: p.rotation,
      position: (p.position === 2 ? 2 : 1) as 1 | 2,
    })),
    doodles: entry.doodles || [],
  }), [entry])

  // Frame inner content area is roughly 960×1130 (1080-2*60, 1350-100-120).
  // The spread is 1300×820 → scale to fit width: 960/1300 ≈ 0.74.
  const FRAME_INNER_W = 960
  const scale = FRAME_INNER_W / SPREAD_W

  return (
    <ShareCardFrame date={new Date(entry.createdAt)} subtitle={subtitle}>
      {/* Scoped style: hide cross-origin iframes (song embeds don't capture). */}
      <style>{`.share-card-spread iframe { display: none !important; }`}</style>
      <div
        className="share-card-spread"
        style={{
          width: `${SPREAD_W}px`,
          height: `${SPREAD_H}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          ['--page-bg' as string]: colors.pageBg,
          ['--page-bg-solid' as string]: colors.pageBgSolid,
          display: 'flex',
          position: 'relative',
        } as React.CSSProperties}
      >
        {/* Left page */}
        <div
          style={{
            width: SPREAD_W / 2,
            height: SPREAD_H,
            backgroundColor: colors.pageBgSolid,
            backgroundImage: `linear-gradient(${colors.pageBg}, ${colors.pageBg})`,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 14px 40px rgba(0,0,0,0.25)',
          }}
        >
          <div style={{ height: '100%', padding: '20px 30px', position: 'relative', overflow: 'hidden' }}>
            <LeftPage entry={entryForPages} isNewEntry={false} />
          </div>
        </div>

        {/* Right page */}
        <div
          style={{
            width: SPREAD_W / 2,
            height: SPREAD_H,
            backgroundColor: colors.pageBgSolid,
            backgroundImage: `linear-gradient(${colors.pageBg}, ${colors.pageBg})`,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 14px 40px rgba(0,0,0,0.25)',
          }}
        >
          <div style={{ height: '100%', padding: '20px 30px', position: 'relative', overflow: 'hidden' }}>
            <RightPage entry={entryForPages} isNewEntry={false} photos={entryForPages.photos} />
          </div>
        </div>

        {/* Song pill — replaces the hidden iframe so the share card stays intentional. */}
        {entry.song && (
          <div
            style={{
              position: 'absolute',
              bottom: 24,
              left: 30,
              padding: '8px 14px',
              borderRadius: 999,
              background: 'rgba(0,0,0,0.06)',
              border: '1px solid rgba(0,0,0,0.08)',
              fontFamily: 'Georgia, serif',
              fontSize: 14,
              fontStyle: 'italic',
              color: 'rgba(0,0,0,0.65)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>🎵</span>
            <span>song</span>
          </div>
        )}
      </div>
    </ShareCardFrame>
  )
}
