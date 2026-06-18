import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  const adminUsername = 'admin';
  const adminPassword = 'adminPassword123'; // Default secure password for local testing
  
  // Check if admin already exists
  const existingAdmin = await prisma.admin.findUnique({
    where: { username: adminUsername }
  });

  if (existingAdmin) {
    console.log(`Admin user "${adminUsername}" already exists.`);
  } else {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const newAdmin = await prisma.admin.create({
      data: {
        username: adminUsername,
        password: hashedPassword,
        name: 'SuciHome HR Manager'
      }
    });
    console.log(`Admin user created successfully!`);
    console.log(`Username: ${adminUsername}`);
    console.log(`Password: ${adminPassword}`);
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
