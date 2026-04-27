'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Background from '@/components/Background'
import Navigation from '@/components/Navigation'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import CursorPicker from '@/components/CursorPicker'
import PageTransition from '@/components/PageTransition'
import DeskSettingsPanel from '@/components/desk/DeskSettingsPanel'
import AmbientSoundLayer from '@/components/AmbientSoundLayer'
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
  //
  // The gear-driven DeskSettingsPanel is the single settings entry point on
  // every authed page (theme, cursor, animations, sound — and page opacity
  // on /write). It replaces the older floating ThemeSwitcher + CursorPicker.
  if (isWritingPage) {
    return (
      <>
        <Background />
        <AmbientSoundLayer />
        {children}
        <Navigation />
        <DeskSettingsPanel />
        <InstallPrompt />
      </>
    )
  }

  return (
    <>
      <Background />
      <AmbientSoundLayer />
      <Navigation />
      <main className="relative z-10 min-h-screen pt-20 pb-8 px-4">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
      {/* Gear is rendered at the layout root so it's NOT inside <main> /
          <PageTransition> — those wrappers have transforms during the
          page-transition animation, which would otherwise become the
          containing block for the gear's `position: fixed`. */}
      <DeskSettingsPanel />
      <InstallPrompt />
    </>
  )
}
