import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { Currency, InvoiceStatus } from '../../generated/prisma/enums';
import { CURRENT_VAT_RATE } from '../common/constants/tax.constants';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CreateInvoiceItemDto } from './dto/create-invoice-item.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { UpdateInvoiceItemDto } from './dto/update-invoice-item.dto';

export type FindAllInvoicesParams = {
  status?: InvoiceStatus;
  customerId?: string;
  search?: string;
  page?: number;
  limit?: number;
};

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateInvoiceDto, userId: string) {
    const { currency, exchangeRate } = this.resolveCurrency(
      dto.currency,
      dto.exchangeRate,
    );
    const vatRate = new Prisma.Decimal(CURRENT_VAT_RATE);

    const itemsData = await Promise.all(
      dto.items.map((item) => this.buildItemRow(item, currency)),
    );
    const { totalAmount, vatAmount, grandTotal } = this.sumItems(
      itemsData,
      vatRate,
    );

    return this.prisma.invoice.create({
      data: {
        invoiceNumber: this.generateInvoiceNumber(),
        customerId: dto.customerId,
        dueDate: new Date(dto.dueDate),
        currency,
        exchangeRate,
        notes: dto.notes,
        totalAmount,
        vatRate,
        vatAmount,
        grandTotal,
        createdById: userId,
        items: { create: itemsData },
      },
      include: { items: true, customer: true },
    });
  }

  async findAll(params: FindAllInvoicesParams = {}) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 10;

    const where: Prisma.InvoiceWhereInput = {};
    if (params.status) where.status = params.status;
    if (params.customerId) where.customerId = params.customerId;
    if (params.search) {
      where.OR = [
        { invoiceNumber: { contains: params.search, mode: 'insensitive' } },
        {
          customer: { name: { contains: params.search, mode: 'insensitive' } },
        },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: { customer: true, items: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
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

  async update(id: string, dto: UpdateInvoiceDto) {
    const invoice = await this.findOne(id);
    this.assertDraft(invoice.status);

    const currencyChanged =
      dto.currency !== undefined || dto.exchangeRate !== undefined;
    const resolved = currencyChanged
      ? this.resolveCurrency(
          dto.currency ?? invoice.currency,
          dto.exchangeRate ?? Number(invoice.exchangeRate),
        )
      : undefined;

    return this.prisma.invoice.update({
      where: { id },
      data: {
        ...(dto.dueDate !== undefined && { dueDate: new Date(dto.dueDate) }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(resolved && {
          currency: resolved.currency,
          exchangeRate: resolved.exchangeRate,
        }),
      },
      include: { customer: true, items: true },
    });
  }

  async updateItem(
    invoiceId: string,
    itemId: string,
    dto: UpdateInvoiceItemDto,
  ) {
    const invoice = await this.findOne(invoiceId);
    this.assertDraft(invoice.status);

    const item = invoice.items.find((i) => i.id === itemId);
    if (!item) {
      throw new NotFoundException(`Item ${itemId} not found on this invoice`);
    }

    const description = dto.description ?? item.description;
    const quantity = dto.quantity ?? item.quantity;
    const unitPrice = dto.unitPrice ?? Number(item.unitPrice);
    const total = new Prisma.Decimal(unitPrice).times(quantity);
    const chargeCodeId =
      dto.chargeCodeId !== undefined ? dto.chargeCodeId : item.chargeCodeId;
    const isTaxable = await this.resolveItemTax(
      chargeCodeId ?? undefined,
      dto.isTaxable ?? item.isTaxable,
      invoice.currency,
    );

    return this.prisma.$transaction(async (tx) => {
      await tx.invoiceItem.update({
        where: { id: itemId },
        data: {
          description,
          quantity,
          unitPrice,
          total,
          isTaxable,
          chargeCodeId,
        },
      });
      return this.recalculateTotal(tx, invoiceId);
    });
  }

  async addItem(invoiceId: string, dto: CreateInvoiceItemDto) {
    const invoice = await this.findOne(invoiceId);
    this.assertDraft(invoice.status);
    const itemRow = await this.buildItemRow(dto, invoice.currency);

    return this.prisma.$transaction(async (tx) => {
      await tx.invoiceItem.create({ data: { ...itemRow, invoiceId } });
      return this.recalculateTotal(tx, invoiceId);
    });
  }

  async removeItem(invoiceId: string, itemId: string) {
    const invoice = await this.findOne(invoiceId);
    this.assertDraft(invoice.status);

    const item = invoice.items.find((i) => i.id === itemId);
    if (!item) {
      throw new NotFoundException(`Item ${itemId} not found on this invoice`);
    }
    if (invoice.items.length === 1) {
      throw new BadRequestException('An invoice must have at least one item');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.invoiceItem.delete({ where: { id: itemId } });
      return this.recalculateTotal(tx, invoiceId);
    });
  }

  private resolveCurrency(currency?: Currency, exchangeRate?: number) {
    const resolvedCurrency = currency ?? Currency.IDR;
    if (resolvedCurrency === Currency.IDR) {
      return {
        currency: resolvedCurrency,
        exchangeRate: new Prisma.Decimal(1),
      };
    }
    if (!exchangeRate || exchangeRate <= 0) {
      throw new BadRequestException(
        'exchangeRate is required and must be greater than 0 for non-IDR currencies',
      );
    }
    return {
      currency: resolvedCurrency,
      exchangeRate: new Prisma.Decimal(exchangeRate),
    };
  }

  private assertDraft(status: InvoiceStatus) {
    if (status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException(
        'Only draft invoices can have their items modified',
      );
    }
  }

  private async recalculateTotal(
    tx: Prisma.TransactionClient,
    invoiceId: string,
  ) {
    const invoice = await tx.invoice.findUniqueOrThrow({
      where: { id: invoiceId },
    });
    const items = await tx.invoiceItem.findMany({ where: { invoiceId } });
    const { totalAmount, vatAmount, grandTotal } = this.sumItems(
      items,
      invoice.vatRate,
    );

    return tx.invoice.update({
      where: { id: invoiceId },
      data: { totalAmount, vatAmount, grandTotal },
      include: { customer: true, items: true },
    });
  }

  /** Sums item totals, splitting out the VAT-eligible (isTaxable) portion. */
  private sumItems(
    items: Array<{ total: Prisma.Decimal; isTaxable: boolean }>,
    vatRate: Prisma.Decimal,
  ) {
    const totalAmount = items.reduce(
      (sum, item) => sum.plus(item.total),
      new Prisma.Decimal(0),
    );
    const taxableAmount = items
      .filter((item) => item.isTaxable)
      .reduce((sum, item) => sum.plus(item.total), new Prisma.Decimal(0));
    const vatAmount = taxableAmount.times(vatRate);
    return { totalAmount, vatAmount, grandTotal: totalAmount.plus(vatAmount) };
  }

  /**
   * Resolves whether a line item is PPN-taxable: an explicit value always
   * wins; otherwise fall back to the linked charge code's default; otherwise
   * fall back to the currency heuristic (IDR=true, non-IDR=false).
   */
  private async resolveItemTax(
    chargeCodeId: string | undefined,
    explicitIsTaxable: boolean | undefined,
    currency: Currency,
  ): Promise<boolean> {
    if (explicitIsTaxable !== undefined) return explicitIsTaxable;
    if (chargeCodeId) {
      const chargeCode = await this.prisma.chargeCode.findUnique({
        where: { id: chargeCodeId },
      });
      if (chargeCode) return chargeCode.isTaxable;
    }
    return currency === Currency.IDR;
  }

  private async buildItemRow(dto: CreateInvoiceItemDto, currency: Currency) {
    const unitPrice = new Prisma.Decimal(dto.unitPrice);
    const total = unitPrice.times(dto.quantity);
    const isTaxable = await this.resolveItemTax(
      dto.chargeCodeId,
      dto.isTaxable,
      currency,
    );
    return {
      description: dto.description,
      quantity: dto.quantity,
      unitPrice,
      total,
      isTaxable,
      chargeCodeId: dto.chargeCodeId,
    };
  }

  private generateInvoiceNumber() {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return `INV-${datePart}-${randomPart}`;
  }
}
