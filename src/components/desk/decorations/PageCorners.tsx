// src/components/desk/decorations/PageCorners.tsx
'use client'

interface PageCornersProps {
  style: 'ornate' | 'botanical' | 'magical' | 'stars' | 'none'
  color: string
}

export function PageCorners({ style, color }: PageCornersProps) {
  if (style === 'none') return null

  const corners = {
    ornate: (
      <svg viewBox="0 0 60 60" className="w-14 h-14">
        <path
          d="M5 55 Q5 5 55 5 M10 55 Q10 10 55 10 M15 55 Q15 15 55 15"
          fill="none"
          stroke={color}
          strokeWidth="1"
          opacity="0.6"
        />
        <circle cx="8" cy="52" r="2" fill={color} opacity="0.4" />
        <path d="M2 58 Q2 40 20 40 Q10 40 10 50 Q10 58 2 58" fill={color} opacity="0.2" />
      </svg>
    ),
    botanical: (
      <svg viewBox="0 0 60 60" className="w-14 h-14">
        <path
          d="M5 55 Q15 45 10 35 Q20 40 25 30 M10 50 Q20 45 15 35"
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.5"
        />
        <circle cx="10" cy="35" r="3" fill={color} opacity="0.3" />
        <circle cx="25" cy="30" r="2" fill={color} opacity="0.25" />
        <ellipse cx="8" cy="48" rx="4" ry="2" fill={color} opacity="0.2" transform="rotate(-30 8 48)" />
      </svg>
    ),
    magical: (
      <svg viewBox="0 0 60 60" className="w-14 h-14">
        <path
          d="M5 55 L5 35 M5 55 L25 55"
          fill="none"
          stroke={color}
          strokeWidth="2"
          opacity="0.6"
        />
        <circle cx="5" cy="30" r="2" fill={color} opacity="0.8" />
        <circle cx="30" cy="55" r="2" fill={color} opacity="0.8" />
        <path d="M8 52 L12 48 L8 44 L4 48 Z" fill={color} opacity="0.4" />
        <circle cx="15" cy="40" r="1" fill={color} opacity="0.5" />
        <circle cx="20" cy="50" r="1" fill={color} opacity="0.5" />
      </svg>
    ),
    stars: (
      <svg viewBox="0 0 60 60" className="w-14 h-14">
        <circle cx="10" cy="50" r="1.5" fill={color} opacity="0.7" />
        <circle cx="20" cy="45" r="1" fill={color} opacity="0.5" />
        <circle cx="15" cy="55" r="0.8" fill={color} opacity="0.4" />
        <circle cx="25" cy="52" r="1.2" fill={color} opacity="0.6" />
        <circle cx="8" cy="40" r="0.6" fill={color} opacity="0.3" />
        <path d="M12 48 L13 46 L14 48 L13 50 Z" fill={color} opacity="0.8" />
      </svg>
    ),
  }

  return (
    <>
      {/* Top-left */}
      <div className="absolute top-2 left-2 pointer-events-none">
        {corners[style]}
      </div>
      {/* Top-right */}
      <div className="absolute top-2 right-2 pointer-events-none" style={{ transform: 'scaleX(-1)' }}>
        {corners[style]}
      </div>
      {/* Bottom-left */}
      <div className="absolute bottom-2 left-2 pointer-events-none" style={{ transform: 'scaleY(-1)' }}>
        {corners[style]}
      </div>
      {/* Bottom-right */}
      <div className="absolute bottom-2 right-2 pointer-events-none" style={{ transform: 'scale(-1)' }}>
        {corners[style]}
      </div>
    </>
  )
}
