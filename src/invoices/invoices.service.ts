import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { InvoiceStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CreateInvoiceItemDto } from './dto/create-invoice-item.dto';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateInvoiceDto, userId: string) {
    const itemsData = dto.items.map((item) => this.toItemRow(item));
    const totalAmount = itemsData.reduce(
      (sum, item) => sum.plus(item.total),
      new Prisma.Decimal(0),
    );

    return this.prisma.invoice.create({
      data: {
        invoiceNumber: this.generateInvoiceNumber(),
        customerId: dto.customerId,
        dueDate: new Date(dto.dueDate),
        notes: dto.notes,
        totalAmount,
        createdById: userId,
        items: { create: itemsData },
      },
      include: { items: true, customer: true },
    });
  }

  findAll(status?: InvoiceStatus) {
    return this.prisma.invoice.findMany({
      where: status ? { status } : undefined,
      include: { customer: true, items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { customer: true, items: true },
    });
    if (!invoice) {
      throw new NotFoundException(`Invoice ${id} not found`);
    }
    return invoice;
  }

  async updateStatus(id: string, status: InvoiceStatus) {
    await this.findOne(id);
    return this.prisma.invoice.update({
      where: { id },
      data: { status },
      include: { customer: true, items: true },
    });
  }

  async addItem(invoiceId: string, dto: CreateInvoiceItemDto) {
    await this.findOne(invoiceId);
    const itemRow = this.toItemRow(dto);

    return this.prisma.$transaction(async (tx) => {
      await tx.invoiceItem.create({ data: { ...itemRow, invoiceId } });
      const items = await tx.invoiceItem.findMany({ where: { invoiceId } });
      const totalAmount = items.reduce(
        (sum, item) => sum.plus(item.total),
        new Prisma.Decimal(0),
      );
      return tx.invoice.update({
        where: { id: invoiceId },
        data: { totalAmount },
        include: { customer: true, items: true },
      });
    });
  }

  private toItemRow(dto: CreateInvoiceItemDto) {
    const unitPrice = new Prisma.Decimal(dto.unitPrice);
    const total = unitPrice.times(dto.quantity);
    return {
      description: dto.description,
      quantity: dto.quantity,
      unitPrice,
      total,
    };
  }

  private generateInvoiceNumber() {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return `INV-${datePart}-${randomPart}`;
  }
}
