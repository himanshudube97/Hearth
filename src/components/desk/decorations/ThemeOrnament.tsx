import { ThemeName } from '@/lib/themes'

const ornaments: Record<ThemeName, React.ReactNode> = {
  rivendell: (
    <>
      <path
        d="M16 4 C 10 8, 8 16, 14 24 C 20 28, 26 22, 26 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M14 24 L 12 28 M 14 24 L 16 28"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
    </>
  ),
  hobbiton: (
    <>
      <path d="M16 6 Q 10 12 16 18 Q 22 12 16 6 Z" fill="currentColor" />
      <path d="M16 18 Q 22 16 26 22 Q 22 24 18 22 Z" fill="currentColor" />
      <path d="M16 18 Q 10 16 6 22 Q 10 24 14 22 Z" fill="currentColor" />
      <line
        x1="16"
        y1="18"
        x2="16"
        y2="28"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
    </>
  ),
  winterSunset: (
    <>
      <circle cx="16" cy="20" r="5" fill="none" stroke="currentColor" strokeWidth="1" />
      <line x1="16" y1="6" x2="16" y2="11" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <line x1="6" y1="20" x2="9" y2="20" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <line x1="23" y1="20" x2="26" y2="20" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <line x1="9" y1="13" x2="11" y2="15" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <line x1="21" y1="15" x2="23" y2="13" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </>
  ),
  cherryBlossom: (
    <>
      <circle cx="16" cy="9" r="3" fill="currentColor" opacity="0.8" />
      <circle cx="22" cy="14" r="3" fill="currentColor" opacity="0.8" />
      <circle cx="20" cy="22" r="3" fill="currentColor" opacity="0.8" />
      <circle cx="12" cy="22" r="3" fill="currentColor" opacity="0.8" />
      <circle cx="10" cy="14" r="3" fill="currentColor" opacity="0.8" />
      <circle cx="16" cy="16" r="1.5" fill="currentColor" />
    </>
  ),
  northernLights: (
    <>
      <path
        d="M4 18 Q 10 10 16 14 T 28 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M4 22 Q 10 16 16 19 T 28 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.6"
      />
    </>
  ),
  mistyMountains: (
    <>
      <path
        d="M4 24 L 12 12 L 18 18 L 24 8 L 28 24 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path d="M9 20 L 12 17 M 21 14 L 24 12" stroke="currentColor" strokeWidth="0.6" />
    </>
  ),
  gentleRain: (
    <>
      <path
        d="M16 6 Q 22 14 22 20 A 6 6 0 0 1 10 20 Q 10 14 16 6 Z"
        fill="currentColor"
        opacity="0.85"
      />
    </>
  ),
  cosmos: (
    <>
      <path
        d="M16 4 L 17.5 14.5 L 28 16 L 17.5 17.5 L 16 28 L 14.5 17.5 L 4 16 L 14.5 14.5 Z"
        fill="currentColor"
      />
      <circle cx="22" cy="8" r="0.8" fill="currentColor" />
      <circle cx="9" cy="24" r="0.8" fill="currentColor" />
    </>
  ),
  candlelight: (
    <>
      <path
        d="M16 4 Q 12 10 14 16 Q 10 14 12 22 Q 14 28 18 26 Q 22 22 20 16 Q 18 12 16 4 Z"
        fill="currentColor"
      />
    </>
  ),
  oceanTwilight: (
    <>
      <path
        d="M4 16 Q 8 10 12 16 T 20 16 T 28 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M4 22 Q 8 16 12 22 T 20 22 T 28 22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.7"
      />
    </>
  ),
  quietSnow: (
    <>
      <line x1="16" y1="5" x2="16" y2="27" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <line
        x1="6.5"
        y1="10.5"
        x2="25.5"
        y2="21.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <line
        x1="6.5"
        y1="21.5"
        x2="25.5"
        y2="10.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <line x1="13" y1="8" x2="16" y2="11" stroke="currentColor" strokeWidth="0.7" />
      <line x1="19" y1="8" x2="16" y2="11" stroke="currentColor" strokeWidth="0.7" />
      <line x1="13" y1="24" x2="16" y2="21" stroke="currentColor" strokeWidth="0.7" />
      <line x1="19" y1="24" x2="16" y2="21" stroke="currentColor" strokeWidth="0.7" />
    </>
  ),
  warmPeaceful: (
    <>
      <circle cx="16" cy="16" r="5" fill="currentColor" />
      <line x1="16" y1="3" x2="16" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="16" y1="24" x2="16" y2="29" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="3" y1="16" x2="8" y2="16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="24" y1="16" x2="29" y2="16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="6.5" y1="6.5" x2="10" y2="10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="22" y1="22" x2="25.5" y2="25.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="6.5" y1="25.5" x2="10" y2="22" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="22" y1="10" x2="25.5" y2="6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </>
  ),
}

interface ThemeOrnamentProps {
  themeName: ThemeName
  color: string
  size?: number
  flip?: boolean
}

export default function ThemeOrnament({
  themeName,
  color,
  size = 36,
  flip = false,
}: ThemeOrnamentProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      style={{ color, transform: flip ? 'scaleX(-1)' : undefined }}
      aria-hidden="true"
    >
      {ornaments[themeName]}
    </svg>
  )
}
