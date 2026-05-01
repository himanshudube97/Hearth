'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import { useAuthStore } from '@/store/auth'
import { useProfileStore } from '@/store/profile'

const tabs = [
  { href: '/write', label: 'Write', icon: '✎' },
  { href: '/scrapbook', label: 'Scrapbook', icon: '✦' },
  { href: '/letters', label: 'Letters', icon: '✉' },
  { href: '/shelf', label: 'Shelf', icon: '❒' },
  { href: '/constellation', label: 'Memory', icon: '★' },
]

export default function Navigation() {
  const pathname = usePathname()
  const { theme } = useThemeStore()
  const { user } = useAuthStore()
  const { profile, fetchProfile } = useProfileStore()

  // Fetch profile on mount to get nickname
  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user, fetchProfile])

  // Don't show navigation on login page or landing page
  if (pathname === '/login' || pathname === '/') {
    return null
  }

  // Get first letter of nickname (or email fallback) for avatar
  const nickname = profile.nickname
  const avatarLetter = nickname?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'

  return (
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
  )
}
