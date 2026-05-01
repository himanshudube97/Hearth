'use client'

export function HarbourSky() {
  return (
    <div
      className="absolute inset-0"
      style={{
        background: `linear-gradient(180deg,
          #2A1F3A 0%,
          #5A3258 18%,
          #B04860 38%,
          #E07848 56%,
          #F0B070 70%,
          #F8D090 78%,
          #4A5878 80%,
          #3A4868 90%,
          #1C2840 100%
        )`,
      }}
    >
      {/* Sun disc on the horizon */}
      <div
        className="absolute"
        style={{
          left: '58%',
          top: '70%',
          width: 70,
          height: 70,
          background:
            'radial-gradient(circle, #FFF4D8 0%, #FFD890 30%, #FF9858 65%, rgba(255,150,80,0.3) 90%, transparent 100%)',
          borderRadius: '50%',
          boxShadow: '0 0 60px rgba(255,180,100,0.6)',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Cloud streaks */}
      <div
        className="absolute"
        style={{
          left: '8%',
          top: '20%',
          width: 140,
          height: 4,
          background: 'rgba(255,200,140,0.5)',
          borderRadius: '50%',
          filter: 'blur(2px)',
        }}
      />
      <div
        className="absolute"
        style={{
          left: '30%',
          top: '14%',
          width: 100,
          height: 4,
          background: 'rgba(255,200,140,0.5)',
          borderRadius: '50%',
          filter: 'blur(2px)',
        }}
      />
      <div
        className="absolute"
        style={{
          left: '55%',
          top: '24%',
          width: 120,
          height: 4,
          background: 'rgba(255,200,140,0.5)',
          borderRadius: '50%',
          filter: 'blur(2px)',
        }}
      />
      <div
        className="absolute"
        style={{
          left: '75%',
          top: '18%',
          width: 80,
          height: 4,
          background: 'rgba(255,200,140,0.5)',
          borderRadius: '50%',
          filter: 'blur(2px)',
        }}
      />
    </div>
  )
}
