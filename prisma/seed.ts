import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '../generated/prisma/client';
import { Currency, InvoiceStatus, Role } from '../generated/prisma/enums';

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

type CustomerSeed = {
  name: string;
  email: string;
  phone: string;
  address: string;
  currency: Currency;
};

const CUSTOMERS: CustomerSeed[] = [
  // Domestic principals & cargo owners (billed in IDR)
  {
    name: 'PT Pelayaran Nusantara Bahari',
    email: 'billing@nusantarabahari.test',
    phone: '+62 812 5510 7732',
    address: 'Jl. Yos Sudarso No. 21, Tanjung Priok, Jakarta Utara 14310',
    currency: Currency.IDR,
  },
  {
    name: 'PT Borneo Coal Shipping',
    email: 'finance@borneocoal.test',
    phone: '+62 813 4420 9981',
    address: 'Jl. Jenderal Sudirman No. 60, Balikpapan, Kalimantan Timur 76114',
    currency: Currency.IDR,
  },
  {
    name: 'PT Samudera Indah Pelayaran',
    email: 'billing@samuderaindah.test',
    phone: '+62 815 7732 4410',
    address: 'Jl. Perak Timur No. 88, Surabaya, Jawa Timur 60165',
    currency: Currency.IDR,
  },
  {
    name: 'PT Krakatau Bandar Samudera',
    email: 'ar@krakataubandar.test',
    phone: '+62 816 9012 5543',
    address: 'Jl. Pelabuhan Ciwandan No. 5, Cilegon, Banten 42447',
    currency: Currency.IDR,
  },
  {
    name: 'PT Meratus Line Logistik',
    email: 'billing@meratusline.test',
    phone: '+62 817 3321 8870',
    address: 'Jl. Barito Hilir No. 14, Banjarmasin, Kalimantan Selatan 70234',
    currency: Currency.IDR,
  },
  {
    name: 'PT Tanjung Mas Bulk Carrier',
    email: 'finance@tanjungmasbulk.test',
    phone: '+62 818 6654 2290',
    address: 'Jl. Coaster No. 9, Tanjung Mas, Semarang, Jawa Tengah 50174',
    currency: Currency.IDR,
  },
  {
    name: 'PT Adhiguna Putera Pelayaran',
    email: 'billing@adhigunaputera.test',
    phone: '+62 819 2245 6671',
    address: 'Jl. Gajah Mada No. 33, Jakarta Selatan 12930',
    currency: Currency.IDR,
  },
  {
    name: 'PT Wahana Samudera Raya',
    email: 'ar@wahanasamudera.test',
    phone: '+62 821 5567 8843',
    address: 'Jl. Nusantara No. 17, Makassar, Sulawesi Selatan 90174',
    currency: Currency.IDR,
  },
  {
    name: 'PT Indo Bahari Energi',
    email: 'billing@indobaharienergi.test',
    phone: '+62 822 7789 1123',
    address: 'Jl. Tanjung Api-Api No. 40, Palembang, Sumatera Selatan 30961',
    currency: Currency.IDR,
  },
  {
    name: 'PT Berlian Laju Tanker Nusantara',
    email: 'finance@berlianlaju.test',
    phone: '+62 823 1198 4456',
    address: 'Jl. Enggano No. 8, Tanjung Priok, Jakarta Utara 14270',
    currency: Currency.IDR,
  },
  {
    name: 'PT Cahaya Bahari Logistik',
    email: 'billing@cahayabahari.test',
    phone: '+62 852 4432 9087',
    address: 'Jl. Krakatau Ujung No. 12, Belawan, Medan, Sumatera Utara 20411',
    currency: Currency.IDR,
  },
  {
    name: 'PT Trans Kontinental Energi',
    email: 'ar@transkontinental.test',
    phone: '+62 853 6678 2231',
    address: 'Jl. Sudirman No. 5, Dumai, Riau 28811',
    currency: Currency.IDR,
  },
  // International ship owners / charterers (billed in USD)
  {
    name: 'Ocean Glory Shipping Pte Ltd',
    email: 'accounts@oceanglory-sg.test',
    phone: '+65 6221 4487',
    address: '10 Anson Road, #22-01, Singapore 079903',
    currency: Currency.USD,
  },
  {
    name: 'Pacific Star Maritime Ltd',
    email: 'billing@pacificstar-hk.test',
    phone: '+852 2543 9871',
    address: '15/F, Connaught Road, Central, Hong Kong',
    currency: Currency.USD,
  },
  {
    name: 'Golden Horizon Shipping Co.',
    email: 'ar@goldenhorizon-mh.test',
    phone: '+692 625 3344',
    address: 'Trust Company Complex, Ajeltake Road, Majuro, MH 96960',
    currency: Currency.USD,
  },
  {
    name: 'Blue Wave Tankers Inc.',
    email: 'finance@bluewavetankers.test',
    phone: '+507 263 7754',
    address: 'Calle 50, Edificio Capital Plaza, Panama City, Panama',
    currency: Currency.USD,
  },
  {
    name: 'Eastern Pacific Bulkers Ltd',
    email: 'billing@easternpacificbulkers.test',
    phone: '+65 6334 8821',
    address: '1 Raffles Place, #40-02, Singapore 048616',
    currency: Currency.USD,
  },
];

type ItemSeed = {
  description: string;
  minIdr: number;
  maxIdr: number;
  minUsd: number;
  maxUsd: number;
};

const ITEM_POOL: ItemSeed[] = [
  {
    description: 'Port dues and harbor fee',
    minIdr: 1_500_000,
    maxIdr: 4_500_000,
    minUsd: 120,
    maxUsd: 350,
  },
  {
    description: 'Pilotage fee (in/out)',
    minIdr: 2_000_000,
    maxIdr: 5_000_000,
    minUsd: 150,
    maxUsd: 400,
  },
  {
    description: 'Tug assistance / towage',
    minIdr: 3_000_000,
    maxIdr: 8_000_000,
    minUsd: 250,
    maxUsd: 650,
  },
  {
    description: 'Mooring / unmooring service',
    minIdr: 1_000_000,
    maxIdr: 2_500_000,
    minUsd: 80,
    maxUsd: 200,
  },
  {
    description: 'Husbandry agency fee',
    minIdr: 5_000_000,
    maxIdr: 15_000_000,
    minUsd: 400,
    maxUsd: 1_200,
  },
  {
    description: 'Port disbursement account handling fee',
    minIdr: 2_500_000,
    maxIdr: 6_000_000,
    minUsd: 200,
    maxUsd: 500,
  },
  {
    description: 'Stevedoring charges',
    minIdr: 8_000_000,
    maxIdr: 25_000_000,
    minUsd: 600,
    maxUsd: 2_000,
  },
  {
    description: 'Fresh water supply',
    minIdr: 1_200_000,
    maxIdr: 3_000_000,
    minUsd: 100,
    maxUsd: 250,
  },
  {
    description: 'Bunker survey fee',
    minIdr: 1_800_000,
    maxIdr: 4_000_000,
    minUsd: 150,
    maxUsd: 350,
  },
  {
    description: 'Customs clearance fee',
    minIdr: 2_000_000,
    maxIdr: 5_500_000,
    minUsd: 180,
    maxUsd: 450,
  },
  {
    description: 'Crew change assistance',
    minIdr: 3_500_000,
    maxIdr: 9_000_000,
    minUsd: 300,
    maxUsd: 750,
  },
  {
    description: 'Cargo survey fee',
    minIdr: 2_200_000,
    maxIdr: 6_000_000,
    minUsd: 180,
    maxUsd: 500,
  },
  {
    description: 'Anchorage fee',
    minIdr: 1_000_000,
    maxIdr: 3_000_000,
    minUsd: 90,
    maxUsd: 250,
  },
  {
    description: 'Light dues',
    minIdr: 800_000,
    maxIdr: 2_000_000,
    minUsd: 70,
    maxUsd: 180,
  },
  {
    description: 'Quarantine and health clearance fee',
    minIdr: 1_500_000,
    maxIdr: 3_500_000,
    minUsd: 130,
    maxUsd: 300,
  },
  {
    description: 'Ship chandlery / provisions supply',
    minIdr: 4_000_000,
    maxIdr: 12_000_000,
    minUsd: 350,
    maxUsd: 1_000,
  },
  {
    description: 'Garbage / waste disposal fee',
    minIdr: 900_000,
    maxIdr: 2_200_000,
    minUsd: 80,
    maxUsd: 200,
  },
];

const NOTE_POOL = [
  'Net 30',
  'Settlement upon vessel departure',
  'Disbursement account - final settlement',
  'Husbandry services - Tanjung Priok anchorage',
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

  const customers: Array<
    Awaited<ReturnType<typeof prisma.customer.create>> & { currency: Currency }
  > = [];
  for (const c of CUSTOMERS) {
    const owner = pick(users);
    const customer = await prisma.customer.create({
      data: {
        name: c.name,
        email: c.email,
        phone: c.phone,
        address: c.address,
        createdById: owner.id,
      },
    });
    customers.push({ ...customer, currency: c.currency });
  }

  const totalInvoices = 53;
  for (let i = 1; i <= totalInvoices; i++) {
    const customer = pick(customers);
    const owner = pick(users);
    const status = STATUSES[(i - 1) % STATUSES.length];
    const currency = customer.currency;
    const exchangeRate =
      currency === Currency.USD ? randomInt(15800, 16200) : 1;

    const itemCount = randomInt(1, 3);
    const items = Array.from({ length: itemCount }, () => {
      const pool = pick(ITEM_POOL);
      const quantity = randomInt(1, 5);
      const unitPrice =
        currency === Currency.USD
          ? randomInt(pool.minUsd, pool.maxUsd)
          : randomInt(pool.minIdr, pool.maxIdr);
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
        currency,
        exchangeRate,
        notes: i % 5 === 0 ? pick(NOTE_POOL) : undefined,
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
