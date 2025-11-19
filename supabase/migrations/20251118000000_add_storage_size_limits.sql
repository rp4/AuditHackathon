-- Add file size limits to storage buckets
-- This prevents users from uploading files larger than specified limits

-- Update agents-storage bucket (for documentation images)
UPDATE storage.buckets
SET file_size_limit = 5242880  -- 5MB in bytes
WHERE id = 'agents-storage';

-- Update avatars bucket (for profile pictures)
UPDATE storage.buckets
SET file_size_limit = 5242880  -- 5MB in bytes
WHERE id = 'avatars';

-- Add comment for documentation
COMMENT ON COLUMN storage.buckets.file_size_limit IS 'Maximum file size in bytes. 5242880 = 5MB';
