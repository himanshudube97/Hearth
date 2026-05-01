'use client'

interface Tile {
  cx: number
  cy: number
  rx: number
  ry: number
  rotate: number
}

const TILES: Tile[] = [
  // Far → near. Tiles are ellipses to fake perspective.
  { cx: 50, cy: 56, rx: 1.6, ry: 0.5, rotate: 0 },
  { cx: 50, cy: 60, rx: 2.2, ry: 0.7, rotate: 0 },
  { cx: 50, cy: 64, rx: 3.0, ry: 0.9, rotate: 0 },
  { cx: 49, cy: 69, rx: 4.0, ry: 1.2, rotate: -2 },
  { cx: 50, cy: 75, rx: 5.4, ry: 1.6, rotate: 1 },
  { cx: 51, cy: 82, rx: 7.2, ry: 2.1, rotate: -1 },
  { cx: 50, cy: 92, rx: 9.6, ry: 2.8, rotate: 0 },
]

export function GardenPath() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {TILES.map((t, i) => (
          <g key={i} transform={`translate(${t.cx} ${t.cy}) rotate(${t.rotate})`}>
            {/* Soft tile shadow */}
            <ellipse cx="0" cy="0.4" rx={t.rx} ry={t.ry} fill="rgba(120,40,40,0.18)" />
            {/* Tile face */}
            <ellipse cx="0" cy="0" rx={t.rx} ry={t.ry} fill="#E8D2C8" />
            {/* Tile highlight */}
            <ellipse cx="0" cy={-t.ry * 0.4} rx={t.rx * 0.8} ry={t.ry * 0.5} fill="#F4E4DC" opacity="0.8" />
          </g>
        ))}
      </svg>
    </div>
  )
}
