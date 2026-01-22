import { PrismaClient, AdminRole } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Hash password for super admin
  const passwordHash = await hash('admin123', 12);

  // Create super admin user
  const superAdmin = await prisma.adminUser.upsert({
    where: { username: 'Admin' },
    update: {
      passwordHash,
      mustChangePassword: true,
    },
    create: {
      username: 'Admin',
      passwordHash,
      role: AdminRole.SUPER_ADMIN,
      mustChangePassword: true,
    },
  });

  console.log('Created/updated super admin user:', {
    id: superAdmin.id,
    username: superAdmin.username,
    role: superAdmin.role,
    mustChangePassword: superAdmin.mustChangePassword,
  });
  console.log('Default credentials: Username: "Admin", Password: "admin123"');
  console.log('IMPORTANT: Change password after first login!');

  // Also create legacy admin user for backwards compatibility
  const legacyAdmin = await prisma.user.upsert({
    where: { email: 'admin@townandcountry.de' },
    update: {},
    create: {
      email: 'admin@townandcountry.de',
      name: 'Admin Benutzer',
      role: 'ADMIN',
    },
  });

  console.log('Created legacy admin user:', legacyAdmin);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
