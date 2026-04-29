'use client'

import SongEmbed from '@/components/SongEmbed'
import DoodlePreview from '@/components/DoodlePreview'
import { StrokeData } from '@/store/journal'

interface Props {
  photos?: string[]      // image URLs or base64 data URLs
  doodle?: StrokeData[]
  songUrl?: string | null
}

export default function TuckedIn({ photos = [], doodle, songUrl }: Props) {
  const hasAnything = photos.length > 0 || (doodle && doodle.length > 0) || !!songUrl
  if (!hasAnything) return null

  return (
    <div className="mt-6 border-t border-dashed border-[rgba(80,60,40,0.2)] pt-4">
      <div className="mb-3 text-center text-xs uppercase tracking-[0.2em] opacity-50">— tucked in —</div>
      <div className="flex flex-wrap items-end justify-center gap-4">
        {photos.slice(0, 3).map((src, i) => (
          <div
            key={i}
            className="relative bg-white p-2 pb-6 shadow-md"
            style={{
              transform: `rotate(${i % 2 === 0 ? -2 : 2}deg)`,
              width: 140,
              height: 160,
            }}
          >
            {/* washi tape strip */}
            <div className="absolute -top-2 left-1/2 h-4 w-12 -translate-x-1/2 rotate-3 bg-[rgba(200,180,120,0.65)]" />
            <div className="relative h-full w-full overflow-hidden bg-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="tucked-in photo" className="h-full w-full object-cover" />
            </div>
          </div>
        ))}

        {doodle && doodle.length > 0 && (
          <div
            className="bg-[var(--color-paper,#f4ead0)] p-3 shadow-sm border border-[rgba(80,60,40,0.15)]"
            style={{ transform: 'rotate(-1.5deg)', width: 140, height: 140 }}
          >
            <DoodlePreview strokes={doodle} />
          </div>
        )}

        {songUrl && (
          <div
            className="rounded-md bg-[rgba(80,60,40,0.06)] px-3 py-2 shadow-sm"
            style={{ transform: 'rotate(1deg)' }}
          >
            <SongEmbed url={songUrl} />
          </div>
        )}
      </div>
    </div>
  )
}
