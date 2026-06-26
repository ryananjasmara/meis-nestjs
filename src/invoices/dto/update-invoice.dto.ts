import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class UpdateInvoiceDto {
  @ApiProperty({ example: '2026-07-15' })
  @IsDateString()
  dueDate: string;
}
