'use client'

import { useState } from 'react'
import { format, addWeeks, addMonths, addYears, addDays } from 'date-fns'
import PhotoBlock from '@/components/desk/PhotoBlock'
import CompactDoodleCanvas from '@/components/desk/CompactDoodleCanvas'
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
  recipientType: 'self' | 'friend'
  // Photos (same format as PhotoBlock)
  photos: { url: string; rotation: number; position: 1 | 2 }[]
  onPhotoAdd: (position: 1 | 2, dataUrl: string) => void
  // Doodle
  doodleStrokes: StrokeData[]
  onDoodleChange: (strokes: StrokeData[]) => void
  // Song
  songLink: string
  onSongChange: (url: string) => void
  // Address fields
  friendName: string
  onFriendNameChange: (v: string) => void
  friendEmail: string
  onFriendEmailChange: (v: string) => void
  senderName: string
  onSenderNameChange: (v: string) => void
  location: string
  onLocationChange: (v: string) => void
  // Date
  unlockDate: Date
  onUnlockDateChange: (d: Date) => void
}

export default function PostcardBack(props: PostcardBackProps) {
  const [showDatePicker, setShowDatePicker] = useState(false)

  const inputStyle: React.CSSProperties = {
    background: 'transparent',
    borderBottom: '1px solid #c4a265',
    color: '#3d2c1a',
    fontFamily: "var(--font-caveat), 'Caveat', cursive",
    fontSize: '1.1rem',
  }

  return (
    <div
      className="w-full h-full relative flex flex-col sm:flex-row"
      style={{ background: '#f5f0e6' }}
    >
      {/* Left: Photos + Song (wider) */}
      <div className="sm:flex-1 p-4 flex flex-col gap-3 shrink-0" style={{ flexBasis: '55%' }}>
        {/* Photos — same component as desk */}
        <div className="flex-1 flex items-center justify-center">
          <PhotoBlock
            photos={props.photos}
            onPhotoAdd={props.onPhotoAdd}
          />
        </div>

        {/* Song input */}
        <div className="shrink-0">
          <input
            type="text"
            value={props.songLink}
            onChange={(e) => props.onSongChange(e.target.value)}
            placeholder="Paste a song link..."
            className="w-full px-2 py-1 rounded text-sm outline-none"
            style={inputStyle}
          />
        </div>
      </div>

      {/* Divider */}
      <div className="hidden sm:block w-px self-stretch" style={{ background: '#c4a265' }} />
      <div className="block sm:hidden h-px w-full" style={{ background: '#c4a265' }} />

      {/* Right: Address form + doodle at bottom */}
      <div className="sm:flex-1 p-4 flex flex-col gap-2" style={{ flexBasis: '45%' }}>
        {/* To field */}
        <div>
          <label className="text-xs tracking-wider" style={{ color: '#8B6914', fontFamily: "'Georgia', serif" }}>
            TO
          </label>
          {props.recipientType === 'self' ? (
            <p className="mt-1" style={{ ...inputStyle, borderBottom: 'none', opacity: 0.6 }}>
              Future Me
            </p>
          ) : (
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
          )}
        </div>

        {/* From field */}
        <div>
          <label className="text-xs tracking-wider" style={{ color: '#8B6914', fontFamily: "'Georgia', serif" }}>
            FROM
          </label>
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
          <label className="text-xs tracking-wider" style={{ color: '#8B6914', fontFamily: "'Georgia', serif" }}>
            WRITING FROM
          </label>
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
          <label className="text-xs tracking-wider" style={{ color: '#8B6914', fontFamily: "'Georgia', serif" }}>
            ARRIVES ON
          </label>
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
                    background: selected ? '#8B691430' : 'transparent',
                    border: `1px solid ${selected ? '#8B6914' : '#c4a265'}`,
                    color: '#3d2c1a',
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
                border: '1px solid #c4a265',
                color: '#3d2c1a',
                fontFamily: "'Georgia', serif",
              }}
            >
              Custom
            </button>
          </div>
          <p className="mt-1 text-xs" style={{ color: '#8B6914' }}>
            {format(props.unlockDate, 'MMMM d, yyyy')}
          </p>
        </div>

        {/* Doodle area — fixed height, inline, same as desk CompactDoodleCanvas */}
        <div className="mt-auto shrink-0" style={{ height: '140px' }}>
          <div className="text-[10px] uppercase tracking-[0.15em] mb-1 font-medium" style={{ color: '#8B6914', fontFamily: "'Georgia', serif" }}>
            Draw
          </div>
          <div style={{ height: '120px' }}>
            <CompactDoodleCanvas
              strokes={props.doodleStrokes}
              onStrokesChange={props.onDoodleChange}
              doodleColors={['#3d2c1a', '#8B6914', '#c4a265', '#5E8B5A']}
              canvasBackground="rgba(139,105,20,0.05)"
              canvasBorder="rgba(196,162,101,0.3)"
              textColor="#3d2c1a"
              mutedColor="#c4a265"
            />
          </div>
        </div>
      </div>

      {/* DatePicker modal (already uses createPortal) */}
      <DatePicker
        value=""
        onChange={(dateStr: string) => {
          if (dateStr) {
            props.onUnlockDateChange(new Date(dateStr))
            setShowDatePicker(false)
          }
        }}
        minDate={
          props.recipientType === 'friend'
            ? addDays(new Date(), 7)
            : addDays(new Date(), 1)
        }
        mode="modal"
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
      />
    </div>
  )
}
