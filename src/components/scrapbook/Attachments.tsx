// src/components/scrapbook/Attachments.tsx
'use client'

import React from 'react'
import { AttachmentKind, ScrapbookItem, attachmentForItem } from '@/lib/scrapbook'

const PIN_COLORS = ['#a3413a', '#3a5a8a', '#3a8a4a', '#8a6a3a']

interface Props {
  item: ScrapbookItem
}

export default function Attachments({ item }: Props) {
  const kind: AttachmentKind = attachmentForItem(item)
  const color = PIN_COLORS[Math.abs(simpleHash(item.id)) % PIN_COLORS.length]

  if (kind === 'pin') return <Pin color={color} />
  if (kind === 'tape') return <Tape />
  if (kind === 'corners') return <Corners />
  if (kind === 'grommets') return <Grommets />
  if (kind === 'paper-clip') return <PaperClip />
  return null
}

function Pin({ color }: { color: string }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: '50%',
        top: -7,
        width: 14,
        height: 14,
        transform: 'translateX(-50%)',
        background: `radial-gradient(circle at 35% 30%, #fff 0%, ${color} 35%, #2a1a14 100%)`,
        borderRadius: '50%',
        boxShadow: '0 2px 4px rgba(0,0,0,0.35)',
        zIndex: 10,
      }}
    />
  )
}

function Tape() {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: '50%',
        top: -10,
        width: '40%',
        height: 20,
        transform: 'translateX(-50%) rotate(-2deg)',
        background: 'rgba(245, 230, 180, 0.78)',
        borderLeft: '1px dashed rgba(120, 80, 30, 0.18)',
        borderRight: '1px dashed rgba(120, 80, 30, 0.18)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
        zIndex: 10,
      }}
    />
  )
}

function Corners() {
  const corner = (style: React.CSSProperties) => (
    <div
      className="absolute pointer-events-none"
      style={{
        width: 14,
        height: 14,
        background: 'rgba(58, 52, 41, 0.35)',
        clipPath: 'polygon(0 0, 100% 0, 100% 100%)',
        zIndex: 10,
        ...style,
      }}
    />
  )
  return (
    <>
      {corner({ top: -2, left: -2, transform: 'rotate(0deg)' })}
      {corner({ top: -2, right: -2, transform: 'rotate(90deg)' })}
      {corner({ bottom: -2, right: -2, transform: 'rotate(180deg)' })}
      {corner({ bottom: -2, left: -2, transform: 'rotate(270deg)' })}
    </>
  )
}

function Grommets() {
  return (
    <>
      {[20, 80].map((top) => (
        <div
          key={top}
          className="absolute pointer-events-none"
          style={{
            left: 6,
            top: `${top}%`,
            width: 10,
            height: 10,
            background: '#2a1a14',
            borderRadius: '50%',
            boxShadow: 'inset 0 0 0 2px rgba(245, 230, 180, 0.55)',
            zIndex: 10,
          }}
        />
      ))}
    </>
  )
}

function PaperClip() {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        top: -8,
        left: 8,
        width: 14,
        height: 22,
        border: '2px solid #6b6e74',
        borderRadius: '6px 6px 0 0',
        borderBottom: 'none',
        zIndex: 10,
      }}
    />
  )
}

function simpleHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return h
}
