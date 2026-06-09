// server/src/bank-accounts/bank-accounts.service.ts

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';

@Injectable()
export class BankAccountsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateBankAccountDto) {
    // Check for duplicate account number for this user
    const duplicate = await this.prisma.userBankAccount.findUnique({
      where: {
        userId_accountNumber: { userId, accountNumber: dto.accountNumber },
      },
    });
    if (duplicate) {
      throw new ConflictException(
        `Bank account with number "${dto.accountNumber}" already exists`,
      );
    }

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

  async update(id: string, userId: string, dto: UpdateBankAccountDto) {
    // 1. หาบัญชีเป้าหมายก่อน
    const account = await this.prisma.userBankAccount.findUnique({
      where: { id },
    });

    if (!account || account.userId !== userId) {
      throw new NotFoundException('Bank account not found');
    }

    // 2. เช็คกรณีเปลี่ยนเลขบัญชีว่าซ้ำกับของเดิมที่ User มีหรือไม่
    if (dto.accountNumber && dto.accountNumber !== account.accountNumber) {
      const duplicate = await this.prisma.userBankAccount.findUnique({
        where: {
          userId_accountNumber: { userId, accountNumber: dto.accountNumber },
        },
      });
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(
          `Bank account with number "${dto.accountNumber}" already exists`,
        );
      }
    }

    // 3. จัดการกรณีเปลี่ยนเป็น Default
    if (dto.isDefault === true && !account.isDefault) {
      await this.prisma.userBankAccount.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // 4. กรณีเปลี่ยน Default จาก true เป็น false
    // หากเป็นบัญชีเดียวของระบบ หรือไม่มีตัวอื่นทดแทน ควรบังคับให้เป็น default ต่อไป
    let finalIsDefault = dto.isDefault;
    if (dto.isDefault === false && account.isDefault) {
      const nextDefault = await this.prisma.userBankAccount.findFirst({
        where: { userId, id: { not: id } },
        orderBy: { createdAt: 'desc' },
      });
      if (nextDefault) {
        await this.prisma.userBankAccount.update({
          where: { id: nextDefault.id },
          data: { isDefault: true },
        });
      } else {
        // ไม่มีบัญชีอื่นเลย บังคับให้คงสถานะ default
        finalIsDefault = true;
      }
    }

    return this.prisma.userBankAccount.update({
      where: { id },
      data: {
        ...dto,
        isDefault: finalIsDefault !== undefined ? finalIsDefault : undefined,
      },
    });
  }

  async remove(id: string, userId: string) {
    // 1. หาบัญชีเป้าหมายก่อน
    const account = await this.prisma.userBankAccount.findUnique({
      where: { id },
    });

    if (!account || account.userId !== userId) {
      throw new NotFoundException('Bank account not found');
    }

    // 2. ลบ
    const deleted = await this.prisma.userBankAccount.delete({
      where: { id },
    });

    // 3. ถ้าบัญชีที่ถูกลบไปเคยเป็น Default และยังมีบัญชีอื่นๆ หลงเหลืออยู่
    // ให้ตั้งบัญชีอื่นที่ล่าสุดที่สุดเป็น Default อัตโนมัติ
    if (deleted.isDefault) {
      const nextDefault = await this.prisma.userBankAccount.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      if (nextDefault) {
        await this.prisma.userBankAccount.update({
          where: { id: nextDefault.id },
          data: { isDefault: true },
        });
      }
    }

    return deleted;
  }
}
