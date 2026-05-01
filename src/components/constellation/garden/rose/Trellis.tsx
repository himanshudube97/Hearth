'use client'

export function Trellis() {
  // Trellis is centered horizontally, sits behind the foreground tiles.
  // Coordinate space: percentage of viewport via CSS positioning + inner SVG viewBox.
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: '50%',
        top: '32%',
        width: '38vmin',
        height: '38vmin',
        transform: 'translateX(-50%)',
      }}
    >
      <svg viewBox="0 0 200 220" width="100%" height="100%">
        {/* Outer arch frame */}
        <defs>
          <linearGradient id="trellisWood" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FBF4ED" />
            <stop offset="100%" stopColor="#E8DAC8" />
          </linearGradient>
        </defs>

        {/* Left post */}
        <rect x="20" y="60" width="10" height="160" fill="url(#trellisWood)" stroke="#9A7060" strokeWidth="0.6" />
        {/* Right post */}
        <rect x="170" y="60" width="10" height="160" fill="url(#trellisWood)" stroke="#9A7060" strokeWidth="0.6" />
        {/* Arch top */}
        <path
          d="M20,65 C20,15 180,15 180,65"
          fill="none"
          stroke="url(#trellisWood)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M20,65 C20,15 180,15 180,65"
          fill="none"
          stroke="#9A7060"
          strokeWidth="0.6"
          strokeLinecap="round"
        />

        {/* Lattice — diagonal cross-hatch, faint */}
        <g stroke="#D8C4B0" strokeWidth="0.8" opacity="0.7">
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={`d1-${i}`} x1={30 + i * 20} y1="60" x2={10 + i * 20} y2="220" />
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={`d2-${i}`} x1={30 + i * 20} y1="220" x2={10 + i * 20} y2="60" />
          ))}
        </g>

        {/* Vines climbing the posts */}
        <g stroke="#5C7A4B" strokeWidth="1.4" fill="none" strokeLinecap="round">
          <path d="M25,210 C28,180 22,160 26,130 C30,100 22,80 26,60" />
          <path d="M175,210 C172,180 178,160 174,130 C170,100 178,80 174,60" />
        </g>
        {/* Tiny leaves on the vines */}
        <g fill="#6E8E58">
          {[200, 180, 160, 140, 120, 100, 80].map((y, i) => (
            <ellipse key={`lL-${i}`} cx={i % 2 === 0 ? 22 : 30} cy={y} rx="2.2" ry="1.2" transform={`rotate(${i % 2 === 0 ? -25 : 25} ${i % 2 === 0 ? 22 : 30} ${y})`} />
          ))}
          {[200, 180, 160, 140, 120, 100, 80].map((y, i) => (
            <ellipse key={`lR-${i}`} cx={i % 2 === 0 ? 178 : 170} cy={y} rx="2.2" ry="1.2" transform={`rotate(${i % 2 === 0 ? 25 : -25} ${i % 2 === 0 ? 178 : 170} ${y})`} />
          ))}
        </g>
      </svg>
    </div>
  )
}
