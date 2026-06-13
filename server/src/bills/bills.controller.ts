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
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { BillsService } from './bills.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { ClerkAuthGuard } from '@/auth/clerk-auth.guard';
import { CurrentUser } from '@/auth/current-user.decorator';

@ApiTags('Bills')
@ApiBearerAuth()
@Controller('bills')
@UseGuards(ClerkAuthGuard) // 🛡️ บังคับ Login
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new bill' })
  @ApiResponse({
    status: 201,
    description: 'The bill has been successfully created.',
  })
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateBillDto) {
    return this.billsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all bills for current user' })
  findAll(@CurrentUser() user: { id: string }) {
    return this.billsService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bill details by ID' })
  findOne(@Param('id') id: string) {
    return this.billsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a bill' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateBillDto,
  ) {
    return this.billsService.update(id, user.id, dto);
  }

  @Patch(':id/close') // ✅ API ปิดบิล
  @ApiOperation({ summary: 'Close a bill (finalize splits)' })
  close(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.billsService.close(id, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a bill' })
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.billsService.remove(id, user.id);
  }

  @Get(':id/summary') // ✅ API ดูยอดเงิน
  @ApiOperation({ summary: 'Get financial summary of a bill' })
  getSummary(@Param('id') id: string) {
    return this.billsService.getSummary(id);
  }
}
