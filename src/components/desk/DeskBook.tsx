'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeStore } from '@/store/theme'
import { useDeskStore } from '@/store/desk'
import { useDiaryStore } from '@/store/diary'
import { diaryThemes } from '@/lib/diaryThemes'
import BookSpread from './BookSpread'
import { CoverEmblems } from './decorations/CoverEmblems'

export default function DeskBook() {
  const { theme } = useThemeStore()
  const { isBookOpen, openBook, closeBook } = useDeskStore()
  const { currentDiaryTheme } = useDiaryStore()
  const diaryTheme = diaryThemes[currentDiaryTheme]

  // Get cover accent color based on theme
  const coverAccent = diaryTheme.cover.borderColor || theme.accent.warm

  return (
    <div className="relative" style={{ perspective: '2000px' }}>
      <AnimatePresence mode="wait">
        {!isBookOpen ? (
          // Closed book
          <motion.div
            key="closed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, rotateY: -30 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            onClick={openBook}
            className="cursor-pointer relative"
            style={{ transformStyle: 'preserve-3d' }}
            whileHover={{ scale: 1.03, y: -8 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Book cover */}
            <div
              className="relative rounded-lg overflow-hidden"
              style={{
                width: '260px',
                height: '340px',
                background: currentDiaryTheme === 'glass'
                  ? theme.glass.bg
                  : diaryTheme.cover.background,
                backdropFilter: currentDiaryTheme === 'glass'
                  ? `blur(${theme.glass.blur})`
                  : undefined,
                WebkitBackdropFilter: currentDiaryTheme === 'glass'
                  ? `blur(${theme.glass.blur})`
                  : undefined,
                boxShadow: currentDiaryTheme === 'glass'
                  ? `0 8px 32px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.1)`
                  : `10px 10px 30px rgba(0,0,0,0.5), inset 2px 0 6px rgba(255,255,255,0.08), inset -3px 0 8px rgba(0,0,0,0.3)`,
                border: currentDiaryTheme === 'glass'
                  ? `1px solid ${theme.glass.border}`
                  : `1px solid ${coverAccent}30`,
              }}
            >
              {/* Leather/Velvet texture overlay - not for glass */}
              {currentDiaryTheme !== 'glass' && (diaryTheme.cover.texture === 'leather' || diaryTheme.cover.texture === 'velvet' || diaryTheme.cover.texture === 'kraft') && (
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                  }}
                />
              )}

              {/* Damask pattern for Victorian Rose */}
              {diaryTheme.cover.texture === 'damask' && (
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  }}
                />
              )}

              {/* Spine detail - subtle for glass */}
              <div
                className="absolute left-0 top-0 bottom-0 w-10"
                style={{
                  background: currentDiaryTheme === 'glass'
                    ? `linear-gradient(90deg, rgba(255,255,255,0.05) 0%, transparent 100%)`
                    : `linear-gradient(90deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 40%, transparent 100%)`,
                }}
              >
                {/* Spine ridges - hide for glass */}
                {currentDiaryTheme !== 'glass' && [...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute left-2 right-2 h-px"
                    style={{
                      top: `${15 + i * 17}%`,
                      background: `linear-gradient(90deg, ${coverAccent}30, ${coverAccent}10)`,
                    }}
                  />
                ))}
              </div>

              {/* Stitching effect */}
              {diaryTheme.cover.hasStitching && (
                <div
                  className="absolute inset-4 rounded pointer-events-none"
                  style={{
                    border: `2px dashed ${coverAccent}40`,
                  }}
                />
              )}

              {/* Gilded edges */}
              {diaryTheme.cover.hasGildedEdges && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    boxShadow: `inset 0 0 0 3px ${coverAccent}40`,
                  }}
                />
              )}

              {/* Decorative border frame */}
              <div
                className="absolute inset-6 rounded pointer-events-none"
                style={{
                  border: currentDiaryTheme === 'glass'
                    ? `1px solid rgba(255,255,255,0.1)`
                    : `1px solid ${coverAccent}25`,
                }}
              />

              {/* Inner decorative frame - hide for glass */}
              {currentDiaryTheme !== 'glass' && (
                <div
                  className="absolute rounded pointer-events-none"
                  style={{
                    top: '32px',
                    left: '32px',
                    right: '16px',
                    bottom: '32px',
                    border: `1px solid ${coverAccent}15`,
                  }}
                />
              )}

              {/* Cover Emblem */}
              {diaryTheme.cover.emblem && diaryTheme.cover.emblem !== 'none' && (
                <div className="absolute inset-0 flex items-center justify-center pl-4 pointer-events-none" style={{ top: '-20px' }}>
                  <CoverEmblems
                    style={diaryTheme.cover.emblem}
                    color={coverAccent}
                    glowing={diaryTheme.interactive.glowingInk}
                  />
                </div>
              )}

              {/* Title area */}
              <div className="absolute inset-0 flex items-center justify-center pl-4">
                <div className="text-center">
                  <motion.div
                    className="text-2xl font-serif tracking-wider mb-3"
                    style={{
                      color: currentDiaryTheme === 'glass' ? theme.text.primary : coverAccent,
                      textShadow: diaryTheme.interactive.glowingInk
                        ? `0 0 20px ${coverAccent}, 0 2px 12px ${coverAccent}50`
                        : currentDiaryTheme === 'glass'
                        ? 'none'
                        : `0 2px 12px ${coverAccent}50`,
                      fontFamily: 'var(--font-playfair), Georgia, serif',
                    }}
                    animate={{ opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    Journal
                  </motion.div>
                  <div
                    className="w-16 h-px mx-auto mb-3"
                    style={{ background: currentDiaryTheme === 'glass' ? `${theme.text.muted}` : `${coverAccent}40` }}
                  />
                  <div
                    className="text-[10px] tracking-[0.2em] uppercase"
                    style={{ color: currentDiaryTheme === 'glass' ? theme.text.muted : coverAccent, opacity: currentDiaryTheme === 'glass' ? 1 : 0.5 }}
                  >
                    Click to Open
                  </div>
                </div>
              </div>

              {/* Page edges (right side) - use diary page background color */}
              <div
                className="absolute right-0 top-3 bottom-3 w-2"
                style={{
                  background: currentDiaryTheme === 'glass'
                    ? `repeating-linear-gradient(180deg, rgba(255,255,255,0.9) 0px, rgba(255,255,255,0.9) 1px, rgba(255,255,255,0.7) 1px, rgba(255,255,255,0.7) 3px)`
                    : `repeating-linear-gradient(180deg, ${diaryTheme.pages.background} 0px, ${diaryTheme.pages.background} 1px, ${diaryTheme.pages.mutedColor}20 1px, ${diaryTheme.pages.mutedColor}20 3px)`,
                  borderRadius: '0 2px 2px 0',
                }}
              />

              {/* Corner embellishments */}
              {diaryTheme.cover.cornerStyle && diaryTheme.cover.cornerStyle !== 'none' && (
                <>
                  <div
                    className="absolute top-3 right-3 w-6 h-6"
                    style={{
                      borderTop: `2px solid ${coverAccent}50`,
                      borderRight: `2px solid ${coverAccent}50`,
                      borderRadius: '0 4px 0 0',
                    }}
                  />
                  <div
                    className="absolute bottom-3 right-3 w-6 h-6"
                    style={{
                      borderBottom: `2px solid ${coverAccent}50`,
                      borderRight: `2px solid ${coverAccent}50`,
                      borderRadius: '0 0 4px 0',
                    }}
                  />
                  <div
                    className="absolute top-3 left-12 w-6 h-6"
                    style={{
                      borderTop: `2px solid ${coverAccent}50`,
                      borderLeft: `2px solid ${coverAccent}50`,
                      borderRadius: '4px 0 0 0',
                    }}
                  />
                  <div
                    className="absolute bottom-3 left-12 w-6 h-6"
                    style={{
                      borderBottom: `2px solid ${coverAccent}50`,
                      borderLeft: `2px solid ${coverAccent}50`,
                      borderRadius: '0 0 0 4px',
                    }}
                  />
                </>
              )}
            </div>

            {/* Book shadow */}
            <motion.div
              className="absolute -bottom-6 left-6 right-6 h-10 rounded-[50%]"
              style={{
                background: 'rgba(0,0,0,0.4)',
                filter: 'blur(16px)',
              }}
              animate={{
                opacity: [0.4, 0.5, 0.4],
                scaleX: [1, 1.02, 1],
              }}
              transition={{ duration: 4, repeat: Infinity }}
            />
          </motion.div>
        ) : (
          // Open book
          <motion.div
            key="open"
            initial={{ opacity: 0, scale: 0.85, rotateY: 40 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <BookSpread onClose={closeBook} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
