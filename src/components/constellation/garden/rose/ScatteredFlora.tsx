'use client'

interface FloraItem {
  type: 'daisy' | 'baby' | 'leaf' | 'bud'
  x: number
  y: number
  scale: number
}

const FLORA: FloraItem[] = [
  { type: 'leaf', x: 12, y: 78, scale: 1.0 },
  { type: 'daisy', x: 16, y: 84, scale: 0.9 },
  { type: 'baby', x: 22, y: 80, scale: 1.1 },
  { type: 'bud', x: 26, y: 74, scale: 0.85 },
  { type: 'leaf', x: 36, y: 86, scale: 1.0 },
  { type: 'daisy', x: 42, y: 90, scale: 0.85 },
  { type: 'baby', x: 58, y: 88, scale: 1.0 },
  { type: 'leaf', x: 64, y: 84, scale: 0.9 },
  { type: 'bud', x: 72, y: 76, scale: 0.95 },
  { type: 'daisy', x: 78, y: 82, scale: 1.0 },
  { type: 'baby', x: 84, y: 86, scale: 0.9 },
  { type: 'leaf', x: 88, y: 80, scale: 0.85 },
  { type: 'daisy', x: 8, y: 92, scale: 1.0 },
  { type: 'leaf', x: 92, y: 94, scale: 1.1 },
]

function FloraSVG({ type, scale }: { type: FloraItem['type']; scale: number }) {
  const px = 36 * scale
  switch (type) {
    case 'daisy':
      return (
        <svg width={px} height={px} viewBox="-20 -20 40 40">
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <ellipse
              key={a}
              cx="0"
              cy="-10"
              rx="3.5"
              ry="6"
              fill="#FBF4ED"
              stroke="rgba(120,80,80,0.3)"
              strokeWidth="0.3"
              transform={`rotate(${a})`}
            />
          ))}
          <circle cx="0" cy="0" r="3" fill="#E8B040" />
        </svg>
      )
    case 'baby':
      return (
        <svg width={px} height={px} viewBox="-20 -20 40 40">
          {[
            [0, 0],
            [-6, -4],
            [6, -4],
            [-3, -10],
            [3, -10],
            [-9, 2],
            [9, 2],
            [0, -14],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.6" fill="#FBF4ED" />
          ))}
          <line x1="0" y1="14" x2="0" y2="-2" stroke="#5C7A4B" strokeWidth="0.6" />
        </svg>
      )
    case 'leaf':
      return (
        <svg width={px} height={px} viewBox="-20 -20 40 40">
          <ellipse cx="-4" cy="-2" rx="9" ry="4" fill="#6E8E58" transform="rotate(-30 -4 -2)" />
          <ellipse cx="4" cy="-2" rx="9" ry="4" fill="#5C7A4B" transform="rotate(30 4 -2)" />
          <ellipse cx="0" cy="-8" rx="7" ry="3.5" fill="#7E9E68" />
        </svg>
      )
    case 'bud':
      return (
        <svg width={px} height={px} viewBox="-20 -20 40 40">
          <line x1="0" y1="14" x2="0" y2="-2" stroke="#5C7A4B" strokeWidth="0.7" />
          <ellipse cx="-4" cy="6" rx="3.5" ry="2" fill="#6E8E58" transform="rotate(-30 -4 6)" />
          <ellipse cx="4" cy="6" rx="3.5" ry="2" fill="#6E8E58" transform="rotate(30 4 6)" />
          <ellipse cx="0" cy="-6" rx="5" ry="7" fill="#E27062" stroke="rgba(122,32,48,0.4)" strokeWidth="0.4" />
          <ellipse cx="-2" cy="-6" rx="3" ry="6" fill="#B12838" opacity="0.5" />
        </svg>
      )
  }
}

export function ScatteredFlora() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {FLORA.map((f, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${f.x}%`,
            top: `${f.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <FloraSVG type={f.type} scale={f.scale} />
        </div>
      ))}
    </div>
  )
}
