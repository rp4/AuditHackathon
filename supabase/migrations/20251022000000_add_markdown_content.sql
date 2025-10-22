-- Add markdown_content field to agents table
-- This will store the entire agent documentation as markdown
ALTER TABLE agents
ADD COLUMN markdown_content TEXT,
ADD COLUMN markdown_file_url TEXT;

-- Update agents table to make some fields optional since they'll be in markdown now
ALTER TABLE agents
ALTER COLUMN instructions DROP NOT NULL,
ALTER COLUMN configuration DROP NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN agents.markdown_content IS 'Full agent documentation in markdown format';
COMMENT ON COLUMN agents.markdown_file_url IS 'URL to markdown file in storage (if uploaded as file)';
