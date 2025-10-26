-- Add document_content field to store Univer documents
-- Keep markdown_content for backwards compatibility

ALTER TABLE agents
ADD COLUMN IF NOT EXISTS document_content JSONB DEFAULT NULL;

-- Add index for JSONB queries if needed
CREATE INDEX IF NOT EXISTS idx_agents_document_content ON agents USING gin(document_content);

-- Update comment
COMMENT ON COLUMN agents.document_content IS 'Univer document format for rich documentation';
COMMENT ON COLUMN agents.markdown_content IS 'Legacy markdown content or plain text (deprecated in favor of document_content)';
