/**
 * Agent Registry
 *
 * Central registry of all selectable agents for the copilot UI dropdown.
 * Includes the default Copilot, the Judge, and all 10 Bluth Company characters.
 */

export type CooperationLevel = 'helpful' | 'guarded' | 'evasive' | 'hostile'

export interface AgentOption {
  id: string
  name: string
  title: string
  category: 'system' | 'character'
  icon: string
  cooperationLevel?: CooperationLevel
}

export const AGENT_OPTIONS: AgentOption[] = [
  // System agents
  {
    id: 'copilot',
    name: 'Copilot',
    title: 'AI Audit Assistant',
    category: 'system',
    icon: '🤖',
  },
  {
    id: 'judge',
    name: 'Judge',
    title: 'Score Your Audit',
    category: 'system',
    icon: '⚖️',
  },

  // Bluth Company Characters
  {
    id: 'character:george-sr',
    name: 'George Bluth Sr',
    title: 'CEO (Incarcerated)',
    category: 'character',
    icon: '👔',
    cooperationLevel: 'evasive',
  },
  {
    id: 'character:lucille',
    name: 'Lucille Bluth',
    title: 'Matriarch & Board Member',
    category: 'character',
    icon: '🍸',
    cooperationLevel: 'hostile',
  },
  {
    id: 'character:michael',
    name: 'Michael Bluth',
    title: 'COO',
    category: 'character',
    icon: '📋',
    cooperationLevel: 'guarded',
  },
  {
    id: 'character:gob',
    name: 'GOB Bluth',
    title: 'Senior VP',
    category: 'character',
    icon: '🎩',
    cooperationLevel: 'helpful', // accidentally revealing
  },
  {
    id: 'character:lindsay',
    name: 'Lindsay Bluth',
    title: 'VP of Acquisitions',
    category: 'character',
    icon: '💅',
    cooperationLevel: 'evasive',
  },
  {
    id: 'character:tobias',
    name: 'Tobias Funke',
    title: 'Analyst/Therapist',
    category: 'character',
    icon: '🎭',
    cooperationLevel: 'helpful', // tangential but willing
  },
  {
    id: 'character:george-michael',
    name: 'George Michael Bluth',
    title: 'Software Developer',
    category: 'character',
    icon: '💻',
    cooperationLevel: 'guarded',
  },
  {
    id: 'character:buster',
    name: 'Buster Bluth',
    title: 'VP of Cartography',
    category: 'character',
    icon: '🗺️',
    cooperationLevel: 'helpful', // confused but willing
  },
  {
    id: 'character:annyong',
    name: 'Annyong Bluth',
    title: 'Intern',
    category: 'character',
    icon: '🎎',
    cooperationLevel: 'hostile',
  },
  {
    id: 'character:kitty',
    name: 'Kitty Sanchez',
    title: 'Executive Assistant',
    category: 'character',
    icon: '🔑',
    cooperationLevel: 'guarded', // transactional
  },
]

export function getAgentOption(agentId: string): AgentOption | undefined {
  return AGENT_OPTIONS.find((a) => a.id === agentId)
}

export function isCharacterAgent(agentId: string): boolean {
  return agentId.startsWith('character:')
}

export function getCharacterId(agentId: string): string {
  return agentId.replace('character:', '')
}
