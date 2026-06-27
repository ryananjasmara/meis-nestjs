import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChargeCodeDto } from './dto/create-charge-code.dto';
import { UpdateChargeCodeDto } from './dto/update-charge-code.dto';

@Injectable()
export class ChargeCodesService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateChargeCodeDto) {
    return this.prisma.chargeCode.create({ data: dto });
  }

  findAll(search?: string) {
    const where: Prisma.ChargeCodeWhereInput | undefined = search
      ? {
          OR: [
            { code: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }
      : undefined;

    return this.prisma.chargeCode.findMany({ where, orderBy: { code: 'asc' } });
  }

  async findOne(id: string) {
    const chargeCode = await this.prisma.chargeCode.findUnique({
      where: { id },
    });
    if (!chargeCode) {
      throw new NotFoundException(`Charge code ${id} not found`);
    }
    return chargeCode;
  }

  async update(id: string, dto: UpdateChargeCodeDto) {
    await this.findOne(id);
    return this.prisma.chargeCode.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.chargeCode.delete({ where: { id } });
  }
}
