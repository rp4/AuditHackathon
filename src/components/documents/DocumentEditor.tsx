'use client'

import { useEditor, EditorContent, JSONContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { Image } from '@tiptap/extension-image'
import { Link } from '@tiptap/extension-link'
import { TextAlign } from '@tiptap/extension-text-align'
import { TaskList } from '@tiptap/extension-task-list'
import { TaskItem } from '@tiptap/extension-task-item'
import { useEffect, useState } from 'react'
import { useDebounce } from 'use-debounce'
import { EditorToolbar } from './EditorToolbar'
import { extractImageUrls } from '@/lib/documents/storage'

interface DocumentEditorProps {
  agentSlug: string
  initialContent?: JSONContent
  onSave?: (content: JSONContent, images: string[]) => void
  onContentChange?: (content: JSONContent) => void
  placeholder?: string
  editable?: boolean
  autoSave?: boolean
  autoSaveDelay?: number
}

export function DocumentEditor({
  agentSlug,
  initialContent,
  onSave,
  onContentChange,
  placeholder = 'Start writing your agent documentation...',
  editable = true,
  autoSave = true,
  autoSaveDelay = 3000,
}: DocumentEditorProps) {
  const [content, setContent] = useState<JSONContent | undefined>(initialContent)
  const [debouncedContent] = useDebounce(content, autoSaveDelay)
  const [isSaving, setIsSaving] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      Image.configure({
        inline: true,
        allowBase64: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: initialContent,
    editable,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none focus:outline-none min-h-[400px] p-4',
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON()
      setContent(json)
      onContentChange?.(json)
    },
  })

  // Auto-save effect
  useEffect(() => {
    if (autoSave && debouncedContent && onSave && editor) {
      const saveContent = async () => {
        setIsSaving(true)
        try {
          // Extract all image URLs from content
          const imageUrls = extractImageUrls(debouncedContent)
          await onSave(debouncedContent, imageUrls)
        } catch (error) {
          console.error('Auto-save error:', error)
        } finally {
          setIsSaving(false)
        }
      }

      saveContent()
    }
  }, [debouncedContent, autoSave, onSave, editor])

  // Handle image upload tracking
  const handleImageUpload = (url: string) => {
    setUploadedImages((prev) => [...prev, url])
  }

  if (!editor) {
    return (
      <div className="border rounded-lg p-8 text-center text-gray-500">
        <div className="animate-pulse">Loading editor...</div>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {editable && (
        <EditorToolbar
          editor={editor}
          agentSlug={agentSlug}
          onImageUpload={handleImageUpload}
        />
      )}

      <div className="relative">
        <EditorContent editor={editor} className="min-h-[400px]" />

        {isSaving && (
          <div className="absolute top-2 right-2 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow">
            Saving...
          </div>
        )}
      </div>

      {editable && (
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 text-xs text-gray-500 flex justify-between items-center">
          <span>
            {editor.storage.characterCount?.characters() || 0} characters
            {' • '}
            {editor.storage.characterCount?.words() || 0} words
          </span>
          {autoSave && (
            <span>
              {isSaving ? 'Saving...' : 'Auto-save enabled'}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
