'use client'

/**
 * Renders a single OpenMoji botanical/creature SVG from /public/garden/.
 * SVGs are colored at the source — this component applies a soft
 * desaturate + drop-shadow so the OpenMoji style integrates with the
 * pastel theme palette. Per-instance overrides via filter prop.
 */

export type PlantName =
  | 'tree-deciduous'
  | 'tree-evergreen'
  | 'herb'
  | 'clover'
  | 'seedling'
  | 'tulip'
  | 'rose'
  | 'hibiscus'
  | 'sunflower'
  | 'blossom'
  | 'bouquet'
  | 'fence'
  | 'leaf-fluttering'
  | 'leaf-fallen'
  | 'butterfly'
  | 'bee'
  | 'ladybug'
  | 'mushroom'
  | 'house-with-garden'
  | 'house'
  | 'cottage'
  | 'potted-plant'
  | 'wheat'
  | 'rock'
  | 'snail'
  | 'bird'
  | 'rainbow'

interface PlantProps {
  name: PlantName
  width: number
  height?: number
  rotate?: number
  opacity?: number
  saturate?: number
  blur?: number
  /** Hue rotation in degrees. Useful for color-shifting the same SVG. */
  hueRotate?: number
  /** Override the entire CSS filter chain. */
  filter?: string
  className?: string
  style?: React.CSSProperties
}

export function Plant({
  name,
  width,
  height,
  rotate = 0,
  opacity = 1,
  saturate = 0.65,
  blur,
  hueRotate = 0,
  filter,
  className,
  style,
}: PlantProps) {
  const blurPart = blur ? ` blur(${blur}px)` : ''
  const huePart = hueRotate !== 0 ? ` hue-rotate(${hueRotate}deg)` : ''
  const composedFilter =
    filter ??
    `saturate(${saturate}) brightness(1.04)${huePart} drop-shadow(0 1.5px 2px rgba(0,0,0,0.10))${blurPart}`

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/garden/${name}.svg`}
      alt=""
      width={width}
      height={height ?? width}
      draggable={false}
      className={className}
      style={{
        transform: `rotate(${rotate}deg)`,
        opacity,
        filter: composedFilter,
        display: 'block',
        userSelect: 'none',
        pointerEvents: 'none',
        ...style,
      }}
    />
  )
}
