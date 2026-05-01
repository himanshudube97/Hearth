'use client'

// Static stacked logs. Sits inside the fireplace opening,
// underneath the Lottie flame. The parent positions and sizes it.
export function Logs() {
  return (
    <svg
      viewBox="-50 -20 100 40"
      preserveAspectRatio="xMidYMax meet"
      className="absolute inset-0 w-full h-full pointer-events-none"
    >
      {/* Glowing core under the logs */}
      <ellipse cx="0" cy="2" rx="35" ry="6" fill="#ffb84d" opacity="0.8" />
      <ellipse cx="0" cy="2" rx="22" ry="3" fill="#fff0b8" opacity="0.9" />

      {/* Bottom row of logs */}
      <g transform="translate(-22, -4) rotate(8)">
        <rect width="22" height="6" rx="2" fill="#4a2818" />
      </g>
      <g transform="translate(0, -4) rotate(-15)">
        <rect width="22" height="6" rx="2" fill="#3a2010" />
      </g>

      {/* Top row */}
      <g transform="translate(-30, -10) rotate(-25)">
        <rect width="22" height="6" rx="2" fill="#3a2010" />
      </g>
      <g transform="translate(-12, -10) rotate(-8)">
        <rect width="22" height="6" rx="2" fill="#4a2818" />
      </g>
      <g transform="translate(6, -10) rotate(15)">
        <rect width="22" height="6" rx="2" fill="#3a2010" />
      </g>
    </svg>
  )
}
