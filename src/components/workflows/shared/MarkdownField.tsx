'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { Pencil, Check, X } from 'lucide-react'

// Fix common markdown issues: ensure space after # for headings
function normalizeMarkdown(text: string): string {
  return text.replace(/^(#{1,6})([^\s#])/gm, '$1 $2')
}

interface MarkdownFieldProps {
  value: string
  onChange: (value: string) => void
  label: string
  placeholder?: string
  readOnly?: boolean
  rows?: number
}

export function MarkdownField({
  value,
  onChange,
  label,
  placeholder = 'Click to add content...',
  readOnly = false,
  rows = 10,
}: MarkdownFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Sync draft when value changes externally (e.g. switching nodes)
  useEffect(() => {
    if (!isEditing) {
      setDraft(value)
    }
  }, [value, isEditing])

  // Auto-focus textarea on entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      // Place cursor at end
      const len = textareaRef.current.value.length
      textareaRef.current.setSelectionRange(len, len)
    }
  }, [isEditing])

  const handleEnterEdit = useCallback(() => {
    if (readOnly) return
    setDraft(value)
    setIsEditing(true)
  }, [readOnly, value])

  const handleSave = useCallback(() => {
    onChange(draft)
    setIsEditing(false)
  }, [draft, onChange])

  const handleCancel = useCallback(() => {
    setDraft(value)
    setIsEditing(false)
  }, [value])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel()
    }
    // Ctrl/Cmd + Enter to save
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSave()
    }
  }, [handleCancel, handleSave])

  if (isEditing) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-stone-600">{label}</label>
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={rows}
          placeholder={placeholder}
          className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 resize-vertical font-mono bg-white"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-stone-400">
            Markdown supported. Ctrl+Enter to save.
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-stone-600 bg-white border border-stone-200 rounded-md hover:bg-stone-50 transition-colors"
            >
              <X className="h-3 w-3" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 transition-colors"
            >
              <Check className="h-3 w-3" />
              Done
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Display mode
  const hasContent = value && value.trim().length > 0

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-stone-600">{label}</label>
      <div
        onClick={handleEnterEdit}
        className={`
          relative group rounded-lg border transition-colors
          ${readOnly
            ? 'border-stone-200 bg-stone-50'
            : 'border-stone-200 bg-stone-50 cursor-pointer hover:border-stone-300 hover:bg-stone-100/50'
          }
        `}
      >
        <div className="p-3 max-h-64 overflow-y-auto">
          {hasContent ? (
            <div className="markdown-content text-stone-700">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                {normalizeMarkdown(value)}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-stone-400 italic">{placeholder}</p>
          )}
        </div>

        {/* Edit indicator */}
        {!readOnly && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="p-1 bg-white rounded-md shadow-sm border border-stone-200">
              <Pencil className="h-3 w-3 text-stone-400" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
