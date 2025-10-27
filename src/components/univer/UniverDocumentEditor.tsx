"use client"

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import type { IDocumentData } from '@univerjs/core'
import { LocaleType, mergeLocales } from '@univerjs/core'
import { createUniver } from '@univerjs/presets'
import { UniverDocsCorePreset } from '@univerjs/preset-docs-core'
import { UniverDocsDrawingPreset } from '@univerjs/preset-docs-drawing'
import UniverPresetDocsCoreEnUS from '@univerjs/preset-docs-core/lib/locales/en-US'
import UniverPresetDocsDrawingEnUS from '@univerjs/preset-docs-drawing/lib/locales/en-US'
import '@univerjs/preset-docs-core/lib/index.css'
import '@univerjs/preset-docs-drawing/lib/index.css'

import { getAgentTemplate } from '@/lib/univer/templates/agentDocTemplate'

interface UniverDocumentEditorProps {
  onChange?: (content: IDocumentData) => void
  initialContent?: IDocumentData
  agentSlug: string
}

export interface UniverDocumentEditorRef {
  getContent: () => IDocumentData | null
  setContent: (content: IDocumentData) => void
}

export const UniverDocumentEditor = forwardRef<UniverDocumentEditorRef, UniverDocumentEditorProps>(
  ({ onChange, initialContent, agentSlug }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const univerAPIRef = useRef<any>(null)
    const univerRef = useRef<any>(null)

    useImperativeHandle(ref, () => ({
      getContent: () => {
        if (!univerAPIRef.current) return null
        const doc = univerAPIRef.current.getActiveDocument()
        return doc?.getSnapshot() || null
      },
      setContent: (content: IDocumentData) => {
        if (!univerAPIRef.current) return
        // Dispose current document and create new one
        const currentDoc = univerAPIRef.current.getActiveDocument()
        if (currentDoc) {
          univerAPIRef.current.disposeUnit(currentDoc.getId())
        }
        univerAPIRef.current.createUniverDoc(content)
      },
    }))

    useEffect(() => {
      if (!containerRef.current) return

      // Initialize Univer following official docs pattern
      const { univer, univerAPI } = createUniver({
        locale: LocaleType.EN_US,
        locales: {
          [LocaleType.EN_US]: mergeLocales(
            UniverPresetDocsCoreEnUS,
            UniverPresetDocsDrawingEnUS
          ),
        },
        presets: [
          UniverDocsCorePreset({
            container: containerRef.current,
          }),
          UniverDocsDrawingPreset(),
        ],
      })

      univerRef.current = univer
      univerAPIRef.current = univerAPI

      // Load initial content or template
      const contentToLoad = initialContent || getAgentTemplate()
      univerAPI.createUniverDoc(contentToLoad)

      // Listen for content changes
      let subscription: any = null
      if (onChange) {
        subscription = univerAPI.onCommandExecuted((command: any) => {
          // Only respond to document edit commands
          if (command.id?.startsWith('doc.command.')) {
            const docData = univerAPI.getActiveDocument()?.getSnapshot()
            if (docData) {
              onChange(docData)
            }
          }
        })
      }

      // Cleanup on unmount
      return () => {
        if (subscription) {
          subscription.dispose()
        }
        if (univerRef.current) {
          univerRef.current.dispose()
        }
      }
    }, []) // Only run once on mount

    return (
      <div className="border rounded-lg overflow-hidden bg-white">
        <div
          ref={containerRef}
          style={{ height: '600px', width: '100%' }}
          className="univer-container"
        />
        <div className="px-4 py-2 bg-gray-50 border-t text-xs text-gray-600">
          💡 Tip: You can paste images directly into the document using Ctrl+V (Cmd+V on Mac)
        </div>
      </div>
    )
  }
)

UniverDocumentEditor.displayName = 'UniverDocumentEditor'
