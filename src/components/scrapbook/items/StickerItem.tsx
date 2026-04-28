'use client'

import React from 'react'
import { StickerItemData } from '@/lib/scrapbook'
import { stickers, StickerId } from '../stickers'

interface Props {
  item: StickerItemData
}

export default function StickerItem({ item }: Props) {
  const entry = stickers[item.stickerId as StickerId]
  if (!entry) return null
  const Sticker = entry.component
  return (
    <div className="w-full h-full">
      <Sticker />
    </div>
  )
}
