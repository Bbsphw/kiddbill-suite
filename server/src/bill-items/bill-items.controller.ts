// server/src/bill-items/bill-items.controller.ts

import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { BillItemsService } from './bill-items.service';
import { CreateBillItemDto } from './dto/create-bill-item.dto';
import { UpdateBillItemDto } from './dto/update-bill-item.dto';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('bill-items')
@UseGuards(ClerkAuthGuard)
export class BillItemsController {
  constructor(private readonly billItemsService: BillItemsService) {}

  @Post()
  create(
    @CurrentUser() user: { id: string },
    @Body() createBillItemDto: CreateBillItemDto,
  ) {
    return this.billItemsService.create(user.id, createBillItemDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() updateBillItemDto: UpdateBillItemDto,
  ) {
    return this.billItemsService.update(id, user.id, updateBillItemDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.billItemsService.remove(id, user.id);
  }
}
