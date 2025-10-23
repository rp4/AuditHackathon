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
  const supabase = createClient()

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

  // Search
  if (params.search) {
    query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`)
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
    throw error
  }

  return data as AgentWithRelations[]
}

export async function getAgentBySlug(slug: string, userId?: string) {
  const supabase = createClient()

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
  const supabase = createClient()

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
  const supabase = createClient()

  console.log('📦 getCategories: Starting fetch...')

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('order_index', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('❌ Error fetching categories:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    })

    // If table doesn't exist, return empty array with warning
    if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
      console.warn('⚠️ Categories table does not exist. Returning empty array.')
      return []
    }

    throw error
  }

  console.log('✅ getCategories: Fetched', data?.length || 0, 'categories')
  return data as Category[]
}

export async function getPlatforms(limit: number = 100): Promise<Platform[]> {
  const supabase = createClient()

  console.log('📦 getPlatforms: Starting fetch...')

  const { data, error } = await supabase
    .from('platforms')
    .select('*')
    .order('name', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('❌ Error fetching platforms:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    })

    // If table doesn't exist, return empty array with warning
    if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
      console.warn('⚠️ Platforms table does not exist. Returning empty array.')
      return []
    }

    throw error
  }

  console.log('✅ getPlatforms: Fetched', data?.length || 0, 'platforms')
  return data as Platform[]
}

// ============================================
// PROFILE QUERIES
// ============================================

export async function getUserProfile(username: string) {
  const supabase = createClient()

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
  const supabase = createClient()

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
  const supabase = createClient()

  const { data, error } = await supabase
    .from('ratings')
    .select(`
      *,
      profile:profiles(id, username, full_name, avatar_url)
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
  const supabase = createClient()

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
  const supabase = createClient()

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
  const supabase = createClient()

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

  return data.map((fav: any) => ({
    ...fav.agent,
    user_favorited: true
  })) as AgentWithRelations[]
}

export async function checkUserFavorited(agentId: string, userId: string) {
  const supabase = createClient()

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
  const supabase = createClient()

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
  const supabase = createClient()

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
  const supabase = createClient()

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

  return data.map((item: any) => item.agent) as AgentWithRelations[]
}
