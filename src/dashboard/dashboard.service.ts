import { Injectable } from '@nestjs/common';
import { InvoiceStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async summary() {
    const [
      totalCustomers,
      totalInvoices,
      statusGroups,
      paidAggregate,
      outstandingAggregate,
      recentInvoices,
    ] = await Promise.all([
      this.prisma.customer.count(),
      this.prisma.invoice.count(),
      this.prisma.invoice.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.invoice.aggregate({
        where: { status: InvoiceStatus.PAID },
        _sum: { totalAmount: true },
      }),
      this.prisma.invoice.aggregate({
        where: { status: { in: [InvoiceStatus.SENT, InvoiceStatus.OVERDUE] } },
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

    return {
      totalCustomers,
      totalInvoices,
      totalRevenue: paidAggregate._sum.totalAmount ?? 0,
      outstandingAmount: outstandingAggregate._sum.totalAmount ?? 0,
      invoicesByStatus,
      recentInvoices,
    };
  }
}
