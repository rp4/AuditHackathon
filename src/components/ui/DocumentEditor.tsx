"use client"

import { useEffect, useRef } from 'react'
import { UniverDocsCorePreset } from '@univerjs/preset-docs-core'
import UniverPresetDocsCoreEnUS from '@univerjs/preset-docs-core/locales/en-US'
import { createUniver, LocaleType, mergeLocales } from '@univerjs/presets'
import '@univerjs/preset-docs-core/lib/index.css'

interface DocumentEditorProps {
  onChange?: (content: any) => void
  initialContent?: any
}

export function DocumentEditor({ onChange, initialContent }: DocumentEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const univerAPIRef = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const { univerAPI } = createUniver({
      locale: LocaleType.EN_US,
      locales: {
        [LocaleType.EN_US]: mergeLocales(UniverPresetDocsCoreEnUS),
      },
      presets: [
        UniverDocsCorePreset({
          container: containerRef.current,
        }),
      ],
    })

    univerAPI.createUniverDoc(initialContent || {})
    univerAPIRef.current = univerAPI

    // Listen for content changes
    if (onChange) {
      // TODO: Add change listener
    }

    return () => {
      univerAPI.dispose()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="border rounded-lg overflow-hidden"
      style={{ height: '500px', width: '100%' }}
    />
  )
}
