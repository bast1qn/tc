import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

// Admin endpoint to resolve failed Prisma migrations
export async function POST() {
  try {
    // Check if the failed migration exists
    const result = await prisma.$queryRaw`
      SELECT * FROM "_prisma_migrations"
      WHERE "migration_name" = '20250128180000_add_master_data_tables'
    ` as any[];

    if (result.length > 0) {
      // Delete the failed migration record
      await prisma.$executeRaw`
        DELETE FROM "_prisma_migrations"
        WHERE "migration_name" = '20250128180000_add_master_data_tables'
      `;

      return NextResponse.json({
        success: true,
        message: 'Failed migration resolved',
        removedMigration: result[0].migration_name,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'No failed migration found',
    });
  } catch (error) {
    console.error('Resolve migration error:', error);
    return NextResponse.json(
      { error: 'Failed to resolve migration' },
      { status: 500 }
    );
  }
}
