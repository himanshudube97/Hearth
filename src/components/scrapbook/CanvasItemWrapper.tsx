'use client'

import React, { useRef, useState } from 'react'
import { ScrapbookItem, clampToCanvas, nextZ } from '@/lib/scrapbook'

interface Props {
  item: ScrapbookItem
  allItems: ScrapbookItem[]
  canvasRef: React.RefObject<HTMLDivElement | null>
  selected: boolean
  onSelect: () => void
  onUpdate: (item: ScrapbookItem) => void
  onDelete: () => void
  children: React.ReactNode
}

export default function CanvasItemWrapper({
  item,
  allItems,
  canvasRef,
  selected,
  onSelect,
  onUpdate,
  onDelete,
  children,
}: Props) {
  const dragState = useRef<{
    pointerId: number
    startClientX: number
    startClientY: number
    startItemX: number
    startItemY: number
    canvasRect: DOMRect
  } | null>(null)

  const [dragging, setDragging] = useState(false)

  function startDrag(e: React.PointerEvent<HTMLElement>) {
    e.stopPropagation()
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return

    // bump z so this item is on top while being moved
    const newZ = nextZ(allItems)
    onSelect()

    dragState.current = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startItemX: item.x,
      startItemY: item.y,
      canvasRect: canvas.getBoundingClientRect(),
    }
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)

    onUpdate({ ...item, z: newZ })
  }

  function moveDrag(e: React.PointerEvent<HTMLElement>) {
    const ds = dragState.current
    if (!ds || ds.pointerId !== e.pointerId) return
    const dxPct = ((e.clientX - ds.startClientX) / ds.canvasRect.width) * 100
    const dyPct = ((e.clientY - ds.startClientY) / ds.canvasRect.height) * 100
    const next = clampToCanvas({
      ...item,
      x: ds.startItemX + dxPct,
      y: ds.startItemY + dyPct,
    })
    onUpdate(next)
  }

  function endDrag(e: React.PointerEvent<HTMLElement>) {
    const ds = dragState.current
    if (!ds || ds.pointerId !== e.pointerId) return
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}
    dragState.current = null
    setDragging(false)
  }

  function handleBodyClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (!selected) {
      // Bring to top on first click
      onUpdate({ ...item, z: nextZ(allItems) })
    }
    onSelect()
  }

  return (
    <div
      className="absolute select-none"
      style={{
        left: `${item.x}%`,
        top: `${item.y}%`,
        width: `${item.width}%`,
        height: `${item.height}%`,
        transform: `rotate(${item.rotation}deg)`,
        transformOrigin: 'center center',
        zIndex: item.z,
        cursor: selected ? 'default' : 'pointer',
        transition: dragging ? 'none' : 'box-shadow 200ms ease',
      }}
      onClick={handleBodyClick}
    >
      {/* dashed selection outline */}
      {selected && (
        <div
          className="absolute pointer-events-none"
          style={{
            inset: -6,
            border: '1.5px dashed rgba(58, 52, 41, 0.55)',
            borderRadius: 4,
          }}
        />
      )}

      {/* top-center drag handle */}
      {selected && (
        <div
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 px-2.5 py-1 rounded-full"
          style={{
            top: -28,
            background: '#3a3429',
            color: '#f4ecd8',
            cursor: 'grab',
            fontFamily: 'var(--font-caveat), cursive',
            fontSize: 13,
            lineHeight: 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            touchAction: 'none',
          }}
          title="Drag to move"
        >
          <span style={{ letterSpacing: -2, fontSize: 14 }}>⋮⋮</span>
          <span>move</span>
        </div>
      )}

      {/* delete button */}
      {selected && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="absolute flex items-center justify-center rounded-full"
          style={{
            top: -14,
            right: -14,
            width: 24,
            height: 24,
            background: '#a3413a',
            color: '#fff',
            fontSize: 14,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          }}
          title="Delete"
        >
          ×
        </button>
      )}

      {/* content */}
      <div
        className="w-full h-full"
        style={{
          // soft drop shadow on the item itself
          filter: dragging
            ? 'drop-shadow(0 8px 12px rgba(20,14,4,0.35))'
            : 'drop-shadow(0 3px 5px rgba(20,14,4,0.18))',
        }}
      >
        {children}
      </div>
    </div>
  )
}
