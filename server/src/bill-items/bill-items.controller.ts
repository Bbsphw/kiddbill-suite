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
@UseGuards(ClerkAuthGuard) // 🛡️ บังคับ Login
export class BillItemsController {
  constructor(private readonly billItemsService: BillItemsService) {}

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateBillItemDto) {
    return this.billItemsService.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateBillItemDto,
  ) {
    return this.billItemsService.update(id, user.id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.billItemsService.remove(id, user.id);
  }
}
