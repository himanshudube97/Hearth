'use client'

import React, { useEffect, useRef, useState } from 'react'
import {
  ScrapbookItem,
  clampToCanvas,
  nextZ,
  lockAspectFor,
  minSizeFor,
  isEditableType,
} from '@/lib/scrapbook'
import Attachments from './Attachments'

interface Props {
  item: ScrapbookItem
  allItems: ScrapbookItem[]
  canvasRef: React.RefObject<HTMLDivElement | null>
  selected: boolean
  isEditing: boolean
  onSelect: () => void
  onRequestEdit: () => void
  onUpdate: (item: ScrapbookItem) => void
  onDelete: () => void
  children: React.ReactNode
}

type DragKind = 'rotate' | 'resize'

interface HandleDragState {
  kind: DragKind
  pointerId: number
  startClientX: number
  startClientY: number
  itemAtStart: ScrapbookItem
  canvasRect: DOMRect
  centerX?: number
  centerY?: number
  startAngle?: number
}

interface BodyTracker {
  pointerId: number
  downClientX: number
  downClientY: number
  itemAtStart: ScrapbookItem
  canvasRect: DOMRect
  startedDrag: boolean
}

const DRAG_THRESHOLD_PX = 5

export default function CanvasItemWrapper({
  item,
  allItems,
  canvasRef,
  selected,
  isEditing,
  onSelect,
  onRequestEdit,
  onUpdate,
  onDelete,
  children,
}: Props) {
  const handleDragRef = useRef<HandleDragState | null>(null)
  const bodyTrackerRef = useRef<BodyTracker | null>(null)
  const [activeDrag, setActiveDrag] = useState<'move' | DragKind | null>(null)
  const [hovered, setHovered] = useState(false)

  // Pop-in on mount: items appear with a tiny scale+fade so the canvas
  // feels alive when you add things. Settles to identity transform after
  // ~380ms; subsequent interactions (hover, drag) take over inline.
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // ---- handle-driven drags (rotate, resize) ----
  function beginHandleDrag(kind: DragKind, e: React.PointerEvent<HTMLElement>) {
    e.stopPropagation()
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return

    onSelect()
    onUpdate({ ...item, z: nextZ(allItems) })

    const rect = canvas.getBoundingClientRect()
    const state: HandleDragState = {
      kind,
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      itemAtStart: { ...item },
      canvasRect: rect,
    }
    if (kind === 'rotate') {
      const cx = rect.left + ((item.x + item.width / 2) / 100) * rect.width
      const cy = rect.top + ((item.y + item.height / 2) / 100) * rect.height
      state.centerX = cx
      state.centerY = cy
      state.startAngle = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI
    }
    handleDragRef.current = state
    setActiveDrag(kind)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function moveHandleDrag(e: React.PointerEvent<HTMLElement>) {
    const ds = handleDragRef.current
    if (!ds || ds.pointerId !== e.pointerId) return

    if (ds.kind === 'rotate' && ds.centerX != null && ds.centerY != null && ds.startAngle != null) {
      const currentAngle =
        (Math.atan2(e.clientY - ds.centerY, e.clientX - ds.centerX) * 180) / Math.PI
      let newRot = ds.itemAtStart.rotation + (currentAngle - ds.startAngle)
      while (newRot > 180) newRot -= 360
      while (newRot < -180) newRot += 360
      for (const s of [0, 90, -90, 180, -180]) {
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
      const dxLocal = dxScreen * cos + dyScreen * sin
      const dyLocal = -dxScreen * sin + dyScreen * cos
      const dwPct = (dxLocal / ds.canvasRect.width) * 100
      const dhPct = (dyLocal / ds.canvasRect.height) * 100
      const min = minSizeFor(ds.itemAtStart.type)
      let newW = Math.max(min.w, ds.itemAtStart.width + dwPct)
      let newH = Math.max(min.h, ds.itemAtStart.height + dhPct)
      if (lockAspectFor(ds.itemAtStart.type)) {
        const aspect = ds.itemAtStart.width / ds.itemAtStart.height
        const wd = Math.abs(newW - ds.itemAtStart.width) / ds.itemAtStart.width
        const hd = Math.abs(newH - ds.itemAtStart.height) / ds.itemAtStart.height
        if (wd >= hd) newH = newW / aspect
        else newW = newH * aspect
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
    }
  }

  function endHandleDrag(e: React.PointerEvent<HTMLElement>) {
    const ds = handleDragRef.current
    if (!ds || ds.pointerId !== e.pointerId) return
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}
    handleDragRef.current = null
    setActiveDrag(null)
  }

  const handleDragHandlers = {
    onPointerMove: moveHandleDrag,
    onPointerUp: endHandleDrag,
    onPointerCancel: endHandleDrag,
  }

  // ---- body click-vs-drag (move OR enter-edit) ----
  function onBodyPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    // While editing, let the contenteditable child handle the pointer
    if (isEditing) return
    const canvas = canvasRef.current
    if (!canvas) return

    bodyTrackerRef.current = {
      pointerId: e.pointerId,
      downClientX: e.clientX,
      downClientY: e.clientY,
      itemAtStart: { ...item },
      canvasRect: canvas.getBoundingClientRect(),
      startedDrag: false,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function onBodyPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const t = bodyTrackerRef.current
    if (!t || t.pointerId !== e.pointerId) return
    const dx = e.clientX - t.downClientX
    const dy = e.clientY - t.downClientY
    if (!t.startedDrag) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return
      t.startedDrag = true
      onSelect()
      onUpdate({ ...t.itemAtStart, z: nextZ(allItems) })
      setActiveDrag('move')
    }
    const dxPct = (dx / t.canvasRect.width) * 100
    const dyPct = (dy / t.canvasRect.height) * 100
    onUpdate(
      clampToCanvas({
        ...item,
        x: t.itemAtStart.x + dxPct,
        y: t.itemAtStart.y + dyPct,
      }),
    )
  }

  function onBodyPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const t = bodyTrackerRef.current
    if (!t || t.pointerId !== e.pointerId) return
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}
    if (t.startedDrag) {
      setActiveDrag(null)
    } else {
      // tap → select + (if editable) enter edit mode
      onSelect()
      if (isEditableType(item.type)) {
        onRequestEdit()
      }
    }
    bodyTrackerRef.current = null
  }

  function onContainerClick(e: React.MouseEvent) {
    // We've handled selection via pointer-up. Stop click from bubbling
    // to the canvas (which would deselect us).
    e.stopPropagation()
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
        transition: activeDrag ? 'none' : 'box-shadow 200ms ease, transform 200ms ease',
      }}
      onClick={onContainerClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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

      {/* rotate handle */}
      {selected && (
        <div
          onPointerDown={(e) => beginHandleDrag('rotate', e)}
          {...handleDragHandlers}
          className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center rounded-full"
          style={{
            top: -34,
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
      {/* connector line from rotate handle to item top */}
      {selected && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: '50%',
            top: -12,
            width: 1,
            height: 6,
            background: 'rgba(58, 52, 41, 0.45)',
            transform: 'translateX(-50%)',
          }}
        />
      )}

      {/* resize handle (bottom-right) */}
      {selected && (
        <div
          onPointerDown={(e) => beginHandleDrag('resize', e)}
          {...handleDragHandlers}
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
            top: -12,
            right: -12,
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

      {/* attachment overlay — pin / tape / corners / grommets / clip */}
      <Attachments item={item} />

      {/* body — drags by hold-and-move, taps to enter edit (if editable) */}
      <div
        onPointerDown={onBodyPointerDown}
        onPointerMove={onBodyPointerMove}
        onPointerUp={onBodyPointerUp}
        onPointerCancel={onBodyPointerUp}
        className="w-full h-full"
        style={{
          cursor: isEditing
            ? 'text'
            : activeDrag === 'move'
              ? 'grabbing'
              : 'grab',
          touchAction: isEditing ? 'auto' : 'none',
          filter:
            activeDrag === 'move'
              ? 'drop-shadow(0 10px 14px rgba(20,14,4,0.4))'
              : hovered && !selected
                ? 'drop-shadow(0 6px 10px rgba(20,14,4,0.3))'
                : 'drop-shadow(0 3px 5px rgba(20,14,4,0.18))',
          opacity: mounted ? 1 : 0,
          transform: !mounted
            ? 'scale(0.78)'
            : hovered && !selected && !activeDrag
              ? 'scale(1.015)'
              : 'scale(1)',
          transition: activeDrag
            ? 'none'
            : 'transform 380ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 240ms ease, filter 180ms ease',
        }}
      >
        {children}
      </div>
    </div>
  )
}
