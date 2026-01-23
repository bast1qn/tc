-- Step 1: Change all SUPER_ADMIN to ADMIN
UPDATE "AdminUser" SET "role" = 'ADMIN' WHERE "role" = 'SUPER_ADMIN';

-- Step 2: Drop the default value temporarily
ALTER TABLE "AdminUser" ALTER COLUMN "role" DROP DEFAULT;

-- Step 3: Create new enum without SUPER_ADMIN
CREATE TYPE "AdminRole_new" AS ENUM ('ADMIN', 'STAFF');

-- Step 4: Alter the column to use the new enum
ALTER TABLE "AdminUser" ALTER COLUMN "role" TYPE "AdminRole_new" USING "role"::text::"AdminRole_new";

-- Step 5: Set the default value on the new type
ALTER TABLE "AdminUser" ALTER COLUMN "role" SET DEFAULT 'ADMIN';

-- Step 6: Drop the old enum
DROP TYPE "AdminRole";

-- Step 7: Rename the new enum to the original name
ALTER TYPE "AdminRole_new" RENAME TO "AdminRole";
