-- Clean up from failed migration and apply the changes properly

-- Step 1: Drop the partially created new enum type if it exists
DROP TYPE IF EXISTS "AdminRole_new" CASCADE;

-- Step 2: Change all SUPER_ADMIN to ADMIN (idempotent)
UPDATE "AdminUser" SET "role" = 'ADMIN' WHERE "role" = 'SUPER_ADMIN';

-- Step 3: Drop default temporarily
ALTER TABLE "AdminUser" ALTER COLUMN "role" DROP DEFAULT;

-- Step 4: Add STAFF to the existing enum
ALTER TYPE "AdminRole" ADD VALUE 'STAFF';

-- Step 5: Restore the default
ALTER TABLE "AdminUser" ALTER COLUMN "role" SET DEFAULT 'ADMIN';
