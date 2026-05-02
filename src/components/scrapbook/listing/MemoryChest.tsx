'use client'

import { ReactNode } from 'react'

interface Props {
  open: boolean
  onToggle: () => void
  /** Brass plate with picker + any tag/badge slots, rendered on the body face. */
  children?: ReactNode
}

/**
 * Rectangular wooden chest with a flat lid, iron straps, brass corners,
 * and a clasp. Lid rotates back when opened. Wood tone is theme-driven
 * via --chest-* CSS vars; brass and iron stay constant across themes.
 */
export default function MemoryChest({ open, onToggle, children }: Props) {
  return (
    <div className="chest-wrap">
      <div className={`chest ${open ? 'is-open' : ''}`} onClick={onToggle}>
        <div className="lid">
          <div className="lid-front" />
          <div className="lid-strip lid-strip-1" />
          <div className="lid-strip lid-strip-2" />
          <div className="lid-corner lid-corner-tl" />
          <div className="lid-corner lid-corner-tr" />
        </div>

        <div className="body">
          <div className="body-grain" />
          <div className="band band-top" />
          <div className="band band-bot" />
          <div className="corner corner-bl" />
          <div className="corner corner-br" />
          <div className="clasp" />
          {children}
        </div>

        <div className="chest-shadow" />
      </div>

      <style jsx>{`
        .chest-wrap { position: relative; flex: 0 0 auto; }
        .chest {
          position: relative;
          width: 380px;
          height: 240px;
          cursor: pointer;
          transition: transform .55s cubic-bezier(.25,.8,.4,1);
          transform-origin: center bottom;
        }
        .chest:hover { transform: translateY(-2px); }

        .lid {
          position: absolute;
          left: 0; right: 0;
          top: 0;
          height: 56px;
          transform-origin: bottom center;
          transform-style: preserve-3d;
          transition: transform .55s cubic-bezier(.5,1.4,.4,1);
          z-index: 2;
        }
        .chest.is-open .lid { transform: rotateX(-115deg); }
        .lid-front {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(180deg,
              var(--chest-3) 0%,
              var(--chest-2) 35%,
              var(--chest-4) 100%);
          border-radius: 8px 8px 4px 4px;
          box-shadow:
            inset 0 4px 8px rgba(255, 220, 180, 0.20),
            inset 0 -4px 8px rgba(0, 0, 0, 0.4),
            0 6px 14px rgba(0, 0, 0, 0.25);
        }
        .lid-strip {
          position: absolute;
          left: -8px; right: -8px;
          height: 8px;
          background: linear-gradient(180deg, var(--iron-1) 0%, var(--iron-2) 60%, var(--iron-3) 100%);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 1px 2px rgba(0,0,0,0.4);
        }
        .lid-strip-1 { top: 14px; }
        .lid-strip-2 { top: 36px; }
        .lid-corner {
          position: absolute;
          width: 22px; height: 22px;
          top: 2px;
          background: linear-gradient(135deg, var(--brass-1) 0%, var(--brass-3) 100%);
          box-shadow:
            inset 0 1px 1px rgba(255,235,180,0.5),
            inset 0 -2px 2px rgba(0,0,0,0.3);
          border-radius: 2px;
        }
        .lid-corner-tl { left: -2px; clip-path: polygon(0 0, 100% 0, 0 100%); }
        .lid-corner-tr { right: -2px; clip-path: polygon(100% 0, 100% 100%, 0 0); }

        .body {
          position: absolute;
          left: 0; right: 0;
          top: 50px;
          bottom: 12px;
          background:
            linear-gradient(180deg,
              var(--chest-4) 0%,
              var(--chest-1) 30%,
              var(--chest-2) 55%,
              var(--chest-4) 100%);
          border-radius: 4px 4px 6px 6px;
          box-shadow:
            inset 0 8px 16px rgba(0, 0, 0, 0.35),
            inset 0 -2px 6px rgba(255, 220, 180, 0.10),
            0 14px 28px rgba(0, 0, 0, 0.30);
          z-index: 1;
        }
        .body-grain {
          position: absolute;
          inset: 0;
          background:
            repeating-linear-gradient(180deg,
              transparent 0px, transparent 14px,
              rgba(0,0,0,0.06) 14px, rgba(0,0,0,0.06) 15px),
            repeating-linear-gradient(90deg,
              transparent 0px, transparent 80px,
              rgba(255,220,180,0.04) 80px, rgba(255,220,180,0.04) 82px);
          border-radius: inherit;
          pointer-events: none;
        }
        .band {
          position: absolute;
          left: -8px; right: -8px;
          height: 14px;
          background: linear-gradient(180deg, var(--iron-1) 0%, var(--iron-2) 60%, var(--iron-3) 100%);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.08),
            inset 0 -1px 0 rgba(255,255,255,0.04),
            0 2px 3px rgba(0,0,0,0.4);
          z-index: 3;
        }
        .band-top { top: 4px; }
        .band-bot { bottom: -2px; }
        .corner {
          position: absolute;
          width: 24px; height: 28px;
          bottom: -2px;
          background: linear-gradient(135deg, var(--brass-1) 0%, var(--brass-3) 100%);
          box-shadow:
            inset 0 1px 1px rgba(255,235,180,0.5),
            inset 0 -2px 2px rgba(0,0,0,0.3),
            0 2px 3px rgba(0,0,0,0.3);
          border-radius: 2px;
          z-index: 4;
        }
        .corner-bl { left: -2px; clip-path: polygon(0 0, 100% 100%, 0 100%); }
        .corner-br { right: -2px; clip-path: polygon(100% 0, 100% 100%, 0 100%); }

        .clasp {
          position: absolute;
          bottom: 18px;
          left: 50%;
          transform: translateX(-50%);
          width: 22px;
          height: 28px;
          background: linear-gradient(180deg, var(--brass-1) 0%, var(--brass-3) 100%);
          border-radius: 3px 3px 50% 50%;
          box-shadow:
            inset 0 1px 1px rgba(255,235,180,0.5),
            inset 0 -2px 3px rgba(0,0,0,0.35),
            0 2px 3px rgba(0,0,0,0.35);
          z-index: 4;
        }
        .clasp::after {
          content: '';
          position: absolute;
          inset: 6px 8px 8px 8px;
          background: radial-gradient(circle at 50% 30%, #1a0a04 0%, #050201 100%);
          border-radius: 50%;
        }

        .chest-shadow {
          position: absolute;
          left: -8%; right: -8%;
          bottom: -6px;
          height: 18px;
          background: radial-gradient(ellipse at center, rgba(0,0,0,0.32), transparent 70%);
          z-index: 0;
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}
