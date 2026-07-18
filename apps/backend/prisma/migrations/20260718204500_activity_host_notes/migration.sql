-- Give every hosted activity an optional event-specific introduction.
ALTER TABLE "Event" ADD COLUMN "hostNote" TEXT;
ALTER TABLE "Circle" ADD COLUMN "hostNote" TEXT;
