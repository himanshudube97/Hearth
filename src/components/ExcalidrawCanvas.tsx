'use client'

import { useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useThemeStore } from '@/store/theme'

const Excalidraw = dynamic(
  async () => {
    const mod = await import('@excalidraw/excalidraw')
    // Load Excalidraw styles alongside the component
    try { await import('@excalidraw/excalidraw/index.css') } catch { /* handled by bundler */ }
    return mod.Excalidraw
  },
  { ssr: false }
)

interface ExcalidrawCanvasProps {
  initialData?: {
    elements: readonly any[]
    appState?: Record<string, any>
    files?: Record<string, any>
  }
  viewMode?: boolean
  onChange?: (elements: readonly any[], appState: any, files: any) => void
  onApiReady?: (api: any) => void
}

export default function ExcalidrawCanvas({
  initialData,
  viewMode = false,
  onChange,
  onApiReady,
}: ExcalidrawCanvasProps) {
  const { theme } = useThemeStore()

  const handleApiReady = useCallback(
    (api: any) => {
      onApiReady?.(api)
    },
    [onApiReady]
  )

  return (
    <div
      className="w-full h-full rounded-2xl overflow-hidden"
      style={{
        border: `1px solid ${theme.glass.border}`,
      }}
    >
      <Excalidraw
        excalidrawAPI={handleApiReady}
        initialData={
          initialData
            ? {
                elements: initialData.elements,
                appState: {
                  ...initialData.appState,
                  viewBackgroundColor: 'transparent',
                },
                files: initialData.files,
                scrollToContent: true,
              }
            : {
                appState: { viewBackgroundColor: 'transparent' },
              }
        }
        onChange={onChange}
        theme="dark"
        viewModeEnabled={viewMode}
        zenModeEnabled={false}
      />
    </div>
  )
}
