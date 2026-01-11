import { prisma } from '../src/lib/prisma.js';
import { hashPassword } from '../src/utils/helpers.js';

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const hashedPassword = await hashPassword('demo1234');

  const user = await prisma.user.upsert({
    where: { email: 'demo@zetwa.com' },
    update: {},
    create: {
      email: 'demo@zetwa.com',
      password: hashedPassword,
      name: 'Demo User',
      isVerified: true,
    },
  });

  console.log(`✅ Created demo user: ${user.email}`);

  console.log('🌱 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
