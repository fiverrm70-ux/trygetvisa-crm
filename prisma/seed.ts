import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@trygetvisa.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@trygetvisa.com',
      password,
      role: Role.SUPER_ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: 'leads@trygetvisa.com' },
    update: {},
    create: {
      name: 'Leads Executive',
      email: 'leads@trygetvisa.com',
      password,
      role: Role.LEADS_EXECUTIVE,
    },
  });

  await prisma.user.upsert({
    where: { email: 'sales@trygetvisa.com' },
    update: {},
    create: {
      name: 'Sales Executive',
      email: 'sales@trygetvisa.com',
      password,
      role: Role.SALES_EXECUTIVE,
    },
  });

  await prisma.user.upsert({
    where: { email: 'process@trygetvisa.com' },
    update: {},
    create: {
      name: 'Process Executive',
      email: 'process@trygetvisa.com',
      password,
      role: Role.PROCESS_EXECUTIVE,
    },
  });

  await prisma.user.upsert({
    where: { email: 'client@trygetvisa.com' },
    update: {},
    create: {
      name: 'Demo Client',
      email: 'client@trygetvisa.com',
      password,
      role: Role.CLIENT,
    },
  });

  console.log('=================================');
  console.log('Demo users created successfully');
  console.log('=================================');
  console.log('SUPER ADMIN: admin@trygetvisa.com / admin123');
  console.log('LEADS EXECUTIVE: leads@trygetvisa.com / admin123');
  console.log('SALES EXECUTIVE: sales@trygetvisa.com / admin123');
  console.log('PROCESS EXECUTIVE: process@trygetvisa.com / admin123');
  console.log('CLIENT: client@trygetvisa.com / admin123');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
