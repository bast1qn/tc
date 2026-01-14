-- Rename column if it exists with wrong name
DO $$
BEGIN
    -- Check if column exists with wrong name and rename it
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'Submission'
        AND column_name = 'verantworlichr'
    ) THEN
        ALTER TABLE "Submission" RENAME COLUMN "verantworlichr" TO "verantworlice_r";
    END IF;
END $$;

-- Add column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'Submission'
        AND column_name = 'verantworlice_r'
    ) THEN
        ALTER TABLE "Submission" ADD COLUMN "verantworlice_r" TEXT;
    END IF;
END $$;
