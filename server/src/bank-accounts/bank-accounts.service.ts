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
    // 1. ถ้าบัญชีใหม่ต้องการเป็น Default -> ต้องไปปลด Default ของเก่าออกก่อน
    if (dto.isDefault) {
      await this.prisma.userBankAccount.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // 2. [UX Improvement] เช็คว่า User นี้เคยมีบัญชีไหม?
    // ถ้ายังไม่มีเลย -> บัญชีแรกควรเป็น Default เสมอ (ถึงแม้จะส่ง isDefault: false มาก็ตาม)
    const existingCount = await this.prisma.userBankAccount.count({
      where: { userId },
    });
    const shouldBeDefault = existingCount === 0 ? true : dto.isDefault;

    // 3. สร้างบัญชี
    return this.prisma.userBankAccount.create({
      data: {
        ...dto,
        isDefault: shouldBeDefault,
        userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.userBankAccount.findMany({
      where: { userId },
      // เรียงลำดับ: เอา Default ขึ้นก่อน, ตามด้วยบัญชีใหม่สุด
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async remove(id: string, userId: string) {
    // 1. หาบัญชีเป้าหมายก่อน
    const account = await this.prisma.userBankAccount.findUnique({
      where: { id },
    });

    if (!account) throw new NotFoundException('Bank account not found');

    // 2. เช็คสิทธิ์: ต้องเป็นของตัวเองเท่านั้น
    if (account.userId !== userId) {
      throw new ForbiddenException(
        'You can only delete your own bank accounts',
      );
    }

    // 3. ลบ
    return this.prisma.userBankAccount.delete({
      where: { id },
    });
  }
}
