ALTER TABLE "UserSettings"
ALTER COLUMN "notificationsEnabled" SET DEFAULT false;

UPDATE "UserSettings"
SET "notificationsEnabled" = false;
