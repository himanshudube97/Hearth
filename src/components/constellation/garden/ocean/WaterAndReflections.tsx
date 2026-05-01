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
            'linear-gradient(180deg, rgba(244,208,184,0.5) 0%, rgba(228,192,168,0.25) 50%, transparent 100%)',
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
            'linear-gradient(90deg, transparent, rgba(220,200,180,0.4), transparent)',
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
            'linear-gradient(90deg, transparent, rgba(220,200,180,0.4), transparent)',
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
            'linear-gradient(90deg, transparent, rgba(220,200,180,0.4), transparent)',
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
            'linear-gradient(90deg, transparent, rgba(220,200,180,0.4), transparent)',
        }}
      />
    </div>
  )
}
