'use client'

import { useState } from 'react'
import { format, addWeeks, addMonths, addYears, addDays } from 'date-fns'
import { useThemeStore } from '@/store/theme'
import { getGlassDiaryColors } from '@/lib/glassDiaryColors'
import PhotoBlock from '@/components/desk/PhotoBlock'
import CompactDoodleCanvas from '@/components/desk/CompactDoodleCanvas'
import SongEmbed from '@/components/SongEmbed'
import DatePicker from '@/components/DatePicker'
import { StrokeData } from '@/store/journal'

const unlockOptions = [
  { label: '1 week', getValue: () => addWeeks(new Date(), 1) },
  { label: '2 weeks', getValue: () => addWeeks(new Date(), 2) },
  { label: '1 month', getValue: () => addMonths(new Date(), 1) },
  { label: '3 months', getValue: () => addMonths(new Date(), 3) },
  { label: '6 months', getValue: () => addMonths(new Date(), 6) },
  { label: '1 year', getValue: () => addYears(new Date(), 1) },
]

interface PostcardBackProps {
  recipient: 'self' | 'friend'
  photos: { url: string; rotation: number; position: 1 | 2 }[]
  onPhotoAdd: (position: 1 | 2, dataUrl: string) => void
  doodleStrokes: StrokeData[]
  onDoodleChange: (strokes: StrokeData[]) => void
  songLink: string
  onSongChange: (url: string) => void
  friendName: string
  onFriendNameChange: (v: string) => void
  friendEmail: string
  onFriendEmailChange: (v: string) => void
  senderName: string
  onSenderNameChange: (v: string) => void
  location: string
  onLocationChange: (v: string) => void
  unlockDate: Date
  onUnlockDateChange: (d: Date) => void
}

export default function PostcardBack(props: PostcardBackProps) {
  const [showDatePicker, setShowDatePicker] = useState(false)
  const { theme } = useThemeStore()
  const colors = getGlassDiaryColors(theme)

  // Recipient comes from the front-side picker (`Dear [▾ ...]`). Friends need
  // 7 days of lead time so the email feels delayed; self letters can land as
  // soon as tomorrow.
  const isFriend = props.recipient === 'friend'

  const inputStyle: React.CSSProperties = {
    background: 'transparent',
    borderBottom: `1px solid ${colors.pageBorder}`,
    color: colors.bodyText,
    fontFamily: "var(--font-caveat), 'Caveat', cursive",
    fontSize: '1.1rem',
  }

  const labelStyle: React.CSSProperties = {
    color: colors.sectionLabel,
    fontFamily: "'Georgia', serif",
  }

  return (
    <div
      className="w-full h-full relative flex flex-col sm:flex-row"
      style={{
        background: colors.pageBg,
        backdropFilter: `blur(${colors.pageBlur})`,
      }}
    >
      {/* Left: Song → Photos → Doodle */}
      <div className="sm:flex-1 p-4 flex flex-col gap-2 shrink-0" style={{ flexBasis: '55%' }}>
        {/* Song */}
        <div className="shrink-0" style={{ minHeight: '56px' }}>
          {props.songLink && /https?:\/\//.test(props.songLink) ? (
            <div className="relative">
              <SongEmbed url={props.songLink} compact audioOnly />
              <button
                onClick={() => props.onSongChange('')}
                className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] opacity-50 hover:opacity-100 transition-opacity"
                style={{
                  background: `${theme.accent.warm}30`,
                  color: theme.accent.warm,
                }}
                title="Change song"
              >
                ✎
              </button>
            </div>
          ) : (
            <>
              <div
                className="text-[10px] uppercase tracking-[0.15em] mb-1 font-medium"
                style={labelStyle}
              >
                Add a Song
              </div>
              <input
                type="text"
                value={props.songLink}
                onChange={(e) => props.onSongChange(e.target.value)}
                placeholder="Paste Spotify, YouTube, or SoundCloud link..."
                className="w-full px-2 py-1.5 rounded-lg text-sm outline-none"
                style={{
                  ...inputStyle,
                  borderBottom: 'none',
                  border: `1px solid ${colors.pageBorder}`,
                  background: colors.buttonBg,
                }}
              />
            </>
          )}
        </div>

        {/* Photos */}
        <div className="flex items-center justify-center" style={{ flex: '1 1 0%' }}>
          <PhotoBlock
            photos={props.photos}
            onPhotoAdd={props.onPhotoAdd}
          />
        </div>

        {/* Doodle */}
        <div className="flex flex-col shrink-0" style={{ flex: '0 0 35%' }}>
          <div className="text-[10px] uppercase tracking-[0.15em] mb-1 font-medium" style={labelStyle}>
            Draw
          </div>
          <div className="flex-1 min-h-0">
            <CompactDoodleCanvas
              strokes={props.doodleStrokes}
              onStrokesChange={props.onDoodleChange}
              doodleColors={[colors.bodyText, theme.accent.warm, theme.accent.primary, colors.sectionLabel]}
              canvasBackground={colors.doodleBg}
              canvasBorder={colors.doodleBorder}
              textColor={colors.bodyText}
              mutedColor={colors.sectionLabel}
            />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="hidden sm:block w-px self-stretch" style={{ background: colors.pageBorder }} />
      <div className="block sm:hidden h-px w-full" style={{ background: colors.pageBorder }} />

      {/* Right: Address form */}
      <div className="sm:flex-1 p-4 flex flex-col gap-2" style={{ flexBasis: '45%' }}>
        {/* To — what's editable depends on the recipient picker on the front. */}
        <div>
          <label className="text-xs tracking-wider" style={labelStyle}>TO</label>
          {isFriend ? (
            <>
              <input
                type="text"
                value={props.friendName}
                onChange={(e) => props.onFriendNameChange(e.target.value)}
                placeholder="Friend's name"
                className="w-full mt-1 px-1 py-0.5 outline-none"
                style={inputStyle}
              />
              <input
                type="email"
                value={props.friendEmail}
                onChange={(e) => props.onFriendEmailChange(e.target.value)}
                placeholder="friend@email.com"
                className="w-full mt-2 px-1 py-0.5 outline-none"
                style={inputStyle}
              />
            </>
          ) : (
            <p className="mt-1" style={{ ...inputStyle, borderBottom: 'none', opacity: 0.6 }}>
              Future Me
            </p>
          )}
        </div>

        {/* From */}
        <div>
          <label className="text-xs tracking-wider" style={labelStyle}>FROM</label>
          <input
            type="text"
            value={props.senderName}
            onChange={(e) => props.onSenderNameChange(e.target.value)}
            placeholder="Your name (optional)"
            className="w-full mt-1 px-1 py-0.5 outline-none"
            style={inputStyle}
          />
        </div>

        {/* Location */}
        <div>
          <label className="text-xs tracking-wider" style={labelStyle}>WRITING FROM</label>
          <input
            type="text"
            value={props.location}
            onChange={(e) => props.onLocationChange(e.target.value)}
            placeholder="e.g., Himachal Pradesh"
            className="w-full mt-1 px-1 py-0.5 outline-none"
            style={inputStyle}
          />
        </div>

        {/* Unlock date */}
        <div>
          <label className="text-xs tracking-wider" style={labelStyle}>ARRIVES ON</label>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {unlockOptions.map((opt) => {
              const d = opt.getValue()
              const selected = format(props.unlockDate, 'yyyy-MM-dd') === format(d, 'yyyy-MM-dd')
              return (
                <button
                  key={opt.label}
                  onClick={() => props.onUnlockDateChange(d)}
                  className="px-2 py-0.5 rounded-full text-xs"
                  style={{
                    background: selected ? `${theme.accent.warm}30` : 'transparent',
                    border: `1px solid ${selected ? theme.accent.warm : colors.pageBorder}`,
                    color: colors.bodyText,
                    fontFamily: "'Georgia', serif",
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
            <button
              onClick={() => setShowDatePicker(true)}
              className="px-2 py-0.5 rounded-full text-xs"
              style={{
                border: `1px solid ${colors.pageBorder}`,
                color: colors.bodyText,
                fontFamily: "'Georgia', serif",
              }}
            >
              Custom
            </button>
          </div>
          <p className="mt-1 text-xs" style={{ color: colors.sectionLabel }}>
            {format(props.unlockDate, 'MMMM d, yyyy')}
          </p>
        </div>
      </div>

      <DatePicker
        value=""
        onChange={(dateStr: string) => {
          if (dateStr) {
            props.onUnlockDateChange(new Date(dateStr))
            setShowDatePicker(false)
          }
        }}
        minDate={isFriend ? addDays(new Date(), 7) : addDays(new Date(), 1)}
        mode="modal"
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
      />
    </div>
  )
}
