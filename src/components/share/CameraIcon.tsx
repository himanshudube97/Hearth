'use client'

interface CameraIconProps {
  size?: number
  color?: string
  strokeWidth?: number
}

/**
 * Minimalist line-icon camera. Inline SVG to match Hearth's existing icon
 * style (no icon library is installed in this project).
 */
export default function CameraIcon({ size = 18, color = 'currentColor', strokeWidth = 1.5 }: CameraIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 7h3l2-2.5h8L18 7h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}
