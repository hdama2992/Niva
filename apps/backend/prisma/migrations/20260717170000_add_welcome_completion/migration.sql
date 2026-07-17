ALTER TABLE "User" ADD COLUMN "welcomeCompletedAt" TIMESTAMP(3);

UPDATE "User"
SET "welcomeCompletedAt" = NOW()
WHERE "selfDeclarationAccepted" = true;
