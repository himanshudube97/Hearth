'use client'

import { SpineDesign } from '@/lib/spineDesigns'

interface SpineOrnamentsProps {
  spine: SpineDesign
}

const SPINE_WIDTH = 22

export default function SpineOrnaments({ spine }: SpineOrnamentsProps) {
  return (
    <div
      className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
      style={{ width: `${SPINE_WIDTH}px` }}
    >
      {/* Soft gutter shadow that bleeds onto the inner page edges, so the
          spine sits inside the natural fold of an opened book. */}
      <div
        className="absolute top-0 bottom-0"
        style={{
          left: '-10px',
          width: '10px',
          background:
            'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.08) 100%)',
        }}
      />
      <div
        className="absolute top-0 bottom-0"
        style={{
          right: '-10px',
          width: '10px',
          background:
            'linear-gradient(90deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0) 100%)',
        }}
      />

      {/* Material strip — base color + cross-section shading. */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, ${spine.shadowColor} 0%, ${spine.baseColor} 50%, ${spine.shadowColor} 100%)`,
          boxShadow: [
            'inset 1px 0 2px rgba(0,0,0,0.18)',
            'inset -1px 0 2px rgba(0,0,0,0.18)',
          ].join(', '),
        }}
      />

      {/* Material-specific texture overlay. */}
      <MaterialTexture spine={spine} />

      {/* Soft vertical sheen down the centerline. */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 60% 100% at 50% 50%, ${spine.highlightColor}26 0%, transparent 65%)`,
        }}
      />

      {/* Horizontal raised bands (ornate leather binding look). */}
      {spine.bands?.positions.map((topPct, i) => (
        <Band
          key={`band-${i}`}
          topPct={topPct}
          color={spine.bands!.color}
          baseColor={spine.baseColor}
          highlightColor={spine.highlightColor}
        />
      ))}

      {/* Vertical ribbon down the spine. */}
      {spine.ribbon && <Ribbon ribbon={spine.ribbon} />}

      {/* Foil / wax-seal medallion (sits above ribbon and bands). */}
      {spine.medallion && <Medallion medallion={spine.medallion} />}

      {/* Accent (stitches / rule / knots / none). */}
      <Accent spine={spine} />
    </div>
  )
}

function Band({
  topPct,
  color,
  baseColor,
  highlightColor,
}: {
  topPct: number
  color: string
  baseColor: string
  highlightColor: string
}) {
  return (
    <div
      className="absolute left-0 right-0"
      style={{
        top: `${topPct}%`,
        height: '12px',
        transform: 'translateY(-50%)',
        background: `linear-gradient(180deg, ${color} 0%, ${baseColor} 35%, ${highlightColor} 50%, ${baseColor} 65%, ${color} 100%)`,
        boxShadow: [
          'inset 0 1px 1px rgba(255,255,255,0.18)',
          'inset 0 -1px 1px rgba(0,0,0,0.45)',
          '0 1px 2px rgba(0,0,0,0.35)',
        ].join(', '),
      }}
    />
  )
}

function Ribbon({ ribbon }: { ribbon: NonNullable<SpineDesign['ribbon']> }) {
  const width = ribbon.width ?? 3
  return (
    <div
      className="absolute top-0 bottom-0"
      style={{
        left: '50%',
        width: `${width}px`,
        transform: `translateX(-${width / 2}px)`,
        background: `linear-gradient(90deg, rgba(0,0,0,0.45) 0%, ${ribbon.color} 50%, rgba(0,0,0,0.45) 100%)`,
        boxShadow: [
          'inset 0 0 1px rgba(0,0,0,0.6)',
          '0 0 1px rgba(0,0,0,0.4)',
        ].join(', '),
      }}
    />
  )
}

function Medallion({
  medallion,
}: {
  medallion: NonNullable<SpineDesign['medallion']>
}) {
  const size = medallion.size ?? 14
  const rim = medallion.rimColor ?? 'rgba(0,0,0,0.5)'
  return (
    <div
      className="absolute"
      style={{
        top: `${medallion.position}%`,
        left: '50%',
        width: `${size}px`,
        height: `${size}px`,
        transform: 'translate(-50%, -50%)',
        borderRadius: '50%',
        background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.55) 0%, ${medallion.color} 45%, rgba(0,0,0,0.35) 100%)`,
        border: `1px solid ${rim}`,
        boxShadow: [
          '0 1px 2px rgba(0,0,0,0.6)',
          'inset 0 -1px 1px rgba(0,0,0,0.35)',
          'inset 0 1px 1px rgba(255,255,255,0.30)',
        ].join(', '),
      }}
    />
  )
}

function MaterialTexture({ spine }: { spine: SpineDesign }) {
  switch (spine.material) {
    case 'leather':
      return (
        <div
          className="absolute inset-0 opacity-30"
          style={{
            mixBlendMode: 'overlay',
            backgroundImage: `repeating-linear-gradient(
              90deg,
              transparent 0,
              transparent 2px,
              rgba(0,0,0,0.10) 2px,
              rgba(0,0,0,0.10) 3px,
              transparent 3px,
              transparent 6px,
              rgba(255,255,255,0.06) 6px,
              rgba(255,255,255,0.06) 7px
            )`,
          }}
        />
      )
    case 'silk':
      return (
        <div
          className="absolute inset-0 opacity-35"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              rgba(255,255,255,0.10) 0,
              rgba(255,255,255,0.10) 1px,
              transparent 1px,
              transparent 4px
            ),
            repeating-linear-gradient(
              -45deg,
              rgba(0,0,0,0.10) 0,
              rgba(0,0,0,0.10) 1px,
              transparent 1px,
              transparent 4px
            )`,
          }}
        />
      )
    case 'canvas':
      return (
        <div
          className="absolute inset-0 opacity-40"
          style={{
            mixBlendMode: 'overlay',
            backgroundImage: `repeating-linear-gradient(
              0deg,
              rgba(0,0,0,0.18) 0,
              rgba(0,0,0,0.18) 1px,
              transparent 1px,
              transparent 3px
            ),
            repeating-linear-gradient(
              90deg,
              rgba(0,0,0,0.18) 0,
              rgba(0,0,0,0.18) 1px,
              transparent 1px,
              transparent 3px
            )`,
          }}
        />
      )
    case 'pewter':
      return (
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `linear-gradient(
              90deg,
              rgba(255,255,255,0) 0%,
              rgba(255,255,255,0.18) 30%,
              rgba(255,255,255,0.05) 50%,
              rgba(255,255,255,0.18) 70%,
              rgba(255,255,255,0) 100%
            ),
            repeating-linear-gradient(
              90deg,
              transparent 0,
              transparent 4px,
              rgba(0,0,0,0.06) 4px,
              rgba(0,0,0,0.06) 5px
            )`,
          }}
        />
      )
    case 'kraft':
      return (
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `repeating-linear-gradient(
              90deg,
              transparent 0,
              transparent 1px,
              rgba(0,0,0,0.08) 1px,
              rgba(0,0,0,0.08) 2px
            )`,
          }}
        />
      )
    case 'linen':
      return (
        <div
          className="absolute inset-0 opacity-45"
          style={{
            mixBlendMode: 'multiply',
            backgroundImage: `repeating-linear-gradient(
              0deg,
              rgba(0,0,0,0.10) 0,
              rgba(0,0,0,0.10) 1px,
              transparent 1px,
              transparent 3px
            ),
            repeating-linear-gradient(
              90deg,
              rgba(0,0,0,0.10) 0,
              rgba(0,0,0,0.10) 1px,
              transparent 1px,
              transparent 3px
            )`,
          }}
        />
      )
  }
}

function Accent({ spine }: { spine: SpineDesign }) {
  if (spine.accent === 'none') return null

  if (spine.accent === 'rule') {
    return (
      <div
        className="absolute top-0 bottom-0"
        style={{
          left: '50%',
          width: '1px',
          transform: 'translateX(-0.5px)',
          background: spine.accentColor,
          opacity: 0.55,
          boxShadow: [
            `-1px 0 0 rgba(0,0,0,0.25)`,
            `1px 0 0 rgba(255,255,255,0.10)`,
          ].join(', '),
        }}
      />
    )
  }

  if (spine.accent === 'stitches') {
    // Tiny dashed thread running down the centerline.
    return (
      <div
        className="absolute top-0 bottom-0"
        style={{
          left: '50%',
          width: '2px',
          transform: 'translateX(-1px)',
          backgroundImage: `repeating-linear-gradient(
            180deg,
            ${spine.accentColor} 0,
            ${spine.accentColor} 6px,
            transparent 6px,
            transparent 14px
          )`,
          opacity: 0.85,
          filter: 'drop-shadow(0 1px 0 rgba(0,0,0,0.35))',
        }}
      />
    )
  }

  // 'knots' — small knot at top and bottom only.
  return (
    <>
      <Knot color={spine.accentColor} top="6%" />
      <Knot color={spine.accentColor} top="94%" />
    </>
  )
}

function Knot({ color, top }: { color: string; top: string }) {
  return (
    <div
      className="absolute"
      style={{
        top,
        left: '50%',
        width: '14px',
        height: '8px',
        transform: 'translate(-50%, -50%)',
        borderRadius: '40%',
        background: `radial-gradient(ellipse at 50% 35%, ${color} 0%, ${color} 55%, rgba(0,0,0,0.4) 100%)`,
        boxShadow: [
          'inset 0 -1px 1px rgba(0,0,0,0.45)',
          'inset 0 1px 1px rgba(255,255,255,0.18)',
          '0 1px 2px rgba(0,0,0,0.5)',
        ].join(', '),
      }}
    />
  )
}
