'use client'

export function Dock() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Dock plank surface */}
      <div
        className="absolute"
        style={{
          left: '-2%',
          bottom: '8%',
          width: '38%',
          height: 10,
          background: 'linear-gradient(180deg, #4A3020 0%, #2A1C10 100%)',
          boxShadow: '0 4px 6px rgba(0,0,0,0.4)',
        }}
      />

      {/* Plank-line dividers */}
      <div
        className="absolute"
        style={{
          left: '8%',
          bottom: '8%',
          width: 1,
          height: 10,
          background: 'rgba(0,0,0,0.5)',
        }}
      />
      <div
        className="absolute"
        style={{
          left: '18%',
          bottom: '8%',
          width: 1,
          height: 10,
          background: 'rgba(0,0,0,0.5)',
        }}
      />
      <div
        className="absolute"
        style={{
          left: '28%',
          bottom: '8%',
          width: 1,
          height: 10,
          background: 'rgba(0,0,0,0.5)',
        }}
      />

      {/* Pilings — descend from dock to bottom of frame */}
      <div
        className="absolute"
        style={{
          left: '3%',
          bottom: 0,
          width: 6,
          height: '10%',
          background: 'linear-gradient(180deg, #2A1C10 0%, #0A0608 100%)',
        }}
      />
      <div
        className="absolute"
        style={{
          left: '22%',
          bottom: 0,
          width: 6,
          height: '10%',
          background: 'linear-gradient(180deg, #2A1C10 0%, #0A0608 100%)',
        }}
      />
    </div>
  )
}
