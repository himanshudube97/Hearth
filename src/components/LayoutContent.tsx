'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Background from '@/components/Background'
import Navigation from '@/components/Navigation'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import CursorPicker from '@/components/CursorPicker'
import PageTransition from '@/components/PageTransition'
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

  if (isWritingPage) {
    // Writing page renders its own background and full-bleed canvas,
    // but still needs the top navigation floating above it. Theme/cursor
    // pickers are folded into the desk's gear-driven settings drawer
    // (see DeskSettingsPanel), so the floating ones are intentionally
    // omitted here to avoid duplicate controls.
    return (
      <>
        {children}
        <Navigation />
        <InstallPrompt />
      </>
    )
  }

  // All other pages - full layout with background, nav, padding
  return (
    <>
      <Background />
      <Navigation />
      <main className="relative z-10 min-h-screen pt-20 pb-8 px-4">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
      <CursorPicker />
      <ThemeSwitcher />
      <InstallPrompt />
    </>
  )
}
