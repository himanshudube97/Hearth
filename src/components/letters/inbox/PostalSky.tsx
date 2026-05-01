'use client'

import { useThemeStore } from '@/store/theme'
import { useEffect, useRef } from 'react'

export default function PostalSky() {
  const particlesKind = useThemeStore(s => s.theme.particles)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const host = ref.current
    host.innerHTML = ''
    for (let i = 0; i < 12; i++) {
      const p = document.createElement('div')
      p.className = `particle p-${particlesKind}`
      p.style.left = `${Math.random() * 100}vw`
      p.style.top = `${-10 + Math.random() * 30}vh`
      p.style.animationDelay = `${-Math.random() * 22}s`
      p.style.animationDuration = `${16 + Math.random() * 14}s`
      host.appendChild(p)
    }
  }, [particlesKind])

  return (
    <>
      <div className="ps-sun" />
      <div className="ps-hills" />
      <div className="ps-village" />
      <div className="ps-village-windows" />
      <div className="ps-ground-line" />
      <div ref={ref} aria-hidden />
      <style jsx>{`
        /* sun-glow — soft horizon light, theme-tinted */
        .ps-sun {
          position: absolute;
          top: 12%;
          left: 22%;
          width: 110px;
          height: 110px;
          border-radius: 50%;
          background: radial-gradient(circle,
            var(--accent-highlight) 0%,
            color-mix(in oklab, var(--accent-warm) 60%, transparent) 40%,
            transparent 75%);
          filter: blur(2px);
          opacity: 0.9;
          pointer-events: none;
          animation: sun-pulse 8s ease-in-out infinite;
        }
        @keyframes sun-pulse {
          0%,100% { opacity: 0.85; transform: scale(1); }
          50%     { opacity: 1; transform: scale(1.04); }
        }

        /* far hills silhouette */
        .ps-hills {
          position: absolute;
          left: 0; right: 0;
          bottom: 16%;
          height: 90px;
          background: var(--shelf);
          -webkit-mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 90' preserveAspectRatio='none'><path d='M0 80 L0 56 Q40 38 80 50 Q120 62 160 42 Q200 22 240 36 Q280 50 320 30 Q360 16 400 32 Q440 48 480 34 Q520 22 560 40 Q600 56 640 42 Q680 26 720 38 Q760 50 800 38 L800 80 Z'/></svg>");
          mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 90' preserveAspectRatio='none'><path d='M0 80 L0 56 Q40 38 80 50 Q120 62 160 42 Q200 22 240 36 Q280 50 320 30 Q360 16 400 32 Q440 48 480 34 Q520 22 560 40 Q600 56 640 42 Q680 26 720 38 Q760 50 800 38 L800 80 Z'/></svg>");
          -webkit-mask-size: 100% 100%;
          mask-size: 100% 100%;
          opacity: 0.30;
          pointer-events: none;
        }

        /* small village rooftops on the hills */
        .ps-village {
          position: absolute;
          left: 0; right: 0;
          bottom: calc(16% + 22px);
          height: 36px;
          background: var(--shelf);
          -webkit-mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 36' preserveAspectRatio='none'><path d='M0 36 L0 24 L60 24 L60 16 L80 8 L100 16 L100 24 L160 24 L160 12 L180 4 L200 12 L200 24 L260 24 L260 18 L280 12 L300 18 L300 24 L380 24 L380 14 L400 6 L420 14 L420 24 L500 24 L500 16 L520 8 L540 16 L540 24 L620 24 L620 18 L640 10 L660 18 L660 24 L720 24 L720 12 L740 4 L760 12 L760 24 L800 24 L800 36 Z'/></svg>");
          mask-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 36' preserveAspectRatio='none'><path d='M0 36 L0 24 L60 24 L60 16 L80 8 L100 16 L100 24 L160 24 L160 12 L180 4 L200 12 L200 24 L260 24 L260 18 L280 12 L300 18 L300 24 L380 24 L380 14 L400 6 L420 14 L420 24 L500 24 L500 16 L520 8 L540 16 L540 24 L620 24 L620 18 L640 10 L660 18 L660 24 L720 24 L720 12 L740 4 L760 12 L760 24 L800 24 L800 36 Z'/></svg>");
          -webkit-mask-size: 100% 100%;
          mask-size: 100% 100%;
          opacity: 0.45;
          pointer-events: none;
        }

        /* tiny window-glows */
        .ps-village-windows {
          position: absolute;
          left: 0; right: 0;
          bottom: calc(16% + 26px);
          height: 12px;
          background-image:
            radial-gradient(circle at 10% 60%, var(--accent-warm) 1.4px, transparent 2px),
            radial-gradient(circle at 23% 50%, var(--accent-warm) 1.2px, transparent 2px),
            radial-gradient(circle at 38% 60%, var(--accent-warm) 1.4px, transparent 2px),
            radial-gradient(circle at 52% 50%, var(--accent-warm) 1.5px, transparent 2px),
            radial-gradient(circle at 68% 60%, var(--accent-warm) 1.2px, transparent 2px),
            radial-gradient(circle at 82% 55%, var(--accent-warm) 1.4px, transparent 2px),
            radial-gradient(circle at 92% 60%, var(--accent-warm) 1.2px, transparent 2px);
          opacity: 0.7;
          pointer-events: none;
          filter: drop-shadow(0 0 3px var(--accent-warm));
        }

        /* ground line */
        .ps-ground-line {
          position: absolute;
          left: 0; right: 0;
          bottom: 16%;
          height: 1px;
          background: color-mix(in oklab, var(--text-primary) 30%, transparent);
          pointer-events: none;
        }

        /* drifting particles — base class */
        :global(.particle) {
          position: absolute;
          pointer-events: none;
          opacity: 0;
          animation: drift 22s linear infinite;
        }
        @keyframes drift {
          0%   { transform: translate(0, -10vh) rotate(0deg); opacity: 0; }
          10%  { opacity: 0.8; }
          100% { transform: translate(-120px, 110vh) rotate(180deg); opacity: 0; }
        }

        /* sakura petal */
        :global(.p-sakura) {
          width: 10px;
          height: 12px;
          background: var(--accent-highlight);
          border-radius: 80% 20% 70% 30% / 60% 40% 60% 40%;
          box-shadow: 0 0 4px color-mix(in oklab, var(--accent-highlight) 40%, transparent);
        }

        /* leaf */
        :global(.p-leaves) {
          width: 14px;
          height: 8px;
          background: var(--accent-warm);
          border-radius: 0 100% 0 100%;
          opacity: 0.7;
        }

        /* ocean foam */
        :global(.p-foam) {
          width: 6px;
          height: 6px;
          background: var(--accent-highlight);
          border-radius: 50%;
          opacity: 0.5;
          filter: blur(0.5px);
        }

        /* fireflies — small glowing dot */
        :global(.p-fireflies) {
          width: 5px;
          height: 5px;
          background: var(--accent-highlight);
          border-radius: 50%;
          box-shadow: 0 0 6px 2px var(--accent-highlight);
          opacity: 0.8;
        }

        /* embers — tiny orange sparks */
        :global(.p-embers) {
          width: 4px;
          height: 4px;
          background: var(--accent-warm);
          border-radius: 50%;
          box-shadow: 0 0 4px var(--accent-warm);
          opacity: 0.7;
        }

        /* snow flakes */
        :global(.p-snow) {
          width: 5px;
          height: 5px;
          background: rgba(255, 255, 255, 0.85);
          border-radius: 50%;
          box-shadow: 0 0 3px rgba(255, 255, 255, 0.5);
        }

        /* rain drops — thin elongated */
        :global(.p-rain) {
          width: 1.5px;
          height: 10px;
          background: var(--accent-highlight);
          border-radius: 1px;
          opacity: 0.5;
        }

        /* stars */
        :global(.p-stars) {
          width: 3px;
          height: 3px;
          background: var(--accent-highlight);
          border-radius: 50%;
          box-shadow: 0 0 4px 1px var(--accent-highlight);
          opacity: 0.9;
        }

        /* goldFlecks */
        :global(.p-goldFlecks) {
          width: 4px;
          height: 4px;
          background: var(--accent-warm);
          border-radius: 50%;
          box-shadow: 0 0 3px var(--accent-warm);
          opacity: 0.7;
        }

        /* dust motes */
        :global(.p-dust) {
          width: 3px;
          height: 3px;
          background: var(--accent-highlight);
          border-radius: 50%;
          opacity: 0.4;
          filter: blur(0.3px);
        }

        /* mist */
        :global(.p-mist) {
          width: 8px;
          height: 8px;
          background: var(--accent-highlight);
          border-radius: 50%;
          opacity: 0.25;
          filter: blur(2px);
        }

        /* sunbeam */
        :global(.p-sunbeam) {
          width: 2px;
          height: 14px;
          background: linear-gradient(180deg, var(--accent-highlight), transparent);
          border-radius: 1px;
          opacity: 0.4;
        }
      `}</style>
    </>
  )
}
