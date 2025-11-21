/**
 * Reusable Prisma select objects to reduce duplication
 * and maintain consistency across queries
 */

// Basic user fields
export const userBasicSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
} as const

// Extended user profile fields
export const userProfileSelect = {
  ...userBasicSelect,
  bio: true,
  linkedin_url: true,
  website: true,
  company: true,
  role: true,
  createdAt: true,
} as const

// Tool/Agent basic fields
export const toolBasicSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  platform: true,
  category: true,
  is_public: true,
  created_at: true,
  updated_at: true,
} as const

// Tool/Agent with user
export const toolWithUserSelect = {
  ...toolBasicSelect,
  user: {
    select: userBasicSelect
  }
} as const

// Tool/Agent with counts
export const toolWithCountsSelect = {
  ...toolBasicSelect,
  _count: {
    select: {
      favorites: true,
      ratings: true,
      comments: true,
      downloads: true,
    }
  }
} as const

// Full tool/agent with all relations
export const toolFullSelect = {
  ...toolBasicSelect,
  configuration: true,
  instructions: true,
  documentation: true,
  user: {
    select: userBasicSelect
  },
  _count: {
    select: {
      favorites: true,
      ratings: true,
      comments: true,
      downloads: true,
    }
  }
} as const

// Rating fields
export const ratingSelect = {
  id: true,
  rating: true,
  created_at: true,
  user: {
    select: userBasicSelect
  }
} as const

// Comment fields
export const commentSelect = {
  id: true,
  content: true,
  created_at: true,
  updated_at: true,
  user: {
    select: userBasicSelect
  }
} as const

// Collection fields
export const collectionBasicSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  is_public: true,
  created_at: true,
} as const

// Collection with tools
export const collectionWithToolsSelect = {
  ...collectionBasicSelect,
  user: {
    select: userBasicSelect
  },
  collection_agents: {
    select: {
      agent: {
        select: toolBasicSelect
      }
    }
  },
  _count: {
    select: {
      collection_agents: true
    }
  }
} as const