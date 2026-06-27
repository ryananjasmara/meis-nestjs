import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateChargeCodeDto {
  @ApiProperty({ example: 'PD001' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Port dues and harbor fee' })
  @IsString()
  description: string;

  @ApiPropertyOptional({
    example: true,
    description:
      'Default PPN-taxable flag, used to pre-fill new invoice items that reference this charge code.',
  })
  @IsOptional()
  @IsBoolean()
  isTaxable?: boolean;
}
