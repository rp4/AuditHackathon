-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, false, 5242880, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']),
  ('agents-storage', 'agents-storage', false, false, 52428800, ARRAY[
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
  ]),
  ('agent-thumbnails', 'agent-thumbnails', true, true, 2097152, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']),
  ('documentation', 'documentation', false, false, 10485760, ARRAY['application/pdf', 'text/markdown', 'text/plain'])
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  avif_autodetection = EXCLUDED.avif_autodetection,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================
-- AVATARS BUCKET POLICIES
-- ============================================
-- Anyone can view avatars (public bucket)
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    (auth.uid())::text = (storage.foldername(name))[1]
  );

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    (auth.uid())::text = (storage.foldername(name))[1]
  );

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    (auth.uid())::text = (storage.foldername(name))[1]
  );

-- ============================================
-- AGENTS-STORAGE BUCKET POLICIES
-- ============================================
-- Authenticated users can view agent files for public agents
CREATE POLICY "View agent files for public agents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'agents-storage' AND
    (
      -- Check if the agent is public
      EXISTS (
        SELECT 1 FROM agents
        WHERE agents.slug = (storage.foldername(name))[2]
        AND agents.is_public = true
      )
      OR
      -- Or if the user owns the agent
      EXISTS (
        SELECT 1 FROM agents
        WHERE agents.slug = (storage.foldername(name))[2]
        AND agents.user_id = auth.uid()
      )
    )
  );

-- Users can upload files for their own agents
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

-- Users can update files for their own agents
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

-- Users can delete files for their own agents
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

-- ============================================
-- AGENT-THUMBNAILS BUCKET POLICIES
-- ============================================
-- Anyone can view thumbnails (public bucket)
CREATE POLICY "Agent thumbnails are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'agent-thumbnails');

-- Users can upload thumbnails for their own agents
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

-- Users can update thumbnails for their own agents
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

-- Users can delete thumbnails for their own agents
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

-- ============================================
-- DOCUMENTATION BUCKET POLICIES
-- ============================================
-- View documentation for public agents or own agents
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

-- Users can upload documentation for their own agents
CREATE POLICY "Users can upload documentation for own agents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documentation' AND
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.slug = (storage.foldername(name))[1]
      AND agents.user_id = auth.uid()
    )
  );

-- Users can update documentation for their own agents
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

-- Users can delete documentation for their own agents
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