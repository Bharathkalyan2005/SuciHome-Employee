import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  // 1. Remove default admin if it exists in the database
  try {
    const defaultAdminExists = await prisma.admin.findUnique({
      where: { username: 'admin' }
    });
    if (defaultAdminExists) {
      await prisma.admin.delete({
        where: { username: 'admin' }
      });
      console.log('Removed old default "admin" account.');
    }
  } catch (err) {
    console.log('No default admin cleanup needed or table does not exist yet.');
  }

  // 2. Define the new admin credentials list
  const newAdmins = [
    {
      username: 'Welcome@vrcpvtltd.com',
      password: 'SuciHome@567',
      name: 'SuciHome HR Admin'
    },
    {
      username: 'Ch Bharath Kalyan',
      password: 'Bharath Kalyan',
      name: 'Ch Bharath Kalyan (Admin)'
    }
  ];

  for (const admin of newAdmins) {
    const existingAdmin = await prisma.admin.findUnique({
      where: { username: admin.username }
    });

    if (existingAdmin) {
      console.log(`Admin user "${admin.username}" already exists.`);
    } else {
      const hashedPassword = await bcrypt.hash(admin.password, 10);
      await prisma.admin.create({
        data: {
          username: admin.username,
          password: hashedPassword,
          name: admin.name
        }
      });
      console.log(`Admin user "${admin.username}" created successfully!`);
    }
  }
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
