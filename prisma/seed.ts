import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Create default admin user (password needs to be set after Supabase setup)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@townandcountry.de' },
    update: {},
    create: {
      email: 'admin@townandcountry.de',
      name: 'Admin Benutzer',
      role: 'ADMIN',
    },
  });

  console.log('Created admin user:', admin);

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
