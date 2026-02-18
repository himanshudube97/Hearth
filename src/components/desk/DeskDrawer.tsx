'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useThemeStore } from '@/store/theme'
import { useDeskStore } from '@/store/desk'

export default function DeskDrawer() {
  const { theme } = useThemeStore()
  const { isDrawerOpen, toggleDrawer, setActiveElement } = useDeskStore()
  const router = useRouter()

  const handleLettersClick = () => {
    router.push('/letters')
  }

  return (
    <motion.div
      className="relative group"
      onHoverStart={() => setActiveElement('drawer')}
      onHoverEnd={() => !isDrawerOpen && setActiveElement(null)}
    >
      {/* Drawer body */}
      <motion.div
        onClick={toggleDrawer}
        className="relative cursor-pointer"
        animate={{
          x: isDrawerOpen ? 80 : 0,
        }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ x: isDrawerOpen ? 80 : 20 }}
      >
        {/* Drawer front panel */}
        <div
          className="relative rounded-lg overflow-hidden"
          style={{
            width: '150px',
            height: '90px',
            background: `linear-gradient(180deg,
              hsl(25, 30%, 28%) 0%,
              hsl(25, 25%, 22%) 100%
            )`,
            border: `1px solid hsl(25, 20%, 35%)`,
            boxShadow: `
              inset 0 2px 4px rgba(255,255,255,0.08),
              0 6px 16px rgba(0,0,0,0.35)
            `,
          }}
        >
          {/* Wood grain texture */}
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: `repeating-linear-gradient(
                95deg,
                transparent 0px,
                rgba(0,0,0,0.1) 1px,
                transparent 2px,
                transparent 25px
              )`,
            }}
          />

          {/* Decorative panel inset */}
          <div
            className="absolute inset-3 rounded"
            style={{
              border: `1px solid hsl(25, 15%, 30%)`,
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)',
            }}
          />

          {/* Handle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-14 h-3.5 rounded-full relative"
              style={{
                background: `linear-gradient(180deg,
                  hsl(40, 50%, 55%) 0%,
                  hsl(35, 45%, 40%) 100%
                )`,
                boxShadow: `
                  inset 0 1px 2px rgba(255,255,255,0.3),
                  0 2px 4px rgba(0,0,0,0.4)
                `,
              }}
            >
              {/* Handle highlight */}
              <div
                className="absolute top-0.5 left-2 right-2 h-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.2)' }}
              />
            </div>
          </div>

          {/* Envelope peeking out */}
          <motion.div
            className="absolute -top-3 left-1/2 -translate-x-1/2"
            animate={{
              y: isDrawerOpen ? -15 : 0,
              rotate: isDrawerOpen ? -8 : 0,
            }}
            transition={{ duration: 0.4 }}
          >
            {/* Envelope */}
            <div
              className="relative"
              style={{
                width: '50px',
                height: '35px',
              }}
            >
              {/* Envelope body */}
              <div
                className="absolute inset-0 rounded-sm"
                style={{
                  background: `linear-gradient(135deg,
                    #f8f4ec 0%,
                    #ebe5da 100%
                  )`,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                }}
              />
              {/* Envelope flap */}
              <div
                className="absolute top-0 left-0 right-0 h-4"
                style={{
                  background: `linear-gradient(180deg,
                    #f0ebe0 0%,
                    #f8f4ec 100%
                  )`,
                  clipPath: 'polygon(0 0, 50% 100%, 100% 0)',
                }}
              />
              {/* Wax seal */}
              <motion.div
                className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full"
                style={{
                  background: `radial-gradient(circle at 30% 30%,
                    ${theme.accent.warm} 0%,
                    hsl(15, 60%, 35%) 100%
                  )`,
                  boxShadow: `inset 0 -2px 3px rgba(0,0,0,0.3)`,
                }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </motion.div>
        </div>

        {/* Drawer shadow */}
        <div
          className="absolute -bottom-3 left-3 right-3 h-6 rounded-[50%]"
          style={{
            background: 'rgba(0,0,0,0.25)',
            filter: 'blur(8px)',
          }}
        />
      </motion.div>

      {/* Open drawer content - appears behind */}
      <AnimatePresence>
        {isDrawerOpen && (
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.3 }}
            className="absolute top-1/2 -translate-y-1/2 -left-8 z-10"
            onClick={handleLettersClick}
          >
            <motion.button
              className="px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2"
              style={{
                background: theme.glass.bg,
                border: `1px solid ${theme.glass.border}`,
                color: theme.text.primary,
                backdropFilter: `blur(${theme.glass.blur})`,
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
              }}
              whileHover={{ scale: 1.05, x: -3 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>✉</span>
              <span>Open Letters</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Label */}
      <motion.div
        className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap"
        style={{ color: theme.text.muted }}
        animate={{ opacity: isDrawerOpen ? 1 : 0 }}
      >
        Letters & Messages
      </motion.div>
    </motion.div>
  )
}
