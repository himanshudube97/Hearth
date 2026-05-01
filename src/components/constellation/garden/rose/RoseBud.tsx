'use client'

interface RoseBudProps {
  /** Size multiplier. 1.0 = base ~36px. */
  size?: number
}

export function RoseBud({ size = 1 }: RoseBudProps) {
  const px = 64 * size
  return (
    <svg width={px} height={px} viewBox="-20 -20 40 40">
      <line x1="0" y1="14" x2="0" y2="-2" stroke="#5C7A4B" strokeWidth="0.7" />
      <ellipse cx="-4" cy="6" rx="3.5" ry="2" fill="#6E8E58" transform="rotate(-30 -4 6)" />
      <ellipse cx="4" cy="6" rx="3.5" ry="2" fill="#6E8E58" transform="rotate(30 4 6)" />
      <ellipse
        cx="0"
        cy="-6"
        rx="5"
        ry="7"
        fill="#E27062"
        stroke="rgba(122,32,48,0.4)"
        strokeWidth="0.4"
      />
      <ellipse cx="-2" cy="-6" rx="3" ry="6" fill="#B12838" opacity="0.5" />
    </svg>
  )
}
