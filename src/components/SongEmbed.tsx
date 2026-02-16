'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'

interface SongEmbedProps {
  url: string
  compact?: boolean
}

type EmbedType = 'youtube' | 'spotify' | 'soundcloud' | 'apple' | 'unknown'

interface EmbedInfo {
  type: EmbedType
  embedUrl: string | null
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
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}?rel=0&modestbranding=1`,
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

export default function SongEmbed({ url, compact = false }: SongEmbedProps) {
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

  // YouTube embed
  if (embedInfo.type === 'youtube') {
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

  // Spotify embed
  if (embedInfo.type === 'spotify') {
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

  // Apple Music embed
  if (embedInfo.type === 'apple') {
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
