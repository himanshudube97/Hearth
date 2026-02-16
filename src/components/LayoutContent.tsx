'use client'

import { usePathname } from 'next/navigation'
import Background from '@/components/Background'
import Navigation from '@/components/Navigation'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import CursorPicker from '@/components/CursorPicker'

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isLandingPage = pathname === '/'

  if (isLandingPage) {
    // Landing page - no background, navigation, or padding
    return (
      <>
        {children}
        <CursorPicker />
        <ThemeSwitcher />
      </>
    )
  }

  // All other pages - full layout with background, nav, padding
  return (
    <>
      <Background />
      <Navigation />
      <main className="relative z-10 min-h-screen pt-20 pb-8 px-4">
        {children}
      </main>
      <CursorPicker />
      <ThemeSwitcher />
    </>
  )
}
