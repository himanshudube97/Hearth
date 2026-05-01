'use client'

// Peaked-roof brick cottage with an arched fireplace opening.
// Pure presentational SVG. No props — the parent positions/sizes it.
export function CottageFrame() {
  return (
    <svg
      viewBox="0 0 400 400"
      preserveAspectRatio="xMidYMid meet"
      className="absolute inset-0 w-full h-full pointer-events-none"
    >
      <defs>
        {/* Brick texture for the cottage walls */}
        <pattern id="hearth-brick" x="0" y="0" width="40" height="20" patternUnits="userSpaceOnUse">
          <rect width="40" height="20" fill="#3a2418" />
          <rect x="0" y="0" width="40" height="1" fill="#1a0e08" />
          <rect x="0" y="0" width="1" height="20" fill="#1a0e08" />
          <rect x="20" y="10" width="20" height="1" fill="#1a0e08" />
          <rect x="20" y="10" width="1" height="10" fill="#1a0e08" />
          <rect x="0" y="10" width="20" height="1" fill="#1a0e08" />
        </pattern>

        {/* Warm wash projected onto the wall by the fire */}
        <radialGradient id="hearth-wallglow" cx="0.5" cy="0.85" r="0.7">
          <stop offset="0%" stopColor="#fff0b8" stopOpacity="0.55" />
          <stop offset="40%" stopColor="#e8742c" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#1a0604" stopOpacity="0" />
        </radialGradient>

        {/* Dark interior of the fireplace opening (used as the opening fill) */}
        <radialGradient id="hearth-interior" cx="0.5" cy="0.85" r="0.7">
          <stop offset="0%" stopColor="#5a2008" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#2a0e04" stopOpacity="1" />
          <stop offset="100%" stopColor="#0a0402" stopOpacity="1" />
        </radialGradient>
      </defs>

      {/* Cottage silhouette: peaked roof + walls */}
      <path
        d="M 30 160 Q 200 0 370 160 L 370 380 L 30 380 Z"
        fill="url(#hearth-brick)"
        stroke="#0a0604"
        strokeWidth="3"
      />

      {/* Subtle warm wash on the wall */}
      <path
        d="M 30 160 Q 200 0 370 160 L 370 380 L 30 380 Z"
        fill="url(#hearth-wallglow)"
      />

      {/* Arched fireplace opening — empty container; HearthFire/Logs render inside it (positioned absolutely by HearthScene) */}
      <path
        d="M 130 380 L 130 240 Q 200 150 270 240 L 270 380 Z"
        fill="url(#hearth-interior)"
        stroke="#1a0e08"
        strokeWidth="2"
      />
    </svg>
  )
}
