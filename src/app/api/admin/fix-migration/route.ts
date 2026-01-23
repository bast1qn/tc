import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

/**
 * Emergency endpoint to fix failed migration
 * Call this once to clean up the _prisma_migrations table
 * Then deployments will work again
 */
export async function POST(request: Request) {
  try {
    // Simple protection: check for a secret key
    const authHeader = request.headers.get('authorization');
    const secretKey = process.env.SEED_SECRET || 'initial-setup-2025';

    if (authHeader !== `Bearer ${secretKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Delete the failed migration entry
    await prisma.$executeRawUnsafe(`DELETE FROM "_prisma_migrations" WHERE migration_name = '20260123124408_remove_super_admin_role'`);

    // Clean up any partially created types
    await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "AdminRole_new" CASCADE`);

    // Change all SUPER_ADMIN to ADMIN
    await prisma.$executeRawUnsafe(`UPDATE "AdminUser" SET "role" = 'ADMIN' WHERE "role" = 'SUPER_ADMIN'`);

    // Drop default temporarily
    await prisma.$executeRawUnsafe(`ALTER TABLE "AdminUser" ALTER COLUMN "role" DROP DEFAULT`);

    // Add STAFF to the existing enum (if not already present)
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'STAFF' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AdminRole')) THEN
              ALTER TYPE "AdminRole" ADD VALUE 'STAFF';
          END IF;
      END
      $$
    `);

    // Restore the default
    await prisma.$executeRawUnsafe(`ALTER TABLE "AdminUser" ALTER COLUMN "role" SET DEFAULT 'ADMIN'`);

    return NextResponse.json({
      success: true,
      message: 'Migration fixed successfully. You can now deploy.',
    });
  } catch (error) {
    console.error('Fix migration error:', error);
    return NextResponse.json(
      { error: 'Failed to fix migration: ' + (error as any).message },
      { status: 500 }
    );
  }
}
