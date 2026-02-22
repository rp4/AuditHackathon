-- CreateTable
CREATE TABLE "audit_scores" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "score" DOUBLE PRECISION NOT NULL,
    "details" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_scores_userId_idx" ON "audit_scores"("userId");

-- CreateIndex
CREATE INDEX "audit_scores_score_idx" ON "audit_scores"("score");

-- CreateIndex
CREATE INDEX "audit_scores_createdAt_idx" ON "audit_scores"("createdAt");

-- AddForeignKey
ALTER TABLE "audit_scores" ADD CONSTRAINT "audit_scores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
