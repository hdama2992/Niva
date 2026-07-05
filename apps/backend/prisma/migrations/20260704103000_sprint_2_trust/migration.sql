-- CreateEnum
CREATE TYPE "SelfieVerificationStatus" AS ENUM ('NOT_STARTED', 'PENDING', 'APPROVED', 'NEEDS_REVIEW', 'REJECTED');

-- CreateEnum
CREATE TYPE "SelfieCheckProvider" AS ENUM ('MANUAL', 'VENDOR', 'NONE');

-- CreateEnum
CREATE TYPE "ImageQuality" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "TrustTier" AS ENUM ('NEW', 'BASIC_VERIFIED', 'TRUSTED', 'HOST_ELIGIBLE', 'HOST');

-- CreateEnum
CREATE TYPE "TrustVerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "TrustEventType" AS ENUM ('PHONE_VERIFIED', 'GOOGLE_LINKED', 'USERNAME_SET', 'PROFILE_COMPLETED', 'SELF_DECLARATION_ACCEPTED', 'SELFIE_SUBMITTED', 'SELFIE_APPROVED', 'SELFIE_REJECTED', 'EVENT_ATTENDED', 'NO_SHOW', 'REPORT_CONFIRMED');

-- CreateEnum
CREATE TYPE "VerificationReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "ActivityDifficulty" AS ENUM ('EASY', 'BEGINNER', 'SOCIAL', 'FOCUSED');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('REQUESTED', 'APPROVED', 'CANCELLED', 'ATTENDED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('SPAM', 'FAKE_PROFILE', 'HARASSMENT', 'INAPPROPRIATE_BEHAVIOUR', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('VERIFICATION_APPROVED', 'JOIN_REQUEST_ACCEPTED', 'EVENT_REMINDER', 'HOST_UPDATED_LOCATION', 'CIRCLE_STARTING', 'REPORT_UPDATE');

-- CreateEnum
CREATE TYPE "ChatThreadType" AS ENUM ('EVENT', 'CIRCLE');

-- AlterTable
ALTER TABLE "User"
  ADD COLUMN "email" TEXT,
  ADD COLUMN "username" TEXT,
  ADD COLUMN "displayName" TEXT,
  ADD COLUMN "authProviders" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "googleVerified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "selfDeclarationAccepted" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "selfDeclarationAcceptedAt" TIMESTAMP(3),
  ADD COLUMN "selfDeclarationVersion" TEXT,
  ALTER COLUMN "phone" DROP NOT NULL;

-- Backfill existing phone-auth users into the new trust inputs.
UPDATE "User"
SET
  "phoneVerified" = true,
  "authProviders" = ARRAY['phone']::TEXT[]
WHERE "phone" IS NOT NULL;

-- CreateTable
CREATE TABLE "UsernameReservation" (
  "username" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UsernameReservation_pkey" PRIMARY KEY ("username")
);

-- CreateTable
CREATE TABLE "UserProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "bio" TEXT,
  "city" TEXT NOT NULL,
  "interests" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "profilePhotoUrl" TEXT,
  "profileCompleteness" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SelfieVerification" (
  "userId" TEXT NOT NULL,
  "status" "SelfieVerificationStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "selfieUrl" TEXT,
  "selfieSubmittedAt" TIMESTAMP(3),
  "selfieCheckProvider" "SelfieCheckProvider" NOT NULL DEFAULT 'MANUAL',
  "faceDetected" BOOLEAN,
  "imageQuality" "ImageQuality",
  "suspectedFake" BOOLEAN,
  "suspectedScreenshot" BOOLEAN,
  "confidence" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SelfieVerification_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "TrustProfile" (
  "userId" TEXT NOT NULL,
  "score" INTEGER NOT NULL DEFAULT 0,
  "tier" "TrustTier" NOT NULL DEFAULT 'NEW',
  "verificationStatus" "TrustVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TrustProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "TrustEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "TrustEventType" NOT NULL,
  "points" INTEGER NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TrustEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationReview" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "selfieUrl" TEXT NOT NULL,
  "status" "VerificationReviewStatus" NOT NULL DEFAULT 'PENDING',
  "reviewerId" TEXT,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "reviewedAt" TIMESTAMP(3),

  CONSTRAINT "VerificationReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "UsernameReservation_userId_key" ON "UsernameReservation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE INDEX "TrustEvent_userId_type_idx" ON "TrustEvent"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationReview_userId_key" ON "VerificationReview"("userId");

-- CreateIndex
CREATE INDEX "VerificationReview_status_createdAt_idx" ON "VerificationReview"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "UsernameReservation" ADD CONSTRAINT "UsernameReservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SelfieVerification" ADD CONSTRAINT "SelfieVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustProfile" ADD CONSTRAINT "TrustProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustEvent" ADD CONSTRAINT "TrustEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationReview" ADD CONSTRAINT "VerificationReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "Event" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "locationName" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3),
  "capacity" INTEGER NOT NULL,
  "difficulty" "ActivityDifficulty" NOT NULL DEFAULT 'SOCIAL',
  "interests" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "status" "ActivityStatus" NOT NULL DEFAULT 'PUBLISHED',
  "requiresVerification" BOOLEAN NOT NULL DEFAULT true,
  "hostId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Circle" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "locationName" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "schedule" TEXT NOT NULL,
  "durationWeeks" INTEGER NOT NULL DEFAULT 6,
  "capacity" INTEGER NOT NULL,
  "difficulty" "ActivityDifficulty" NOT NULL DEFAULT 'SOCIAL',
  "interests" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "status" "ActivityStatus" NOT NULL DEFAULT 'PUBLISHED',
  "requiresVerification" BOOLEAN NOT NULL DEFAULT true,
  "hostId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Circle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventMember" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "MembershipStatus" NOT NULL DEFAULT 'REQUESTED',
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EventMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CircleMember" (
  "id" TEXT NOT NULL,
  "circleId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "MembershipStatus" NOT NULL DEFAULT 'REQUESTED',
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CircleMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserReport" (
  "id" TEXT NOT NULL,
  "reporterId" TEXT NOT NULL,
  "reportedUserId" TEXT,
  "eventId" TEXT,
  "circleId" TEXT,
  "reason" "ReportReason" NOT NULL,
  "details" TEXT,
  "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UserReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBlock" (
  "id" TEXT NOT NULL,
  "blockerId" TEXT NOT NULL,
  "blockedId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UserBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "metadata" JSONB,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
  "userId" TEXT NOT NULL,
  "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
  "showProfileInRecommendations" BOOLEAN NOT NULL DEFAULT true,
  "allowCircleContinuitySuggestions" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "EmergencyContact" (
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "relationship" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EmergencyContact_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "ChatThread" (
  "id" TEXT NOT NULL,
  "type" "ChatThreadType" NOT NULL,
  "eventId" TEXT,
  "circleId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ChatThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
  "id" TEXT NOT NULL,
  "threadId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventFeedback" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "body" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "EventFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Connection" (
  "id" TEXT NOT NULL,
  "userAId" TEXT NOT NULL,
  "userBId" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Connection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Event_city_startsAt_idx" ON "Event"("city", "startsAt");

-- CreateIndex
CREATE INDEX "Event_status_startsAt_idx" ON "Event"("status", "startsAt");

-- CreateIndex
CREATE INDEX "Circle_city_startsAt_idx" ON "Circle"("city", "startsAt");

-- CreateIndex
CREATE INDEX "Circle_status_startsAt_idx" ON "Circle"("status", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "EventMember_eventId_userId_key" ON "EventMember"("eventId", "userId");

-- CreateIndex
CREATE INDEX "EventMember_userId_status_idx" ON "EventMember"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CircleMember_circleId_userId_key" ON "CircleMember"("circleId", "userId");

-- CreateIndex
CREATE INDEX "CircleMember_userId_status_idx" ON "CircleMember"("userId", "status");

-- CreateIndex
CREATE INDEX "UserReport_status_createdAt_idx" ON "UserReport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "UserReport_reportedUserId_status_idx" ON "UserReport"("reportedUserId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "UserBlock_blockerId_blockedId_key" ON "UserBlock"("blockerId", "blockedId");

-- CreateIndex
CREATE INDEX "UserBlock_blockedId_idx" ON "UserBlock"("blockedId");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ChatThread_eventId_key" ON "ChatThread"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatThread_circleId_key" ON "ChatThread"("circleId");

-- CreateIndex
CREATE INDEX "ChatMessage_threadId_createdAt_idx" ON "ChatMessage"("threadId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EventFeedback_eventId_userId_key" ON "EventFeedback"("eventId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Connection_userAId_userBId_key" ON "Connection"("userAId", "userBId");

-- CreateIndex
CREATE INDEX "Connection_userBId_idx" ON "Connection"("userBId");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Circle" ADD CONSTRAINT "Circle_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventMember" ADD CONSTRAINT "EventMember_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventMember" ADD CONSTRAINT "EventMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CircleMember" ADD CONSTRAINT "CircleMember_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CircleMember" ADD CONSTRAINT "CircleMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReport" ADD CONSTRAINT "UserReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReport" ADD CONSTRAINT "UserReport_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReport" ADD CONSTRAINT "UserReport_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReport" ADD CONSTRAINT "UserReport_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyContact" ADD CONSTRAINT "EmergencyContact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatThread" ADD CONSTRAINT "ChatThread_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatThread" ADD CONSTRAINT "ChatThread_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "Circle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "ChatThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventFeedback" ADD CONSTRAINT "EventFeedback_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventFeedback" ADD CONSTRAINT "EventFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_userAId_fkey" FOREIGN KEY ("userAId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_userBId_fkey" FOREIGN KEY ("userBId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
