-- AlterTable
ALTER TABLE "UserSettings"
  ADD COLUMN "showInterestsInIcebreakers" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "ContinuityPreference" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "wantsSimilarEvents" BOOLEAN NOT NULL DEFAULT true,
  "wantsCircleSuggestions" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContinuityPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductAnalyticsEvent" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "userId" TEXT,
  "eventId" TEXT,
  "circleId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductAnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContinuityPreference_userId_eventId_key" ON "ContinuityPreference"("userId", "eventId");
CREATE INDEX "ContinuityPreference_userId_updatedAt_idx" ON "ContinuityPreference"("userId", "updatedAt");
CREATE INDEX "ProductAnalyticsEvent_type_createdAt_idx" ON "ProductAnalyticsEvent"("type", "createdAt");
CREATE INDEX "ProductAnalyticsEvent_userId_createdAt_idx" ON "ProductAnalyticsEvent"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "ContinuityPreference" ADD CONSTRAINT "ContinuityPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContinuityPreference" ADD CONSTRAINT "ContinuityPreference_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductAnalyticsEvent" ADD CONSTRAINT "ProductAnalyticsEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductAnalyticsEvent" ADD CONSTRAINT "ProductAnalyticsEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductAnalyticsEvent" ADD CONSTRAINT "ProductAnalyticsEvent_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
