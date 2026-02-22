/**
 * Character Agent Factory
 *
 * Creates ADKAgent instances configured as Bluth Company characters.
 * Each character has a unique personality, cooperation level, and access
 * to Bluth MCP tools for looking up company data during interviews.
 */

import { ADKAgent } from '../../client'
import {
  createBluthMCPClient,
} from '../../../mcp/bluth-client'
import { WRANGLER_FUNCTION_DECLARATIONS } from '../wrangler'
import type { GeminiModel } from '@/lib/copilot/types'

import { getGeorgeSrSystemInstruction } from './george-sr'
import { getLucilleSystemInstruction } from './lucille'
import { getMichaelSystemInstruction } from './michael'
import { getGobSystemInstruction } from './gob'
import { getLindsaySystemInstruction } from './lindsay'
import { getTobiasSystemInstruction } from './tobias'
import { getGeorgeMichaelSystemInstruction } from './george-michael'
import { getBusterSystemInstruction } from './buster'
import { getAnnyongSystemInstruction } from './annyong'
import { getKittySystemInstruction } from './kitty'

const CHARACTER_INSTRUCTIONS: Record<string, () => string> = {
  'george-sr': getGeorgeSrSystemInstruction,
  'lucille': getLucilleSystemInstruction,
  'michael': getMichaelSystemInstruction,
  'gob': getGobSystemInstruction,
  'lindsay': getLindsaySystemInstruction,
  'tobias': getTobiasSystemInstruction,
  'george-michael': getGeorgeMichaelSystemInstruction,
  'buster': getBusterSystemInstruction,
  'annyong': getAnnyongSystemInstruction,
  'kitty': getKittySystemInstruction,
}

export function isValidCharacter(characterId: string): boolean {
  return characterId in CHARACTER_INSTRUCTIONS
}

export function createCharacterAgent(config: {
  characterId: string
  model: GeminiModel
  userId: string
  userEmail: string
  sessionId?: string
}): ADKAgent {
  const getInstruction = CHARACTER_INSTRUCTIONS[config.characterId]
  if (!getInstruction) {
    throw new Error(`Unknown character: ${config.characterId}`)
  }

  const bluthClient = createBluthMCPClient()

  return new ADKAgent({
    model: config.model,
    systemInstruction: getInstruction(),
    functionDeclarations: WRANGLER_FUNCTION_DECLARATIONS,
    toolRouter: (name, args) => bluthClient.callTool(name, args),
    userContext: { userId: config.userId, userEmail: config.userEmail },
    sessionId: config.sessionId,
  })
}
