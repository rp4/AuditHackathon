-- AlterTable
ALTER TABLE "tools" DROP COLUMN "configuration";
ALTER TABLE "tools" DROP COLUMN "short_description";
ALTER TABLE "tools" ADD COLUMN "documentation" TEXT;
