import { z } from 'zod'

// ============================================
// AGENT SCHEMAS
// ============================================

export const createAgentSchema = z.object({
  name: z.string()
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name must be less than 100 characters'),

  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters'),

  markdown_content: z.string()
    .min(100, 'Documentation must be at least 100 characters')
    .optional(),

  category_id: z.string()
    .uuid('Invalid category'),

  platforms: z.array(z.string().uuid())
    .min(1, 'Select at least one platform')
    .max(5, 'Maximum 5 platforms'),

  tags: z.array(z.string())
    .max(10, 'Maximum 10 tags')
    .optional(),

  version: z.string()
    .regex(/^\d+\.\d+\.\d+$/, 'Version must be in format X.Y.Z')
    .optional(),

  complexity_level: z.enum(['beginner', 'intermediate', 'advanced'])
    .optional(),

  prerequisites: z.array(z.string())
    .optional(),

  estimated_tokens: z.number()
    .int()
    .positive()
    .optional(),

  estimated_cost: z.number()
    .positive()
    .optional(),

  is_public: z.boolean()
    .optional(),

  instructions: z.any().optional(),
  configuration: z.any().optional(),
  sample_inputs: z.any().optional(),
  sample_outputs: z.any().optional(),
})

export const updateAgentSchema = createAgentSchema.partial()

export type CreateAgentInput = z.infer<typeof createAgentSchema>
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>

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
    .optional(),
})

export type CreateRatingInput = z.infer<typeof createRatingSchema>

// ============================================
// COMMENT SCHEMAS
// ============================================

export const createCommentSchema = z.object({
  agent_id: z.string().uuid(),
  content: z.string()
    .min(1, 'Comment cannot be empty')
    .max(2000, 'Comment must be less than 2000 characters'),
  parent_id: z.string().uuid().optional(),
})

export const updateCommentSchema = z.object({
  content: z.string()
    .min(1, 'Comment cannot be empty')
    .max(2000, 'Comment must be less than 2000 characters'),
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
    .optional(),

  bio: z.string()
    .max(500, 'Bio must be less than 500 characters')
    .optional(),

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

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

// ============================================
// COLLECTION SCHEMAS
// ============================================

export const createCollectionSchema = z.object({
  name: z.string()
    .min(3, 'Collection name must be at least 3 characters')
    .max(100, 'Collection name must be less than 100 characters'),

  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),

  is_public: z.boolean()
    .optional()
    .default(true),
})

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>
