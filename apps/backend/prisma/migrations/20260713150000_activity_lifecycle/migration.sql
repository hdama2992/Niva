-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ACTIVITY_UPDATED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ACTIVITY_CANCELLED';

-- AlterEnum
ALTER TYPE "AdminAuditAction" ADD VALUE IF NOT EXISTS 'ACTIVITY_CANCELLED';

-- AlterTable
ALTER TABLE "Event"
  ADD COLUMN "cancellationReason" TEXT,
  ADD COLUMN "cancelledAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Circle"
  ADD COLUMN "cancellationReason" TEXT,
  ADD COLUMN "cancelledAt" TIMESTAMP(3);
