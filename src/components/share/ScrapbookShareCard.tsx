'use client'

import { useRef } from 'react'
import PageSurface from '@/components/scrapbook/PageSurface'
import CanvasItemWrapper from '@/components/scrapbook/CanvasItemWrapper'
import TextItem from '@/components/scrapbook/items/TextItem'
import StickerItem from '@/components/scrapbook/items/StickerItem'
import PhotoItem from '@/components/scrapbook/items/PhotoItem'
import SongItem from '@/components/scrapbook/items/SongItem'
import DoodleItem from '@/components/scrapbook/items/DoodleItem'
import ClipItem from '@/components/scrapbook/items/ClipItem'
import StampItem from '@/components/scrapbook/items/StampItem'
import DateItem from '@/components/scrapbook/items/DateItem'
import type {
  ScrapbookItem,
  TextItemData,
  StickerItemData,
  PhotoItemData,
  SongItemData,
  DoodleItemData,
  ClipItemData,
  StampItemData,
  DateItemData,
} from '@/lib/scrapbook'
import ShareCardFrame from './ShareCardFrame'

const PAGE_W = 1102
const PAGE_H = 760

interface ScrapbookShareCardProps {
  items: ScrapbookItem[]
  date: Date
}

/**
 * The scrapbook share image. Mirrors the live canvas layout (1102×760)
 * inside the ShareCardFrame's content area. Items are rendered read-only
 * — no selection, no edit affordances, no toolbars.
 *
 * CanvasItemWrapper requires children (the item renderer), so we inline
 * the same type→component dispatch that ScrapbookCanvas uses.
 */
export default function ScrapbookShareCard({ items, date }: ScrapbookShareCardProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  // The ShareCardFrame inner content area is ~960px wide (1080 minus 2×60px padding).
  const FRAME_INNER_W = 960
  const scale = FRAME_INNER_W / PAGE_W

  return (
    <ShareCardFrame date={date}>
      <div
        style={{
          width: `${PAGE_W}px`,
          height: `${PAGE_H}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          pointerEvents: 'none',
        }}
        ref={canvasRef}
      >
        <PageSurface>
          {items.map((item) => (
            <CanvasItemWrapper
              key={item.id}
              item={item}
              allItems={items}
              canvasRef={canvasRef}
              selected={false}
              isEditing={false}
              onSelect={() => {}}
              onRequestEdit={() => {}}
              onUpdate={() => {}}
              onDelete={() => {}}
            >
              {item.type === 'text' && (
                <TextItem
                  item={item as TextItemData}
                  selected={false}
                  isEditing={false}
                  onChange={() => {}}
                />
              )}
              {item.type === 'sticker' && (
                <StickerItem item={item as StickerItemData} />
              )}
              {item.type === 'photo' && (
                <PhotoItem
                  item={item as PhotoItemData}
                  isEditing={false}
                  onChange={() => {}}
                  onRequestCamera={() => {}}
                  onRequestUpload={() => {}}
                />
              )}
              {item.type === 'song' && (
                <SongItem
                  item={item as SongItemData}
                  isEditing={false}
                  onChange={() => {}}
                />
              )}
              {item.type === 'doodle' && (
                <DoodleItem
                  item={item as DoodleItemData}
                  selected={false}
                  isEditing={false}
                  onChange={() => {}}
                />
              )}
              {item.type === 'clip' && (
                <ClipItem
                  item={item as ClipItemData}
                  isEditing={false}
                  onChange={() => {}}
                />
              )}
              {item.type === 'stamp' && (
                <StampItem
                  item={item as StampItemData}
                  isEditing={false}
                  onChange={() => {}}
                />
              )}
              {item.type === 'date' && (
                <DateItem item={item as DateItemData} />
              )}
            </CanvasItemWrapper>
          ))}
        </PageSurface>
      </div>
    </ShareCardFrame>
  )
}
