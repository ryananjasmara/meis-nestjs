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

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]) {
  return arr[randomInt(0, arr.length - 1)];
}

const CUSTOMERS = [
  {
    name: 'PT Maju Bersama',
    city: 'Jakarta Selatan, DKI Jakarta',
    street: 'Jl. Jenderal Sudirman No. 45',
    postal: '12190',
  },
  {
    name: 'PT Sejahtera Abadi',
    city: 'Bandung, Jawa Barat',
    street: 'Jl. Diponegoro No. 12',
    postal: '40115',
  },
  {
    name: 'PT Cahaya Nusantara',
    city: 'Surabaya, Jawa Timur',
    street: 'Jl. Raya Darmo No. 88',
    postal: '60265',
  },
  {
    name: 'PT Mitra Sukses Mandiri',
    city: 'Semarang, Jawa Tengah',
    street: 'Jl. Pandanaran No. 21',
    postal: '50241',
  },
  {
    name: 'PT Bintang Timur Jaya',
    city: 'Yogyakarta, DI Yogyakarta',
    street: 'Jl. Malioboro No. 5',
    postal: '55213',
  },
  {
    name: 'PT Karya Indah Lestari',
    city: 'Medan, Sumatera Utara',
    street: 'Jl. Gatot Subroto No. 110',
    postal: '20115',
  },
  {
    name: 'PT Tunas Harapan Bangsa',
    city: 'Makassar, Sulawesi Selatan',
    street: 'Jl. Boulevard No. 33',
    postal: '90234',
  },
  {
    name: 'PT Anugrah Sentosa',
    city: 'Denpasar, Bali',
    street: 'Jl. Sunset Road No. 9',
    postal: '80361',
  },
  {
    name: 'PT Wahana Cipta Karya',
    city: 'Palembang, Sumatera Selatan',
    street: 'Jl. Demang Lebar Daun No. 17',
    postal: '30137',
  },
  {
    name: 'PT Sumber Rejeki Abadi',
    city: 'Balikpapan, Kalimantan Timur',
    street: 'Jl. Jenderal Sudirman No. 60',
    postal: '76114',
  },
  {
    name: 'PT Bumi Perkasa Mandiri',
    city: 'Malang, Jawa Timur',
    street: 'Jl. Ijen No. 25',
    postal: '65112',
  },
  {
    name: 'PT Citra Mega Sentosa',
    city: 'Bekasi, Jawa Barat',
    street: 'Jl. Ahmad Yani No. 78',
    postal: '17141',
  },
  {
    name: 'PT Graha Mulia Sejahtera',
    city: 'Bogor, Jawa Barat',
    street: 'Jl. Pajajaran No. 40',
    postal: '16143',
  },
  {
    name: 'PT Lintas Buana Nusa',
    city: 'Pekanbaru, Riau',
    street: 'Jl. Sudirman No. 92',
    postal: '28116',
  },
  {
    name: 'PT Sentra Niaga Utama',
    city: 'Manado, Sulawesi Utara',
    street: 'Jl. Piere Tendean No. 14',
    postal: '95111',
  },
];

const ITEM_POOL: Array<{
  description: string;
  minPrice: number;
  maxPrice: number;
}> = [
  {
    description: 'Website design services',
    minPrice: 1500000,
    maxPrice: 3500000,
  },
  { description: 'Hosting (monthly)', minPrice: 300000, maxPrice: 750000 },
  { description: 'Consulting hours', minPrice: 500000, maxPrice: 1000000 },
  { description: 'Domain renewal', minPrice: 150000, maxPrice: 400000 },
  {
    description: 'Annual support contract',
    minPrice: 8000000,
    maxPrice: 15000000,
  },
  { description: 'Logo redesign', minPrice: 1000000, maxPrice: 2500000 },
  { description: 'SEO optimization', minPrice: 1200000, maxPrice: 3000000 },
  {
    description: 'Mobile app development',
    minPrice: 5000000,
    maxPrice: 12000000,
  },
  { description: 'Server maintenance', minPrice: 800000, maxPrice: 2000000 },
  { description: 'Database migration', minPrice: 2000000, maxPrice: 5000000 },
  { description: 'UI/UX design', minPrice: 2500000, maxPrice: 6000000 },
  { description: 'Content writing', minPrice: 300000, maxPrice: 900000 },
  {
    description: 'Social media management',
    minPrice: 1000000,
    maxPrice: 2500000,
  },
  {
    description: 'Cloud infrastructure setup',
    minPrice: 3000000,
    maxPrice: 7000000,
  },
  { description: 'Security audit', minPrice: 4000000, maxPrice: 9000000 },
];

const STATUSES = [
  InvoiceStatus.DRAFT,
  InvoiceStatus.SENT,
  InvoiceStatus.PAID,
  InvoiceStatus.OVERDUE,
  InvoiceStatus.CANCELLED,
];

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

  const users = [admin, staff];

  const customers = [];
  for (const c of CUSTOMERS) {
    const slug = c.name
      .toLowerCase()
      .replace(/^pt\s+/, '')
      .replace(/[^a-z0-9]+/g, '');
    const owner = pick(users);
    const customer = await prisma.customer.create({
      data: {
        name: c.name,
        email: `billing@${slug}.test`,
        phone: `+62 8${randomInt(11, 99)} ${randomInt(1000, 9999)} ${randomInt(1000, 9999)}`,
        address: `${c.street}, ${c.city} ${c.postal}`,
        createdById: owner.id,
      },
    });
    customers.push(customer);
  }

  const totalInvoices = 120;
  for (let i = 1; i <= totalInvoices; i++) {
    const customer = pick(customers);
    const owner = pick(users);
    const status = STATUSES[(i - 1) % STATUSES.length];

    const itemCount = randomInt(1, 3);
    const items = Array.from({ length: itemCount }, () => {
      const pool = pick(ITEM_POOL);
      const quantity = randomInt(1, 5);
      const unitPrice = randomInt(pool.minPrice, pool.maxPrice);
      return itemRow(pool.description, quantity, unitPrice);
    });
    const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

    const dueOffsetDays = randomInt(-45, 45);
    const dueDate = new Date(Date.now() + dueOffsetDays * 24 * 60 * 60 * 1000);

    await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-SEED-${String(i).padStart(4, '0')}`,
        customerId: customer.id,
        createdById: owner.id,
        status,
        dueDate,
        notes: i % 5 === 0 ? 'Net 30' : undefined,
        totalAmount,
        items: { create: items },
      },
    });
  }

  console.log(
    `Seed complete: ${customers.length} customers, ${totalInvoices} invoices.`,
  );
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
