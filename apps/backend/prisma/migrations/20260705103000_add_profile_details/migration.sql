ALTER TABLE "UserProfile" ADD COLUMN "ageRange" TEXT;
ALTER TABLE "UserProfile" ADD COLUMN "languages" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "UserProfile" ADD COLUMN "occupation" TEXT;
