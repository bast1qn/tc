import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resolveFailedMigration() {
  try {
    // Delete the failed migration record from _prisma_migrations
    await prisma.$executeRaw`
      DELETE FROM "_prisma_migrations"
      WHERE "migration_name" = '20250128180000_add_master_data_tables'
    `;

    console.log('Successfully resolved failed migration');

    // Clean up any partially created tables
    const tables = await prisma.$queryRaw`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE '%Bauleitung%'
      OR table_name LIKE '%Verantwortlicher%'
      OR table_name LIKE '%Gewerk%'
      OR table_name LIKE '%Firma%'
    `;
    console.log('Existing tables:', tables);

  } catch (error) {
    console.error('Error resolving migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

resolveFailedMigration();
