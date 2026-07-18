-- Persist a single reusable cover per activity and model recurring circle
-- sessions as first-class calendar occurrences.
CREATE TYPE "CircleOccurrenceStatus" AS ENUM ('SCHEDULED', 'CANCELLED', 'COMPLETED');

ALTER TABLE "Event" ADD COLUMN "coverImageUrl" TEXT;

ALTER TABLE "Circle"
  ADD COLUMN "coverImageUrl" TEXT,
  ADD COLUMN "recurrenceIntervalWeeks" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata';

CREATE TABLE "CircleOccurrence" (
  "id" TEXT NOT NULL,
  "circleId" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "status" "CircleOccurrenceStatus" NOT NULL DEFAULT 'SCHEDULED',
  "cancellationReason" TEXT,
  "cancelledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CircleOccurrence_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CircleOccurrence_circleId_startsAt_key"
  ON "CircleOccurrence"("circleId", "startsAt");
CREATE INDEX "CircleOccurrence_startsAt_status_idx"
  ON "CircleOccurrence"("startsAt", "status");

ALTER TABLE "CircleOccurrence"
  ADD CONSTRAINT "CircleOccurrence_circleId_fkey"
  FOREIGN KEY ("circleId") REFERENCES "Circle"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill future occurrences for existing circles from the first session.
INSERT INTO "CircleOccurrence" (
  "id", "circleId", "startsAt", "status", "createdAt", "updatedAt"
)
SELECT
  'occ_' || md5(c."id" || ':' || occurrence."startsAt"::text),
  c."id",
  occurrence."startsAt",
  'SCHEDULED'::"CircleOccurrenceStatus",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Circle" c
CROSS JOIN LATERAL (
  SELECT c."startsAt" + (series.week_index * INTERVAL '1 week') AS "startsAt"
  FROM generate_series(0, GREATEST(c."durationWeeks" - 1, 0)) AS series(week_index)
) occurrence
WHERE occurrence."startsAt" >= CURRENT_TIMESTAMP
ON CONFLICT ("circleId", "startsAt") DO NOTHING;
