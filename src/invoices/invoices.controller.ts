import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { InvoiceStatus } from '../../generated/prisma/enums';
import { CreateInvoiceItemDto } from './dto/create-invoice-item.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';
import { InvoicesService } from './invoices.service';

@ApiTags('invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private invoicesService: InvoicesService) {}

  @Post()
  @ApiOperation({ summary: 'Create an invoice with line items' })
  create(@Body() dto: CreateInvoiceDto, @CurrentUser() user: { id: string }) {
    return this.invoicesService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List invoices, optionally filtered by status' })
  findAll(@Query('status') status?: InvoiceStatus) {
    return this.invoicesService.findAll(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an invoice by id, including items' })
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update an invoice status' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateInvoiceStatusDto) {
    return this.invoicesService.updateStatus(id, dto.status);
  }

  @Post(':id/items')
  @ApiOperation({ summary: 'Add a line item to an existing invoice' })
  addItem(@Param('id') id: string, @Body() dto: CreateInvoiceItemDto) {
    return this.invoicesService.addItem(id, dto);
  }
}
