"use client"

import { useEffect, useRef, useState } from 'react'
import { UniverDocsCorePreset } from '@univerjs/preset-docs-core'
import { UniverDocsDrawingPreset } from '@univerjs/preset-docs-drawing'
import UniverPresetDocsCoreEnUS from '@univerjs/preset-docs-core/lib/locales/en-US'
import UniverPresetDocsDrawingEnUS from '@univerjs/preset-docs-drawing/lib/locales/en-US'
import { createUniver, LocaleType, mergeLocales } from '@univerjs/presets'
import type { IDocumentData } from '@univerjs/core'
import '@univerjs/preset-docs-core/lib/index.css'
import '@univerjs/preset-docs-drawing/lib/index.css'

import { downloadUniverDocument } from '@/lib/supabase/storage'

interface UniverDocumentViewerProps {
  documentPath: string
  agentSlug: string
}

export function UniverDocumentViewer({ documentPath, agentSlug }: UniverDocumentViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const univerRef = useRef<any>(null)
  const univerAPIRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    async function initializeViewer() {
      try {
        console.log('📖 Initializing Univer Document Viewer for agent:', agentSlug)
        setIsLoading(true)
        setError(null)

        // Download document from storage
        const documentData = await downloadUniverDocument(documentPath)
        if (!documentData) {
          setError('Failed to load document')
          setIsLoading(false)
          return
        }

        // Initialize Univer in read-only mode
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
              container: containerRef.current!,
            }),
            UniverDocsDrawingPreset(),
          ],
        })

        univerRef.current = univer
        univerAPIRef.current = univerAPI

        // Load document
        univerAPI.createUniverDoc(documentData)

        // Make document read-only by disabling edit commands
        try {
          const doc = univerAPI.getActiveDocument()
          if (doc) {
            const commandsToDisable = [
              'doc.command.insert-text',
              'doc.command.delete-text',
              'doc.command.set-text-style',
              'doc.command.paste',
            ]

            commandsToDisable.forEach(cmd => {
              try {
                univerAPI.unregisterCommand(cmd)
              } catch (e) {
                // Command might not exist, ignore
              }
            })
          }
        } catch (e) {
          console.warn('Could not set read-only mode:', e)
        }

        console.log('✅ Univer viewer initialized successfully')
        setIsLoading(false)
      } catch (error) {
        console.error('Error initializing viewer:', error)
        setError('Failed to load document viewer')
        setIsLoading(false)
      }
    }

    initializeViewer()

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up Univer viewer')
      if (univerRef.current) {
        univerRef.current.dispose()
      }
    }
  }, [documentPath, agentSlug])

  if (isLoading) {
    return (
      <div className="border rounded-lg overflow-hidden bg-white">
        <div className="flex items-center justify-center h-[600px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading documentation...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="border rounded-lg overflow-hidden bg-white">
        <div className="flex items-center justify-center h-[600px]">
          <div className="text-center text-red-600">
            <p className="text-lg font-semibold mb-2">⚠️ Error</p>
            <p>{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <div
        ref={containerRef}
        style={{ height: '600px', width: '100%' }}
        className="univer-container"
      />
      <div className="px-4 py-2 bg-gray-50 border-t text-xs text-gray-500">
        📖 Read-only document view
      </div>
    </div>
  )
}
