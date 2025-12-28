-- Rename Tool to Swarm
-- First drop foreign key constraints that reference the tools table
ALTER TABLE "favorites" DROP CONSTRAINT IF EXISTS "favorites_toolId_fkey";
ALTER TABLE "ratings" DROP CONSTRAINT IF EXISTS "ratings_toolId_fkey";
ALTER TABLE "downloads" DROP CONSTRAINT IF EXISTS "downloads_toolId_fkey";
ALTER TABLE "comments" DROP CONSTRAINT IF EXISTS "comments_toolId_fkey";
ALTER TABLE "tool_versions" DROP CONSTRAINT IF EXISTS "tool_versions_toolId_fkey";
ALTER TABLE "tool_platforms" DROP CONSTRAINT IF EXISTS "tool_platforms_toolId_fkey";
ALTER TABLE "collection_tools" DROP CONSTRAINT IF EXISTS "collection_tools_toolId_fkey";

-- Rename the tools table to swarms
ALTER TABLE "tools" RENAME TO "swarms";

-- Rename toolId columns to swarmId in related tables
ALTER TABLE "favorites" RENAME COLUMN "toolId" TO "swarmId";
ALTER TABLE "ratings" RENAME COLUMN "toolId" TO "swarmId";
ALTER TABLE "downloads" RENAME COLUMN "toolId" TO "swarmId";
ALTER TABLE "comments" RENAME COLUMN "toolId" TO "swarmId";

-- Rename tool_versions to swarm_versions
ALTER TABLE "tool_versions" RENAME TO "swarm_versions";
ALTER TABLE "swarm_versions" RENAME COLUMN "toolId" TO "swarmId";

-- Add workflow columns to swarms if they don't exist
ALTER TABLE "swarms" ADD COLUMN IF NOT EXISTS "workflowNodes" TEXT;
ALTER TABLE "swarms" ADD COLUMN IF NOT EXISTS "workflowEdges" TEXT;
ALTER TABLE "swarms" ADD COLUMN IF NOT EXISTS "workflowMetadata" TEXT;
ALTER TABLE "swarms" ADD COLUMN IF NOT EXISTS "workflowVersion" VARCHAR(50) DEFAULT '1.0';

-- Drop the documentation column if it exists (replaced by workflow fields)
-- ALTER TABLE "swarms" DROP COLUMN IF EXISTS "documentation";

-- Drop platform-related tables (no longer used)
DROP TABLE IF EXISTS "tool_platforms";
DROP TABLE IF EXISTS "platforms";

-- Drop collection tables (simplifying the model)
DROP TABLE IF EXISTS "collection_tools";
DROP TABLE IF EXISTS "collections";

-- Recreate foreign key constraints with new table/column names
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_swarmId_fkey"
  FOREIGN KEY ("swarmId") REFERENCES "swarms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ratings" ADD CONSTRAINT "ratings_swarmId_fkey"
  FOREIGN KEY ("swarmId") REFERENCES "swarms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "downloads" ADD CONSTRAINT "downloads_swarmId_fkey"
  FOREIGN KEY ("swarmId") REFERENCES "swarms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "comments" ADD CONSTRAINT "comments_swarmId_fkey"
  FOREIGN KEY ("swarmId") REFERENCES "swarms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "swarm_versions" ADD CONSTRAINT "swarm_versions_swarmId_fkey"
  FOREIGN KEY ("swarmId") REFERENCES "swarms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Update unique constraints
ALTER TABLE "favorites" DROP CONSTRAINT IF EXISTS "favorites_userId_toolId_key";
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_swarmId_key" UNIQUE ("userId", "swarmId");

ALTER TABLE "ratings" DROP CONSTRAINT IF EXISTS "ratings_userId_toolId_key";
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_userId_swarmId_key" UNIQUE ("userId", "swarmId");

-- Update indexes
DROP INDEX IF EXISTS "favorites_toolId_idx";
CREATE INDEX IF NOT EXISTS "favorites_swarmId_idx" ON "favorites"("swarmId");

DROP INDEX IF EXISTS "ratings_toolId_idx";
CREATE INDEX IF NOT EXISTS "ratings_swarmId_idx" ON "ratings"("swarmId");

DROP INDEX IF EXISTS "downloads_toolId_idx";
CREATE INDEX IF NOT EXISTS "downloads_swarmId_idx" ON "downloads"("swarmId");

DROP INDEX IF EXISTS "comments_toolId_idx";
CREATE INDEX IF NOT EXISTS "comments_swarmId_idx" ON "comments"("swarmId");

DROP INDEX IF EXISTS "tool_versions_toolId_idx";
CREATE INDEX IF NOT EXISTS "swarm_versions_swarmId_idx" ON "swarm_versions"("swarmId");
