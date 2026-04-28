'use client'

import React, { useRef, useState } from 'react'
import {
  ScrapbookItem,
  clampToCanvas,
  nextZ,
  lockAspectFor,
  minSizeFor,
} from '@/lib/scrapbook'

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

type DragKind = 'move' | 'rotate' | 'resize'

interface DragState {
  kind: DragKind
  pointerId: number
  startClientX: number
  startClientY: number
  itemAtStart: ScrapbookItem
  canvasRect: DOMRect
  // For rotate: item center in screen coords + initial pointer angle
  centerX?: number
  centerY?: number
  startAngle?: number
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
  const dragRef = useRef<DragState | null>(null)
  const [activeDrag, setActiveDrag] = useState<DragKind | null>(null)

  function beginDrag(
    kind: DragKind,
    e: React.PointerEvent<HTMLElement>,
  ) {
    e.stopPropagation()
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return

    onSelect()
    onUpdate({ ...item, z: nextZ(allItems) })

    const rect = canvas.getBoundingClientRect()
    const state: DragState = {
      kind,
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      itemAtStart: { ...item },
      canvasRect: rect,
    }

    if (kind === 'rotate') {
      const centerX = rect.left + ((item.x + item.width / 2) / 100) * rect.width
      const centerY = rect.top + ((item.y + item.height / 2) / 100) * rect.height
      state.centerX = centerX
      state.centerY = centerY
      state.startAngle =
        (Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180) / Math.PI
    }

    dragRef.current = state
    setActiveDrag(kind)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function moveDrag(e: React.PointerEvent<HTMLElement>) {
    const ds = dragRef.current
    if (!ds || ds.pointerId !== e.pointerId) return

    if (ds.kind === 'move') {
      const dxPct = ((e.clientX - ds.startClientX) / ds.canvasRect.width) * 100
      const dyPct = ((e.clientY - ds.startClientY) / ds.canvasRect.height) * 100
      const next = clampToCanvas({
        ...item,
        x: ds.itemAtStart.x + dxPct,
        y: ds.itemAtStart.y + dyPct,
      })
      onUpdate(next)
      return
    }

    if (ds.kind === 'rotate' && ds.centerX != null && ds.centerY != null && ds.startAngle != null) {
      const currentAngle =
        (Math.atan2(e.clientY - ds.centerY, e.clientX - ds.centerX) * 180) / Math.PI
      let newRot = ds.itemAtStart.rotation + (currentAngle - ds.startAngle)
      // Normalize to [-180, 180]
      while (newRot > 180) newRot -= 360
      while (newRot < -180) newRot += 360
      // Soft snap to common angles (within 3°)
      const snaps = [0, 90, -90, 180, -180]
      for (const s of snaps) {
        if (Math.abs(newRot - s) < 3) {
          newRot = s
          break
        }
      }
      onUpdate({ ...item, rotation: newRot })
      return
    }

    if (ds.kind === 'resize') {
      const r = (ds.itemAtStart.rotation * Math.PI) / 180
      const cos = Math.cos(r)
      const sin = Math.sin(r)
      const dxScreen = e.clientX - ds.startClientX
      const dyScreen = e.clientY - ds.startClientY
      // Rotate screen delta back into the item's local (unrotated) frame
      const dxLocal = dxScreen * cos + dyScreen * sin
      const dyLocal = -dxScreen * sin + dyScreen * cos
      const dwPct = (dxLocal / ds.canvasRect.width) * 100
      const dhPct = (dyLocal / ds.canvasRect.height) * 100

      const min = minSizeFor(ds.itemAtStart.type)
      let newW = Math.max(min.w, ds.itemAtStart.width + dwPct)
      let newH = Math.max(min.h, ds.itemAtStart.height + dhPct)

      if (lockAspectFor(ds.itemAtStart.type)) {
        const aspect = ds.itemAtStart.width / ds.itemAtStart.height
        // Use whichever dimension changed proportionally more
        const widthDelta = Math.abs(newW - ds.itemAtStart.width) / ds.itemAtStart.width
        const heightDelta = Math.abs(newH - ds.itemAtStart.height) / ds.itemAtStart.height
        if (widthDelta >= heightDelta) {
          newH = newW / aspect
        } else {
          newW = newH * aspect
        }
        // Re-clamp after aspect adjust
        if (newW < min.w) {
          newW = min.w
          newH = newW / aspect
        }
        if (newH < min.h) {
          newH = min.h
          newW = newH * aspect
        }
      }

      onUpdate({ ...item, width: newW, height: newH })
      return
    }
  }

  function endDrag(e: React.PointerEvent<HTMLElement>) {
    const ds = dragRef.current
    if (!ds || ds.pointerId !== e.pointerId) return
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}
    dragRef.current = null
    setActiveDrag(null)
  }

  function handleBodyClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (!selected) {
      onUpdate({ ...item, z: nextZ(allItems) })
    }
    onSelect()
  }

  const dragHandlers = {
    onPointerMove: moveDrag,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
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
        transition: activeDrag ? 'none' : 'box-shadow 200ms ease',
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

      {/* top-center drag (move) handle */}
      {selected && (
        <div
          onPointerDown={(e) => beginDrag('move', e)}
          {...dragHandlers}
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

      {/* rotate handle (above the item, offset further than move handle) */}
      {selected && (
        <div
          onPointerDown={(e) => beginDrag('rotate', e)}
          {...dragHandlers}
          className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center rounded-full"
          style={{
            top: -56,
            width: 22,
            height: 22,
            background: '#fefaf0',
            border: '1.5px solid #3a3429',
            color: '#3a3429',
            cursor: 'grab',
            fontSize: 13,
            boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
            touchAction: 'none',
          }}
          title="Drag to rotate"
        >
          ↻
        </div>
      )}
      {/* thin connector line from rotate handle to item top */}
      {selected && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: '50%',
            top: -34,
            width: 1,
            height: 6,
            background: 'rgba(58, 52, 41, 0.45)',
            transform: 'translateX(-50%)',
          }}
        />
      )}

      {/* resize handle (bottom-right corner) */}
      {selected && (
        <div
          onPointerDown={(e) => beginDrag('resize', e)}
          {...dragHandlers}
          className="absolute flex items-center justify-center rounded-sm"
          style={{
            right: -10,
            bottom: -10,
            width: 18,
            height: 18,
            background: '#fefaf0',
            border: '1.5px solid #3a3429',
            color: '#3a3429',
            cursor: 'nwse-resize',
            fontSize: 11,
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            touchAction: 'none',
          }}
          title="Drag to resize"
        >
          ⤡
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
            width: 22,
            height: 22,
            background: '#a3413a',
            color: '#fff',
            fontSize: 13,
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
          filter: activeDrag
            ? 'drop-shadow(0 8px 12px rgba(20,14,4,0.35))'
            : 'drop-shadow(0 3px 5px rgba(20,14,4,0.18))',
        }}
      >
        {children}
      </div>
    </div>
  )
}
