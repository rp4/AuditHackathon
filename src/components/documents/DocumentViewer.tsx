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

interface DocumentViewerProps {
  content: JSONContent | null
  className?: string
}

export function DocumentViewer({ content, className = '' }: DocumentViewerProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Table.configure({
        resizable: false,
      }),
      TableRow,
      TableCell,
      TableHeader,
      Image.configure({
        inline: true,
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: 'text-primary underline hover:text-primary/80',
          target: '_blank',
          rel: 'noopener noreferrer',
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
    content: content || undefined,
    editable: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none focus:outline-none',
      },
    },
  })

  if (!content) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>No documentation available.</p>
      </div>
    )
  }

  if (!editor) {
    return (
      <div className="p-8 text-center text-gray-500">
        <div className="animate-pulse">Loading documentation...</div>
      </div>
    )
  }

  return (
    <div className={`document-viewer ${className}`}>
      <EditorContent editor={editor} />
    </div>
  )
}
