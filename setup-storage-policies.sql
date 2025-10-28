-- ============================================
-- Storage Policies for agents-storage Bucket
-- ============================================
-- Run this in Supabase SQL Editor

-- 1. Make bucket public
UPDATE storage.buckets
SET public = true
WHERE id = 'agents-storage';

-- 2. Drop existing policies (if any)
DROP POLICY IF EXISTS "Public can view agent storage files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to their agent folders" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own agent files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own agent files" ON storage.objects;

-- 3. Create new policies
CREATE POLICY "Public can view agent storage files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'agents-storage');

CREATE POLICY "Users can upload to their agent folders"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'agents-storage' AND
  (storage.foldername(name))[1] IN (
    SELECT slug FROM agents WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own agent files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'agents-storage' AND
  (storage.foldername(name))[1] IN (
    SELECT slug FROM agents WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own agent files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'agents-storage' AND
  (storage.foldername(name))[1] IN (
    SELECT slug FROM agents WHERE user_id = auth.uid()
  )
);

-- 4. Verify policies were created
SELECT policyname, cmd FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage'
AND policyname LIKE '%agent%';
