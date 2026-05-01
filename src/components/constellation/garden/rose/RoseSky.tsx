'use client'

export function RoseSky() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Sky gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #FFE4DA 0%, #F8C8C0 50%, #E8A8A0 100%)',
        }}
      />
      {/* Sun glow blob upper-right */}
      <div
        className="absolute"
        style={{
          right: '8%',
          top: '6%',
          width: '36vmin',
          height: '36vmin',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,240,220,0.85) 0%, rgba(255,210,200,0.35) 40%, rgba(255,200,190,0) 70%)',
          filter: 'blur(8px)',
        }}
      />
      {/* Far hill silhouette */}
      <svg
        className="absolute bottom-[28%] left-0 w-full"
        height="120"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        style={{ opacity: 0.55 }}
      >
        <path
          d="M0,80 C180,40 360,90 540,60 C720,30 900,70 1080,55 C1260,40 1380,70 1440,55 L1440,120 L0,120 Z"
          fill="#D89090"
        />
      </svg>
      {/* Closer hill silhouette */}
      <svg
        className="absolute bottom-[22%] left-0 w-full"
        height="100"
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
        style={{ opacity: 0.7 }}
      >
        <path
          d="M0,70 C200,55 380,80 560,55 C740,30 920,70 1100,50 C1280,30 1380,55 1440,45 L1440,100 L0,100 Z"
          fill="#C87878"
        />
      </svg>
    </div>
  )
}
