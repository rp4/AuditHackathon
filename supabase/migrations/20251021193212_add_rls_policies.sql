-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_versions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================
-- Anyone can view profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (handled by trigger, but just in case)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- CATEGORIES POLICIES
-- ============================================
-- Anyone can view categories
CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT
  USING (true);

-- ============================================
-- PLATFORMS POLICIES
-- ============================================
-- Anyone can view platforms
CREATE POLICY "Platforms are viewable by everyone"
  ON platforms FOR SELECT
  USING (true);

-- ============================================
-- AGENTS POLICIES
-- ============================================
-- Anyone can view public agents, users can view their own private agents
CREATE POLICY "Public agents are viewable by everyone"
  ON agents FOR SELECT
  USING (is_public = true OR user_id = auth.uid());

-- Authenticated users can create agents
CREATE POLICY "Authenticated users can create agents"
  ON agents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own agents
CREATE POLICY "Users can update own agents"
  ON agents FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own agents
CREATE POLICY "Users can delete own agents"
  ON agents FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- AGENT_PLATFORMS POLICIES
-- ============================================
-- View policies follow agent visibility
CREATE POLICY "Agent platforms visibility follows agent"
  ON agent_platforms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_platforms.agent_id
      AND (agents.is_public = true OR agents.user_id = auth.uid())
    )
  );

-- Insert/Update/Delete follows agent ownership
CREATE POLICY "Users can manage platforms for own agents"
  ON agent_platforms FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_platforms.agent_id
      AND agents.user_id = auth.uid()
    )
  );

-- ============================================
-- UPVOTES POLICIES
-- ============================================
-- Anyone can view upvotes
CREATE POLICY "Upvotes are viewable by everyone"
  ON upvotes FOR SELECT
  USING (true);

-- Authenticated users can create upvotes
CREATE POLICY "Authenticated users can create upvotes"
  ON upvotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own upvotes
CREATE POLICY "Users can delete own upvotes"
  ON upvotes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- RATINGS POLICIES
-- ============================================
-- Anyone can view ratings
CREATE POLICY "Ratings are viewable by everyone"
  ON ratings FOR SELECT
  USING (true);

-- Authenticated users can create ratings
CREATE POLICY "Authenticated users can create ratings"
  ON ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own ratings
CREATE POLICY "Users can update own ratings"
  ON ratings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own ratings
CREATE POLICY "Users can delete own ratings"
  ON ratings FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- DOWNLOADS POLICIES
-- ============================================
-- Only allow inserts (tracking downloads)
CREATE POLICY "Anyone can track downloads"
  ON downloads FOR INSERT
  WITH CHECK (true);

-- Users can view their own download history
CREATE POLICY "Users can view own downloads"
  ON downloads FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- ============================================
-- COMMENTS POLICIES
-- ============================================
-- Anyone can view non-deleted comments
CREATE POLICY "Non-deleted comments are viewable by everyone"
  ON comments FOR SELECT
  USING (is_deleted = false);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_deleted = false);

-- Users can update their own comments (for edits)
CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can soft-delete their own comments
CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- COLLECTIONS POLICIES
-- ============================================
-- Public collections are viewable by everyone, private by owner only
CREATE POLICY "Collections visibility based on privacy"
  ON collections FOR SELECT
  USING (is_public = true OR user_id = auth.uid());

-- Authenticated users can create collections
CREATE POLICY "Authenticated users can create collections"
  ON collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own collections
CREATE POLICY "Users can update own collections"
  ON collections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own collections
CREATE POLICY "Users can delete own collections"
  ON collections FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- COLLECTION_AGENTS POLICIES
-- ============================================
-- Visibility follows collection visibility
CREATE POLICY "Collection agents visibility follows collection"
  ON collection_agents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_agents.collection_id
      AND (collections.is_public = true OR collections.user_id = auth.uid())
    )
  );

-- Users can manage agents in their own collections
CREATE POLICY "Users can manage agents in own collections"
  ON collection_agents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_agents.collection_id
      AND collections.user_id = auth.uid()
    )
  );

-- ============================================
-- FOLLOWS POLICIES
-- ============================================
-- Anyone can view follows
CREATE POLICY "Follows are viewable by everyone"
  ON follows FOR SELECT
  USING (true);

-- Authenticated users can follow others
CREATE POLICY "Authenticated users can follow"
  ON follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

-- Users can unfollow (delete their own follows)
CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE
  USING (auth.uid() = follower_id);

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================
-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- System can create notifications (via service role)
-- Users cannot directly create notifications
CREATE POLICY "Only system can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (false);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- AGENT_VERSIONS POLICIES
-- ============================================
-- Visibility follows agent visibility
CREATE POLICY "Agent versions visibility follows agent"
  ON agent_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_versions.agent_id
      AND (agents.is_public = true OR agents.user_id = auth.uid())
    )
  );

-- Only agent owners can create versions
CREATE POLICY "Agent owners can create versions"
  ON agent_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_versions.agent_id
      AND agents.user_id = auth.uid()
    )
  );

-- Create function to increment view count (called from client)
CREATE OR REPLACE FUNCTION increment_agent_views(agent_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE agents
  SET views_count = views_count + 1
  WHERE id = agent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user has upvoted an agent
CREATE OR REPLACE FUNCTION has_user_upvoted(p_agent_id UUID, p_user_id UUID)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM upvotes
    WHERE agent_id = p_agent_id AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's rating for an agent
CREATE OR REPLACE FUNCTION get_user_rating(p_agent_id UUID, p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  rating_score INTEGER;
BEGIN
  SELECT score INTO rating_score
  FROM ratings
  WHERE agent_id = p_agent_id AND user_id = p_user_id;

  RETURN rating_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;