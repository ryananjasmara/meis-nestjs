import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { InvoiceStatus } from '../../../generated/prisma/enums';

export class UpdateInvoiceStatusDto {
  @ApiProperty({ enum: InvoiceStatus, example: InvoiceStatus.SENT })
  @IsEnum(InvoiceStatus)
  status: InvoiceStatus;
}
