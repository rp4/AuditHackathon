-- ============================================
-- Storage Policies for agents-storage Bucket
-- ============================================
-- This migration sets up RLS policies for the agents-storage bucket
-- to allow documentation image uploads

-- ============================================
-- 1. Ensure bucket exists and is public
-- ============================================

-- Update bucket to be public if it isn't already
UPDATE storage.buckets
SET public = true
WHERE id = 'agents-storage';

-- ============================================
-- 2. Drop existing policies if they exist
-- ============================================

DROP POLICY IF EXISTS "Public can view agent storage files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to their agent folders" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own agent files" ON storage.objects;

-- ============================================
-- 3. Create RLS policies for documentation images
-- ============================================

-- Allow public access to view all files in agents-storage
CREATE POLICY "Public can view agent storage files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'agents-storage');

-- Allow authenticated users to upload to their own agent folders
CREATE POLICY "Users can upload to their agent folders"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'agents-storage'
  AND (storage.foldername(name))[1] IN (
    SELECT slug FROM agents WHERE user_id = auth.uid()
  )
);

-- Allow users to delete from their own agent folders
CREATE POLICY "Users can delete their own agent files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'agents-storage'
  AND (storage.foldername(name))[1] IN (
    SELECT slug FROM agents WHERE user_id = auth.uid()
  )
);

-- Allow users to update/replace files in their own agent folders
CREATE POLICY "Users can update their own agent files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'agents-storage'
  AND (storage.foldername(name))[1] IN (
    SELECT slug FROM agents WHERE user_id = auth.uid()
  )
);

-- ============================================
-- 4. Verification
-- ============================================

-- Verify bucket is public
-- SELECT id, name, public FROM storage.buckets WHERE id = 'agents-storage';

-- Verify policies are created
-- SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
