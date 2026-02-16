'use client'

import { useMemo, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeStore } from '@/store/theme'

interface SongEmbedProps {
  url: string
  compact?: boolean
  audioOnly?: boolean // New prop to show custom UI instead of video
}

type EmbedType = 'youtube' | 'spotify' | 'soundcloud' | 'apple' | 'unknown'

interface EmbedInfo {
  type: EmbedType
  embedUrl: string | null
  audioEmbedUrl?: string | null
  title?: string
}

function parseUrl(url: string): EmbedInfo {
  const trimmedUrl = url.trim()

  // YouTube - various formats
  // https://www.youtube.com/watch?v=VIDEO_ID
  // https://youtu.be/VIDEO_ID
  // https://www.youtube.com/embed/VIDEO_ID
  // https://music.youtube.com/watch?v=VIDEO_ID
  const youtubeRegex = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/|music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/
  const youtubeMatch = trimmedUrl.match(youtubeRegex)
  if (youtubeMatch) {
    const videoId = youtubeMatch[1]
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`,
      // For audio-only mode, we use the same embed but hide it
      audioEmbedUrl: `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=1`,
    }
  }

  // Spotify - tracks, albums, playlists, episodes
  // https://open.spotify.com/track/TRACK_ID
  // https://open.spotify.com/album/ALBUM_ID
  // https://open.spotify.com/playlist/PLAYLIST_ID
  const spotifyRegex = /open\.spotify\.com\/(track|album|playlist|episode)\/([a-zA-Z0-9]+)/
  const spotifyMatch = trimmedUrl.match(spotifyRegex)
  if (spotifyMatch) {
    return {
      type: 'spotify',
      embedUrl: `https://open.spotify.com/embed/${spotifyMatch[1]}/${spotifyMatch[2]}?utm_source=generator&theme=0`,
    }
  }

  // SoundCloud - basic detection (embeds require oEmbed API, so we'll just link)
  if (trimmedUrl.includes('soundcloud.com')) {
    return {
      type: 'soundcloud',
      embedUrl: null,
    }
  }

  // Apple Music
  // https://music.apple.com/us/album/song-name/ALBUM_ID?i=TRACK_ID
  const appleMusicRegex = /music\.apple\.com\/([a-z]{2})\/(album|playlist)\/([^\/]+)\/([a-zA-Z0-9\.]+)/
  const appleMatch = trimmedUrl.match(appleMusicRegex)
  if (appleMatch) {
    return {
      type: 'apple',
      embedUrl: `https://embed.music.apple.com/${appleMatch[1]}/${appleMatch[2]}/${appleMatch[4]}`,
    }
  }

  // Check if it's a URL at all
  const isUrl = /^https?:\/\//i.test(trimmedUrl)

  return {
    type: 'unknown',
    embedUrl: null,
    title: isUrl ? trimmedUrl : undefined,
  }
}

// Audio visualizer bars animation
function AudioVisualizer({ isPlaying, color, size = 'md' }: { isPlaying: boolean; color: string; size?: 'sm' | 'md' }) {
  const bars = size === 'sm' ? [1, 2, 3] : [1, 2, 3, 4, 5]
  const height = size === 'sm' ? 'h-4' : 'h-8'
  const maxHeight = size === 'sm' ? '16px' : '32px'

  return (
    <div className={`flex items-end gap-[2px] ${height}`}>
      {bars.map((bar) => (
        <motion.div
          key={bar}
          className="w-[3px] rounded-full"
          style={{ backgroundColor: color }}
          animate={isPlaying ? {
            height: ['4px', maxHeight, '8px', `${parseInt(maxHeight) * 0.7}px`, '6px', `${parseInt(maxHeight) * 0.8}px`, '4px'],
          } : { height: '4px' }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: bar * 0.1,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// Floating music notes for the player area (subtle)
function FloatingNotes({ color }: { color: string }) {
  const notes = ['♪', '♫', '♬', '♩']

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(4)].map((_, i) => (
        <motion.span
          key={i}
          className="absolute text-lg opacity-20"
          style={{ color }}
          initial={{
            x: 20 + Math.random() * 60,
            y: 80,
            opacity: 0,
            scale: 0.5,
          }}
          animate={{
            y: -20,
            opacity: [0, 0.3, 0.2, 0],
            scale: [0.5, 1, 0.8],
            x: 20 + Math.random() * 80,
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: i * 1,
            ease: 'easeOut',
          }}
        >
          {notes[i % notes.length]}
        </motion.span>
      ))}
    </div>
  )
}

// Full screen floating notes - music fills the room
function FullScreenMusicNotes({ color, secondaryColor }: { color: string; secondaryColor: string }) {
  const notes = ['♪', '♫', '♬', '♩', '♪', '♫']

  // Change cursor to music note when playing
  useEffect(() => {
    // Create a style element for the custom cursor
    const style = document.createElement('style')
    style.id = 'music-cursor-style'

    // SVG cursor with music note
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'><text x='4' y='22' font-size='20' fill='${color.replace('#', '%23')}'>♪</text></svg>`

    style.textContent = `
      *, *::before, *::after {
        cursor: url("data:image/svg+xml,${svg}") 12 12, auto !important;
      }
    `

    document.head.appendChild(style)

    return () => {
      const existingStyle = document.getElementById('music-cursor-style')
      if (existingStyle) {
        existingStyle.remove()
      }
    }
  }, [color])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      className="fixed inset-0 pointer-events-none z-40 overflow-hidden"
    >
      {/* Notes floating up from bottom */}
      {[...Array(12)].map((_, i) => (
        <motion.span
          key={`up-${i}`}
          className="absolute text-2xl"
          style={{
            color: i % 2 === 0 ? color : secondaryColor,
            left: `${5 + (i * 8)}%`,
            textShadow: `0 0 20px ${color}50`,
          }}
          initial={{
            y: '100vh',
            opacity: 0,
            scale: 0.3,
            rotate: -20,
          }}
          animate={{
            y: '-10vh',
            opacity: [0, 0.4, 0.3, 0.2, 0],
            scale: [0.3, 0.8, 1, 0.9, 0.7],
            rotate: [-20, 10, -10, 20, 0],
            x: [0, 30, -20, 40, 0],
          }}
          transition={{
            duration: 8 + Math.random() * 4,
            repeat: Infinity,
            delay: i * 0.7,
            ease: 'easeOut',
          }}
        >
          {notes[i % notes.length]}
        </motion.span>
      ))}

      {/* Notes drifting from sides */}
      {[...Array(6)].map((_, i) => (
        <motion.span
          key={`side-${i}`}
          className="absolute text-xl"
          style={{
            color: i % 2 === 0 ? secondaryColor : color,
            top: `${15 + (i * 12)}%`,
            opacity: 0.25,
          }}
          initial={{
            x: i % 2 === 0 ? '-5vw' : '105vw',
            opacity: 0,
            scale: 0.5,
          }}
          animate={{
            x: i % 2 === 0 ? '105vw' : '-5vw',
            opacity: [0, 0.25, 0.2, 0],
            scale: [0.5, 0.9, 0.7],
            y: [0, -50, -30, -80],
          }}
          transition={{
            duration: 12 + Math.random() * 5,
            repeat: Infinity,
            delay: i * 1.5 + 2,
            ease: 'linear',
          }}
        >
          {notes[(i + 2) % notes.length]}
        </motion.span>
      ))}

      {/* Subtle sparkles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`sparkle-${i}`}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: color,
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
            boxShadow: `0 0 10px ${color}`,
          }}
          animate={{
            opacity: [0, 0.6, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: i * 0.8,
            ease: 'easeInOut',
          }}
        />
      ))}
    </motion.div>
  )
}

// Spinning vinyl record
function VinylRecord({ isPlaying, color }: { isPlaying: boolean; color: string }) {
  return (
    <motion.div
      className="relative w-16 h-16 rounded-full flex items-center justify-center"
      style={{
        background: `linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)`,
        boxShadow: `0 0 20px ${color}40`,
      }}
      animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
      transition={isPlaying ? {
        duration: 3,
        repeat: Infinity,
        ease: 'linear',
      } : { duration: 0.5 }}
    >
      {/* Vinyl grooves */}
      <div
        className="absolute inset-2 rounded-full opacity-30"
        style={{
          background: `repeating-radial-gradient(circle at center, transparent 0px, transparent 2px, ${color}20 3px, transparent 4px)`
        }}
      />
      {/* Center label */}
      <div
        className="w-6 h-6 rounded-full"
        style={{
          background: `linear-gradient(135deg, ${color} 0%, ${color}80 100%)`,
        }}
      />
      {/* Center hole */}
      <div className="absolute w-2 h-2 rounded-full bg-black/80" />
    </motion.div>
  )
}

// Get autoplay URL for different platforms
function getAutoplayUrl(embedUrl: string, type: EmbedType): string {
  switch (type) {
    case 'youtube':
      // YouTube: add autoplay=1
      return embedUrl.includes('?')
        ? `${embedUrl}&autoplay=1`
        : `${embedUrl}?autoplay=1`
    case 'spotify':
      // Spotify: already autoplays on user interaction
      return embedUrl
    case 'apple':
      // Apple Music: similar behavior
      return embedUrl
    default:
      return embedUrl
  }
}

// Custom audio player UI
function AudioOnlyPlayer({
  embedUrl,
  originalUrl,
  type,
  theme,
  compact
}: {
  embedUrl: string
  originalUrl: string
  type: EmbedType
  theme: ReturnType<typeof useThemeStore>['theme']
  compact: boolean
}) {
  const [isPlaying, setIsPlaying] = useState(false)

  const platformName = {
    youtube: 'YouTube',
    spotify: 'Spotify',
    apple: 'Apple Music',
    soundcloud: 'SoundCloud',
    unknown: 'Music',
  }[type]

  const platformIcon = {
    youtube: '▶',
    spotify: '●',
    apple: '♪',
    soundcloud: '☁',
    unknown: '♫',
  }[type]

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsPlaying(true)
  }

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsPlaying(false)
  }

  // For portal rendering
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <>
      {/* Full screen music notes - rendered via portal */}
      {mounted && isPlaying && createPortal(
        <AnimatePresence>
          <FullScreenMusicNotes color={theme.accent.warm} secondaryColor={theme.accent.cool} />
        </AnimatePresence>,
        document.body
      )}

      <motion.div
      layout
      className="rounded-2xl overflow-hidden relative"
      onClick={(e) => { e.stopPropagation(); if (!isPlaying) handlePlay(e); }}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        background: isPlaying
          ? `linear-gradient(135deg, ${theme.glass.bg} 0%, ${theme.accent.warm}12 50%, ${theme.accent.cool}08 100%)`
          : `linear-gradient(135deg, ${theme.glass.bg} 0%, ${theme.accent.warm}10 100%)`,
        border: `1px solid ${isPlaying ? theme.accent.warm + '40' : theme.glass.border}`,
        backdropFilter: 'blur(20px)',
        cursor: isPlaying ? 'default' : 'pointer',
      }}
      whileHover={!isPlaying ? { scale: 1.01 } : {}}
      whileTap={!isPlaying ? { scale: 0.99 } : {}}
    >
      {/* Hidden iframe for audio - only when playing */}
      {isPlaying && (
        <iframe
          src={getAutoplayUrl(embedUrl, type)}
          width="1"
          height="1"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          style={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            opacity: 0,
            pointerEvents: 'none',
          }}
        />
      )}

      <AnimatePresence mode="wait">
        {isPlaying ? (
          // Wide playing state
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4"
          >
            {/* Floating notes background */}
            <FloatingNotes color={theme.accent.warm} />

            <div className="flex items-center gap-4 relative z-10">
              {/* Vinyl */}
              <VinylRecord isPlaying={true} color={theme.accent.warm} />

              {/* Center content */}
              <div className="flex-1 flex flex-col items-center justify-center">
                {/* Visualizer */}
                <div className="flex items-center gap-6 mb-2">
                  <AudioVisualizer isPlaying={true} color={theme.accent.cool} />
                  <motion.span
                    className="text-sm font-medium"
                    style={{ color: theme.text.primary }}
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    ♫ Now Playing
                  </motion.span>
                  <AudioVisualizer isPlaying={true} color={theme.accent.warm} />
                </div>
                <span
                  className="text-xs"
                  style={{ color: theme.text.muted }}
                >
                  via {platformName}
                </span>
              </div>

              {/* Stop button */}
              <motion.button
                onClick={handleClose}
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: `${theme.text.muted}15`,
                  color: theme.text.muted,
                }}
                whileHover={{
                  background: `${theme.accent.warm}25`,
                  color: theme.accent.warm,
                  scale: 1.1,
                }}
                whileTap={{ scale: 0.9 }}
              >
                <span className="text-sm">■</span>
              </motion.button>
            </div>

            {/* Animated border glow */}
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                boxShadow: `inset 0 0 30px ${theme.accent.warm}15`,
              }}
              animate={{
                boxShadow: [
                  `inset 0 0 30px ${theme.accent.warm}10`,
                  `inset 0 0 50px ${theme.accent.warm}20`,
                  `inset 0 0 30px ${theme.accent.warm}10`,
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        ) : (
          // Idle state - click to play
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`flex items-center gap-4 ${compact ? 'p-3' : 'p-4'}`}
          >
            {/* Vinyl/Visualizer */}
            <div className="flex-shrink-0">
              {compact ? (
                <AudioVisualizer isPlaying={false} color={theme.accent.warm} />
              ) : (
                <VinylRecord isPlaying={false} color={theme.accent.warm} />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: `${theme.accent.warm}20`,
                    color: theme.accent.warm,
                  }}
                >
                  {platformIcon} {platformName}
                </span>
              </div>
              <p className="text-sm font-medium" style={{ color: theme.text.primary }}>
                Play Music
              </p>
            </div>

            {/* Play button */}
            <motion.div
              className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${theme.accent.warm} 0%, ${theme.accent.cool} 100%)`,
                boxShadow: `0 4px 15px ${theme.accent.warm}40`,
              }}
              whileHover={{ scale: 1.1 }}
            >
              <span className="text-white text-lg ml-0.5">▶</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
    </>
  )
}

export default function SongEmbed({ url, compact = false, audioOnly = true }: SongEmbedProps) {
  const { theme } = useThemeStore()

  const embedInfo = useMemo(() => parseUrl(url), [url])

  // For non-URL text (just song names), show simple text
  if (embedInfo.type === 'unknown' && !embedInfo.title) {
    return (
      <div
        className="flex items-center gap-2 p-3 rounded-xl"
        style={{ background: `${theme.accent.warm}15` }}
      >
        <span style={{ color: theme.accent.warm }}>♫</span>
        <span className="text-sm" style={{ color: theme.text.primary }}>
          {url}
        </span>
      </div>
    )
  }

  // For URLs without embed support, show as clickable link
  if (!embedInfo.embedUrl) {
    return (
      <motion.a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 p-3 rounded-xl hover:opacity-80 transition-opacity"
        style={{ background: `${theme.accent.warm}15` }}
        whileHover={{ scale: 1.01 }}
      >
        <span style={{ color: theme.accent.warm }}>
          {embedInfo.type === 'soundcloud' ? '☁' : '♫'}
        </span>
        <span className="text-sm truncate flex-1" style={{ color: theme.text.primary }}>
          {url}
        </span>
        <span className="text-xs" style={{ color: theme.text.muted }}>↗</span>
      </motion.a>
    )
  }

  // YouTube embed - use custom audio player if audioOnly mode
  if (embedInfo.type === 'youtube') {
    if (audioOnly && embedInfo.embedUrl) {
      return (
        <AudioOnlyPlayer
          embedUrl={embedInfo.embedUrl}
          originalUrl={url}
          type="youtube"
          theme={theme}
          compact={compact}
        />
      )
    }
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl overflow-hidden"
        style={{
          background: theme.glass.bg,
          border: `1px solid ${theme.glass.border}`,
        }}
      >
        <iframe
          src={embedInfo.embedUrl}
          width="100%"
          height={compact ? '80' : '152'}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="rounded-xl"
          style={{ display: 'block' }}
        />
      </motion.div>
    )
  }

  // Spotify embed - use custom audio player if audioOnly mode
  if (embedInfo.type === 'spotify') {
    if (audioOnly && embedInfo.embedUrl) {
      return (
        <AudioOnlyPlayer
          embedUrl={embedInfo.embedUrl}
          originalUrl={url}
          type="spotify"
          theme={theme}
          compact={compact}
        />
      )
    }
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl overflow-hidden"
        style={{
          background: theme.glass.bg,
          border: `1px solid ${theme.glass.border}`,
        }}
      >
        <iframe
          src={embedInfo.embedUrl}
          width="100%"
          height={compact ? '80' : '152'}
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="rounded-xl"
          style={{ display: 'block' }}
        />
      </motion.div>
    )
  }

  // Apple Music embed - use custom audio player if audioOnly mode
  if (embedInfo.type === 'apple') {
    if (audioOnly && embedInfo.embedUrl) {
      return (
        <AudioOnlyPlayer
          embedUrl={embedInfo.embedUrl}
          originalUrl={url}
          type="apple"
          theme={theme}
          compact={compact}
        />
      )
    }
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl overflow-hidden"
        style={{
          background: theme.glass.bg,
          border: `1px solid ${theme.glass.border}`,
        }}
      >
        <iframe
          src={embedInfo.embedUrl}
          width="100%"
          height={compact ? '80' : '150'}
          frameBorder="0"
          allow="autoplay; encrypted-media"
          sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
          className="rounded-xl"
          style={{ display: 'block' }}
        />
      </motion.div>
    )
  }

  // Fallback
  return (
    <div
      className="flex items-center gap-2 p-3 rounded-xl"
      style={{ background: `${theme.accent.warm}15` }}
    >
      <span style={{ color: theme.accent.warm }}>♫</span>
      <span className="text-sm" style={{ color: theme.text.primary }}>
        {url}
      </span>
    </div>
  )
}

// Helper to check if a string looks like a music URL
export function isMusicUrl(text: string): boolean {
  const musicPatterns = [
    /youtube\.com/i,
    /youtu\.be/i,
    /music\.youtube\.com/i,
    /spotify\.com/i,
    /soundcloud\.com/i,
    /music\.apple\.com/i,
  ]
  return musicPatterns.some(pattern => pattern.test(text))
}
