-- Emergency fix: This migration cleans up the failed migration first

-- Step 1: Delete the failed migration entry (this allows Prisma to continue)
DELETE FROM "_prisma_migrations" WHERE migration_name = '20260123124408_remove_super_admin_role';

-- Step 2: Clean up any partially created types
DROP TYPE IF EXISTS "AdminRole_new" CASCADE;

-- Step 3: Convert all SUPER_ADMIN to ADMIN
UPDATE "AdminUser" SET "role" = 'ADMIN' WHERE "role" = 'SUPER_ADMIN';

-- Step 4: Drop default to allow enum modification
ALTER TABLE "AdminUser" ALTER COLUMN "role" DROP DEFAULT;

-- Step 5: Add STAFF to the enum (idempotent - safe to run multiple times)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'STAFF' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AdminRole')) THEN
        ALTER TYPE "AdminRole" ADD VALUE 'STAFF';
    END IF;
END
$$;

-- Step 6: Restore the default
ALTER TABLE "AdminUser" ALTER COLUMN "role" SET DEFAULT 'ADMIN';
