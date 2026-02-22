/**
 * Artist Agent — Image Generation via Nano Banana Pro
 *
 * Uses genai.models.generateContent() with responseModalities [TEXT, IMAGE]
 * instead of genai.chats.create(), since the image model requires this API.
 */

import { GoogleGenAI, Modality } from '@google/genai'
import type { StreamChunk } from '@/lib/copilot/types'
import { trackUsage, type UserContext } from '@/lib/copilot/services/usage-tracking'

export const ARTIST_MODEL = 'gemini-3-pro-image-preview'

export interface ArtistAgentConfig {
  userContext?: UserContext
  sessionId?: string
}

export class ArtistAgent {
  private genai: GoogleGenAI
  private config: ArtistAgentConfig

  constructor(config: ArtistAgentConfig) {
    this.config = config
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY or GEMINI_API_KEY environment variable is required')
    }
    this.genai = new GoogleGenAI({ apiKey })
  }

  async *streamMessage(task: string): AsyncGenerator<StreamChunk> {
    try {
      const response = await this.genai.models.generateContent({
        model: ARTIST_MODEL,
        contents: task,
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
          systemInstruction: ARTIST_SYSTEM_INSTRUCTION,
        },
      })

      this.trackResponse(response)

      const candidate = response.candidates?.[0]
      if (!candidate?.content?.parts) {
        yield { type: 'text', content: 'No image was generated. Please try a more specific description.' }
        return
      }

      for (const part of candidate.content.parts) {
        if (part.text) {
          yield { type: 'text', content: part.text }
        }
        if (part.inlineData?.data && part.inlineData?.mimeType) {
          yield {
            type: 'image',
            image: {
              data: part.inlineData.data,
              mimeType: part.inlineData.mimeType,
            },
          }
        }
      }
    } catch (error) {
      console.error('Artist agent error:', error)
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'Image generation failed',
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private trackResponse(response: any): void {
    const ctx = this.config.userContext
    if (!ctx) return
    const usage = response.usageMetadata
    if (!usage) return
    trackUsage({
      userId: ctx.userId,
      userEmail: ctx.userEmail,
      model: ARTIST_MODEL,
      promptTokens: usage.promptTokenCount || 0,
      outputTokens: usage.candidatesTokenCount || 0,
      totalTokens: usage.totalTokenCount || 0,
      sessionId: this.config.sessionId,
    })
  }

  async close(): Promise<void> {
    // No persistent resources to clean up
  }
}

const ARTIST_SYSTEM_INSTRUCTION = `You are the Artist agent for AuditCanvas. You create professional infographics, charts, diagrams, and visual summaries for audit data.

When given data and a request to create a visual:
1. Generate a clear, professional image that communicates the data effectively
2. Use clean design with appropriate colors and layout
3. Include a brief text explanation of the visual alongside the image
4. Focus on audit-relevant visualizations: risk heat maps, control matrices, finding summaries, trend charts

Always accompany images with a brief text description of what the image shows.`
