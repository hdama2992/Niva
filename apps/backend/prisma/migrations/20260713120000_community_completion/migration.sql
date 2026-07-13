-- CreateEnum
CREATE TYPE "HostApprovalStatus" AS ENUM ('NOT_REQUESTED', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('REVIEWER', 'MODERATOR', 'COMMUNITY_MANAGER', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "AdminAuditAction" AS ENUM ('ADMIN_ACCESS_GRANTED', 'VERIFICATION_REVIEWED', 'REPORT_STATUS_CHANGED', 'HOST_APPROVAL_CHANGED', 'NOTIFICATION_DELIVERY_DISPATCHED');

-- CreateEnum
CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'SKIPPED', 'FAILED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'HOST_APPROVAL_UPDATE';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ATTENDANCE_UPDATED';

-- AlterTable
ALTER TABLE "User"
  ADD COLUMN "communityGuidelinesAccepted" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "communityGuidelinesAcceptedAt" TIMESTAMP(3),
  ADD COLUMN "communityGuidelinesVersion" TEXT;

-- CreateTable
CREATE TABLE "DevicePushToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "platform" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DevicePushToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationDelivery" (
  "id" TEXT NOT NULL,
  "notificationId" TEXT NOT NULL,
  "devicePushTokenId" TEXT NOT NULL,
  "status" "NotificationDeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "providerResponse" JSONB,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HostApproval" (
  "userId" TEXT NOT NULL,
  "status" "HostApprovalStatus" NOT NULL DEFAULT 'NOT_REQUESTED',
  "reason" TEXT,
  "reviewerId" TEXT,
  "requestedAt" TIMESTAMP(3),
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HostApproval_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE "AdminAccess" (
  "userId" TEXT NOT NULL,
  "role" "AdminRole" NOT NULL DEFAULT 'REVIEWER',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdminAccess_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE "AdminAuditLog" (
  "id" TEXT NOT NULL,
  "actorUserId" TEXT,
  "actorLabel" TEXT NOT NULL,
  "action" "AdminAuditAction" NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DevicePushToken_token_key" ON "DevicePushToken"("token");
CREATE INDEX "DevicePushToken_userId_active_idx" ON "DevicePushToken"("userId", "active");
CREATE UNIQUE INDEX "NotificationDelivery_notificationId_devicePushTokenId_key" ON "NotificationDelivery"("notificationId", "devicePushTokenId");
CREATE INDEX "NotificationDelivery_status_createdAt_idx" ON "NotificationDelivery"("status", "createdAt");
CREATE INDEX "HostApproval_status_requestedAt_idx" ON "HostApproval"("status", "requestedAt");
CREATE INDEX "AdminAuditLog_action_createdAt_idx" ON "AdminAuditLog"("action", "createdAt");
CREATE INDEX "AdminAuditLog_targetType_targetId_idx" ON "AdminAuditLog"("targetType", "targetId");

-- AddForeignKey
ALTER TABLE "DevicePushToken" ADD CONSTRAINT "DevicePushToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_devicePushTokenId_fkey" FOREIGN KEY ("devicePushTokenId") REFERENCES "DevicePushToken"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HostApproval" ADD CONSTRAINT "HostApproval_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminAccess" ADD CONSTRAINT "AdminAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
