'use client'

export function WaterAndReflections() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Sun reflection ellipse directly under the sun */}
      <div
        className="absolute"
        style={{
          left: '56%',
          top: '79%',
          width: 80,
          height: '14%',
          background:
            'linear-gradient(180deg, rgba(255,200,120,0.7) 0%, rgba(255,160,80,0.4) 50%, transparent 100%)',
          filter: 'blur(3px)',
          borderRadius: '50%',
          mixBlendMode: 'lighten',
        }}
      />

      {/* Water streaks — tiny suggested wave lines */}
      <div
        className="absolute"
        style={{
          left: '10%',
          right: '10%',
          top: '84%',
          height: 1,
          background:
            'linear-gradient(90deg, transparent, rgba(255,200,140,0.5), transparent)',
        }}
      />
      <div
        className="absolute"
        style={{
          left: '5%',
          right: '15%',
          top: '88%',
          height: 1,
          background:
            'linear-gradient(90deg, transparent, rgba(255,200,140,0.5), transparent)',
        }}
      />
      <div
        className="absolute"
        style={{
          left: '20%',
          right: '5%',
          top: '92%',
          height: 1,
          background:
            'linear-gradient(90deg, transparent, rgba(255,200,140,0.5), transparent)',
        }}
      />
      <div
        className="absolute"
        style={{
          left: '8%',
          right: '20%',
          top: '96%',
          height: 1,
          background:
            'linear-gradient(90deg, transparent, rgba(255,200,140,0.5), transparent)',
        }}
      />
    </div>
  )
}
