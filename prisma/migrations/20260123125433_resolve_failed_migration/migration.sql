-- Resolve the failed migration and apply the changes

-- Step 1: Mark the failed migration as rolled back (or delete it)
DELETE FROM "_prisma_migrations" WHERE migration_name = '20260123124408_remove_super_admin_role';

-- Step 2: Clean up any partially created types
DROP TYPE IF EXISTS "AdminRole_new" CASCADE;

-- Step 3: Change all SUPER_ADMIN to ADMIN
UPDATE "AdminUser" SET "role" = 'ADMIN' WHERE "role" = 'SUPER_ADMIN';

-- Step 4: Drop default temporarily to allow enum modification
ALTER TABLE "AdminUser" ALTER COLUMN "role" DROP DEFAULT;

-- Step 5: Add STAFF to the existing enum (if not already present)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'STAFF' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AdminRole')) THEN
        ALTER TYPE "AdminRole" ADD VALUE 'STAFF';
    END IF;
END
$$;

-- Step 6: Restore the default
ALTER TABLE "AdminUser" ALTER COLUMN "role" SET DEFAULT 'ADMIN';
