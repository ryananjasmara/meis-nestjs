import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Currency } from '../../../generated/prisma/enums';
import { CreateInvoiceItemDto } from './create-invoice-item.dto';

export class CreateInvoiceDto {
  @ApiProperty({ example: 'b3f1c1a0-...' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ example: '2026-07-15' })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({ enum: Currency, default: Currency.IDR })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional({
    example: 16000,
    description:
      'IDR rate per unit of currency, required when currency is not IDR',
  })
  @IsOptional()
  @IsNumber()
  @Min(0.000001)
  exchangeRate?: number;

  @ApiPropertyOptional({ example: 'Payment due within 30 days' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [CreateInvoiceItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];
}
