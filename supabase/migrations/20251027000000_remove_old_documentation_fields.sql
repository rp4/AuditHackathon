-- Remove old documentation fields (markdown and Univer)
-- This migration removes fields from previous documentation implementations

-- Drop index for document_content
DROP INDEX IF EXISTS idx_agents_document_content;

-- Remove columns
ALTER TABLE agents
DROP COLUMN IF EXISTS markdown_content,
DROP COLUMN IF EXISTS markdown_file_url,
DROP COLUMN IF EXISTS document_content;

-- Update comment
COMMENT ON TABLE agents IS 'AI agents shared on the platform';
