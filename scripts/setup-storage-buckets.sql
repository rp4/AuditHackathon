-- Create agent-images storage bucket for image uploads
-- Run this in Supabase SQL Editor

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('agent-images', 'agent-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for agent-images bucket

-- Allow public read access to all images
CREATE POLICY "Public read access for agent images"
ON storage.objects FOR SELECT
USING (bucket_id = 'agent-images');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'agent-images');

-- Allow users to update their own agent's images
CREATE POLICY "Users can update their agent images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'agent-images' AND
  (storage.foldername(name))[1] IN (
    SELECT slug FROM agents WHERE user_id = auth.uid()
  )
);

-- Allow users to delete their own agent's images
CREATE POLICY "Users can delete their agent images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'agent-images' AND
  (storage.foldername(name))[1] IN (
    SELECT slug FROM agents WHERE user_id = auth.uid()
  )
);

-- Verify the bucket was created
SELECT * FROM storage.buckets WHERE id = 'agent-images';
