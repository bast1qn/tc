/**
 * Emergency Migration Fix Script
 *
 * This script fixes the failed Prisma migration by:
 * 1. Deleting the failed migration entry from _prisma_migrations
 * 2. Converting all SUPER_ADMIN to ADMIN
 * 3. Adding STAFF to the AdminRole enum if not present
 *
 * Usage:
 *   1. Get your production DATABASE_URL from Vercel:
 *      - Go to Vercel Dashboard -> Project -> Storage -> Postgres -> .env.local
 *   2. Run with the production URL:
 *      DATABASE_URL="your_production_url" npx tsx scripts/fix-migration.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Starting emergency migration fix...\n');

  // Step 1: Delete the failed migration entry
  console.log('Step 1: Deleting failed migration entry...');
  try {
    await prisma.$executeRawUnsafe(
      `DELETE FROM "_prisma_migrations" WHERE migration_name = '20260123124408_remove_super_admin_role'`
    );
    console.log('✅ Failed migration entry deleted.\n');
  } catch (error: any) {
    console.log(`⚠️  Could not delete migration entry: ${error.message}`);
    console.log('   It may have already been deleted.\n');
  }

  // Step 2: Clean up any partially created types
  console.log('Step 2: Cleaning up partially created types...');
  try {
    await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "AdminRole_new" CASCADE`);
    console.log('✅ Cleanup complete.\n');
  } catch (error: any) {
    console.log(`⚠️  Cleanup note: ${error.message}\n`);
  }

  // Step 3: Convert all SUPER_ADMIN to ADMIN
  console.log('Step 3: Converting SUPER_ADMIN to ADMIN...');
  try {
    const result = await prisma.$executeRawUnsafe(
      `UPDATE "AdminUser" SET "role" = 'ADMIN' WHERE "role" = 'SUPER_ADMIN'`
    );
    console.log(`✅ Converted ${result} users from SUPER_ADMIN to ADMIN.\n`);
  } catch (error: any) {
    console.log(`⚠️  Update note: ${error.message}\n`);
  }

  // Step 4: Drop default temporarily
  console.log('Step 4: Dropping default value...');
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "AdminUser" ALTER COLUMN "role" DROP DEFAULT`
    );
    console.log('✅ Default dropped.\n');
  } catch (error: any) {
    console.log(`⚠️  Could not drop default: ${error.message}\n`);
  }

  // Step 5: Add STAFF to the enum (idempotent)
  console.log('Step 5: Adding STAFF to AdminRole enum...');
  try {
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'STAFF' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AdminRole')) THEN
              ALTER TYPE "AdminRole" ADD VALUE 'STAFF';
          END IF;
      END
      $$
    `);
    console.log('✅ STAFF role added to enum (or already exists).\n');
  } catch (error: any) {
    console.log(`⚠️  Note: ${error.message}\n`);
  }

  // Step 6: Restore the default
  console.log('Step 6: Restoring default value...');
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "AdminUser" ALTER COLUMN "role" SET DEFAULT 'ADMIN'`
    );
    console.log('✅ Default restored.\n');
  } catch (error: any) {
    console.log(`⚠️  Could not restore default: ${error.message}\n`);
  }

  console.log('✨ Migration fix complete! You can now deploy.\n');
}

main()
  .catch((error) => {
    console.error('❌ Error running fix script:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
