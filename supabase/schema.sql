-- ============================================
-- OpenAuditSwarms Complete Database Schema
-- ============================================
-- This script creates the entire database schema for OpenAuditSwarms
-- Features: LinkedIn OAuth, Favorites (not upvotes), Ratings, Comments, Collections
-- Run this script in Supabase SQL Editor or via migrations

-- ============================================
-- 1. EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- ============================================
-- 2. UTILITY FUNCTIONS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- 3. CORE TABLES
-- ============================================

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  website TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  reputation_score INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  parent_id UUID REFERENCES categories(id),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platforms table
CREATE TABLE platforms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  documentation_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agents main table
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES categories(id),

  -- Configuration fields (optional since markdown_content can contain everything)
  instructions JSONB DEFAULT '{}'::jsonb,
  configuration JSONB DEFAULT '{}'::jsonb,
  sample_inputs JSONB DEFAULT '[]'::jsonb,
  sample_outputs JSONB DEFAULT '[]'::jsonb,
  prerequisites TEXT[] DEFAULT '{}',

  -- Markdown documentation
  markdown_content TEXT,
  markdown_file_url TEXT,

  -- Metadata
  version TEXT DEFAULT '1.0.0',
  is_public BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  complexity_level TEXT CHECK (complexity_level IN ('beginner', 'intermediate', 'advanced')),
  estimated_tokens INTEGER,
  estimated_cost DECIMAL(10, 4),
  tags TEXT[] DEFAULT '{}',

  -- Stats (updated by triggers)
  favorites_count INTEGER DEFAULT 0,
  downloads_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  avg_rating DECIMAL(3, 2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- Agent platforms junction table (many-to-many)
CREATE TABLE agent_platforms (
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  platform_id UUID REFERENCES platforms(id) ON DELETE CASCADE,
  platform_config JSONB DEFAULT '{}'::jsonb,
  PRIMARY KEY (agent_id, platform_id)
);

-- ============================================
-- 4. USER INTERACTION TABLES
-- ============================================

-- Favorites table (replaces upvotes - users save/favorite agents)
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, agent_id)
);

-- Ratings table
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  review TEXT,
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, agent_id)
);

-- Downloads tracking table
CREATE TABLE downloads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  downloaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments table with threading support
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collections table
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,
  is_public BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collection agents junction table
CREATE TABLE collection_agents (
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  PRIMARY KEY (collection_id, agent_id)
);

-- User follows table
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent versions table for version history
CREATE TABLE agent_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  change_notes TEXT,
  configuration JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================
-- Updated: 2025-10-27 - Added comprehensive indexes for production performance

-- ============================================
-- PROFILES TABLE INDEXES
-- ============================================
-- Username lookup (case-insensitive for search)
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(LOWER(username));

-- Full-text search on full_name
CREATE INDEX IF NOT EXISTS idx_profiles_fullname ON profiles(full_name) WHERE full_name IS NOT NULL;

-- ============================================
-- CATEGORIES AND PLATFORMS INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_platforms_slug ON platforms(slug);

-- ============================================
-- AGENTS TABLE INDEXES
-- ============================================
-- Single column indexes for filters
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_slug ON agents(slug);
CREATE INDEX IF NOT EXISTS idx_agents_category_id ON agents(category_id) WHERE category_id IS NOT NULL;

-- Tag search using GIN index for array overlap
CREATE INDEX IF NOT EXISTS idx_agents_tags ON agents USING GIN(tags) WHERE tags IS NOT NULL;

-- Composite indexes for common query patterns in browse page
CREATE INDEX IF NOT EXISTS idx_agents_public_created
  ON agents(is_public, created_at DESC)
  WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_agents_public_rating
  ON agents(is_public, avg_rating DESC NULLS LAST)
  WHERE is_public = true AND avg_rating IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_agents_public_downloads
  ON agents(is_public, downloads_count DESC)
  WHERE is_public = true;

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_agents_search_name
  ON agents USING GIN(to_tsvector('english', name));

CREATE INDEX IF NOT EXISTS idx_agents_search_description
  ON agents USING GIN(to_tsvector('english', description));

CREATE INDEX IF NOT EXISTS idx_agents_fulltext
  ON agents USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- ============================================
-- AGENT_PLATFORMS TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_agent_platforms_agent ON agent_platforms(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_platforms_platform ON agent_platforms(platform_id);

-- Unique constraint enforcement
CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_platforms_unique
  ON agent_platforms(agent_id, platform_id);

-- ============================================
-- FAVORITES TABLE INDEXES
-- ============================================
-- Get all favorites for an agent (for count)
CREATE INDEX IF NOT EXISTS idx_favorites_agent ON favorites(agent_id, created_at DESC);

-- Get user's favorited agents
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id, created_at DESC);

-- Unique constraint to prevent duplicate favorites
CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_unique
  ON favorites(agent_id, user_id);

-- ============================================
-- RATINGS TABLE INDEXES
-- ============================================
-- Get all ratings for an agent
CREATE INDEX IF NOT EXISTS idx_ratings_agent ON ratings(agent_id, created_at DESC);

-- Get user's ratings
CREATE INDEX IF NOT EXISTS idx_ratings_user ON ratings(user_id, created_at DESC);

-- Unique constraint to prevent duplicate ratings
CREATE UNIQUE INDEX IF NOT EXISTS idx_ratings_unique
  ON ratings(agent_id, user_id);

-- ============================================
-- DOWNLOADS TABLE INDEXES
-- ============================================
-- Download count by agent
CREATE INDEX IF NOT EXISTS idx_downloads_agent ON downloads(agent_id, downloaded_at DESC);

-- User's download history
CREATE INDEX IF NOT EXISTS idx_downloads_user ON downloads(user_id, downloaded_at DESC) WHERE user_id IS NOT NULL;

-- ============================================
-- COMMENTS TABLE INDEXES
-- ============================================
-- Get all comments for an agent
CREATE INDEX IF NOT EXISTS idx_comments_agent ON comments(agent_id, created_at DESC);

-- Get user's comments
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id, created_at DESC);

-- Threaded comments - find replies to a comment
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id) WHERE parent_id IS NOT NULL;

-- ============================================
-- COLLECTIONS TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_collections_slug ON collections(slug);
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);

-- ============================================
-- NOTIFICATIONS TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- ============================================
-- PERFORMANCE NOTES
-- ============================================
-- These indexes will significantly improve:
-- 1. Browse page queries (filtering, sorting, pagination)
-- 2. Agent detail page loads (slug lookup is O(log n) instead of O(n))
-- 3. User profile pages (user's agents, favorites, ratings)
-- 4. Search functionality (GIN indexes for full-text search)
-- 5. Platform filtering (join performance optimization)
-- 6. Comment threading (parent-child relationships)
-- 7. Favorite/rating uniqueness enforcement
--
-- Trade-offs:
-- - Indexes consume disk space (~10-20% of table size)
-- - Slightly slower writes (indexes need updating)
-- - Much faster reads (the primary use case for this app)
--
-- Maintenance:
-- - Run VACUUM ANALYZE periodically (Supabase does this automatically)
-- - Monitor index usage: SELECT * FROM pg_stat_user_indexes;
-- - Drop unused indexes if identified

-- ============================================
-- 6. UPDATE TRIGGERS
-- ============================================

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ratings_updated_at BEFORE UPDATE ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. AUTO-CREATE PROFILE ON USER SIGNUP
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url, linkedin_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    COALESCE(NEW.raw_user_meta_data->>'linkedin_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 8. AGENT STATS UPDATE FUNCTION
-- ============================================

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
        SELECT AVG(score) FROM ratings WHERE agent_id = COALESCE(NEW.agent_id, OLD.agent_id)
      ),
      total_ratings = (
        SELECT COUNT(*) FROM ratings WHERE agent_id = COALESCE(NEW.agent_id, OLD.agent_id)
      )
    WHERE id = COALESCE(NEW.agent_id, OLD.agent_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updating agent statistics
CREATE TRIGGER update_agent_favorites_on_insert
  AFTER INSERT ON favorites
  FOR EACH ROW EXECUTE FUNCTION update_agent_stats();

CREATE TRIGGER update_agent_favorites_on_delete
  AFTER DELETE ON favorites
  FOR EACH ROW EXECUTE FUNCTION update_agent_stats();

CREATE TRIGGER update_agent_downloads
  AFTER INSERT ON downloads
  FOR EACH ROW EXECUTE FUNCTION update_agent_stats();

CREATE TRIGGER update_agent_ratings
  AFTER INSERT OR UPDATE OR DELETE ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_agent_stats();

-- ============================================
-- 9. HELPER FUNCTIONS
-- ============================================

-- Increment agent views
CREATE OR REPLACE FUNCTION increment_agent_views(p_agent_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE agents
  SET views_count = views_count + 1
  WHERE id = p_agent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has favorited an agent
CREATE OR REPLACE FUNCTION has_user_favorited(p_agent_id UUID, p_user_id UUID)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM favorites
    WHERE agent_id = p_agent_id AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's rating for an agent
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

-- ============================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
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
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- CATEGORIES POLICIES
-- ============================================
CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT
  USING (true);

-- ============================================
-- PLATFORMS POLICIES
-- ============================================
CREATE POLICY "Platforms are viewable by everyone"
  ON platforms FOR SELECT
  USING (true);

-- ============================================
-- AGENTS POLICIES
-- ============================================
CREATE POLICY "Public agents are viewable by everyone"
  ON agents FOR SELECT
  USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Authenticated users can create agents"
  ON agents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agents"
  ON agents FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own agents"
  ON agents FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- AGENT_PLATFORMS POLICIES
-- ============================================
CREATE POLICY "Agent platforms visibility follows agent"
  ON agent_platforms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_platforms.agent_id
      AND (agents.is_public = true OR agents.user_id = auth.uid())
    )
  );

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
-- FAVORITES POLICIES
-- ============================================
CREATE POLICY "Favorites are viewable by everyone"
  ON favorites FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- RATINGS POLICIES
-- ============================================
CREATE POLICY "Ratings are viewable by everyone"
  ON ratings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create ratings"
  ON ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings"
  ON ratings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own ratings"
  ON ratings FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- DOWNLOADS POLICIES
-- ============================================
CREATE POLICY "Anyone can track downloads"
  ON downloads FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own downloads"
  ON downloads FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- ============================================
-- COMMENTS POLICIES
-- ============================================
CREATE POLICY "Non-deleted comments are viewable by everyone"
  ON comments FOR SELECT
  USING (is_deleted = false);

CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_deleted = false);

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- COLLECTIONS POLICIES
-- ============================================
CREATE POLICY "Collections visibility based on privacy"
  ON collections FOR SELECT
  USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Authenticated users can create collections"
  ON collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections"
  ON collections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections"
  ON collections FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- COLLECTION_AGENTS POLICIES
-- ============================================
CREATE POLICY "Collection agents visibility follows collection"
  ON collection_agents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_agents.collection_id
      AND (collections.is_public = true OR collections.user_id = auth.uid())
    )
  );

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
CREATE POLICY "Follows are viewable by everyone"
  ON follows FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can follow"
  ON follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE
  USING (auth.uid() = follower_id);

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Only system can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- AGENT_VERSIONS POLICIES
-- ============================================
CREATE POLICY "Agent versions visibility follows agent"
  ON agent_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_versions.agent_id
      AND (agents.is_public = true OR agents.user_id = auth.uid())
    )
  );

CREATE POLICY "Agent owners can create versions"
  ON agent_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_versions.agent_id
      AND agents.user_id = auth.uid()
    )
  );

-- ============================================
-- 11. SEED DATA
-- ============================================

-- Insert default categories
INSERT INTO categories (name, slug, description, order_index) VALUES
  ('Financial Audit', 'financial-audit', 'Agents for financial auditing and accounting', 1),
  ('Compliance', 'compliance', 'Regulatory compliance and standards checking', 2),
  ('Risk Assessment', 'risk-assessment', 'Risk analysis and management agents', 3),
  ('Internal Controls', 'internal-controls', 'Internal control testing and evaluation', 4),
  ('Data Analysis', 'data-analysis', 'Data analytics and visualization agents', 5),
  ('Report Generation', 'report-generation', 'Automated report generation and documentation', 6),
  ('Process Automation', 'process-automation', 'Workflow and process automation agents', 7),
  ('Document Review', 'document-review', 'Document analysis and review agents', 8),
  ('Other', 'other', 'Miscellaneous audit agents', 999)
ON CONFLICT (slug) DO NOTHING;

-- Insert default platforms
INSERT INTO platforms (name, slug, description, documentation_url) VALUES
  ('OpenAI', 'openai', 'OpenAI GPT models and assistants', 'https://platform.openai.com/docs'),
  ('Claude', 'claude', 'Anthropic Claude AI', 'https://docs.anthropic.com'),
  ('Google Gemini', 'gemini', 'Google Gemini AI models', 'https://ai.google.dev/docs'),
  ('LangChain', 'langchain', 'LangChain framework agents', 'https://docs.langchain.com'),
  ('GitHub Copilot', 'copilot', 'GitHub Copilot extensions', 'https://docs.github.com/copilot'),
  ('Other', 'other', 'Other AI platforms and custom implementations', NULL)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 12. STORAGE BUCKETS (Run separately in Supabase Dashboard or via API)
-- ============================================
-- Note: Storage bucket creation requires admin privileges
-- Run these commands in the Supabase Dashboard SQL Editor or via API

-- Avatars bucket
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  false,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  avif_autodetection = EXCLUDED.avif_autodetection,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Agents storage bucket
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'agents-storage',
  'agents-storage',
  false,
  false,
  52428800, -- 50MB
  ARRAY[
    'application/json',
    'text/plain',
    'text/markdown',
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Agent thumbnails bucket
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'agent-thumbnails',
  'agent-thumbnails',
  true,
  true,
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  avif_autodetection = EXCLUDED.avif_autodetection,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Documentation bucket
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'documentation',
  'documentation',
  false,
  false,
  10485760, -- 10MB
  ARRAY['application/json', 'application/pdf', 'text/markdown', 'text/plain']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================
-- 13. STORAGE POLICIES
-- ============================================

-- Avatars bucket policies
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    (auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    (auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    (auth.uid())::text = (storage.foldername(name))[1]
  );

-- Agents storage bucket policies
CREATE POLICY "View agent files for public agents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'agents-storage' AND
    (
      EXISTS (
        SELECT 1 FROM agents
        WHERE agents.slug = (storage.foldername(name))[2]
        AND agents.is_public = true
      )
      OR
      EXISTS (
        SELECT 1 FROM agents
        WHERE agents.slug = (storage.foldername(name))[2]
        AND agents.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can upload files for own agents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'agents-storage' AND
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.slug = (storage.foldername(name))[2]
      AND agents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update files for own agents"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'agents-storage' AND
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.slug = (storage.foldername(name))[2]
      AND agents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete files for own agents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'agents-storage' AND
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.slug = (storage.foldername(name))[2]
      AND agents.user_id = auth.uid()
    )
  );

-- Agent thumbnails bucket policies
CREATE POLICY "Agent thumbnails are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'agent-thumbnails');

CREATE POLICY "Users can upload thumbnails for own agents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'agent-thumbnails' AND
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.slug = (storage.foldername(name))[1]
      AND agents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update thumbnails for own agents"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'agent-thumbnails' AND
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.slug = (storage.foldername(name))[1]
      AND agents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete thumbnails for own agents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'agent-thumbnails' AND
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.slug = (storage.foldername(name))[1]
      AND agents.user_id = auth.uid()
    )
  );

-- Documentation bucket policies
CREATE POLICY "View documentation for accessible agents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documentation' AND
    (
      EXISTS (
        SELECT 1 FROM agents
        WHERE agents.slug = (storage.foldername(name))[1]
        AND (agents.is_public = true OR agents.user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Authenticated users can upload documentation"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documentation');

CREATE POLICY "Users can update documentation for own agents"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'documentation' AND
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.slug = (storage.foldername(name))[1]
      AND agents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete documentation for own agents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documentation' AND
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.slug = (storage.foldername(name))[1]
      AND agents.user_id = auth.uid()
    )
  );

-- ============================================
-- SCHEMA COMPLETE
-- ============================================
-- This schema includes:
-- ✅ LinkedIn OAuth ready (configure in Supabase Auth settings)
-- ✅ Favorites instead of upvotes
-- ✅ Ratings with reviews
-- ✅ Downloads tracking
-- ✅ Comments with threading
-- ✅ Collections for organizing agents
-- ✅ Full RLS security
-- ✅ Automatic profile creation
-- ✅ Storage buckets and policies
