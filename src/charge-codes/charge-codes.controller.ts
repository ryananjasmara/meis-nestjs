import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChargeCodesService } from './charge-codes.service';
import { CreateChargeCodeDto } from './dto/create-charge-code.dto';
import { UpdateChargeCodeDto } from './dto/update-charge-code.dto';

@ApiTags('charge-codes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('charge-codes')
export class ChargeCodesController {
  constructor(private chargeCodesService: ChargeCodesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a charge code' })
  create(@Body() dto: CreateChargeCodeDto) {
    return this.chargeCodesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List charge codes, with optional search' })
  findAll(@Query('search') search?: string) {
    return this.chargeCodesService.findAll(search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a charge code by id' })
  findOne(@Param('id') id: string) {
    return this.chargeCodesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a charge code' })
  update(@Param('id') id: string, @Body() dto: UpdateChargeCodeDto) {
    return this.chargeCodesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a charge code' })
  remove(@Param('id') id: string) {
    return this.chargeCodesService.remove(id);
  }
}
