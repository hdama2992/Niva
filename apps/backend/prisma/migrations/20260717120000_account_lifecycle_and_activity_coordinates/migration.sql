-- Remove the legacy field replaced by User.displayName and UserProfile.displayName.
ALTER TABLE "User" DROP COLUMN IF EXISTS "name";

ALTER TYPE "AdminAuditAction" ADD VALUE 'ACCOUNT_DELETION_REQUEST_UPDATED';

-- Coordinates are optional because hosts may intentionally disclose only a
-- neighbourhood until a membership request is approved.
ALTER TABLE "Event"
  ADD COLUMN "latitude" DOUBLE PRECISION,
  ADD COLUMN "longitude" DOUBLE PRECISION;

ALTER TABLE "Circle"
  ADD COLUMN "latitude" DOUBLE PRECISION,
  ADD COLUMN "longitude" DOUBLE PRECISION;

CREATE TABLE "BetaAccessRequest" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "interest" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BetaAccessRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BetaAccessRequest_email_key"
  ON "BetaAccessRequest"("email");

CREATE TABLE "AccountDeletionRequest" (
  "id" TEXT NOT NULL,
  "identifier" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AccountDeletionRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AccountDeletionRequest_identifier_key"
  ON "AccountDeletionRequest"("identifier");
