// server/src/bank-accounts/bank-accounts.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BankAccountsService } from './bank-accounts.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { ClerkAuthGuard } from '@/auth/clerk-auth.guard';
import { CurrentUser } from '@/auth/current-user.decorator';

@ApiTags('Bank Accounts')
@ApiBearerAuth()
@Controller('bank-accounts')
@UseGuards(ClerkAuthGuard) // 🛡️ บังคับ Login ทุก Route
export class BankAccountsController {
  constructor(private readonly bankAccountsService: BankAccountsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new bank account' })
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateBankAccountDto,
  ) {
    return this.bankAccountsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all bank accounts for current user' })
  findAll(@CurrentUser() user: { id: string }) {
    return this.bankAccountsService.findAll(user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a bank account' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateBankAccountDto,
  ) {
    return this.bankAccountsService.update(id, user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a bank account' })
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.bankAccountsService.remove(id, user.id);
  }
}
