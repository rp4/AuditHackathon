-- ============================================
-- Documentation System with Monetization Support
-- ============================================
-- This migration adds Tiptap-based documentation with preview/full split
-- for future monetization support

-- ============================================
-- 1. Add Documentation Columns to Agents
-- ============================================

ALTER TABLE agents
-- Documentation content (Tiptap JSON format)
ADD COLUMN documentation_preview JSONB DEFAULT NULL,
ADD COLUMN documentation_full JSONB DEFAULT NULL,

-- Image tracking
ADD COLUMN documentation_preview_images TEXT[] DEFAULT '{}',
ADD COLUMN documentation_full_images TEXT[] DEFAULT '{}',

-- Monetization fields
ADD COLUMN is_premium BOOLEAN DEFAULT FALSE,
ADD COLUMN price DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN currency TEXT DEFAULT 'USD',
ADD COLUMN preview_paragraph_count INTEGER DEFAULT 3;

-- ============================================
-- 2. Create Indexes
-- ============================================

CREATE INDEX idx_agents_documentation_preview ON agents USING gin(documentation_preview);
CREATE INDEX idx_agents_documentation_full ON agents USING gin(documentation_full);
CREATE INDEX idx_agents_premium ON agents(is_premium, price) WHERE is_premium = true;

-- ============================================
-- 3. Create Agent Purchases Table
-- ============================================

CREATE TABLE agent_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,

  -- Payment details
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL,
  payment_provider TEXT NOT NULL CHECK (payment_provider IN ('stripe', 'paypal', 'manual')),
  payment_intent_id TEXT UNIQUE NOT NULL,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),

  -- Timestamps
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  refunded_at TIMESTAMPTZ,

  -- Ensure user can only purchase once
  UNIQUE(user_id, agent_id)
);

-- ============================================
-- 4. Indexes for Agent Purchases
-- ============================================

CREATE INDEX idx_purchases_user_agent ON agent_purchases(user_id, agent_id) WHERE status = 'completed';
CREATE INDEX idx_purchases_agent ON agent_purchases(agent_id, status);
CREATE INDEX idx_purchases_user ON agent_purchases(user_id, status);

-- ============================================
-- 5. Row Level Security for Purchases
-- ============================================

ALTER TABLE agent_purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY "Users can view their own purchases"
ON agent_purchases FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users cannot insert purchases (only via API/webhooks)
CREATE POLICY "Purchases inserted via backend only"
ON agent_purchases FOR INSERT
TO authenticated
WITH CHECK (false); -- All inserts must go through service role

-- ============================================
-- 6. Functions for Access Control
-- ============================================

-- Check if user has purchased an agent
CREATE OR REPLACE FUNCTION user_has_purchased_agent(agent_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM agent_purchases
    WHERE agent_id = agent_uuid
    AND user_id = user_uuid
    AND status = 'completed'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can access full documentation
CREATE OR REPLACE FUNCTION can_access_full_documentation(agent_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  agent_record RECORD;
BEGIN
  -- Get agent details
  SELECT user_id, is_premium INTO agent_record
  FROM agents
  WHERE id = agent_uuid;

  -- Free agents: everyone can access
  IF NOT agent_record.is_premium THEN
    RETURN TRUE;
  END IF;

  -- No user: cannot access premium
  IF user_uuid IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Owner: always can access
  IF agent_record.user_id = user_uuid THEN
    RETURN TRUE;
  END IF;

  -- Check if user purchased
  RETURN user_has_purchased_agent(agent_uuid, user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. Update Agents RLS Policies
-- ============================================

-- Drop existing policy if it exists (from previous migrations)
DROP POLICY IF EXISTS "Anyone can view public agents" ON agents;

-- Create comprehensive select policy
CREATE POLICY "Public can view agents with access control"
ON agents FOR SELECT
TO public
USING (
  is_public = true
);

-- Note: Full documentation access is controlled in application layer
-- by using can_access_full_documentation() function

-- ============================================
-- 8. Storage Bucket for Documentation Images
-- ============================================

-- Create bucket for agent documentation images (run this via Supabase dashboard or API)
-- Bucket name: 'agent-documentation'
-- Public: true
-- File size limit: 10MB
-- Allowed MIME types: image/*

-- Note: Run these via Supabase dashboard or supabase.storage API:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('agent-documentation', 'agent-documentation', true);

-- ============================================
-- 9. Comments
-- ============================================

COMMENT ON COLUMN agents.documentation_preview IS 'Public preview of documentation (Tiptap JSON format) - shown to all users';
COMMENT ON COLUMN agents.documentation_full IS 'Complete documentation (Tiptap JSON format) - requires purchase for premium agents';
COMMENT ON COLUMN agents.documentation_preview_images IS 'Array of Supabase Storage URLs for images in preview';
COMMENT ON COLUMN agents.documentation_full_images IS 'Array of Supabase Storage URLs for images in full documentation';
COMMENT ON COLUMN agents.is_premium IS 'Whether this agent requires payment to access full documentation';
COMMENT ON COLUMN agents.price IS 'Price in specified currency (0.00 for free agents)';
COMMENT ON COLUMN agents.currency IS 'Currency code (USD, EUR, GBP, etc.)';
COMMENT ON COLUMN agents.preview_paragraph_count IS 'Number of paragraphs to show in preview (used if preview not manually set)';

COMMENT ON TABLE agent_purchases IS 'Tracks agent purchases for premium content access';
COMMENT ON COLUMN agent_purchases.payment_intent_id IS 'Unique payment ID from payment provider (prevents duplicate purchases)';
COMMENT ON COLUMN agent_purchases.status IS 'Payment status: pending, completed, refunded, failed';

-- ============================================
-- 10. Triggers for Purchase Stats
-- ============================================

-- Function to update agent stats when purchase is completed
CREATE OR REPLACE FUNCTION update_agent_purchase_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update downloads_count on completed purchases
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
    UPDATE agents
    SET downloads_count = downloads_count + 1
    WHERE id = NEW.agent_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for purchase stats
DROP TRIGGER IF EXISTS trigger_purchase_stats ON agent_purchases;
CREATE TRIGGER trigger_purchase_stats
AFTER INSERT OR UPDATE ON agent_purchases
FOR EACH ROW
EXECUTE FUNCTION update_agent_purchase_stats();

-- ============================================
-- 11. Migration Complete
-- ============================================

-- Verification queries (for testing):
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'agents' AND column_name LIKE 'documentation%';
-- SELECT * FROM agent_purchases LIMIT 1;
