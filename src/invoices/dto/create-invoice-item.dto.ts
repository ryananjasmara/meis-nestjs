import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateInvoiceItemDto {
  @ApiProperty({ example: 'Website design services' })
  @IsString()
  description: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 150.0 })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({
    example: 'b3f1c1a0-...',
    description:
      'Optional charge code reference. Used as a template only — description/isTaxable are still stored as plain values on the item.',
  })
  @IsOptional()
  @IsUUID()
  chargeCodeId?: string;

  @ApiPropertyOptional({
    example: true,
    description:
      "Whether this line item is subject to PPN. Defaults to the charge code's default, or to the invoice currency heuristic (IDR=true, non-IDR=false) if no charge code is given.",
  })
  @IsOptional()
  @IsBoolean()
  isTaxable?: boolean;
}
