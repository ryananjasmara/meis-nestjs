import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '../generated/prisma/client';
import { InvoiceStatus, Role } from '../generated/prisma/enums';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

function itemRow(description: string, quantity: number, unitPrice: number) {
  return { description, quantity, unitPrice, total: quantity * unitPrice };
}

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@meis.test' },
    update: {},
    create: {
      email: 'admin@meis.test',
      name: 'Budi Santoso',
      password: passwordHash,
      role: Role.ADMIN,
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@meis.test' },
    update: {},
    create: {
      email: 'staff@meis.test',
      name: 'Siti Rahayu',
      password: passwordHash,
      role: Role.STAFF,
    },
  });

  const acme = await prisma.customer.create({
    data: {
      name: 'PT Maju Bersama',
      email: 'billing@majubersama.test',
      phone: '+62 21 5551234',
      address:
        'Jl. Jenderal Sudirman No. 45, Jakarta Selatan, DKI Jakarta 12190',
      createdById: admin.id,
    },
  });

  const globex = await prisma.customer.create({
    data: {
      name: 'PT Sejahtera Abadi',
      email: 'ap@sejahteraabadi.test',
      phone: '+62 812 3456 7890',
      address: 'Jl. Diponegoro No. 12, Bandung, Jawa Barat 40115',
      createdById: staff.id,
    },
  });

  await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-SEED-0001',
      customerId: acme.id,
      createdById: admin.id,
      status: InvoiceStatus.PAID,
      dueDate: new Date('2026-05-15'),
      totalAmount: 450,
      items: {
        create: [
          itemRow('Website design services', 2, 150),
          itemRow('Hosting (monthly)', 1, 150),
        ],
      },
    },
  });

  await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-SEED-0002',
      customerId: acme.id,
      createdById: staff.id,
      status: InvoiceStatus.SENT,
      dueDate: new Date('2026-07-01'),
      notes: 'Net 30',
      totalAmount: 825,
      items: {
        create: [
          itemRow('Consulting hours', 5, 150),
          itemRow('Domain renewal', 1, 75),
        ],
      },
    },
  });

  await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-SEED-0003',
      customerId: globex.id,
      createdById: admin.id,
      status: InvoiceStatus.DRAFT,
      dueDate: new Date('2026-07-20'),
      totalAmount: 1200,
      items: {
        create: [itemRow('Annual support contract', 1, 1200)],
      },
    },
  });

  await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-SEED-0004',
      customerId: globex.id,
      createdById: staff.id,
      status: InvoiceStatus.OVERDUE,
      dueDate: new Date('2026-05-01'),
      totalAmount: 300,
      items: {
        create: [itemRow('Logo redesign', 1, 300)],
      },
    },
  });

  console.log('Seed complete.');
  console.log('Login with: admin@meis.test / password123 (ADMIN)');
  console.log('        or: staff@meis.test / password123 (STAFF)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
