ALTER TABLE "SelfieVerification"
ADD COLUMN "selfieStoragePath" TEXT;

ALTER TABLE "VerificationReview"
ADD COLUMN "selfieStoragePath" TEXT;
