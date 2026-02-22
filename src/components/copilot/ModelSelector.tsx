'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Zap, Brain, Check } from 'lucide-react'
import type { GeminiModel, ModelConfig } from '@/lib/copilot/types'

const MODELS: ModelConfig[] = [
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash',
    description: 'Fast & affordable, great for most tasks',
    maxTokens: 1000000,
    supportsTools: true,
  },
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro',
    description: 'Most capable, best for complex reasoning',
    maxTokens: 1000000,
    supportsTools: true,
  },
]

interface ModelSelectorProps {
  value: GeminiModel
  onChange: (model: GeminiModel) => void
  fullWidth?: boolean
}

export function ModelSelector({ value, onChange, fullWidth = false }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedModel = MODELS.find((m) => m.id === value) || MODELS[0]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getModelIcon = (modelId: string) => {
    if (modelId.includes('pro')) return Brain
    return Zap
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors ${
          fullWidth ? 'w-full justify-between' : ''
        }`}
      >
        <div className="flex items-center gap-2">
          {(() => {
            const Icon = getModelIcon(selectedModel.id)
            return <Icon className="w-4 h-4 text-blue-600" />
          })()}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {selectedModel.name}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className={`absolute bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 ${
          fullWidth ? 'left-0 right-0 bottom-full mb-2' : 'right-0 w-64 mt-2'
        }`}>
          <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Select Model
            </h3>
          </div>
          <div className="py-1">
            {MODELS.map((model) => {
              const Icon = getModelIcon(model.id)
              const isSelected = model.id === value

              return (
                <button
                  key={model.id}
                  onClick={() => {
                    onChange(model.id)
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-start gap-3 px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-lg ${
                      isSelected
                        ? 'bg-blue-100 dark:bg-blue-900/50'
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        isSelected ? 'text-blue-600' : 'text-gray-500'
                      }`}
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium ${
                          isSelected
                            ? 'text-blue-700 dark:text-blue-300'
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {model.name}
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {model.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
