import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'PT Cahaya Mas Cemerlang' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'cahayamascemerlang@cms.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+62 812 3456 7890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Jl. Raya Cemerlang No. 123' })
  @IsOptional()
  @IsString()
  address?: string;
}
