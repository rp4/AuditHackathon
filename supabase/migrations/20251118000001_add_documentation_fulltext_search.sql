-- ============================================
-- Add Full-Text Search for Documentation Content
-- ============================================
-- This migration enables searching within the Tiptap JSONB documentation
-- by extracting text content and creating a full-text search index

-- ============================================
-- 1. Create Function to Extract Text from Tiptap JSON
-- ============================================
-- Tiptap stores content as JSONB with nested structure
-- This function recursively extracts all text nodes

CREATE OR REPLACE FUNCTION extract_text_from_tiptap(doc JSONB)
RETURNS TEXT AS $$
DECLARE
  result TEXT := '';
  content_item JSONB;
BEGIN
  -- Handle null or empty input
  IF doc IS NULL OR doc = 'null'::jsonb THEN
    RETURN '';
  END IF;

  -- If doc has a 'content' array, iterate through it
  IF doc ? 'content' AND jsonb_typeof(doc->'content') = 'array' THEN
    FOR content_item IN SELECT * FROM jsonb_array_elements(doc->'content')
    LOOP
      -- If this item has text, append it
      IF content_item ? 'text' THEN
        result := result || ' ' || (content_item->>'text');
      END IF;

      -- If this item has nested content, recurse
      IF content_item ? 'content' THEN
        result := result || ' ' || extract_text_from_tiptap(content_item);
      END IF;
    END LOOP;
  END IF;

  -- If doc itself has text (for leaf nodes)
  IF doc ? 'text' THEN
    result := result || ' ' || (doc->>'text');
  END IF;

  RETURN TRIM(result);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 2. Add Column for Searchable Documentation Text
-- ============================================
-- Using a regular column updated by triggers instead of generated column
-- (PostgreSQL doesn't allow custom functions in generated columns)

ALTER TABLE agents
ADD COLUMN IF NOT EXISTS documentation_searchable_text TEXT;

-- ============================================
-- 3. Create Trigger Function to Update Searchable Text
-- ============================================

CREATE OR REPLACE FUNCTION update_documentation_searchable_text()
RETURNS TRIGGER AS $$
BEGIN
  NEW.documentation_searchable_text :=
    extract_text_from_tiptap(NEW.documentation_preview) || ' ' ||
    extract_text_from_tiptap(NEW.documentation_full);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. Create Trigger
-- ============================================

DROP TRIGGER IF EXISTS trigger_update_documentation_searchable_text ON agents;
CREATE TRIGGER trigger_update_documentation_searchable_text
  BEFORE INSERT OR UPDATE OF documentation_preview, documentation_full
  ON agents
  FOR EACH ROW
  EXECUTE FUNCTION update_documentation_searchable_text();

-- ============================================
-- 5. Populate Existing Records
-- ============================================

UPDATE agents
SET documentation_searchable_text =
  extract_text_from_tiptap(documentation_preview) || ' ' ||
  extract_text_from_tiptap(documentation_full)
WHERE documentation_preview IS NOT NULL OR documentation_full IS NOT NULL;

-- ============================================
-- 6. Add tsvector Column for Full-Text Search
-- ============================================
-- We need a separate tsvector column to avoid IMMUTABLE issues with indexes

ALTER TABLE agents
ADD COLUMN IF NOT EXISTS documentation_search_vector tsvector;

-- ============================================
-- 7. Create Trigger Function to Update Search Vector
-- ============================================

CREATE OR REPLACE FUNCTION update_documentation_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.documentation_search_vector :=
    to_tsvector('english', COALESCE(NEW.documentation_searchable_text, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. Create Trigger for Search Vector
-- ============================================

DROP TRIGGER IF EXISTS trigger_update_documentation_search_vector ON agents;
CREATE TRIGGER trigger_update_documentation_search_vector
  BEFORE INSERT OR UPDATE OF documentation_searchable_text
  ON agents
  FOR EACH ROW
  EXECUTE FUNCTION update_documentation_search_vector();

-- ============================================
-- 9. Populate Search Vector for Existing Records
-- ============================================

UPDATE agents
SET documentation_search_vector = to_tsvector('english', COALESCE(documentation_searchable_text, ''))
WHERE documentation_searchable_text IS NOT NULL;

-- ============================================
-- 10. Create GIN Index on tsvector Column
-- ============================================

CREATE INDEX IF NOT EXISTS idx_agents_documentation_fulltext
ON agents USING GIN(documentation_search_vector);

-- ============================================
-- 11. Comments
-- ============================================

COMMENT ON COLUMN agents.documentation_searchable_text IS
  'Searchable text extracted from documentation_preview and documentation_full JSONB fields, auto-updated by trigger';

COMMENT ON COLUMN agents.documentation_search_vector IS
  'Full-text search vector for documentation content, auto-updated by trigger';

COMMENT ON FUNCTION extract_text_from_tiptap(JSONB) IS
  'Extracts plain text from Tiptap JSON format for full-text search indexing';

COMMENT ON FUNCTION update_documentation_searchable_text() IS
  'Trigger function to automatically update documentation_searchable_text when documentation fields change';

COMMENT ON FUNCTION update_documentation_search_vector() IS
  'Trigger function to automatically update documentation_search_vector when searchable text changes';

-- ============================================
-- Migration Complete
-- ============================================
-- This migration adds:
-- ✅ Text extraction function for Tiptap JSON format
-- ✅ Generated column with searchable documentation text
-- ✅ GIN index for full-text search on documentation
-- ✅ Comprehensive search index combining all searchable fields
--
-- Usage in queries:
-- WHERE to_tsvector('english', documentation_searchable_text) @@ plainto_tsquery('english', 'search term')
-- OR using the comprehensive index for all fields at once
