-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- Create update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

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
  instructions JSONB NOT NULL DEFAULT '{}'::jsonb,
  configuration JSONB DEFAULT '{}'::jsonb,
  sample_inputs JSONB DEFAULT '[]'::jsonb,
  sample_outputs JSONB DEFAULT '[]'::jsonb,
  prerequisites TEXT[] DEFAULT '{}',
  version TEXT DEFAULT '1.0.0',
  is_public BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  complexity_level TEXT CHECK (complexity_level IN ('beginner', 'intermediate', 'advanced')),
  estimated_tokens INTEGER,
  estimated_cost DECIMAL(10, 4),
  tags TEXT[] DEFAULT '{}',
  upvotes_count INTEGER DEFAULT 0,
  downloads_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  avg_rating DECIMAL(3, 2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
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

-- Upvotes table
CREATE TABLE upvotes (
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

-- Create indexes for performance
CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_agents_category_id ON agents(category_id);
CREATE INDEX idx_agents_slug ON agents(slug);
CREATE INDEX idx_agents_is_public ON agents(is_public);
CREATE INDEX idx_agents_created_at ON agents(created_at DESC);
CREATE INDEX idx_agents_upvotes_count ON agents(upvotes_count DESC);
CREATE INDEX idx_agents_downloads_count ON agents(downloads_count DESC);
CREATE INDEX idx_agents_avg_rating ON agents(avg_rating DESC);
CREATE INDEX idx_agents_search ON agents USING gin(to_tsvector('english', name || ' ' || coalesce(description, '')));
CREATE INDEX idx_agents_tags ON agents USING gin(tags);

CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_platforms_slug ON platforms(slug);
CREATE INDEX idx_collections_slug ON collections(slug);
CREATE INDEX idx_collections_user_id ON collections(user_id);
CREATE INDEX idx_comments_agent_id ON comments(agent_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Apply update triggers
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

-- Function to automatically create profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update agent stats
CREATE OR REPLACE FUNCTION update_agent_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'upvotes' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE agents SET upvotes_count = upvotes_count + 1 WHERE id = NEW.agent_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE agents SET upvotes_count = upvotes_count - 1 WHERE id = OLD.agent_id;
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

-- Triggers for updating agent statistics
CREATE TRIGGER update_agent_upvotes_on_insert
  AFTER INSERT ON upvotes
  FOR EACH ROW EXECUTE FUNCTION update_agent_stats();

CREATE TRIGGER update_agent_upvotes_on_delete
  AFTER DELETE ON upvotes
  FOR EACH ROW EXECUTE FUNCTION update_agent_stats();

CREATE TRIGGER update_agent_downloads
  AFTER INSERT ON downloads
  FOR EACH ROW EXECUTE FUNCTION update_agent_stats();

CREATE TRIGGER update_agent_ratings
  AFTER INSERT OR UPDATE OR DELETE ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_agent_stats();

-- Insert default categories
INSERT INTO categories (name, slug, description, order_index) VALUES
  ('Financial Audit', 'financial-audit', 'Agents for financial auditing and accounting', 1),
  ('Compliance', 'compliance', 'Regulatory compliance and standards checking', 2),
  ('Risk Assessment', 'risk-assessment', 'Risk analysis and management agents', 3),
  ('Operations', 'operations', 'Operational audit and process improvement', 4),
  ('Data Analysis', 'data-analysis', 'Data analytics and visualization agents', 5),
  ('Documentation', 'documentation', 'Documentation and report generation', 6),
  ('Testing', 'testing', 'Testing and validation agents', 7),
  ('Other', 'other', 'Miscellaneous audit agents', 999);

-- Insert default platforms
INSERT INTO platforms (name, slug, description, documentation_url) VALUES
  ('OpenAI', 'openai', 'OpenAI GPT models and assistants', 'https://platform.openai.com/docs'),
  ('Claude', 'claude', 'Anthropic Claude AI', 'https://docs.anthropic.com'),
  ('Google Gemini', 'gemini', 'Google Gemini AI models', 'https://ai.google.dev/docs'),
  ('LangChain', 'langchain', 'LangChain framework agents', 'https://docs.langchain.com'),
  ('GitHub Copilot', 'copilot', 'GitHub Copilot extensions', 'https://docs.github.com/copilot'),
  ('Other', 'other', 'Other AI platforms and custom implementations', NULL);