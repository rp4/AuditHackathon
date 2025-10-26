"use client"

import { useEffect, useRef, useState } from 'react'
import { UniverDocsCorePreset } from '@univerjs/preset-docs-core'
import { UniverDocsDrawingPreset } from '@univerjs/preset-docs-drawing'
import UniverPresetDocsCoreEnUS from '@univerjs/preset-docs-core/locales/en-US'
import UniverPresetDocsDrawingEnUS from '@univerjs/preset-docs-drawing/locales/en-US'
import { createUniver, LocaleType, mergeLocales } from '@univerjs/presets'
import '@univerjs/preset-docs-core/lib/index.css'
import '@univerjs/preset-docs-drawing/lib/index.css'
import { Button } from './button'
import { Download } from 'lucide-react'
import { downloadUniverDocument, triggerDocumentDownload } from '@/lib/supabase/storage'

interface DocumentViewerProps {
  documentPath: string
  agentName?: string
}

export function DocumentViewer({ documentPath, agentName = 'agent' }: DocumentViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const univerAPIRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    if (!containerRef.current || !documentPath) return

    const loadDocument = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Download the document from storage
        const documentContent = await downloadUniverDocument(documentPath)

        if (!documentContent) {
          setError('Failed to load documentation')
          setIsLoading(false)
          return
        }

        // Initialize Univer with drawing support for images
        const { univerAPI } = createUniver({
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

        // Load the document content (read-only)
        univerAPI.createUniverDoc(documentContent)
        univerAPIRef.current = univerAPI

        setIsLoading(false)
      } catch (err) {
        console.error('Error loading document:', err)
        setError('Failed to load documentation')
        setIsLoading(false)
      }
    }

    loadDocument()

    return () => {
      if (univerAPIRef.current) {
        univerAPIRef.current.dispose()
      }
    }
  }, [documentPath])

  const handleDownload = async () => {
    try {
      setIsDownloading(true)
      const filename = `${agentName.toLowerCase().replace(/\s+/g, '-')}-documentation.univer`
      await triggerDocumentDownload(documentPath, filename)
    } catch (err) {
      console.error('Error downloading document:', err)
    } finally {
      setIsDownloading(false)
    }
  }

  if (error) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Documentation</h3>
        <Button
          onClick={handleDownload}
          disabled={isDownloading || isLoading}
          variant="outline"
          size="sm"
        >
          <Download className="h-4 w-4 mr-2" />
          {isDownloading ? 'Downloading...' : 'Download'}
        </Button>
      </div>

      {isLoading ? (
        <div className="border rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading documentation...</p>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="border rounded-lg overflow-hidden"
          style={{ height: '600px', width: '100%' }}
        />
      )}
    </div>
  )
}
