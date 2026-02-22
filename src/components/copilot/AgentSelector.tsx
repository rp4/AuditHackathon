'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, Users, Scale, User } from 'lucide-react'
import Image from 'next/image'
import { AGENT_OPTIONS, type AgentOption } from '@/lib/copilot/adk/agents/registry'
import type { AgentId } from '@/lib/copilot/types'

function getAgentIcon(agent: AgentOption) {
  if (agent.id === 'judge') return Scale
  return Users
}

interface AgentSelectorProps {
  value: AgentId
  onChange: (agentId: AgentId) => void
  fullWidth?: boolean
}

export function AgentSelector({ value, onChange, fullWidth = false }: AgentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedAgent = AGENT_OPTIONS.find((a) => a.id === value) || AGENT_OPTIONS[0]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const systemAgents = AGENT_OPTIONS.filter((a) => a.category === 'system')
  const characterAgents = AGENT_OPTIONS.filter((a) => a.category === 'character')

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors ${
          fullWidth ? 'w-full justify-between' : ''
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {selectedAgent.id === 'copilot' ? (
            <Image src="/copilot.png" alt="Copilot" width={20} height={20} className="flex-shrink-0" />
          ) : selectedAgent.category === 'character' ? (
            <User className="w-5 h-5 text-gray-500 flex-shrink-0" />
          ) : (
            <span className="text-base flex-shrink-0">{selectedAgent.icon}</span>
          )}
          <div className="min-w-0 text-left">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block truncate">
              {selectedAgent.name}
            </span>
            {selectedAgent.category === 'character' && (
              <span className="text-xs text-gray-500 dark:text-gray-400 block truncate">
                {selectedAgent.title}
              </span>
            )}
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 max-h-[70vh] overflow-y-auto ${
            fullWidth ? 'left-0 right-0 bottom-full mb-2' : 'right-0 w-72 mt-2'
          }`}
        >
          {/* System Agents */}
          <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              System
            </h3>
          </div>
          <div className="py-1">
            {systemAgents.map((agent) => (
              <AgentOptionRow
                key={agent.id}
                agent={agent}
                isSelected={agent.id === value}
                onSelect={() => {
                  onChange(agent.id)
                  setIsOpen(false)
                }}
              />
            ))}
          </div>

          {/* Character Agents */}
          <div className="px-3 py-2 border-t border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Bluth Company Employees
            </h3>
          </div>
          <div className="py-1">
            {characterAgents.map((agent) => (
              <AgentOptionRow
                key={agent.id}
                agent={agent}
                isSelected={agent.id === value}
                onSelect={() => {
                  onChange(agent.id)
                  setIsOpen(false)
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function AgentOptionRow({
  agent,
  isSelected,
  onSelect,
}: {
  agent: AgentOption
  isSelected: boolean
  onSelect: () => void
}) {
  const Icon = getAgentIcon(agent)

  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-start gap-3 px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
        isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
      }`}
    >
      <div
        className={`p-1.5 rounded-lg flex-shrink-0 ${
          isSelected
            ? 'bg-blue-100 dark:bg-blue-900/50'
            : 'bg-gray-100 dark:bg-gray-700'
        }`}
      >
        {agent.id === 'copilot' ? (
          <Image src="/copilot.png" alt="Copilot" width={16} height={16} className="w-4 h-4" />
        ) : agent.category === 'character' ? (
          <User className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
        ) : (
          <Icon
            className={`w-4 h-4 ${
              isSelected ? 'text-blue-600' : 'text-gray-500'
            }`}
          />
        )}
      </div>
      <div className="flex-1 text-left min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-medium truncate ${
              isSelected
                ? 'text-blue-700 dark:text-blue-300'
                : 'text-gray-900 dark:text-white'
            }`}
          >
            {agent.name}
          </span>
          {isSelected && (
            <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {agent.title}
        </p>
      </div>
    </button>
  )
}
