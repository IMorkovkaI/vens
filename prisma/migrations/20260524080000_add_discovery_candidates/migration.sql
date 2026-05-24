-- CreateEnum
CREATE TYPE "DiscoveryCandidateStatus" AS ENUM ('NEW', 'REVIEWING', 'ACCEPTED', 'REJECTED', 'ANALYZED');

-- CreateTable
CREATE TABLE "DiscoveryCandidate" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "snippet" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "status" "DiscoveryCandidateStatus" NOT NULL DEFAULT 'NEW',
    "analysisUrl" TEXT,
    "reviewerEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscoveryCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiscoveryCandidate_url_key" ON "DiscoveryCandidate"("url");

-- CreateIndex
CREATE INDEX "DiscoveryCandidate_status_idx" ON "DiscoveryCandidate"("status");

-- CreateIndex
CREATE INDEX "DiscoveryCandidate_provider_idx" ON "DiscoveryCandidate"("provider");

-- CreateIndex
CREATE INDEX "DiscoveryCandidate_createdAt_idx" ON "DiscoveryCandidate"("createdAt");
