'use client'

interface FloraItem {
  type: 'daisy' | 'baby' | 'leaf' | 'bud'
  x: number
  y: number
  scale: number
}

// Four lush clusters along the path edges + bush bases.
// Each cluster is 5–6 overlapping items so the scene reads as full
// rather than as scattered specks. Coordinates are viewport-percentage.
const FLORA: FloraItem[] = [
  // Cluster A — far left, tucked against the foreground bush
  { type: 'leaf', x: 8, y: 84, scale: 1.2 },
  { type: 'daisy', x: 12, y: 87, scale: 1.0 },
  { type: 'baby', x: 14, y: 82, scale: 1.15 },
  { type: 'bud', x: 18, y: 79, scale: 0.95 },
  { type: 'leaf', x: 6, y: 91, scale: 1.0 },
  { type: 'daisy', x: 16, y: 92, scale: 0.9 },

  // Cluster B — left of path, mid-low (under the bench)
  { type: 'leaf', x: 22, y: 86, scale: 1.0 },
  { type: 'baby', x: 26, y: 89, scale: 1.0 },
  { type: 'daisy', x: 30, y: 92, scale: 1.05 },
  { type: 'bud', x: 34, y: 83, scale: 0.85 },
  { type: 'leaf', x: 38, y: 90, scale: 0.95 },

  // Cluster C — right of path, mirroring B
  { type: 'leaf', x: 62, y: 90, scale: 1.0 },
  { type: 'bud', x: 66, y: 83, scale: 0.9 },
  { type: 'daisy', x: 70, y: 92, scale: 1.05 },
  { type: 'baby', x: 74, y: 88, scale: 1.05 },
  { type: 'leaf', x: 78, y: 86, scale: 0.95 },

  // Cluster D — far right, tucked against the foreground bush
  { type: 'daisy', x: 84, y: 90, scale: 0.95 },
  { type: 'leaf', x: 88, y: 86, scale: 1.05 },
  { type: 'baby', x: 86, y: 82, scale: 1.1 },
  { type: 'bud', x: 82, y: 79, scale: 0.95 },
  { type: 'leaf', x: 92, y: 92, scale: 1.0 },
  { type: 'daisy', x: 94, y: 86, scale: 0.9 },
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
