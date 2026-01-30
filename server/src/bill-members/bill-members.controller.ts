// server/src/bill-members/bill-members.controller.ts

import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { BillMembersService } from './bill-members.service';
import { JoinBillDto } from './dto/join-bill-member.dto';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('bill-members')
@UseGuards(ClerkAuthGuard)
export class BillMembersController {
  constructor(private readonly billMembersService: BillMembersService) {}

  @Post('join')
  join(@CurrentUser() user: { id: string }, @Body() joinBillDto: JoinBillDto) {
    return this.billMembersService.join(user.id, joinBillDto);
  }

  @Get(':billId')
  findAll(@Param('billId') billId: string) {
    return this.billMembersService.findAll(billId);
  }
}
