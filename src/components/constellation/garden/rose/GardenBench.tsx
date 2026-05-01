'use client'

export function GardenBench() {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: '14%',
        top: '74%',
        width: '14vmin',
        height: '10vmin',
        transform: 'translate(-50%, -50%)',
      }}
    >
      <svg viewBox="0 0 200 140" width="100%" height="100%" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="benchWood" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FBF4ED" />
            <stop offset="100%" stopColor="#D8C2A8" />
          </linearGradient>
          <linearGradient id="benchShadow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(120,60,40,0.18)" />
            <stop offset="100%" stopColor="rgba(120,60,40,0)" />
          </linearGradient>
        </defs>

        {/* Soft ground shadow under the bench */}
        <ellipse cx="100" cy="128" rx="86" ry="6" fill="url(#benchShadow)" />

        {/* Back legs (slightly offset for perspective) */}
        <rect x="34" y="58" width="6" height="68" fill="#9A7060" rx="1" />
        <rect x="160" y="58" width="6" height="68" fill="#9A7060" rx="1" />

        {/* Front legs */}
        <rect x="42" y="62" width="7" height="66" fill="url(#benchWood)" stroke="#9A7060" strokeWidth="0.6" rx="1" />
        <rect x="151" y="62" width="7" height="66" fill="url(#benchWood)" stroke="#9A7060" strokeWidth="0.6" rx="1" />

        {/* Backrest verticals */}
        <rect x="58" y="14" width="4" height="50" fill="url(#benchWood)" stroke="#9A7060" strokeWidth="0.5" rx="1" />
        <rect x="76" y="14" width="4" height="50" fill="url(#benchWood)" stroke="#9A7060" strokeWidth="0.5" rx="1" />
        <rect x="94" y="14" width="4" height="50" fill="url(#benchWood)" stroke="#9A7060" strokeWidth="0.5" rx="1" />
        <rect x="112" y="14" width="4" height="50" fill="url(#benchWood)" stroke="#9A7060" strokeWidth="0.5" rx="1" />
        <rect x="130" y="14" width="4" height="50" fill="url(#benchWood)" stroke="#9A7060" strokeWidth="0.5" rx="1" />
        <rect x="148" y="14" width="4" height="50" fill="url(#benchWood)" stroke="#9A7060" strokeWidth="0.5" rx="1" />

        {/* Top rail */}
        <rect x="36" y="10" width="128" height="8" fill="url(#benchWood)" stroke="#9A7060" strokeWidth="0.6" rx="2" />

        {/* Seat plank — front */}
        <rect x="32" y="60" width="136" height="8" fill="url(#benchWood)" stroke="#9A7060" strokeWidth="0.6" rx="1.5" />
        {/* Seat plank — back */}
        <rect x="32" y="68" width="136" height="6" fill="#E8D2C0" stroke="#9A7060" strokeWidth="0.5" rx="1" opacity="0.85" />

        {/* Curved arm rests */}
        <path
          d="M32,60 C26,55 26,30 36,28 L40,28 L40,60 Z"
          fill="url(#benchWood)"
          stroke="#9A7060"
          strokeWidth="0.6"
        />
        <path
          d="M168,60 C174,55 174,30 164,28 L160,28 L160,60 Z"
          fill="url(#benchWood)"
          stroke="#9A7060"
          strokeWidth="0.6"
        />

        {/* Tiny rose petal sitting on the bench seat */}
        <g transform="translate(110 58)">
          <ellipse cx="0" cy="0" rx="5" ry="2.4" fill="#E27062" stroke="rgba(122,32,48,0.4)" strokeWidth="0.3" transform="rotate(-22)" />
        </g>
      </svg>
    </div>
  )
}
