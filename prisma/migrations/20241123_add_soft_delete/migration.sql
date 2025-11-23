-- Add soft delete fields to User table
ALTER TABLE "users" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- Add soft delete fields to Tool table
ALTER TABLE "tools" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "tools" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- Create indexes for performance
CREATE INDEX "users_isDeleted_idx" ON "users"("isDeleted");
CREATE INDEX "tools_isDeleted_idx" ON "tools"("isDeleted");