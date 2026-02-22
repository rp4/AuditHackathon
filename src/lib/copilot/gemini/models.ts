import type { GeminiModel, ModelConfig } from '@/lib/copilot/types'

export const GEMINI_MODELS: Record<GeminiModel, ModelConfig> = {
  'gemini-3-flash-preview': {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash',
    description: 'Fast & affordable, great for most tasks',
    maxTokens: 1000000,
    supportsTools: true,
  },
  'gemini-3-pro-preview': {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro',
    description: 'Most capable, best for complex reasoning',
    maxTokens: 1000000,
    supportsTools: true,
  },
}

export const DEFAULT_MODEL: GeminiModel = 'gemini-3-flash-preview'

export function getModelConfig(model: GeminiModel): ModelConfig {
  return GEMINI_MODELS[model] || GEMINI_MODELS[DEFAULT_MODEL]
}

export function isValidModel(model: string): model is GeminiModel {
  return model in GEMINI_MODELS
}
