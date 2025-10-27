import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'

// ============================================
// SANITIZATION HELPERS
// ============================================

/**
 * Sanitize HTML/text content to prevent XSS
 */
function sanitizeHtml(value: unknown): string {
  if (typeof value !== 'string') return ''
  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  })
}

/**
 * Sanitize JSON configuration objects to prevent script injection
 */
function sanitizeJson(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (typeof value === 'string') {
    // Check for script tags or dangerous content
    if (/<script|javascript:|on\w+=/i.test(value)) {
      return value.replace(/<script.*?<\/script>/gi, '').replace(/on\w+=/gi, '')
    }
    return value
  }
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.map(sanitizeJson)
    }
    const sanitized: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeJson(val)
    }
    return sanitized
  }
  return value
}

// ============================================
// AGENT SCHEMAS
// ============================================

export const createAgentSchema = z.object({
  name: z.string()
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name must be less than 100 characters')
    .transform(val => DOMPurify.sanitize(val, { ALLOWED_TAGS: [] })), // Strip all HTML

  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters')
    .transform(sanitizeHtml),

  category_id: z.string()
    .uuid('Invalid category')
    .optional(),

  platforms: z.array(z.string().uuid())
    .min(1, 'Select at least one platform'),

  tags: z.array(z.string())
    .max(10, 'Maximum 10 tags')
    .default([])
    .transform(tags => tags.map(tag => DOMPurify.sanitize(tag, { ALLOWED_TAGS: [] }))),

  prerequisites: z.array(z.string())
    .default([])
    .transform(prereqs => prereqs.map(p => sanitizeHtml(p))),

  estimated_tokens: z.number()
    .int()
    .positive()
    .optional(),

  estimated_cost: z.number()
    .positive()
    .optional(),

  is_public: z.boolean()
    .optional(),

  instructions: z.string()
    .max(10000, 'Instructions too long')
    .optional()
    .transform(val => val ? sanitizeHtml(val) : undefined),

  configuration: z.record(z.string(), z.unknown())
    .optional()
    .transform(val => val ? sanitizeJson(val) as Record<string, unknown> : undefined),

  sample_inputs: z.array(z.string())
    .max(10, 'Maximum 10 sample inputs')
    .default([])
    .transform(inputs => inputs.map(i => sanitizeHtml(i))),

  sample_outputs: z.array(z.string())
    .max(10, 'Maximum 10 sample outputs')
    .default([])
    .transform(outputs => outputs.map(o => sanitizeHtml(o))),
})

export const updateAgentSchema = createAgentSchema.partial()

// Input type (before validation/transform) for forms
export type CreateAgentInput = z.input<typeof createAgentSchema>
// Output type (after validation/transform) for API
export type CreateAgentOutput = z.output<typeof createAgentSchema>

export type UpdateAgentInput = z.input<typeof updateAgentSchema>
export type UpdateAgentOutput = z.output<typeof updateAgentSchema>

// ============================================
// RATING SCHEMAS
// ============================================

export const createRatingSchema = z.object({
  agent_id: z.string().uuid(),
  score: z.number()
    .int()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
  review: z.string()
    .max(1000, 'Review must be less than 1000 characters')
    .optional()
    .transform(val => val ? sanitizeHtml(val) : val),
})

export type CreateRatingInput = z.infer<typeof createRatingSchema>

// ============================================
// COMMENT SCHEMAS
// ============================================

export const createCommentSchema = z.object({
  agent_id: z.string().uuid(),
  content: z.string()
    .min(1, 'Comment cannot be empty')
    .max(2000, 'Comment must be less than 2000 characters')
    .transform(sanitizeHtml),
  parent_id: z.string().uuid().optional(),
})

export const updateCommentSchema = z.object({
  content: z.string()
    .min(1, 'Comment cannot be empty')
    .max(2000, 'Comment must be less than 2000 characters')
    .transform(sanitizeHtml),
})

export type CreateCommentInput = z.infer<typeof createCommentSchema>
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>

// ============================================
// PROFILE SCHEMAS
// ============================================

export const updateProfileSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
    .optional(),

  full_name: z.string()
    .max(100, 'Full name must be less than 100 characters')
    .optional()
    .transform(val => val ? DOMPurify.sanitize(val, { ALLOWED_TAGS: [] }) : undefined),

  bio: z.string()
    .max(500, 'Bio must be less than 500 characters')
    .optional()
    .transform(val => val ? sanitizeHtml(val) : undefined),

  website: z.string()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal('')),

  github_url: z.string()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal('')),

  linkedin_url: z.string()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal('')),
})

export type UpdateProfileInput = z.input<typeof updateProfileSchema>
export type UpdateProfileOutput = z.output<typeof updateProfileSchema>

// ============================================
// COLLECTION SCHEMAS
// ============================================

export const createCollectionSchema = z.object({
  name: z.string()
    .min(3, 'Collection name must be at least 3 characters')
    .max(100, 'Collection name must be less than 100 characters')
    .transform(val => DOMPurify.sanitize(val, { ALLOWED_TAGS: [] })),

  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .transform(val => val ? sanitizeHtml(val) : val),

  is_public: z.boolean()
    .optional()
    .default(true),
})

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>
