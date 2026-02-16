'use client'

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import { createNoise2D } from 'simplex-noise'
import { useThemeStore } from '@/store/theme'
import type { ISourceOptions } from '@tsparticles/engine'

// ========== PARTICLE CONFIGURATIONS ==========

// Fireflies configuration - magical forest glow
const getFirefliesConfig = (): ISourceOptions => ({
  fullScreen: false,
  background: { color: { value: 'transparent' } },
  fpsLimit: 60,
  particles: {
    number: { value: 35, density: { enable: true } },
    color: { value: ['#D4A84B', '#E8A855', '#F0C060'] },
    shape: { type: 'circle' },
    opacity: {
      value: { min: 0.2, max: 0.9 },
      animation: {
        enable: true,
        speed: 0.8,
        sync: false,
        mode: 'random' as const,
      },
    },
    size: {
      value: { min: 2, max: 5 },
      animation: {
        enable: true,
        speed: 2,
        sync: false,
      },
    },
    move: {
      enable: true,
      speed: { min: 0.3, max: 1.2 },
      direction: 'none' as const,
      random: true,
      straight: false,
      outModes: { default: 'bounce' as const },
      warp: true,
    },
    glow: {
      enable: true,
      color: '#D4A84B',
      radius: 15,
    } as any,
    shadow: {
      enable: true,
      color: '#D4A84B',
      blur: 10,
      offset: { x: 0, y: 0 },
    },
  },
  detectRetina: true,
})

// Snow configuration - gentle winter falling (very slow and calm)
const getSnowConfig = (): ISourceOptions => ({
  fullScreen: false,
  background: { color: { value: 'transparent' } },
  fpsLimit: 30,
  particles: {
    number: { value: 60, density: { enable: true } },
    color: { value: ['#FFFAF5', '#FFF8F0', '#FFFFFF'] },
    shape: { type: 'circle' },
    opacity: {
      value: { min: 0.3, max: 0.8 },
    },
    size: {
      value: { min: 1, max: 3 },
    },
    move: {
      enable: true,
      speed: { min: 0.08, max: 0.25 },
      direction: 'bottom' as const,
      random: false,
      straight: false,
      outModes: { default: 'out' as const },
      drift: { min: -0.15, max: 0.15 },
    },
    wobble: {
      enable: true,
      distance: 5,
      speed: { min: -0.3, max: 0.3 },
    },
    shadow: {
      enable: true,
      color: '#FFFFFF',
      blur: 3,
      offset: { x: 0, y: 0 },
    },
  },
  detectRetina: true,
})

// Sakura configuration - cherry blossom petals (very slow, dreamy falling)
const getSakuraConfig = (): ISourceOptions => ({
  fullScreen: false,
  background: { color: { value: 'transparent' } },
  fpsLimit: 30,
  particles: {
    number: { value: 30, density: { enable: true } },
    color: { value: ['#FFB7C5', '#FFC0CB', '#FFD4E0', '#FFDAE0', '#E8A0B8'] },
    shape: {
      type: 'image',
      options: {
        image: [
          {
            src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyMCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZWxsaXBzZSBjeD0iMTAiIGN5PSIxMiIgcng9IjgiIHJ5PSIxMCIgZmlsbD0iI0ZGQjdDNSIgZmlsbC1vcGFjaXR5PSIwLjkiLz48L3N2Zz4=',
            width: 20,
            height: 24,
          },
        ],
      },
    },
    opacity: {
      value: { min: 0.5, max: 0.85 },
    },
    size: {
      value: { min: 6, max: 12 },
    },
    move: {
      enable: true,
      speed: { min: 0.15, max: 0.4 },
      direction: 'bottom' as const,
      outModes: { default: 'out' as const },
      drift: { min: -0.2, max: 0.2 },
    },
    rotate: {
      value: { min: 0, max: 360 },
      animation: {
        enable: true,
        speed: 1,
        sync: false,
      },
    },
    tilt: {
      enable: true,
      value: { min: 0, max: 15 },
      animation: {
        enable: true,
        speed: 0.8,
        sync: false,
      },
    },
    wobble: {
      enable: true,
      distance: 8,
      speed: { min: -0.5, max: 0.5 },
    },
  },
  detectRetina: true,
})

// Aurora stars configuration - twinkling night sky
const getAuroraStarsConfig = (): ISourceOptions => ({
  fullScreen: false,
  background: { color: { value: 'transparent' } },
  fpsLimit: 60,
  particles: {
    number: { value: 100, density: { enable: true } },
    color: { value: '#FFFFFF' },
    shape: { type: 'circle' },
    opacity: {
      value: { min: 0.1, max: 1 },
      animation: {
        enable: true,
        speed: 1,
        sync: false,
        mode: 'random' as const,
      },
    },
    size: {
      value: { min: 0.5, max: 2.5 },
      animation: {
        enable: true,
        speed: 2,
        sync: false,
      },
    },
    move: {
      enable: true,
      speed: 0.1,
      direction: 'none' as const,
      random: true,
      straight: false,
      outModes: { default: 'bounce' as const },
    },
    twinkle: {
      particles: {
        enable: true,
        frequency: 0.05,
        opacity: 1,
      },
    },
  },
  detectRetina: true,
})

// Mist particles configuration (smaller, subtle wisps)
const getMistConfig = (): ISourceOptions => ({
  fullScreen: false,
  background: { color: { value: 'transparent' } },
  fpsLimit: 30,
  particles: {
    number: { value: 25, density: { enable: true } },
    color: { value: ['#C8D8E8', '#B8C8D8', '#D0E0F0'] },
    shape: { type: 'circle' },
    opacity: {
      value: { min: 0.03, max: 0.12 },
    },
    size: {
      value: { min: 8, max: 25 },
    },
    move: {
      enable: true,
      speed: { min: 0.08, max: 0.2 },
      direction: 'right' as const,
      random: true,
      outModes: { default: 'out' as const },
    },
    blur: {
      enable: true,
      value: 8,
    } as any,
  },
  detectRetina: true,
})

// Rain configuration - gentle rainfall (very slow, calming)
const getRainConfig = (): ISourceOptions => ({
  fullScreen: false,
  background: { color: { value: 'transparent' } },
  fpsLimit: 30,
  particles: {
    number: { value: 80, density: { enable: true } },
    color: { value: ['#8AA8C0', '#A0B8D0', '#B8D0E8'] },
    shape: { type: 'circle' },
    opacity: {
      value: { min: 0.15, max: 0.4 },
    },
    size: {
      value: { min: 1, max: 2 },
    },
    move: {
      enable: true,
      speed: { min: 0.8, max: 1.5 },
      direction: 'bottom' as const,
      straight: true,
      outModes: { default: 'out' as const },
    },
    life: {
      duration: { value: 0 },
    },
  },
  detectRetina: true,
})

// Stars configuration - twinkling cosmos (very slow drift)
const getStarsConfig = (): ISourceOptions => ({
  fullScreen: false,
  background: { color: { value: 'transparent' } },
  fpsLimit: 30,
  particles: {
    number: { value: 120, density: { enable: true } },
    color: { value: ['#FFFFFF', '#E8E8FF', '#FFE8F0', '#E8F0FF'] },
    shape: { type: 'circle' },
    opacity: {
      value: { min: 0.1, max: 0.9 },
      animation: {
        enable: true,
        speed: 0.3,
        sync: false,
        mode: 'random' as const,
      },
    },
    size: {
      value: { min: 0.5, max: 2 },
      animation: {
        enable: true,
        speed: 0.5,
        sync: false,
      },
    },
    move: {
      enable: true,
      speed: 0.02,
      direction: 'none' as const,
      random: true,
      outModes: { default: 'bounce' as const },
    },
    twinkle: {
      particles: {
        enable: true,
        frequency: 0.03,
        opacity: 1,
      },
    },
  },
  detectRetina: true,
})

// Dust motes configuration - floating particles near candlelight
const getDustConfig = (): ISourceOptions => ({
  fullScreen: false,
  background: { color: { value: 'transparent' } },
  fpsLimit: 30,
  particles: {
    number: { value: 30, density: { enable: true } },
    color: { value: ['#FFE0B0', '#FFD090', '#FFC070'] },
    shape: { type: 'circle' },
    opacity: {
      value: { min: 0.1, max: 0.4 },
      animation: {
        enable: true,
        speed: 0.2,
        sync: false,
        mode: 'random' as const,
      },
    },
    size: {
      value: { min: 1, max: 3 },
    },
    move: {
      enable: true,
      speed: { min: 0.05, max: 0.15 },
      direction: 'none' as const,
      random: true,
      outModes: { default: 'bounce' as const },
    },
    shadow: {
      enable: true,
      color: '#E8A050',
      blur: 5,
      offset: { x: 0, y: 0 },
    },
  },
  detectRetina: true,
})

// Foam configuration - floating sea foam/bubbles
const getFoamConfig = (): ISourceOptions => ({
  fullScreen: false,
  background: { color: { value: 'transparent' } },
  fpsLimit: 30,
  particles: {
    number: { value: 25, density: { enable: true } },
    color: { value: ['#B0E0F0', '#C8E8F8', '#E0F4FF'] },
    shape: { type: 'circle' },
    opacity: {
      value: { min: 0.2, max: 0.5 },
      animation: {
        enable: true,
        speed: 0.15,
        sync: false,
      },
    },
    size: {
      value: { min: 2, max: 6 },
    },
    move: {
      enable: true,
      speed: { min: 0.05, max: 0.12 },
      direction: 'top-right' as const,
      random: true,
      outModes: { default: 'out' as const },
      drift: { min: -0.1, max: 0.1 },
    },
    wobble: {
      enable: true,
      distance: 4,
      speed: { min: -0.2, max: 0.2 },
    },
  },
  detectRetina: true,
})

// Dandelion seeds configuration - soft blurry floating fluff
const getDandelionConfig = (): ISourceOptions => ({
  fullScreen: false,
  background: { color: { value: 'transparent' } },
  fpsLimit: 30,
  particles: {
    number: { value: 18, density: { enable: true } },
    color: { value: ['#FFFFFF', '#FFF8E8', '#FFFDF5'] },
    shape: { type: 'circle' },
    opacity: {
      value: { min: 0.2, max: 0.5 },
    },
    size: {
      value: { min: 4, max: 10 },
    },
    move: {
      enable: true,
      speed: { min: 0.03, max: 0.1 },
      direction: 'top-right' as const,
      random: true,
      straight: false,
      outModes: { default: 'out' as const },
      drift: { min: -0.1, max: 0.1 },
    },
    wobble: {
      enable: true,
      distance: 8,
      speed: { min: -0.2, max: 0.2 },
    },
    shadow: {
      enable: true,
      color: '#FFFFFF',
      blur: 8,
      offset: { x: 0, y: 0 },
    },
  },
  detectRetina: true,
})

// Snowflakes configuration - peaceful evening snowfall (very slow, straight down)
const getSnowflakesConfig = (): ISourceOptions => ({
  fullScreen: false,
  background: { color: { value: 'transparent' } },
  fpsLimit: 30,
  particles: {
    number: { value: 50, density: { enable: true } },
    color: { value: '#FFFFFF' },
    shape: {
      type: 'image',
      options: {
        image: [
          {
            // 6-point snowflake
            src: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjRkZGRkZGIj48cGF0aCBkPSJNMTIgMnYyME0yIDEyaDIwTTQuOTMgNC45M2wxNC4xNCAxNC4xNE0xOS4wNyA0LjkzTDQuOTMgMTkuMDciIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjIiIGZpbGw9IiNGRkZGRkYiLz48L3N2Zz4=',
            width: 24,
            height: 24,
          },
          {
            // Simple star snowflake
            src: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIj48cGF0aCBkPSJNMTAgMHYyME0wIDEwaDIwTTIuOTMgMi45M2wxNC4xNCAxNC4xNE0xNy4wNyAyLjkzTDIuOTMgMTcuMDciIHN0cm9rZT0iI0ZGRkZGRiIgc3Ryb2tlLXdpZHRoPSIxLjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvc3ZnPg==',
            width: 20,
            height: 20,
          },
        ],
      },
    },
    opacity: {
      value: { min: 0.4, max: 0.85 },
    },
    size: {
      value: { min: 4, max: 8 },
    },
    move: {
      enable: true,
      speed: { min: 0.2, max: 0.5 },
      direction: 'bottom' as const,
      straight: true,
      outModes: { default: 'out' as const },
    },
    rotate: {
      value: { min: 0, max: 360 },
      animation: {
        enable: true,
        speed: 0.3,
        sync: false,
      },
    },
  },
  detectRetina: true,
})

// ========== CSS AURORA COMPONENT (simple, elegant) ==========

const CssAurora = React.memo(function CssAurora() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Aurora ribbon 1 - green */}
      <motion.div
        className="absolute"
        style={{
          top: '5%',
          left: '-10%',
          width: '120%',
          height: '35%',
          background: 'linear-gradient(180deg, transparent 0%, rgba(78, 204, 163, 0.08) 30%, rgba(78, 204, 163, 0.15) 50%, rgba(78, 204, 163, 0.08) 70%, transparent 100%)',
          filter: 'blur(40px)',
          transformOrigin: 'center center',
        }}
        animate={{
          scaleX: [1, 1.05, 0.98, 1.03, 1],
          scaleY: [1, 1.1, 0.95, 1.05, 1],
          x: [0, 20, -15, 10, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Aurora ribbon 2 - teal/cyan */}
      <motion.div
        className="absolute"
        style={{
          top: '8%',
          left: '-5%',
          width: '110%',
          height: '30%',
          background: 'linear-gradient(180deg, transparent 0%, rgba(136, 212, 171, 0.06) 30%, rgba(136, 212, 171, 0.12) 50%, rgba(136, 212, 171, 0.06) 70%, transparent 100%)',
          filter: 'blur(50px)',
          transformOrigin: 'center center',
        }}
        animate={{
          scaleX: [1, 0.97, 1.04, 0.99, 1],
          scaleY: [1, 1.08, 0.96, 1.04, 1],
          x: [0, -25, 15, -10, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      {/* Aurora ribbon 3 - purple hint */}
      <motion.div
        className="absolute"
        style={{
          top: '2%',
          left: '0%',
          width: '100%',
          height: '25%',
          background: 'linear-gradient(180deg, transparent 0%, rgba(123, 104, 238, 0.05) 30%, rgba(123, 104, 238, 0.1) 50%, rgba(123, 104, 238, 0.05) 70%, transparent 100%)',
          filter: 'blur(60px)',
          transformOrigin: 'center center',
        }}
        animate={{
          scaleX: [1, 1.03, 0.96, 1.02, 1],
          scaleY: [1, 0.94, 1.06, 0.98, 1],
          x: [0, 15, -20, 8, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
      />

      {/* Soft vertical streaks */}
      <motion.div
        className="absolute"
        style={{
          top: '0%',
          left: '20%',
          width: '8%',
          height: '40%',
          background: 'linear-gradient(180deg, rgba(78, 204, 163, 0.12) 0%, rgba(78, 204, 163, 0.04) 100%)',
          filter: 'blur(25px)',
        }}
        animate={{ opacity: [0.3, 0.6, 0.3], height: ['35%', '45%', '35%'] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute"
        style={{
          top: '0%',
          left: '55%',
          width: '6%',
          height: '35%',
          background: 'linear-gradient(180deg, rgba(136, 212, 171, 0.1) 0%, rgba(136, 212, 171, 0.03) 100%)',
          filter: 'blur(20px)',
        }}
        animate={{ opacity: [0.4, 0.7, 0.4], height: ['30%', '40%', '30%'] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      />
      <motion.div
        className="absolute"
        style={{
          top: '0%',
          left: '75%',
          width: '5%',
          height: '30%',
          background: 'linear-gradient(180deg, rgba(123, 104, 238, 0.08) 0%, rgba(123, 104, 238, 0.02) 100%)',
          filter: 'blur(18px)',
        }}
        animate={{ opacity: [0.35, 0.55, 0.35], height: ['25%', '35%', '25%'] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 7 }}
      />
    </div>
  )
})

// ========== SIMPLEX NOISE MIST COMPONENT ==========

const NoiseMist = React.memo(function NoiseMist() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const noise2D = useMemo(() => createNoise2D(), [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    let time = 0

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw multiple mist layers
      const layers = [
        { baseY: 0.5, opacity: 0.08, speed: 0.0003, scale: 0.003 },
        { baseY: 0.6, opacity: 0.12, speed: 0.0005, scale: 0.004 },
        { baseY: 0.7, opacity: 0.15, speed: 0.0004, scale: 0.005 },
      ]

      layers.forEach((layer) => {
        ctx.beginPath()

        for (let x = 0; x <= canvas.width; x += 8) {
          const noiseVal = noise2D(x * layer.scale + time * layer.speed, layer.baseY)
          const noiseVal2 = noise2D(x * layer.scale * 2 + time * layer.speed * 0.5, layer.baseY + 100)
          const combined = (noiseVal + noiseVal2 * 0.3) / 1.3

          const baseY = canvas.height * layer.baseY
          const waveHeight = canvas.height * 0.08
          const y = baseY + combined * waveHeight

          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }

        ctx.lineTo(canvas.width, canvas.height)
        ctx.lineTo(0, canvas.height)
        ctx.closePath()

        const gradient = ctx.createLinearGradient(0, canvas.height * layer.baseY, 0, canvas.height)
        gradient.addColorStop(0, `rgba(200, 216, 232, 0)`)
        gradient.addColorStop(0.3, `rgba(200, 216, 232, ${layer.opacity})`)
        gradient.addColorStop(1, `rgba(200, 216, 232, ${layer.opacity * 0.5})`)

        ctx.fillStyle = gradient
        ctx.filter = 'blur(15px)'
        ctx.fill()
        ctx.filter = 'none'
      })

      time++
      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', resize)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [noise2D])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
    />
  )
})

// ========== MOUNTAIN LAYERS (SVG) ==========

const MountainLayer = React.memo(function MountainLayer({
  layer,
  color,
  opacity,
}: {
  layer: number
  color: string
  opacity: number
}) {
  const paths = [
    "M0,85 Q15,70 30,80 T60,75 T90,82 L100,85 L100,100 L0,100 Z",
    "M0,90 L15,72 Q25,65 35,75 L50,60 Q60,55 70,68 L85,70 Q95,78 100,75 L100,100 L0,100 Z",
    "M0,100 L10,82 L25,65 Q30,60 35,65 L45,55 Q55,48 60,58 L75,62 Q82,58 88,68 L100,78 L100,100 L0,100 Z",
    "M0,100 L8,85 Q15,78 20,82 L30,68 Q38,60 45,70 L55,58 Q65,50 72,62 L82,70 Q90,75 95,82 L100,88 L100,100 L0,100 Z",
    "M0,100 L5,92 L15,78 Q22,72 28,80 L38,70 Q48,62 55,75 L65,68 Q75,60 82,72 L92,80 Q96,85 100,82 L100,100 L0,100 Z",
  ]

  return (
    <motion.svg
      className="absolute bottom-0 left-0 w-full"
      style={{ height: `${55 - layer * 8}%` }}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: opacity, y: 0 }}
      transition={{ duration: 1.5, delay: layer * 0.2 }}
    >
      <defs>
        <linearGradient id={`mountain-grad-${layer}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.8" />
        </linearGradient>
      </defs>
      <path d={paths[layer]} fill={`url(#mountain-grad-${layer})`} />
    </motion.svg>
  )
})

// ========== FLYING BIRDS ==========

const FlyingBird = React.memo(function FlyingBird({ delay, yPosition }: { delay: number; yPosition: number }) {
  return (
    <motion.svg
      className="absolute"
      style={{ left: '-5%', top: `${yPosition}%`, width: '20px', height: '10px' }}
      viewBox="0 0 20 10"
      initial={{ x: 0, opacity: 0 }}
      animate={{
        x: ['0vw', '110vw'],
        opacity: [0, 0.5, 0.5, 0],
        y: [0, -10, 5, -8, 0],
      }}
      transition={{
        duration: 25 + Math.random() * 15,
        delay: delay,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      <motion.path
        d="M0,5 Q5,0 10,5 Q15,0 20,5"
        fill="none"
        stroke="rgba(90, 100, 120, 0.5)"
        strokeWidth="1.5"
        strokeLinecap="round"
        animate={{
          d: [
            "M0,5 Q5,0 10,5 Q15,0 20,5",
            "M0,5 Q5,3 10,5 Q15,3 20,5",
            "M0,5 Q5,0 10,5 Q15,0 20,5",
          ],
        }}
        transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.svg>
  )
})

// ========== FLOATING CLOUD ==========

const FloatingCloud = React.memo(function FloatingCloud({ startX, yPosition, size, delay, duration }: {
  startX: number; yPosition: number; size: number; delay: number; duration: number
}) {
  return (
    <motion.svg
      className="absolute"
      style={{ left: `${startX}%`, top: `${yPosition}%`, width: `${size}px`, height: `${size * 0.5}px` }}
      viewBox="0 0 100 50"
      initial={{ x: 0, opacity: 0 }}
      animate={{ x: [0, 80, 0], opacity: [0.2, 0.4, 0.2], y: [0, -5, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
    >
      <defs>
        <filter id={`cloud-blur-${startX}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
        </filter>
      </defs>
      <g fill="rgba(200, 216, 232, 0.35)" filter={`url(#cloud-blur-${startX})`}>
        <ellipse cx="30" cy="30" rx="20" ry="12" />
        <ellipse cx="50" cy="25" rx="25" ry="15" />
        <ellipse cx="70" cy="30" rx="18" ry="11" />
        <ellipse cx="45" cy="32" rx="22" ry="13" />
      </g>
    </motion.svg>
  )
})

// ========== SHOOTING STAR ==========

const ShootingStar = React.memo(function ShootingStar({ delay }: { delay: number }) {
  const startX = 10 + Math.random() * 50
  const startY = 5 + Math.random() * 25

  return (
    <motion.div
      className="absolute"
      style={{
        left: `${startX}%`,
        top: `${startY}%`,
        width: '3px',
        height: '3px',
        background: '#FFFFFF',
        borderRadius: '50%',
        boxShadow: '0 0 8px #FFFFFF, -30px 0 20px rgba(255,255,255,0.5), -60px 0 35px rgba(255,255,255,0.3)',
      }}
      initial={{ opacity: 0, x: 0, y: 0 }}
      animate={{ opacity: [0, 1, 1, 0], x: [0, 200, 280], y: [0, 100, 150] }}
      transition={{
        duration: 1.8,
        delay,
        repeat: Infinity,
        repeatDelay: 12 + Math.random() * 18,
        ease: 'easeOut',
      }}
    />
  )
})

// ========== MAIN BACKGROUND COMPONENT ==========

// Global particle engine initialization (runs once)
let particlesInitialized = false
let particlesInitPromise: Promise<void> | null = null

function initParticlesOnce() {
  if (particlesInitialized) return Promise.resolve()
  if (particlesInitPromise) return particlesInitPromise

  particlesInitPromise = initParticlesEngine(async (engine) => {
    await loadSlim(engine)
  }).then(() => {
    particlesInitialized = true
  })

  return particlesInitPromise
}

function BackgroundComponent() {
  const [mounted, setMounted] = useState(false)
  const [particlesReady, setParticlesReady] = useState(false)
  const { theme } = useThemeStore()

  useEffect(() => {
    setMounted(true)
    initParticlesOnce().then(() => setParticlesReady(true))
  }, [])

  const particlesLoaded = useCallback(async () => {}, [])

  const particleConfig = useMemo(() => {
    if (theme.particles === 'fireflies') return getFirefliesConfig()
    if (theme.particles === 'snow') return getSnowConfig()
    if (theme.particles === 'sakura') return getSakuraConfig()
    if (theme.particles === 'aurora') return getAuroraStarsConfig()
    if (theme.particles === 'mist') return getMistConfig()
    if (theme.particles === 'rain') return getRainConfig()
    if (theme.particles === 'stars') return getStarsConfig()
    if (theme.particles === 'dust') return getDustConfig()
    if (theme.particles === 'foam') return getFoamConfig()
    if (theme.particles === 'snowflakes') return getSnowflakesConfig()
    if (theme.particles === 'dandelion') return getDandelionConfig()
    return getFirefliesConfig()
  }, [theme.particles])

  if (!mounted) return null

  const isNorthernLights = theme.particles === 'aurora'
  const isMistyMountains = theme.particles === 'mist'
  const isCherryBlossom = theme.particles === 'sakura'
  const isWinterSunset = theme.particles === 'snow'
  const isGentleRain = theme.particles === 'rain'
  const isCosmos = theme.particles === 'stars'
  const isCandlelight = theme.particles === 'dust'
  const isOceanTwilight = theme.particles === 'foam'
  const isQuietSnow = theme.particles === 'snowflakes'
  const isHobbiton = theme.particles === 'dandelion'

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {/* Base gradient */}
      <div className="absolute inset-0" style={{ background: theme.bg.gradient }} />

      {/* Theme-specific ambient effects */}
      {isNorthernLights && (
        <>
          {/* CSS-based aurora (calm, elegant) */}
          <CssAurora />

          {/* Ambient glow */}
          <motion.div
            className="absolute"
            style={{
              top: '5%',
              left: '20%',
              width: '60%',
              height: '40%',
              background: 'radial-gradient(ellipse at 50% 50%, rgba(78, 204, 163, 0.12) 0%, transparent 70%)',
              filter: 'blur(40px)',
            }}
            animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.1, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Shooting stars */}
          <ShootingStar delay={3} />
          <ShootingStar delay={12} />
          <ShootingStar delay={25} />
        </>
      )}

      {isMistyMountains && (
        <>
          {/* Ambient mountain glow */}
          <motion.div
            className="absolute"
            style={{
              bottom: '30%',
              left: '15%',
              width: '70%',
              height: '25%',
              background: 'radial-gradient(ellipse at 50% 100%, rgba(200, 216, 232, 0.12) 0%, transparent 70%)',
              filter: 'blur(30px)',
            }}
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Floating clouds */}
          <FloatingCloud startX={5} yPosition={6} size={140} delay={0} duration={70} />
          <FloatingCloud startX={45} yPosition={10} size={110} delay={8} duration={60} />
          <FloatingCloud startX={75} yPosition={4} size={90} delay={15} duration={65} />

          {/* Mountain layers */}
          <MountainLayer layer={0} color="#2A3040" opacity={0.4} />
          <MountainLayer layer={1} color="#252A35" opacity={0.55} />
          <MountainLayer layer={2} color="#1F242D" opacity={0.7} />
          <MountainLayer layer={3} color="#1A1E26" opacity={0.85} />
          <MountainLayer layer={4} color="#15181F" opacity={1} />

          {/* Simplex noise mist */}
          <NoiseMist />

          {/* Flying birds */}
          <FlyingBird delay={8} yPosition={18} />
          <FlyingBird delay={28} yPosition={14} />
          <FlyingBird delay={50} yPosition={22} />
        </>
      )}

      {isCherryBlossom && (
        <>
          {/* Pink ambient glow */}
          <motion.div
            className="absolute"
            style={{
              top: '-10%',
              right: '-5%',
              width: '65%',
              height: '55%',
              background: 'radial-gradient(ellipse at center, rgba(232, 160, 184, 0.15) 0%, transparent 70%)',
            }}
            animate={{ opacity: [0.6, 0.9, 0.6], scale: [1, 1.05, 1] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Branch silhouette */}
          <svg className="absolute top-0 right-0 w-72 h-72 opacity-[0.08]" viewBox="0 0 200 200">
            <path d="M200,0 Q180,40 160,50 Q140,60 130,90 Q125,110 140,130" fill="none" stroke="#E8A0B8" strokeWidth="4" />
            <path d="M160,50 Q145,55 135,45 Q125,35 115,50" fill="none" stroke="#E8A0B8" strokeWidth="2.5" />
            <circle cx="130" cy="90" r="10" fill="#FFD4E0" opacity="0.4" />
            <circle cx="115" cy="50" r="7" fill="#FFD4E0" opacity="0.4" />
          </svg>
        </>
      )}

      {isWinterSunset && (
        <>
          {/* Warm sunset glow */}
          <motion.div
            className="absolute"
            style={{
              top: '-15%',
              right: '-15%',
              width: '75%',
              height: '65%',
              background: 'radial-gradient(ellipse at center, rgba(242, 200, 121, 0.22) 0%, rgba(232, 148, 90, 0.12) 45%, transparent 70%)',
            }}
            animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.05, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Horizon warmth */}
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{
              height: '35%',
              background: 'linear-gradient(180deg, transparent 0%, rgba(232, 148, 90, 0.06) 50%, rgba(242, 200, 121, 0.1) 100%)',
            }}
          />
        </>
      )}

      {/* Rivendell forest glow (default) */}
      {theme.particles === 'fireflies' && (
        <>
          <motion.div
            className="absolute"
            style={{
              top: '-8%',
              right: '-8%',
              width: '55%',
              height: '45%',
              background: 'radial-gradient(ellipse at center, rgba(212, 168, 75, 0.14) 0%, transparent 70%)',
            }}
            animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.05, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Decorative vine - Left side */}
          <motion.svg
            className="absolute top-0 left-0 w-52 h-52 opacity-[0.15]"
            viewBox="0 0 200 200"
            animate={{ rotate: [-1, 1, -1] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <path d="M0,20 Q50,30 40,80 Q35,120 60,150" fill="none" stroke="#5E8B5A" strokeWidth="2.5" />
            <path d="M20,0 Q30,40 50,60 Q70,80 60,120" fill="none" stroke="#5E8B5A" strokeWidth="2" />
            <ellipse cx="40" cy="80" rx="7" ry="11" fill="#5E8B5A" transform="rotate(-30, 40, 80)" />
            <ellipse cx="55" cy="60" rx="6" ry="9" fill="#5E8B5A" transform="rotate(20, 55, 60)" />
          </motion.svg>

          {/* Decorative vine - Right side (mirror) */}
          <motion.svg
            className="absolute top-0 right-0 w-52 h-52 opacity-[0.15]"
            viewBox="0 0 200 200"
            animate={{ rotate: [1, -1, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <path d="M200,20 Q150,30 160,80 Q165,120 140,150" fill="none" stroke="#5E8B5A" strokeWidth="2.5" />
            <path d="M180,0 Q170,40 150,60 Q130,80 140,120" fill="none" stroke="#5E8B5A" strokeWidth="2" />
            <ellipse cx="160" cy="80" rx="7" ry="11" fill="#5E8B5A" transform="rotate(30, 160, 80)" />
            <ellipse cx="145" cy="60" rx="6" ry="9" fill="#5E8B5A" transform="rotate(-20, 145, 60)" />
          </motion.svg>
        </>
      )}

      {/* Hobbiton/Shire ambience - sunny day */}
      {isHobbiton && (
        <>
          {/* Sunny sky glow */}
          <motion.div
            className="absolute"
            style={{
              top: '-15%',
              left: '20%',
              width: '60%',
              height: '45%',
              background: 'radial-gradient(ellipse at center, rgba(135, 206, 235, 0.12) 0%, rgba(176, 226, 255, 0.06) 40%, transparent 70%)',
            }}
            animate={{ opacity: [0.6, 0.8, 0.6] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Warm sunlight from top-right */}
          <motion.div
            className="absolute"
            style={{
              top: '-10%',
              right: '-5%',
              width: '50%',
              height: '40%',
              background: 'radial-gradient(ellipse at center, rgba(255, 245, 180, 0.15) 0%, rgba(255, 240, 150, 0.06) 50%, transparent 70%)',
            }}
            animate={{ opacity: [0.7, 0.9, 0.7], scale: [1, 1.03, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Rolling green hills */}
          <svg className="absolute bottom-0 left-0 w-full h-[40%]" viewBox="0 0 100 40" preserveAspectRatio="none">
            <defs>
              <linearGradient id="hill-sunny-1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#2D5A30" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#1A3A1C" stopOpacity="0.7" />
              </linearGradient>
              <linearGradient id="hill-sunny-2" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#264D28" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#153518" stopOpacity="0.85" />
              </linearGradient>
              <linearGradient id="hill-sunny-3" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1F4020" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0F2510" stopOpacity="1" />
              </linearGradient>
            </defs>
            {/* Back hill - lighter */}
            <path d="M0,28 Q18,16 35,22 T65,18 T90,24 L100,22 L100,40 L0,40 Z" fill="url(#hill-sunny-1)" />
            {/* Middle hill */}
            <path d="M0,34 Q22,22 45,28 T75,24 T100,30 L100,40 L0,40 Z" fill="url(#hill-sunny-2)" />
            {/* Front hill */}
            <path d="M0,40 Q28,30 55,35 T85,32 L100,36 L100,40 L0,40 Z" fill="url(#hill-sunny-3)" />
          </svg>

          {/* River shimmer at bottom */}
          <motion.div
            className="absolute"
            style={{
              bottom: '5%',
              left: '0%',
              width: '100%',
              height: '12%',
              background: 'linear-gradient(90deg, transparent 0%, rgba(100, 180, 220, 0.08) 20%, rgba(120, 200, 240, 0.12) 50%, rgba(100, 180, 220, 0.08) 80%, transparent 100%)',
              filter: 'blur(15px)',
            }}
            animate={{ opacity: [0.4, 0.7, 0.4], x: [-10, 10, -10] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* River sparkles */}
          <motion.div
            className="absolute"
            style={{
              bottom: '8%',
              left: '30%',
              width: '40%',
              height: '6%',
              background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.06) 25%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.06) 75%, transparent 100%)',
              filter: 'blur(8px)',
            }}
            animate={{ opacity: [0.3, 0.6, 0.3], scaleX: [1, 1.1, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Distant green glow - meadow feel */}
          <motion.div
            className="absolute"
            style={{
              bottom: '20%',
              left: '10%',
              width: '80%',
              height: '25%',
              background: 'radial-gradient(ellipse at 50% 80%, rgba(100, 180, 100, 0.06) 0%, transparent 60%)',
              filter: 'blur(30px)',
            }}
            animate={{ opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
        </>
      )}

      {/* Gentle Rain ambience */}
      {isGentleRain && (
        <>
          {/* Distant lightning glow (very subtle, occasional) */}
          <motion.div
            className="absolute"
            style={{
              top: '0%',
              left: '0%',
              width: '100%',
              height: '50%',
              background: 'radial-gradient(ellipse at 30% 20%, rgba(180, 200, 220, 0.08) 0%, transparent 60%)',
              filter: 'blur(60px)',
            }}
            animate={{ opacity: [0, 0, 0.15, 0.05, 0, 0, 0, 0, 0, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Ambient overcast glow */}
          <motion.div
            className="absolute"
            style={{
              top: '-10%',
              left: '-10%',
              width: '120%',
              height: '40%',
              background: 'linear-gradient(180deg, rgba(107, 143, 173, 0.1) 0%, rgba(107, 143, 173, 0.03) 100%)',
              filter: 'blur(40px)',
            }}
            animate={{ opacity: [0.5, 0.7, 0.5] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Window condensation effect - subtle */}
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at 50% 100%, rgba(107, 143, 173, 0.04) 0%, transparent 50%)',
            }}
          />
        </>
      )}

      {/* Cosmos ambience */}
      {isCosmos && (
        <>
          {/* Nebula glow - purple/blue */}
          <motion.div
            className="absolute"
            style={{
              top: '10%',
              right: '-5%',
              width: '50%',
              height: '45%',
              background: 'radial-gradient(ellipse at center, rgba(123, 104, 238, 0.08) 0%, rgba(157, 140, 255, 0.04) 40%, transparent 70%)',
              filter: 'blur(60px)',
            }}
            animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.1, 1], x: [0, 10, 0] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Nebula glow - pink hint */}
          <motion.div
            className="absolute"
            style={{
              top: '25%',
              left: '5%',
              width: '40%',
              height: '35%',
              background: 'radial-gradient(ellipse at center, rgba(255, 140, 180, 0.05) 0%, transparent 60%)',
              filter: 'blur(50px)',
            }}
            animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.05, 1] }}
            transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
          />

          {/* Distant galaxy band */}
          <motion.div
            className="absolute"
            style={{
              top: '35%',
              left: '-10%',
              width: '120%',
              height: '15%',
              background: 'linear-gradient(90deg, transparent 0%, rgba(200, 180, 255, 0.03) 30%, rgba(200, 180, 255, 0.05) 50%, rgba(200, 180, 255, 0.03) 70%, transparent 100%)',
              filter: 'blur(20px)',
              transform: 'rotate(-5deg)',
            }}
            animate={{ opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Shooting star - rare */}
          <ShootingStar delay={8} />
          <ShootingStar delay={30} />
        </>
      )}

      {/* Candlelight ambience */}
      {isCandlelight && (
        <>
          {/* Main candle glow - warm center */}
          <motion.div
            className="absolute"
            style={{
              bottom: '20%',
              left: '45%',
              width: '20%',
              height: '30%',
              background: 'radial-gradient(ellipse at 50% 80%, rgba(232, 160, 80, 0.25) 0%, rgba(240, 184, 104, 0.12) 30%, transparent 60%)',
              filter: 'blur(30px)',
            }}
            animate={{
              opacity: [0.7, 0.9, 0.75, 0.85, 0.7],
              scale: [1, 1.02, 0.98, 1.01, 1],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Ambient room warmth */}
          <motion.div
            className="absolute"
            style={{
              bottom: '0%',
              left: '20%',
              width: '60%',
              height: '50%',
              background: 'radial-gradient(ellipse at 50% 100%, rgba(232, 160, 80, 0.08) 0%, transparent 70%)',
              filter: 'blur(50px)',
            }}
            animate={{ opacity: [0.5, 0.7, 0.5] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Subtle flicker on walls */}
          <motion.div
            className="absolute"
            style={{
              top: '0%',
              left: '0%',
              width: '100%',
              height: '100%',
              background: 'radial-gradient(ellipse at 50% 70%, rgba(255, 208, 144, 0.03) 0%, transparent 50%)',
            }}
            animate={{ opacity: [0.3, 0.5, 0.35, 0.45, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </>
      )}

      {/* Ocean Twilight ambience */}
      {isOceanTwilight && (
        <>
          {/* Sunset horizon glow */}
          <motion.div
            className="absolute"
            style={{
              bottom: '25%',
              left: '0%',
              width: '100%',
              height: '30%',
              background: 'linear-gradient(180deg, transparent 0%, rgba(255, 140, 100, 0.06) 40%, rgba(80, 160, 200, 0.08) 100%)',
              filter: 'blur(40px)',
            }}
            animate={{ opacity: [0.5, 0.7, 0.5] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Ocean surface shimmer */}
          <motion.div
            className="absolute"
            style={{
              bottom: '0%',
              left: '-5%',
              width: '110%',
              height: '35%',
              background: 'linear-gradient(180deg, transparent 0%, rgba(80, 160, 200, 0.05) 50%, rgba(80, 160, 200, 0.1) 100%)',
            }}
            animate={{ opacity: [0.6, 0.8, 0.6] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Wave motion hint - subtle horizontal movement */}
          <motion.div
            className="absolute"
            style={{
              bottom: '5%',
              left: '0%',
              width: '100%',
              height: '15%',
              background: 'linear-gradient(90deg, transparent 0%, rgba(176, 224, 240, 0.06) 25%, rgba(176, 224, 240, 0.08) 50%, rgba(176, 224, 240, 0.06) 75%, transparent 100%)',
              filter: 'blur(20px)',
            }}
            animate={{ x: [-20, 20, -20] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Moon reflection */}
          <motion.div
            className="absolute"
            style={{
              top: '8%',
              right: '15%',
              width: '60px',
              height: '60px',
              background: 'radial-gradient(circle, rgba(255, 255, 240, 0.15) 0%, rgba(255, 255, 240, 0.05) 40%, transparent 70%)',
              borderRadius: '50%',
              filter: 'blur(5px)',
            }}
            animate={{ opacity: [0.6, 0.8, 0.6], scale: [1, 1.05, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
        </>
      )}

      {/* Quiet Snow ambience */}
      {isQuietSnow && (
        <>
          {/* Soft moonlight from above */}
          <motion.div
            className="absolute"
            style={{
              top: '-10%',
              left: '30%',
              width: '40%',
              height: '35%',
              background: 'radial-gradient(ellipse at center, rgba(200, 216, 232, 0.1) 0%, rgba(200, 216, 232, 0.04) 40%, transparent 70%)',
              filter: 'blur(50px)',
            }}
            animate={{ opacity: [0.5, 0.7, 0.5] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Distant treeline silhouette hint */}
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{
              height: '20%',
              background: 'linear-gradient(180deg, transparent 0%, rgba(14, 18, 24, 0.4) 100%)',
            }}
          />

          {/* Snow ground reflection */}
          <motion.div
            className="absolute"
            style={{
              bottom: '0%',
              left: '-5%',
              width: '110%',
              height: '25%',
              background: 'linear-gradient(180deg, transparent 0%, rgba(200, 216, 232, 0.04) 50%, rgba(224, 238, 248, 0.08) 100%)',
            }}
            animate={{ opacity: [0.6, 0.8, 0.6] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Occasional soft glow (like distant window) */}
          <motion.div
            className="absolute"
            style={{
              bottom: '15%',
              right: '10%',
              width: '30px',
              height: '40px',
              background: 'radial-gradient(ellipse at center, rgba(255, 220, 160, 0.12) 0%, transparent 70%)',
              filter: 'blur(8px)',
            }}
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Cold atmosphere overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at 50% 30%, rgba(136, 168, 200, 0.03) 0%, transparent 60%)',
            }}
          />
        </>
      )}

      {/* tsParticles layer */}
      {particlesReady && (
        <Particles
          key={`particles-${theme.particles}`}
          id="tsparticles"
          className="absolute inset-0"
          particlesLoaded={particlesLoaded}
          options={particleConfig}
        />
      )}
    </div>
  )
}

// Memoize to prevent re-renders on navigation
const Background = React.memo(BackgroundComponent)
export default Background
