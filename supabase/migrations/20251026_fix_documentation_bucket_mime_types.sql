-- Add application/json to documentation bucket allowed MIME types
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['application/json', 'application/pdf', 'text/markdown', 'text/plain']
WHERE id = 'documentation';
