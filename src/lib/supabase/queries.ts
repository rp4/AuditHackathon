import { createClient } from './client'
import type {
  Agent,
  AgentWithRelations,
  Category,
  Platform,
  Profile,
  Rating,
  RatingWithProfile,
  Comment,
  CommentWithProfile,
} from '@/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database-generated'

// CRITICAL: Always get the singleton instance to ensure auth state is shared
function getClient() {
  return createClient()
}

/**
 * Handle invalid/expired sessions by auto-logout
 * Best practice: Don't leave users in broken auth state
 */
async function handleInvalidSession(supabase: ReturnType<typeof createClient>) {
  if (typeof window === 'undefined') return // Server-side, do nothing

  console.warn('Invalid session detected - auto-logging out and refreshing')
  try {
    await supabase.auth.signOut()
  } catch (e) {
    console.error('Error during auto-logout:', e)
  }

  // Hard reload to clear all stale state
  window.location.href = '/'
}

// ============================================
// AGENT QUERIES
// ============================================

export interface GetAgentsParams {
  search?: string
  categoryId?: string
  platformIds?: string[]
  minRating?: number
  tags?: string[]
  userId?: string
  isFeatured?: boolean
  isPublic?: boolean
  sortBy?: 'recent' | 'popular' | 'rating' | 'favorites'
  limit?: number
  offset?: number
}

export async function getAgents(params: GetAgentsParams = {}) {
  const supabase = getClient()

  // Check if user is authenticated (with error handling)
  let user = null
  try {
    const { data, error } = await supabase.auth.getUser()
    user = data?.user

    // Only trigger auto-logout if there's an auth error AND we think we're logged in
    // (Don't trigger for users who were never logged in)
    if (error && typeof window !== 'undefined') {
      // Check if there's a session cookie/token present
      const { data: sessionData } = await supabase.auth.getSession()
      if (sessionData.session) {
        // We have a session but getUser failed - session is invalid
        await handleInvalidSession(supabase)
        return []
      }
      // No session present - user is simply not logged in, continue normally
    }
  } catch (error) {
    // Silent fail - just continue without user
    console.error('Auth check failed:', error)
  }

  let query = supabase
    .from('agents')
    .select(`
      *,
      profile:profiles!agents_user_id_fkey(id, username, full_name, avatar_url),
      category:categories(id, name, slug),
      agent_platforms(
        platform_id,
        platform:platforms(id, name, slug)
      )
    `)

  // Apply filters
  // CRITICAL: Always filter out soft-deleted agents
  query = query.or('is_deleted.is.null,is_deleted.eq.false')

  if (params.isPublic !== undefined) {
    query = query.eq('is_public', params.isPublic)
  } else {
    query = query.eq('is_public', true) // Default to public only
  }

  if (params.isFeatured) {
    query = query.eq('is_featured', true)
  }

  if (params.categoryId) {
    query = query.eq('category_id', params.categoryId)
  }

  if (params.userId) {
    query = query.eq('user_id', params.userId)
  }

  if (params.minRating) {
    query = query.gte('avg_rating', params.minRating)
  }

  if (params.tags && params.tags.length > 0) {
    query = query.overlaps('tags', params.tags)
  }

  if (params.platformIds && params.platformIds.length > 0) {
    // Filter by platforms using inner join
    query = query.in('agent_platforms.platform_id', params.platformIds)
  }

  // Search with sanitization
  if (params.search) {
    // Sanitize search input by escaping special characters
    const sanitizedSearch = params.search
      .replace(/[%_\\]/g, '\\$&') // Escape SQL LIKE special chars
      .replace(/[^\w\s-]/g, '') // Remove non-alphanumeric except spaces and hyphens
      .trim()
      .substring(0, 100) // Limit length

    if (sanitizedSearch) {
      query = query.or(`name.ilike.%${sanitizedSearch}%,description.ilike.%${sanitizedSearch}%`)
    }
  }

  // Sorting
  switch (params.sortBy) {
    case 'recent':
      query = query.order('created_at', { ascending: false })
      break
    case 'popular':
      query = query.order('downloads_count', { ascending: false })
      break
    case 'rating':
      query = query.order('avg_rating', { ascending: false })
      break
    case 'favorites':
      query = query.order('favorites_count', { ascending: false })
      break
    default:
      query = query.order('created_at', { ascending: false })
  }

  // Pagination
  if (params.limit) {
    query = query.limit(params.limit)
  }
  if (params.offset) {
    query = query.range(params.offset, params.offset + (params.limit || 20) - 1)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching agents:', error)

    // Check if it's an auth error (JWT expired, invalid session, etc.)
    if (error.code === 'PGRST301' || error.message?.includes('JWT') || error.message?.includes('session')) {
      // Only auto-logout if we actually have a session that's invalid
      if (typeof window !== 'undefined') {
        const { data: sessionData } = await supabase.auth.getSession()
        if (sessionData.session) {
          await handleInvalidSession(supabase)
          return []
        }
      }
    }

    throw error
  }

  return (data || []) as AgentWithRelations[]
}

export async function getAgentBySlug(slug: string, userId?: string) {
  const supabase = getClient()

  const { data, error } = await supabase
    .from('agents')
    .select(`
      *,
      profile:profiles!agents_user_id_fkey(id, username, full_name, avatar_url, bio),
      category:categories(id, name, slug),
      agent_platforms(
        platform_id,
        platform_config,
        platform:platforms(id, name, slug, description, documentation_url)
      )
    `)
    .eq('slug', slug)
    .or('is_deleted.is.null,is_deleted.eq.false')
    .single()

  if (error) {
    console.error('Error fetching agent:', error)
    return null
  }

  let agent = data as AgentWithRelations

  // Check if user has favorited this agent
  if (userId) {
    const { data: favoriteData } = await supabase
      // @ts-expect-error - Supabase client RPC type inference issue
      .rpc('has_user_favorited', { p_agent_id: agent.id, p_user_id: userId })

    agent.user_favorited = favoriteData || false

    // Get user's rating
    const { data: ratingData } = await supabase
      // @ts-expect-error - Supabase client RPC type inference issue
      .rpc('get_user_rating', { p_agent_id: agent.id, p_user_id: userId })

    agent.user_rating = ratingData
  }

  return agent
}

export async function getAgentById(id: string, userId?: string) {
  const supabase = getClient()

  const { data, error } = await supabase
    .from('agents')
    .select(`
      *,
      profile:profiles!agents_user_id_fkey(id, username, full_name, avatar_url),
      category:categories(id, name, slug),
      agent_platforms(
        platform_id,
        platform:platforms(id, name, slug)
      )
    `)
    .eq('id', id)
    .or('is_deleted.is.null,is_deleted.eq.false')
    .single()

  if (error) {
    console.error('Error fetching agent:', error)
    return null
  }

  let agent = data as AgentWithRelations

  if (userId) {
    const { data: favoriteData } = await supabase
      // @ts-expect-error - Supabase client RPC type inference issue
      .rpc('has_user_favorited', { p_agent_id: agent.id, p_user_id: userId })

    agent.user_favorited = favoriteData || false

    const { data: ratingData } = await supabase
      // @ts-expect-error - Supabase client RPC type inference issue
      .rpc('get_user_rating', { p_agent_id: agent.id, p_user_id: userId })

    agent.user_rating = ratingData
  }

  return agent
}

// ============================================
// CATEGORY & PLATFORM QUERIES
// ============================================

export async function getCategories(limit: number = 100): Promise<Category[]> {
  const supabase = getClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('order_index', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('Error fetching categories:', error)

    // If table doesn't exist, return empty array
    if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
      return []
    }

    throw error
  }

  return data as Category[]
}

export async function getPlatforms(limit: number = 100): Promise<Platform[]> {
  const supabase = getClient()

  const { data, error } = await supabase
    .from('platforms')
    .select('*')
    .order('name', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('Error fetching platforms:', error)

    // Check if it's an auth error (JWT expired, invalid session, etc.)
    if (error.code === 'PGRST301' || error.message?.includes('JWT') || error.message?.includes('session')) {
      // Only auto-logout if we actually have a session that's invalid
      if (typeof window !== 'undefined') {
        const { data: sessionData } = await supabase.auth.getSession()
        if (sessionData.session) {
          await handleInvalidSession(supabase)
          return []
        }
      }
    }

    // If table doesn't exist, return empty array
    if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
      return []
    }

    throw error
  }

  return (data || []) as Platform[]
}

export async function getPlatformCounts(): Promise<Record<string, number>> {
  const supabase = getClient()

  const { data, error } = await supabase
    .from('agent_platforms')
    .select('platform_id')

  if (error) {
    console.error('❌ Error fetching platform counts:', error)
    return {}
  }

  // Count occurrences of each platform_id
  const counts: Record<string, number> = {}
  data?.forEach((item: any) => {
    counts[item.platform_id] = (counts[item.platform_id] || 0) + 1
  })

  return counts
}

// ============================================
// PROFILE QUERIES
// ============================================

export async function getUserProfile(username: string) {
  const supabase = getClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data as Profile
}

export async function getUserProfileById(userId: string) {
  const supabase = getClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data as Profile
}

export async function getUserAgents(userId: string, limit = 20) {
  return getAgents({ userId, limit, isPublic: undefined })
}

// ============================================
// RATING QUERIES
// ============================================

export async function getAgentRatings(agentId: string, limit = 10, offset = 0) {
  const supabase = getClient()

  const { data, error } = await supabase
    .from('ratings')
    .select(`
      id,
      agent_id,
      user_id,
      score,
      review,
      created_at,
      updated_at,
      profile:profiles!ratings_user_id_fkey(id, username, full_name, avatar_url)
    `)
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching ratings:', error)
    throw error
  }

  return data as RatingWithProfile[]
}

export async function getUserRating(agentId: string, userId: string) {
  const supabase = getClient()

  const { data, error } = await supabase
    .from('ratings')
    .select('*')
    .eq('agent_id', agentId)
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') { // Not found error is ok
    console.error('Error fetching user rating:', error)
  }

  return data as Rating | null
}

// ============================================
// COMMENT QUERIES
// ============================================

export async function getAgentComments(agentId: string) {
  const supabase = getClient()

  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      profile:profiles(id, username, full_name, avatar_url)
    `)
    .eq('agent_id', agentId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching comments:', error)
    throw error
  }

  // Organize into threaded structure
  const comments = data as CommentWithProfile[]
  const commentMap = new Map<string, CommentWithProfile>()
  const rootComments: CommentWithProfile[] = []

  // First pass: create map
  comments.forEach(comment => {
    commentMap.set(comment.id, { ...comment, replies: [] })
  })

  // Second pass: build tree
  comments.forEach(comment => {
    const commentWithReplies = commentMap.get(comment.id)!
    if (comment.parent_id) {
      const parent = commentMap.get(comment.parent_id)
      if (parent) {
        if (!parent.replies) parent.replies = []
        parent.replies.push(commentWithReplies)
      }
    } else {
      rootComments.push(commentWithReplies)
    }
  })

  return rootComments
}

// ============================================
// FAVORITE QUERIES
// ============================================

export async function getUserFavorites(userId: string, limit = 20, offset = 0) {
  const supabase = getClient()

  const { data, error } = await supabase
    .from('favorites')
    .select(`
      created_at,
      agent:agents(
        *,
        profile:profiles!agents_user_id_fkey(id, username, full_name, avatar_url),
        category:categories(id, name, slug),
        agent_platforms(
          platform_id,
          platform:platforms(id, name, slug)
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching favorites:', error)
    throw error
  }

  // Filter out soft-deleted agents (agent can be null if deleted)
  return data
    .filter((fav: any) => fav.agent && (fav.agent.is_deleted === null || fav.agent.is_deleted === false))
    .map((fav: any) => ({
      ...fav.agent,
      user_favorited: true
    })) as AgentWithRelations[]
}

export async function checkUserFavorited(agentId: string, userId: string) {
  const supabase = getClient()

  const { data, error } = await supabase
    // @ts-expect-error - Supabase client RPC type inference issue
    .rpc('has_user_favorited', { p_agent_id: agentId, p_user_id: userId })

  if (error) {
    console.error('Error checking favorite:', error)
    return false
  }

  return data as boolean
}

// ============================================
// STATS QUERIES
// ============================================

export async function getAgentStats(agentId: string) {
  const supabase = getClient()

  const { data, error } = await supabase
    .from('agents')
    .select('favorites_count, downloads_count, views_count, avg_rating, total_ratings')
    .eq('id', agentId)
    .single()

  if (error) {
    console.error('Error fetching agent stats:', error)
    return null
  }

  return data
}

// ============================================
// COLLECTION QUERIES
// ============================================

export async function getUserCollections(userId: string) {
  const supabase = getClient()

  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching collections:', error)
    throw error
  }

  return data
}

export async function getCollectionAgents(collectionId: string) {
  const supabase = getClient()

  const { data, error } = await supabase
    .from('collection_agents')
    .select(`
      *,
      agent:agents(
        *,
        profile:profiles!agents_user_id_fkey(id, username, full_name, avatar_url),
        category:categories(id, name, slug),
        agent_platforms(
          platform_id,
          platform:platforms(id, name, slug)
        )
      )
    `)
    .eq('collection_id', collectionId)
    .order('added_at', { ascending: false })

  if (error) {
    console.error('Error fetching collection agents:', error)
    throw error
  }

  // Filter out soft-deleted agents (agent can be null if deleted)
  return data
    .filter((item: any) => item.agent && (item.agent.is_deleted === null || item.agent.is_deleted === false))
    .map((item: any) => item.agent) as AgentWithRelations[]
}
