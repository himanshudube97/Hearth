'use client'

import { useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useThemeStore } from '@/store/theme'

const Excalidraw = dynamic(
  async () => (await import('@excalidraw/excalidraw')).Excalidraw,
  { ssr: false }
)

// Load Excalidraw CSS once via link tag (avoids Turbopack exports resolution issues)
let cssLoaded = false
function useExcalidrawCSS() {
  useEffect(() => {
    if (cssLoaded) return
    cssLoaded = true
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = '/excalidraw.css'
    document.head.appendChild(link)
  }, [])
}

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
  useExcalidrawCSS()

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
