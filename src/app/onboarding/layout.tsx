import type { ReactNode } from 'react'

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f6efe2] text-[#3d342a]">
      {children}
    </div>
  )
}
