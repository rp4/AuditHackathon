import { createClient } from './client'
import type {
  AgentInsert,
  AgentUpdate,
  RatingInsert,
  RatingUpdate,
  CommentInsert,
  CommentUpdate,
  DownloadInsert,
  ProfileUpdate,
  Agent as AgentRow,
  AgentPlatformInsert,
} from '@/types/database-generated'

// ============================================
// AGENT MUTATIONS
// ============================================

export async function createAgent(agent: AgentInsert, platformIds: string[]): Promise<AgentRow> {
  const supabase = createClient()

  console.log('📝 Creating agent with data:', JSON.stringify(agent, null, 2))
  console.log('🔗 Platform IDs:', platformIds)

  // Insert agent
  const { data: agentData, error: agentError } = await supabase
    .from('agents')
    // @ts-expect-error - Supabase client type inference issue with Insert types
    .insert(agent)
    .select()
    .single<AgentRow>()

  if (agentError || !agentData) {
    console.error('❌ Error creating agent:', agentError)
    console.error('❌ Full error details:', JSON.stringify(agentError, null, 2))
    throw agentError || new Error('Failed to create agent')
  }

  console.log('✅ Agent created successfully:', agentData.id)

  // Insert agent platforms
  if (platformIds.length > 0) {
    const agentPlatforms: AgentPlatformInsert[] = platformIds.map(platformId => ({
      agent_id: agentData.id,
      platform_id: platformId,
    }))

    const { error: platformError } = await supabase
      .from('agent_platforms')
      // @ts-expect-error - Supabase client type inference issue
      .insert(agentPlatforms)

    if (platformError) {
      console.error('Error creating agent platforms:', platformError)
      // Rollback agent creation - log but don't fail if rollback fails
      try {
        await supabase.from('agents').delete().eq('id', agentData.id)
      } catch (rollbackError) {
        console.error('Failed to rollback agent creation:', rollbackError)
      }
      throw platformError
    }
  }

  return agentData
}

export async function updateAgent(agentId: string, updates: AgentUpdate, platformIds?: string[]): Promise<AgentRow> {
  const supabase = createClient()

  // Update agent
  const { data: agentData, error: agentError } = await supabase
    .from('agents')
    // @ts-expect-error - Supabase client type inference issue with Update types
    .update(updates)
    .eq('id', agentId)
    .select()
    .single<AgentRow>()

  if (agentError || !agentData) {
    console.error('Error updating agent:', agentError)
    throw agentError || new Error('Failed to update agent')
  }

  // Update platforms if provided
  if (platformIds) {
    // Delete existing platforms
    await supabase
      .from('agent_platforms')
      .delete()
      .eq('agent_id', agentId)

    // Insert new platforms
    if (platformIds.length > 0) {
      const agentPlatforms = platformIds.map(platformId => ({
        agent_id: agentId,
        platform_id: platformId,
      }))

      const { error: platformError } = await supabase
        .from('agent_platforms')
        // @ts-expect-error - Supabase client type inference issue
        .insert(agentPlatforms)

      if (platformError) {
        console.error('Error updating agent platforms:', platformError)
        throw platformError
      }
    }
  }

  return agentData
}

export async function deleteAgent(agentId: string) {
  const supabase = createClient()

  console.log('🔧 Deleting agent with ID:', agentId)

  // Soft delete: set is_deleted to true and record deletion time
  const { data, error } = await supabase
    .from('agents')
    // @ts-expect-error - Supabase client type inference issue
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString()
    })
    .eq('id', agentId)
    .select()

  if (error) {
    console.error('❌ Error deleting agent:', error)
    throw error
  }

  console.log('✅ Agent soft-deleted:', data)
  return true
}

// ============================================
// FAVORITE MUTATIONS
// ============================================

export async function toggleFavorite(agentId: string, userId: string) {
  const supabase = createClient()

  // Check if already favorited
  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('agent_id', agentId)
    .eq('user_id', userId)
    .single<{ id: string }>()

  if (existing) {
    // Remove favorite
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', existing.id)

    if (error) {
      console.error('Error removing favorite:', error)
      throw error
    }

    return { favorited: false }
  } else {
    // Add favorite
    const { error } = await supabase
      .from('favorites')
      // @ts-expect-error - Supabase client type inference issue
      .insert({ agent_id: agentId, user_id: userId })

    if (error) {
      console.error('Error adding favorite:', error)
      throw error
    }

    return { favorited: true }
  }
}

export async function addFavorite(agentId: string, userId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('favorites')
    // @ts-expect-error - Supabase client type inference issue
    .insert({ agent_id: agentId, user_id: userId })

  if (error) {
    console.error('Error adding favorite:', error)
    throw error
  }

  return true
}

export async function removeFavorite(agentId: string, userId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('agent_id', agentId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error removing favorite:', error)
    throw error
  }

  return true
}

// ============================================
// RATING MUTATIONS
// ============================================

export async function createOrUpdateRating(rating: RatingInsert) {
  const supabase = createClient()

  // Try to update existing rating first
  const { data: existing } = await supabase
    .from('ratings')
    .select('id')
    .eq('agent_id', rating.agent_id)
    .eq('user_id', rating.user_id)
    .single<{ id: string }>()

  if (existing) {
    // Update existing rating
    const { data, error } = await supabase
      .from('ratings')
      // @ts-expect-error - Supabase client type inference issue
      .update({
        score: rating.score,
        review: rating.review,
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating rating:', error)
      throw error
    }

    return data
  } else {
    // Create new rating
    const { data, error } = await supabase
      .from('ratings')
      // @ts-expect-error - Supabase client type inference issue
      .insert(rating)
      .select()
      .single()

    if (error) {
      console.error('Error creating rating:', error)
      throw error
    }

    return data
  }
}

export async function deleteRating(ratingId: string, userId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('ratings')
    .delete()
    .eq('id', ratingId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting rating:', error)
    throw error
  }

  return true
}

// ============================================
// COMMENT MUTATIONS
// ============================================

export async function createComment(comment: CommentInsert) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('comments')
    // @ts-expect-error - Supabase client type inference issue
    .insert(comment)
    .select(`
      *,
      profile:profiles(id, username, full_name, avatar_url)
    `)
    .single()

  if (error) {
    console.error('Error creating comment:', error)
    throw error
  }

  return data
}

export async function updateComment(commentId: string, content: string, userId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('comments')
    // @ts-expect-error - Supabase client type inference issue
    .update({
      content,
      is_edited: true,
    })
    .eq('id', commentId)
    .eq('user_id', userId)
    .select(`
      *,
      profile:profiles(id, username, full_name, avatar_url)
    `)
    .single()

  if (error) {
    console.error('Error updating comment:', error)
    throw error
  }

  return data
}

export async function deleteComment(commentId: string, userId: string) {
  const supabase = createClient()

  // Soft delete - just mark as deleted
  const { error } = await supabase
    .from('comments')
    // @ts-expect-error - Supabase client type inference issue
    .update({ is_deleted: true })
    .eq('id', commentId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting comment:', error)
    throw error
  }

  return true
}

// ============================================
// DOWNLOAD TRACKING
// ============================================

export async function trackDownload(download: DownloadInsert) {
  const supabase = createClient()

  const { error } = await supabase
    .from('downloads')
    // @ts-expect-error - Supabase client type inference issue
    .insert(download)

  if (error) {
    console.error('Error tracking download:', error)
    // Don't throw - download tracking shouldn't block the download
  }

  return true
}

// ============================================
// VIEW TRACKING
// ============================================

export async function incrementViews(agentId: string) {
  const supabase = createClient()

  const { error } = await supabase
    // @ts-expect-error - Supabase client RPC type inference issue
    .rpc('increment_agent_views', { p_agent_id: agentId })

  if (error) {
    console.error('Error incrementing views:', error)
    // Don't throw - view tracking shouldn't block the page
  }

  return true
}

// ============================================
// PROFILE MUTATIONS
// ============================================

export async function updateProfile(userId: string, updates: ProfileUpdate) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('profiles')
    // @ts-expect-error - Supabase client type inference issue
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating profile:', error)
    throw error
  }

  return data
}

// ============================================
// COLLECTION MUTATIONS
// ============================================

export async function createCollection(
  userId: string,
  name: string,
  description?: string,
  isPublic = true
) {
  const supabase = createClient()

  // Generate slug from name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const { data, error } = await supabase
    .from('collections')
    // @ts-expect-error - Supabase client type inference issue
    .insert({
      user_id: userId,
      name,
      description,
      slug,
      is_public: isPublic,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating collection:', error)
    throw error
  }

  return data
}

export async function addAgentToCollection(collectionId: string, agentId: string, notes?: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('collection_agents')
    // @ts-expect-error - Supabase client type inference issue
    .insert({
      collection_id: collectionId,
      agent_id: agentId,
      notes,
    })

  if (error) {
    console.error('Error adding agent to collection:', error)
    throw error
  }

  return true
}

export async function removeAgentFromCollection(collectionId: string, agentId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('collection_agents')
    .delete()
    .eq('collection_id', collectionId)
    .eq('agent_id', agentId)

  if (error) {
    console.error('Error removing agent from collection:', error)
    throw error
  }

  return true
}

export async function deleteCollection(collectionId: string, userId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', collectionId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting collection:', error)
    throw error
  }

  return true
}

// ============================================
// REPORT MUTATIONS
// ============================================

export async function createReport(agentId: string, userId: string, reason?: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('reports')
    // @ts-expect-error - Supabase client type inference issue
    .insert({
      agent_id: agentId,
      user_id: userId,
      reason,
    })

  if (error) {
    console.error('Error creating report:', error)
    throw error
  }

  return true
}

export async function removeReport(agentId: string, userId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('reports')
    .delete()
    .eq('agent_id', agentId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error removing report:', error)
    throw error
  }

  return true
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate a unique slug from a name
 */
export async function generateUniqueSlug(
  name: string,
  table: 'agents' | 'collections' = 'agents',
  maxAttempts: number = 20
): Promise<string> {
  const supabase = createClient()

  // Generate base slug with length limit
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50) // Limit slug length

  // Handle empty slug
  if (!baseSlug) {
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    return `item-${randomSuffix}`
  }

  let slug = baseSlug
  let attempts = 0

  // Try sequential numbers first (more readable)
  while (attempts < maxAttempts) {
    const { data } = await supabase
      .from(table)
      .select('id')
      .eq('slug', slug)
      .maybeSingle() // Use maybeSingle instead of single to avoid errors

    if (!data) {
      // Slug is available
      return slug
    }

    attempts++

    if (attempts < maxAttempts) {
      // Try with sequential number
      slug = `${baseSlug}-${attempts}`
    }
  }

  // If we've exhausted attempts, add random suffix as fallback
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  const fallbackSlug = `${baseSlug}-${randomSuffix}`

  // Verify fallback slug is unique (one final check)
  const { data: fallbackCheck } = await supabase
    .from(table)
    .select('id')
    .eq('slug', fallbackSlug)
    .maybeSingle()

  if (!fallbackCheck) {
    return fallbackSlug
  }

  // Ultimate fallback: use UUID
  const uuid = crypto.randomUUID().split('-')[0]
  return `${baseSlug.substring(0, 40)}-${uuid}`
}
