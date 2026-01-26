-- Alter table
ALTER TABLE "Submission" ADD COLUMN "trackingToken" TEXT;

-- Add unique constraint
CREATE UNIQUE INDEX "Submission_trackingToken_key" ON "Submission"("trackingToken");
