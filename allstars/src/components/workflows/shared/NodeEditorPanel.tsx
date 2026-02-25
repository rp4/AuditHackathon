'use client'

import { ArrowLeft, X, Loader2, Save, ArrowRight } from 'lucide-react'
import { MarkdownField } from './MarkdownField'
import type { Node } from 'reactflow'

interface StepResultProps {
  result: string
  completed: boolean
  saving: boolean
  onResultChange: (value: string) => void
  onCompletedChange: (value: boolean) => void
  onSave: () => void
  highlight?: boolean
  isDraft?: boolean
  onApproveAndContinue?: () => void
}

interface NodeEditorPanelProps {
  node: Node
  onClose: () => void
  onUpdateField: (nodeId: string, field: string, value: string) => void
  readOnly?: boolean
  stepResult?: StepResultProps
}

export function NodeEditorPanel({
  node,
  onClose,
  onUpdateField,
  readOnly = false,
  stepResult,
}: NodeEditorPanelProps) {
  const data = node.data || {}

  return (
    <div className="flex flex-col h-full -m-5">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-stone-200">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Close
        </button>
        <button
          onClick={onClose}
          className="p-1 text-stone-400 hover:text-stone-600 rounded-md hover:bg-stone-100 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-2">Title</label>
          <input
            type="text"
            value={data.label || ''}
            onChange={(e) => onUpdateField(node.id, 'label', e.target.value)}
            placeholder="Step name"
            disabled={readOnly}
            className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-2">Description</label>
          <textarea
            value={data.description || ''}
            onChange={(e) => onUpdateField(node.id, 'description', e.target.value)}
            placeholder="Brief description of this step"
            rows={3}
            disabled={readOnly}
            className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 resize-none bg-white disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Instructions (markdown) */}
        <MarkdownField
          label="Instructions"
          value={data.instructions || ''}
          onChange={(val) => onUpdateField(node.id, 'instructions', val)}
          placeholder="Click to add instructions..."
          readOnly={readOnly}
          rows={12}
        />

        {/* Step Result section — only on edit page */}
        {stepResult && (
          <>
            <div className={`border-t border-stone-200 pt-4${
              stepResult.highlight
                ? ' ring-2 ring-brand-400 ring-offset-2 rounded-lg p-3 bg-brand-50/50 animate-pulse-once'
                : ''
            }`}>
              <MarkdownField
                label="Result"
                value={stepResult.result}
                onChange={stepResult.onResultChange}
                placeholder="Enter your result for this step, or use AI Assist..."
                rows={8}
              />
            </div>

            {/* Completed checkbox — hidden when draft (approve auto-completes) */}
            {!(stepResult.isDraft && stepResult.onApproveAndContinue) && (
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={stepResult.completed}
                  onChange={(e) => stepResult.onCompletedChange(e.target.checked)}
                  disabled={stepResult.saving}
                  className="h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500/20"
                />
                <span className="text-sm font-medium text-stone-700">Mark as completed</span>
              </label>
            )}

            {/* Approve & Continue (draft from copilot) or Save Result (manual) */}
            {stepResult.isDraft && stepResult.onApproveAndContinue ? (
              <div className="space-y-2">
                <button
                  onClick={stepResult.onApproveAndContinue}
                  disabled={stepResult.saving}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {stepResult.saving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-3.5 w-3.5" />
                      Approve &amp; Continue
                    </>
                  )}
                </button>
                <button
                  onClick={stepResult.onSave}
                  disabled={stepResult.saving}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save Only
                </button>
              </div>
            ) : (
              <button
                onClick={stepResult.onSave}
                disabled={stepResult.saving}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {stepResult.saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    Save Result
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
