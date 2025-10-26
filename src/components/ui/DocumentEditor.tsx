"use client"

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { UniverDocsCorePreset } from '@univerjs/preset-docs-core'
import UniverPresetDocsCoreEnUS from '@univerjs/preset-docs-core/locales/en-US'
import { createUniver, LocaleType, mergeLocales } from '@univerjs/presets'
import '@univerjs/preset-docs-core/lib/index.css'

interface DocumentEditorProps {
  onChange?: (content: any) => void
  initialContent?: any
}

export interface DocumentEditorRef {
  getContent: () => any
}

export const DocumentEditor = forwardRef<DocumentEditorRef, DocumentEditorProps>(
  ({ onChange, initialContent }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const univerAPIRef = useRef<any>(null)

    useImperativeHandle(ref, () => ({
      getContent: () => {
        if (!univerAPIRef.current) return null
        const doc = univerAPIRef.current.getActiveDocument()
        return doc?.getSnapshot()
      },
    }))

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

      const doc = univerAPI.createUniverDoc(initialContent || {})
      univerAPIRef.current = univerAPI

      // Listen for content changes
      if (onChange) {
        const subscription = univerAPI.onCommandExecuted((command) => {
          // Only respond to document edit commands
          if (command.id?.startsWith('doc.command.')) {
            const docData = univerAPI.getActiveDocument()?.getSnapshot()
            if (docData) {
              onChange(docData)
            }
          }
        })

        return () => {
          subscription.dispose()
          univerAPI.dispose()
        }
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
})

DocumentEditor.displayName = 'DocumentEditor'
