'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Background from '@/components/Background'
import Navigation from '@/components/Navigation'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import CursorPicker from '@/components/CursorPicker'
import PageTransition from '@/components/PageTransition'
import DeskSettingsPanel from '@/components/desk/DeskSettingsPanel'
import { InstallPrompt } from '@/components/InstallPrompt'
import { useThemeStore } from '@/store/theme'
import { useApplyCursorStyles } from '@/hooks/useApplyCursorStyles'

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const { theme } = useThemeStore()
  const isLandingPage = pathname === '/'
  const isPricingPage = pathname === '/pricing'
  const isWritingPage = pathname === '/write'
  // /letters renders DeskSettingsPanel (gear icon) for theme + cursor, so the
  // floating bottom pickers would be duplicates. It still wants the shared
  // Background + Navigation + main wrapper, unlike /write.
  const isLettersPage = pathname === '/letters'

  // Apply the active cursor styles globally. Used to live inside
  // CursorPicker, but the writing page no longer renders that picker (it
  // uses the desk gear panel instead) — so this lives at the layout level.
  useApplyCursorStyles()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Update body background color when theme changes
  useEffect(() => {
    if (mounted) {
      document.body.style.backgroundColor = theme.bg.primary
    }
  }, [theme.bg.primary, mounted])

  // Prevent hydration flash - show nothing until client is ready
  if (!mounted) {
    return null
  }

  if (isLandingPage || isPricingPage) {
    // Landing & Pricing - no navigation (public pages)
    return (
      <>
        {children}
        <CursorPicker />
        <ThemeSwitcher />
        <InstallPrompt />
      </>
    )
  }

  // Background renders for every authed page (write, letters, timeline, etc.)
  // so it persists across navigations — no unmount/remount flash when moving
  // between /letters and /write. /write's DeskScene paints its desk surface
  // on top of this Background, /letters lays its postcard over it.
  if (isWritingPage) {
    return (
      <>
        <Background />
        {children}
        <Navigation />
        <InstallPrompt />
      </>
    )
  }

  // /letters uses DeskSettingsPanel (gear) instead of the floating bottom
  // pickers. The gear is rendered here at the layout root so it's NOT inside
  // <main> / <PageTransition> — those wrappers have transforms during the
  // page-transition animation, which would otherwise become the containing
  // block for the gear's `position: fixed` and shift it down by main's
  // pt-20.
  return (
    <>
      <Background />
      <Navigation />
      <main className="relative z-10 min-h-screen pt-20 pb-8 px-4">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
      {isLettersPage ? (
        <DeskSettingsPanel />
      ) : (
        <>
          <CursorPicker />
          <ThemeSwitcher />
        </>
      )}
      <InstallPrompt />
    </>
  )
}
