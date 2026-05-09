'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import { useAuthStore } from '@/store/auth'
import { useProfileStore } from '@/store/profile'
import { useLayoutMode } from '@/hooks/useMediaQuery'

const tabs = [
  { href: '/write', label: 'Write', icon: '✎' },
  { href: '/scrapbook', label: 'Scrapbook', icon: '✦' },
  { href: '/letters', label: 'Letters', icon: '✉' },
  { href: '/shelf', label: 'Shelf', icon: '❒' },
  { href: '/memory', label: 'Memory', icon: '★' },
]

export default function Navigation() {
  const pathname = usePathname()
  const { theme } = useThemeStore()
  const { user } = useAuthStore()
  const { profile, fetchProfile } = useProfileStore()
  const layoutMode = useLayoutMode()
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Fetch profile on mount to get nickname
  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user, fetchProfile])

  // Close the mobile drawer whenever the route changes — otherwise it stays
  // open after a tab tap and covers the page the user just navigated to.
  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  // Don't show navigation on login page or landing page
  if (pathname === '/login' || pathname === '/') {
    return null
  }

  // Get first letter of nickname (or email fallback) for avatar
  const nickname = profile.nickname
  const avatarLetter = nickname?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'

  // Mobile: hamburger in the top-right slot where FullscreenButton sits on
  // desktop (FullscreenButton hides on mobile). The 5-tab pill is too wide
  // for narrow screens, so we collapse to a slide-from-right drawer.
  if (layoutMode === 'mobile') {
    return (
      <>
        <motion.button
          onClick={() => setDrawerOpen(o => !o)}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed top-4 left-4 z-50 w-12 h-12 rounded-full flex items-center justify-center"
          style={{
            background: theme.glass.bg,
            backdropFilter: `blur(${theme.glass.blur})`,
            border: `1px solid ${theme.glass.border}`,
            color: theme.text.primary,
          }}
          aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={drawerOpen}
        >
          <HamburgerIcon open={drawerOpen} />
        </motion.button>

        <AnimatePresence>
          {drawerOpen && (
            <>
              {/* Backdrop — tap to close */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setDrawerOpen(false)}
                className="fixed inset-0 z-40"
                style={{ background: 'rgba(0,0,0,0.35)' }}
              />

              {/* Drawer */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                className="fixed top-0 left-0 z-50 h-full w-72 max-w-[80vw] flex flex-col p-6 pt-20 gap-1.5"
                style={{
                  background: theme.glass.bg,
                  backdropFilter: `blur(${theme.glass.blur})`,
                  borderRight: `1px solid ${theme.glass.border}`,
                }}
              >
                <Link
                  href="/"
                  className="text-[10px] tracking-[0.3em] mb-4 opacity-60"
                  style={{ color: theme.text.muted }}
                >
                  ← HEARTH
                </Link>

                {tabs.map(tab => {
                  const isActive = pathname === tab.href
                  return (
                    <Link key={tab.href} href={tab.href}>
                      <div
                        className="px-4 py-3 rounded-xl flex items-center gap-3 transition"
                        style={{
                          background: isActive ? `${theme.accent.primary}30` : 'transparent',
                          color: isActive ? theme.text.primary : theme.text.muted,
                          border: isActive
                            ? `1px solid ${theme.accent.primary}40`
                            : '1px solid transparent',
                        }}
                      >
                        <span className="text-lg w-6 text-center">{tab.icon}</span>
                        <span className="text-base">{tab.label}</span>
                      </div>
                    </Link>
                  )
                })}

                {user && (
                  <Link href="/me" className="mt-auto">
                    <div
                      className="px-4 py-3 rounded-xl flex items-center gap-3"
                      style={{
                        background: pathname === '/me'
                          ? `${theme.accent.primary}30`
                          : `${theme.accent.warm}20`,
                        color: pathname === '/me' ? theme.accent.primary : theme.text.muted,
                        border: pathname === '/me'
                          ? `1px solid ${theme.accent.primary}`
                          : '1px solid transparent',
                      }}
                    >
                      <span
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                        style={{ border: `1px solid ${theme.glass.border}` }}
                      >
                        {avatarLetter}
                      </span>
                      <span className="text-sm">{nickname || user.email}</span>
                    </div>
                  </Link>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    )
  }

  // Desktop / tablet — original floating pill.
  return (
    <>
      <Link
        href="/"
        className="fixed top-6 left-6 z-40 text-xs tracking-[0.3em] opacity-60 hover:opacity-100 transition"
        style={{ color: theme.text.muted }}
      >
        ← HEARTH
      </Link>
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-40">
      <div
        className="flex gap-1 p-1 rounded-full items-center"
        style={{
          background: theme.glass.bg,
          backdropFilter: `blur(${theme.glass.blur})`,
          border: `1px solid ${theme.glass.border}`,
        }}
      >
        {tabs.map((tab) => {
          const isActive = pathname === tab.href
          return (
            <Link key={tab.href} href={tab.href}>
              <motion.div
                className="relative px-4 py-2 rounded-full flex items-center gap-2"
                style={{
                  color: isActive ? theme.text.primary : theme.text.muted,
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              >
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ background: `${theme.accent.primary}30` }}
                    layoutId="activeTab"
                    transition={{ type: 'spring', stiffness: 80, damping: 20, mass: 1 }}
                  />
                )}
                <span className="relative z-10">{tab.icon}</span>
                <span className="relative z-10 text-sm">{tab.label}</span>
              </motion.div>
            </Link>
          )
        })}

        {user && (
          <>
            <div
              className="w-px h-6 mx-1"
              style={{ background: theme.glass.border }}
            />
            <Link href="/me">
              <motion.div
                className="relative w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                style={{
                  background: pathname === '/me'
                    ? `${theme.accent.primary}30`
                    : `${theme.accent.warm}20`,
                  color: pathname === '/me'
                    ? theme.accent.primary
                    : theme.text.muted,
                  border: pathname === '/me'
                    ? `1px solid ${theme.accent.primary}`
                    : '1px solid transparent',
                }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                title={nickname || user.email}
              >
                {avatarLetter}
              </motion.div>
            </Link>
          </>
        )}
      </div>
    </nav>
    </>
  )
}

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {open ? (
        <>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </>
      ) : (
        <>
          <line x1="3" y1="7" x2="21" y2="7" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="17" x2="21" y2="17" />
        </>
      )}
    </svg>
  )
}
