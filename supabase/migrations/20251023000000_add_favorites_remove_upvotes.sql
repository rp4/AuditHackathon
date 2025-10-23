-- Migration: Add favorites table and remove upvotes
-- This aligns the backend with the frontend implementation

-- ============================================
-- 1. CREATE FAVORITES TABLE
-- ============================================
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, agent_id)
);

-- Create index for performance
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_agent_id ON favorites(agent_id);

-- ============================================
-- 2. ADD FAVORITES_COUNT TO AGENTS
-- ============================================
ALTER TABLE agents ADD COLUMN favorites_count INTEGER DEFAULT 0;

-- Migrate existing upvotes count to favorites count
UPDATE agents SET favorites_count = upvotes_count;

-- ============================================
-- 3. MIGRATE UPVOTES DATA TO FAVORITES
-- ============================================
INSERT INTO favorites (user_id, agent_id, created_at)
SELECT user_id, agent_id, created_at
FROM upvotes
ON CONFLICT (user_id, agent_id) DO NOTHING;

-- ============================================
-- 4. UPDATE AGENT STATS FUNCTION
-- ============================================
-- Drop old triggers first
DROP TRIGGER IF EXISTS update_agent_upvotes_on_insert ON upvotes;
DROP TRIGGER IF EXISTS update_agent_upvotes_on_delete ON upvotes;

-- Update the function to handle favorites instead of upvotes
CREATE OR REPLACE FUNCTION update_agent_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'favorites' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE agents SET favorites_count = favorites_count + 1 WHERE id = NEW.agent_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE agents SET favorites_count = favorites_count - 1 WHERE id = OLD.agent_id;
    END IF;
  ELSIF TG_TABLE_NAME = 'downloads' THEN
    UPDATE agents SET downloads_count = downloads_count + 1 WHERE id = NEW.agent_id;
  ELSIF TG_TABLE_NAME = 'ratings' THEN
    UPDATE agents
    SET
      avg_rating = (
        SELECT AVG(score) FROM ratings WHERE agent_id = NEW.agent_id
      ),
      total_ratings = (
        SELECT COUNT(*) FROM ratings WHERE agent_id = NEW.agent_id
      )
    WHERE id = NEW.agent_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create new triggers for favorites
CREATE TRIGGER update_agent_favorites_on_insert
  AFTER INSERT ON favorites
  FOR EACH ROW EXECUTE FUNCTION update_agent_stats();

CREATE TRIGGER update_agent_favorites_on_delete
  AFTER DELETE ON favorites
  FOR EACH ROW EXECUTE FUNCTION update_agent_stats();

-- ============================================
-- 5. CREATE HELPER FUNCTIONS FOR FAVORITES
-- ============================================
-- Function to check if user has favorited an agent
CREATE OR REPLACE FUNCTION has_user_favorited(p_agent_id UUID, p_user_id UUID)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM favorites
    WHERE agent_id = p_agent_id AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old upvote function
DROP FUNCTION IF EXISTS has_user_upvoted(UUID, UUID);

-- ============================================
-- 6. ENABLE RLS ON FAVORITES
-- ============================================
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Anyone can view favorites
CREATE POLICY "Favorites are viewable by everyone"
  ON favorites FOR SELECT
  USING (true);

-- Authenticated users can create favorites
CREATE POLICY "Authenticated users can create favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own favorites
CREATE POLICY "Users can delete own favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 7. DROP UPVOTES TABLE AND RELATED OBJECTS
-- ============================================
-- Drop the old upvotes table (data already migrated)
DROP TABLE IF EXISTS upvotes CASCADE;

-- Remove upvotes_count column from agents (replaced by favorites_count)
ALTER TABLE agents DROP COLUMN IF EXISTS upvotes_count;
