import { PrismaClient, AdminRole } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Hash password for admin
  const passwordHash = await hash('admin123', 12);

  // Create admin user
  const admin = await prisma.adminUser.upsert({
    where: { username: 'Admin' },
    update: {
      passwordHash,
      mustChangePassword: true,
    },
    create: {
      username: 'Admin',
      passwordHash,
      role: AdminRole.ADMIN,
      mustChangePassword: true,
    },
  });

  console.log('Created/updated admin user:', {
    id: admin.id,
    username: admin.username,
    role: admin.role,
    mustChangePassword: admin.mustChangePassword,
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
