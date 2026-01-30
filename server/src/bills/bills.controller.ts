// server/src/bills/bills.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { BillsService } from './bills.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('bills')
@UseGuards(ClerkAuthGuard)
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Post()
  create(
    @CurrentUser() user: { id: string },
    @Body() createBillDto: CreateBillDto,
  ) {
    return this.billsService.create(user.id, createBillDto);
  }

  @Get()
  findAll(@CurrentUser() user: { id: string }) {
    return this.billsService.findAll(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.billsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() updateBillDto: UpdateBillDto,
  ) {
    return this.billsService.update(id, user.id, updateBillDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.billsService.remove(id, user.id);
  }

  @Get(':id/summary')
  getSummary(@Param('id') id: string) {
    return this.billsService.getSummary(id);
  }
}
