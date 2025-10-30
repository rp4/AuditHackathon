-- Fix soft delete implementation in RLS policies
-- Ensure all policies properly filter out deleted items

-- ============================================
-- AGENTS TABLE - FIX SOFT DELETE POLICIES
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Public agents are viewable by everyone" ON agents;
DROP POLICY IF EXISTS "Users can view own agents" ON agents;
DROP POLICY IF EXISTS "Users can update own agents" ON agents;
DROP POLICY IF EXISTS "Users can delete own agents" ON agents;

-- Recreate policies with soft delete filtering

-- SELECT: Public agents viewable by everyone (excluding deleted)
CREATE POLICY "Public agents are viewable by everyone"
  ON agents FOR SELECT
  USING (
    (is_public = true OR user_id = auth.uid())
    AND (is_deleted = false OR is_deleted IS NULL)
  );

-- INSERT: Authenticated users can create agents
CREATE POLICY "Users can create agents"
  ON agents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update own agents (only non-deleted)
CREATE POLICY "Users can update own agents"
  ON agents FOR UPDATE
  USING (
    auth.uid() = user_id
    AND (is_deleted = false OR is_deleted IS NULL)
  )
  WITH CHECK (
    auth.uid() = user_id
    AND (is_deleted = false OR is_deleted IS NULL)
  );

-- DELETE: Users can soft-delete own agents
CREATE POLICY "Users can delete own agents"
  ON agents FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- COMMENTS TABLE - FIX SOFT DELETE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
DROP POLICY IF EXISTS "Users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

-- SELECT: Comments viewable if not deleted
CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT
  USING (is_deleted = false OR is_deleted IS NULL);

-- INSERT: Authenticated users can create comments
CREATE POLICY "Users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update own non-deleted comments
CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (
    auth.uid() = user_id
    AND (is_deleted = false OR is_deleted IS NULL)
  )
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can soft-delete own comments
CREATE POLICY "Users can delete own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- COLLECTIONS TABLE - FIX SOFT DELETE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Public collections are viewable" ON collections;
DROP POLICY IF EXISTS "Users can view own collections" ON collections;
DROP POLICY IF EXISTS "Users can update own collections" ON collections;

-- SELECT: Public or own collections (excluding deleted)
CREATE POLICY "Collections are viewable"
  ON collections FOR SELECT
  USING (
    (is_public = true OR user_id = auth.uid())
    AND (is_deleted = false OR is_deleted IS NULL)
  );

-- INSERT: Authenticated users can create collections
CREATE POLICY "Users can create collections"
  ON collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update own non-deleted collections
CREATE POLICY "Users can update own collections"
  ON collections FOR UPDATE
  USING (
    auth.uid() = user_id
    AND (is_deleted = false OR is_deleted IS NULL)
  )
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can soft-delete own collections
CREATE POLICY "Users can delete own collections"
  ON collections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- CREATE VIEWS FOR ACTIVE ITEMS
-- ============================================

-- View for active agents (excluding deleted)
CREATE OR REPLACE VIEW active_agents AS
SELECT *
FROM agents
WHERE is_deleted = false OR is_deleted IS NULL;

-- View for active public agents
CREATE OR REPLACE VIEW public_agents AS
SELECT *
FROM agents
WHERE
  is_public = true
  AND (is_deleted = false OR is_deleted IS NULL);

-- View for active comments
CREATE OR REPLACE VIEW active_comments AS
SELECT *
FROM comments
WHERE is_deleted = false OR is_deleted IS NULL;

-- View for active collections
CREATE OR REPLACE VIEW active_collections AS
SELECT *
FROM collections
WHERE is_deleted = false OR is_deleted IS NULL;

-- Grant permissions on views
GRANT SELECT ON active_agents TO authenticated, anon;
GRANT SELECT ON public_agents TO authenticated, anon;
GRANT SELECT ON active_comments TO authenticated, anon;
GRANT SELECT ON active_collections TO authenticated, anon;

-- ============================================
-- SCHEDULED CLEANUP FUNCTION
-- ============================================

-- Function to permanently delete soft-deleted items after 30 days
CREATE OR REPLACE FUNCTION cleanup_deleted_items()
RETURNS void AS $$
BEGIN
  -- Delete agents soft-deleted more than 30 days ago
  DELETE FROM agents
  WHERE is_deleted = true
    AND deleted_at < NOW() - INTERVAL '30 days';

  -- Delete comments soft-deleted more than 30 days ago
  DELETE FROM comments
  WHERE is_deleted = true
    AND deleted_at < NOW() - INTERVAL '30 days';

  -- Delete collections soft-deleted more than 30 days ago
  DELETE FROM collections
  WHERE is_deleted = true
    AND deleted_at < NOW() - INTERVAL '30 days';

  -- Log cleanup
  RAISE NOTICE 'Cleanup completed at %', NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION cleanup_deleted_items IS 'Permanently delete soft-deleted items older than 30 days';

-- Note: Schedule this function to run periodically
-- Example with pg_cron (if available):
-- SELECT cron.schedule('cleanup-deleted-items', '0 3 * * 0', 'SELECT cleanup_deleted_items()');
-- Or use a Supabase Edge Function scheduled via cron-job.org or similar
