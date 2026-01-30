// server/src/bank-accounts/bank-accounts.service.ts

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';

@Injectable()
export class BankAccountsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateBankAccountDto) {
    // ถ้าอันใหม่เป็น Default ให้ไปเคลียร์อันเก่าก่อน
    if (dto.isDefault) {
      await this.prisma.userBankAccount.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    return this.prisma.userBankAccount.create({
      data: {
        ...dto,
        userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.userBankAccount.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' }, // เอา Default ขึ้นก่อน
    });
  }

  async remove(id: string, userId: string) {
    // เช็คความเป็นเจ้าของก่อนลบ
    const account = await this.prisma.userBankAccount.findUnique({
      where: { id },
    });
    if (!account) throw new NotFoundException('Account not found');
    if (account.userId !== userId)
      throw new ForbiddenException('Not your account');

    return this.prisma.userBankAccount.delete({ where: { id } });
  }
}
