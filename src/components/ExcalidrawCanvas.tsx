'use client'

import { useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useThemeStore } from '@/store/theme'

// Dynamically import Excalidraw + MainMenu together (SSR disabled)
const ExcalidrawEditor = dynamic(
  async () => {
    const mod = await import('@excalidraw/excalidraw')
    const { Excalidraw, MainMenu } = mod

    function Editor(props: {
      excalidrawAPI?: (api: any) => void
      initialData?: any
      onChange?: (elements: readonly any[], appState: any, files: any) => void
      theme?: string
      viewModeEnabled?: boolean
      zenModeEnabled?: boolean
      UIOptions?: any
    }) {
      return (
        <Excalidraw
          excalidrawAPI={props.excalidrawAPI}
          initialData={props.initialData}
          onChange={props.onChange}
          theme={props.theme as any}
          viewModeEnabled={props.viewModeEnabled}
          zenModeEnabled={props.zenModeEnabled}
          UIOptions={props.UIOptions}
        >
          {!props.viewModeEnabled && (
            <MainMenu>
              <MainMenu.DefaultItems.ClearCanvas />
              <MainMenu.DefaultItems.SaveAsImage />
              <MainMenu.DefaultItems.ChangeCanvasBackground />
            </MainMenu>
          )}
        </Excalidraw>
      )
    }

    return Editor
  },
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

// Simplified UI: hide unnecessary canvas actions and tools
const SIMPLIFIED_UI_OPTIONS = {
  canvasActions: {
    changeViewBackgroundColor: false,
    clearCanvas: true,
    loadScene: false,
    saveToActiveFile: false,
    export: false,
    toggleTheme: false,
  },
  tools: {
    image: false,
  },
  welcomeScreen: false,
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
      className="w-full h-full rounded-2xl overflow-hidden excalidraw-minimal"
      style={{
        border: `1px solid ${theme.glass.border}`,
      }}
    >
      <ExcalidrawEditor
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
        UIOptions={SIMPLIFIED_UI_OPTIONS}
      />
    </div>
  )
}
