-- Fix RPC function validation for increment_agent_views
-- Add rate limiting and validation

-- Create table to track agent views for rate limiting
CREATE TABLE IF NOT EXISTS agent_view_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_agent_view_tracking_agent_ip
  ON agent_view_tracking(agent_id, ip_address, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_view_tracking_user
  ON agent_view_tracking(agent_id, user_id, created_at DESC);

-- Enable RLS
ALTER TABLE agent_view_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert view tracking (handled by RPC function)
CREATE POLICY "Anyone can track views"
  ON agent_view_tracking FOR INSERT
  WITH CHECK (true);

-- Drop old function if exists
DROP FUNCTION IF EXISTS increment_agent_views(UUID);

-- Create improved function with validation and rate limiting
CREATE OR REPLACE FUNCTION increment_agent_views(p_agent_id UUID, p_ip_address TEXT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  agent_exists BOOLEAN;
  user_ip TEXT;
  current_user_id UUID;
  already_counted BOOLEAN;
BEGIN
  -- Get current user ID if authenticated
  current_user_id := auth.uid();

  -- Use provided IP or try to get from settings
  user_ip := COALESCE(
    p_ip_address,
    current_setting('request.headers', true)::json->>'x-real-ip',
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    'unknown'
  );

  -- Check if agent exists and is public
  SELECT EXISTS(
    SELECT 1 FROM agents
    WHERE id = p_agent_id
      AND is_public = true
      AND (is_deleted = false OR is_deleted IS NULL)
  ) INTO agent_exists;

  IF NOT agent_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Agent not found or not public'
    );
  END IF;

  -- Check if view already counted in last hour (rate limiting)
  -- Check by user ID if authenticated, otherwise by IP
  IF current_user_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM agent_view_tracking
      WHERE agent_id = p_agent_id
        AND user_id = current_user_id
        AND created_at > NOW() - INTERVAL '1 hour'
    ) INTO already_counted;
  ELSE
    SELECT EXISTS(
      SELECT 1 FROM agent_view_tracking
      WHERE agent_id = p_agent_id
        AND ip_address = user_ip
        AND created_at > NOW() - INTERVAL '1 hour'
    ) INTO already_counted;
  END IF;

  IF already_counted THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'View already counted recently'
    );
  END IF;

  -- Insert tracking record
  INSERT INTO agent_view_tracking (agent_id, ip_address, user_id)
  VALUES (p_agent_id, user_ip, current_user_id);

  -- Increment counter
  UPDATE agents
  SET
    views_count = COALESCE(views_count, 0) + 1,
    updated_at = NOW()
  WHERE id = p_agent_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'View counted successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Internal error',
      'details', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION increment_agent_views IS 'Increment agent view count with rate limiting (1 view per hour per user/IP)';

-- Cleanup: Delete old tracking data after 90 days
CREATE OR REPLACE FUNCTION cleanup_old_view_tracking()
RETURNS void AS $$
BEGIN
  DELETE FROM agent_view_tracking
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Schedule this function to run periodically using pg_cron or a Supabase Edge Function
-- Example with pg_cron (if available):
-- SELECT cron.schedule('cleanup-view-tracking', '0 2 * * *', 'SELECT cleanup_old_view_tracking()');
