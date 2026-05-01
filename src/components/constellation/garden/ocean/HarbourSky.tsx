'use client'

export function HarbourSky() {
  return (
    <div
      className="absolute inset-0"
      style={{
        background: `linear-gradient(180deg,
          #4A5878 0%,
          #6B7890 18%,
          #9CA8B8 40%,
          #C4B0B8 60%,
          #D8B8AA 72%,
          #E0C8B0 78%,
          #5A6878 80%,
          #4A5868 90%,
          #2A3848 100%
        )`,
      }}
    >
      {/* Soft pale dawn sun on the horizon */}
      <div
        className="absolute"
        style={{
          left: '58%',
          top: '70%',
          width: 60,
          height: 60,
          background:
            'radial-gradient(circle, #FFEAD0 0%, #F4D0B8 40%, rgba(220,180,160,0.4) 75%, transparent 100%)',
          borderRadius: '50%',
          boxShadow: '0 0 50px rgba(220,200,180,0.4)',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Cool grey-blue cloud streaks */}
      <div
        className="absolute"
        style={{
          left: '8%',
          top: '20%',
          width: 140,
          height: 4,
          background: 'rgba(200,210,220,0.5)',
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
          background: 'rgba(200,210,220,0.5)',
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
          background: 'rgba(200,210,220,0.5)',
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
          background: 'rgba(200,210,220,0.5)',
          borderRadius: '50%',
          filter: 'blur(2px)',
        }}
      />
    </div>
  )
}
