import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { Currency, InvoiceStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';

const OUTSTANDING_STATUSES: InvoiceStatus[] = [
  InvoiceStatus.SENT,
  InvoiceStatus.OVERDUE,
];

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async summary() {
    const [
      totalCustomers,
      totalInvoices,
      statusGroups,
      conversionRows,
      currencyGroups,
      recentInvoices,
    ] = await Promise.all([
      this.prisma.customer.count(),
      this.prisma.invoice.count(),
      this.prisma.invoice.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.invoice.findMany({
        where: {
          status: { in: [InvoiceStatus.PAID, ...OUTSTANDING_STATUSES] },
        },
        select: { status: true, totalAmount: true, exchangeRate: true },
      }),
      this.prisma.invoice.groupBy({
        by: ['currency', 'status'],
        where: {
          status: { in: [InvoiceStatus.PAID, ...OUTSTANDING_STATUSES] },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.invoice.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { customer: true },
      }),
    ]);

    const invoicesByStatus = Object.fromEntries(
      Object.values(InvoiceStatus).map((status) => [status, 0]),
    ) as Record<InvoiceStatus, number>;
    for (const group of statusGroups) {
      invoicesByStatus[group.status] = group._count._all;
    }

    const totalRevenue = conversionRows
      .filter((row) => row.status === InvoiceStatus.PAID)
      .reduce(
        (sum, row) => sum.plus(row.totalAmount.times(row.exchangeRate)),
        new Prisma.Decimal(0),
      );
    const outstandingAmount = conversionRows
      .filter((row) => OUTSTANDING_STATUSES.includes(row.status))
      .reduce(
        (sum, row) => sum.plus(row.totalAmount.times(row.exchangeRate)),
        new Prisma.Decimal(0),
      );

    const revenueByCurrency = Object.fromEntries(
      Object.values(Currency).map((currency) => [
        currency,
        { paid: new Prisma.Decimal(0), outstanding: new Prisma.Decimal(0) },
      ]),
    ) as Record<
      Currency,
      { paid: Prisma.Decimal; outstanding: Prisma.Decimal }
    >;
    for (const group of currencyGroups) {
      const amount = group._sum.totalAmount ?? new Prisma.Decimal(0);
      if (group.status === InvoiceStatus.PAID) {
        revenueByCurrency[group.currency].paid =
          revenueByCurrency[group.currency].paid.plus(amount);
      } else if (OUTSTANDING_STATUSES.includes(group.status)) {
        revenueByCurrency[group.currency].outstanding =
          revenueByCurrency[group.currency].outstanding.plus(amount);
      }
    }

    return {
      totalCustomers,
      totalInvoices,
      totalRevenue,
      outstandingAmount,
      revenueByCurrency,
      invoicesByStatus,
      recentInvoices,
    };
  }
}
