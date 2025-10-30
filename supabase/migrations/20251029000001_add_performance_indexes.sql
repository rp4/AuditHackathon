-- Add performance indexes for common query patterns

-- ============================================
-- AGENTS TABLE INDEXES
-- ============================================

-- Speed up user's agent queries
CREATE INDEX IF NOT EXISTS idx_agents_user_id
  ON agents(user_id)
  WHERE is_deleted = false OR is_deleted IS NULL;

-- Speed up public agent browsing with composite index (most common query)
CREATE INDEX IF NOT EXISTS idx_agents_public_created
  ON agents(is_public, created_at DESC)
  WHERE is_deleted = false OR is_deleted IS NULL;

-- Speed up category filtering
CREATE INDEX IF NOT EXISTS idx_agents_category
  ON agents(category_id)
  WHERE is_public = true AND (is_deleted = false OR is_deleted IS NULL);

-- Speed up platform filtering
CREATE INDEX IF NOT EXISTS idx_agents_platform
  ON agents USING GIN(platforms);

-- Speed up tag searches using GIN index
CREATE INDEX IF NOT EXISTS idx_agents_tags
  ON agents USING GIN(tags);

-- Speed up slug lookups (if not already unique indexed)
CREATE INDEX IF NOT EXISTS idx_agents_slug
  ON agents(slug)
  WHERE is_deleted = false OR is_deleted IS NULL;

-- Full-text search index for agent names and descriptions
CREATE INDEX IF NOT EXISTS idx_agents_search_name
  ON agents USING GIN(to_tsvector('english', name));

CREATE INDEX IF NOT EXISTS idx_agents_search_description
  ON agents USING GIN(to_tsvector('english', description));

-- Combined full-text search
CREATE INDEX IF NOT EXISTS idx_agents_search_combined
  ON agents USING GIN(
    to_tsvector('english', name || ' ' || COALESCE(description, ''))
  )
  WHERE is_public = true AND (is_deleted = false OR is_deleted IS NULL);

-- Speed up sorting by popularity metrics
CREATE INDEX IF NOT EXISTS idx_agents_views_count
  ON agents(views_count DESC)
  WHERE is_public = true AND (is_deleted = false OR is_deleted IS NULL);

CREATE INDEX IF NOT EXISTS idx_agents_downloads_count
  ON agents(downloads_count DESC)
  WHERE is_public = true AND (is_deleted = false OR is_deleted IS NULL);

-- ============================================
-- FAVORITES TABLE INDEXES
-- ============================================

-- Speed up user favorites lookup (most common query)
CREATE INDEX IF NOT EXISTS idx_favorites_user_id
  ON favorites(user_id, created_at DESC);

-- Speed up agent favorites lookup
CREATE INDEX IF NOT EXISTS idx_favorites_agent_id
  ON favorites(agent_id);

-- Composite index for checking if user favorited an agent
CREATE INDEX IF NOT EXISTS idx_favorites_user_agent
  ON favorites(user_id, agent_id);

-- ============================================
-- RATINGS TABLE INDEXES
-- ============================================

-- Speed up rating aggregations by agent
CREATE INDEX IF NOT EXISTS idx_ratings_agent_id
  ON ratings(agent_id, rating);

-- Speed up user's ratings lookup
CREATE INDEX IF NOT EXISTS idx_ratings_user_id
  ON ratings(user_id);

-- Composite index for checking if user rated an agent
CREATE INDEX IF NOT EXISTS idx_ratings_user_agent
  ON ratings(user_id, agent_id);

-- ============================================
-- COMMENTS TABLE INDEXES
-- ============================================

-- Speed up comment threads
CREATE INDEX IF NOT EXISTS idx_comments_agent_created
  ON comments(agent_id, created_at DESC)
  WHERE is_deleted = false OR is_deleted IS NULL;

-- Speed up user's comments
CREATE INDEX IF NOT EXISTS idx_comments_user_id
  ON comments(user_id)
  WHERE is_deleted = false OR is_deleted IS NULL;

-- Speed up parent comment lookups (for threaded comments)
CREATE INDEX IF NOT EXISTS idx_comments_parent_id
  ON comments(parent_id)
  WHERE parent_id IS NOT NULL AND (is_deleted = false OR is_deleted IS NULL);

-- ============================================
-- PROFILES TABLE INDEXES
-- ============================================

-- Speed up username lookups (for mentions, searches)
CREATE INDEX IF NOT EXISTS idx_profiles_username
  ON profiles(username)
  WHERE username IS NOT NULL;

-- Speed up display name searches
CREATE INDEX IF NOT EXISTS idx_profiles_display_name
  ON profiles USING GIN(to_tsvector('english', display_name))
  WHERE display_name IS NOT NULL;

-- ============================================
-- DOWNLOADS TABLE INDEXES
-- ============================================

-- Speed up user downloads lookup
CREATE INDEX IF NOT EXISTS idx_downloads_user_id
  ON downloads(user_id, created_at DESC);

-- Speed up agent downloads lookup
CREATE INDEX IF NOT EXISTS idx_downloads_agent_id
  ON downloads(agent_id);

-- ============================================
-- COLLECTIONS TABLE INDEXES
-- ============================================

-- Speed up user collections lookup
CREATE INDEX IF NOT EXISTS idx_collections_user_id
  ON collections(user_id, created_at DESC)
  WHERE is_deleted = false OR is_deleted IS NULL;

-- Speed up public collections browsing
CREATE INDEX IF NOT EXISTS idx_collections_public
  ON collections(is_public, created_at DESC)
  WHERE is_public = true AND (is_deleted = false OR is_deleted IS NULL);

-- ============================================
-- COLLECTION_AGENTS TABLE INDEXES
-- ============================================

-- Speed up collection agents lookup
CREATE INDEX IF NOT EXISTS idx_collection_agents_collection
  ON collection_agents(collection_id, added_at DESC);

-- Speed up agent collections lookup
CREATE INDEX IF NOT EXISTS idx_collection_agents_agent
  ON collection_agents(agent_id);

-- ============================================
-- CATEGORIES TABLE INDEXES
-- ============================================

-- Speed up category slug lookups
CREATE INDEX IF NOT EXISTS idx_categories_slug
  ON categories(slug);

-- ============================================
-- PLATFORMS TABLE INDEXES
-- ============================================

-- Speed up platform slug lookups
CREATE INDEX IF NOT EXISTS idx_platforms_slug
  ON platforms(slug);

-- ============================================
-- ANALYZE TABLES
-- ============================================

-- Update statistics for query planner
ANALYZE agents;
ANALYZE favorites;
ANALYZE ratings;
ANALYZE comments;
ANALYZE profiles;
ANALYZE downloads;
ANALYZE collections;
ANALYZE collection_agents;
ANALYZE categories;
ANALYZE platforms;
