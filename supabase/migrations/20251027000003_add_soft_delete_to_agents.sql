-- Add soft delete support to agents table
ALTER TABLE agents ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE agents ADD COLUMN deleted_at TIMESTAMPTZ;

-- Create index for better query performance on non-deleted agents
CREATE INDEX idx_agents_not_deleted ON agents(is_deleted) WHERE is_deleted = FALSE;

-- Update RLS policies to exclude soft-deleted agents from public view
DROP POLICY IF EXISTS "Public agents are viewable by everyone" ON agents;

-- Anyone can view public, non-deleted agents; users can view their own agents (even if deleted)
CREATE POLICY "Public agents are viewable by everyone"
  ON agents FOR SELECT
  USING (
    (is_public = true AND is_deleted = false)
    OR user_id = auth.uid()
  );
