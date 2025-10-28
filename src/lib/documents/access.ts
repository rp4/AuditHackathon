/**
 * Access Control for Premium Agent Documentation
 */

import { createClient } from '@/lib/supabase/client'

/**
 * Check if a user can access the full documentation for an agent
 * @param agentId - The agent ID
 * @param userId - The user ID (null for anonymous)
 * @param agent - The agent object (optional, to avoid extra query)
 * @returns True if user can access full documentation
 */
export async function canAccessFullDocumentation(
  agentId: string,
  userId: string | null,
  agent?: { is_premium: boolean; user_id: string }
): Promise<boolean> {
  const supabase = createClient()

  // If agent object not provided, fetch it
  if (!agent) {
    const { data } = await supabase
      .from('agents')
      .select('is_premium, user_id')
      .eq('id', agentId)
      .single()

    if (!data) return false
    agent = data
  }

  // Free agents: everyone can access
  if (!agent.is_premium) {
    return true
  }

  // No user: cannot access premium
  if (!userId) {
    return false
  }

  // Owner: always can access
  if (agent.user_id === userId) {
    return true
  }

  // Check if user has purchased
  const { data: purchase } = await supabase
    .from('agent_purchases')
    .select('id')
    .eq('agent_id', agentId)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .single()

  return !!purchase
}

/**
 * Check if a user has purchased an agent
 * @param agentId - The agent ID
 * @param userId - The user ID
 * @returns True if user has purchased the agent
 */
export async function hasPurchased(
  agentId: string,
  userId: string
): Promise<boolean> {
  const supabase = createClient()

  const { data } = await supabase
    .from('agent_purchases')
    .select('id')
    .eq('agent_id', agentId)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .single()

  return !!data
}
