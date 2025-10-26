-- Fix documentation bucket RLS policy to allow uploads before agent creation
-- This allows users to upload documentation, then create the agent record

-- Drop the restrictive policy that requires agent to exist first
DROP POLICY IF EXISTS "Users can upload documentation for own agents" ON storage.objects;

-- Create a simpler policy that allows any authenticated user to upload
CREATE POLICY "Authenticated users can upload documentation"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documentation');
