// server/src/bills/bills.service.ts

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { calculateBillSummary } from '@kiddbill/shared';

export interface MemberTotalItem {
  memberId: string;
  userId: string | null;
  name: string;
  isPaid: boolean;
  verifiedAt: Date | null;
  baseAmount: number;
  scBasis?: number;
  vatBasis?: number;
  vatOnScBasis?: number;
  scAmount: number;
  vatAmount: number;
  netAmount: number;
  items: Array<{
    name: string;
    amount: number;
    weight?: number;
  }>;
}

@Injectable()
export class BillsService {
  constructor(private prisma: PrismaService) {}

  // 🎲 ฟังก์ชันสุ่มรหัสห้อง (A-Z, 2-9 ยกเว้นตัวที่สับสนง่ายเช่น O, 0, I, 1)
  private generateCode(length = 6): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // ✨ สร้างบิลใหม่
  async create(userId: string, dto: CreateBillDto) {
    // 1. สุ่ม Join Code จนกว่าจะไม่ซ้ำ
    let joinCode = '';
    let isUnique = false;
    while (!isUnique) {
      joinCode = this.generateCode();
      const count = await this.prisma.bill.count({ where: { joinCode } });
      if (count === 0) isUnique = true;
    }

    // 2. Sync User (ถ้ายังไม่มีใน DB ให้ดึงจาก Clerk)
    // เพื่อให้ตาราง User มีข้อมูล Owner เสมอ
    let user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      try {
        const clerkUser = await clerkClient.users.getUser(userId);
        user = await this.prisma.user.create({
          data: {
            id: userId,
            email: clerkUser.emailAddresses[0]?.emailAddress,
            username: clerkUser.username || `user_${userId.substr(0, 8)}`,
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            avatarUrl: clerkUser.imageUrl,
          },
        });
      } catch (e) {
        // Fallback กรณี Clerk ล่ม หรือหาไม่เจอ
        console.error('Sync user failed:', e);
      }
    }

    const ownerName = user?.firstName || user?.username || 'Owner';

    // 3. สร้างบิล + เพิ่ม Owner เป็นสมาชิกคนแรก
    return this.prisma.bill.create({
      data: {
        ...dto,
        ownerId: userId,
        joinCode,
        status: 'DRAFT',
        members: {
          create: {
            userId,
            name: ownerName,
            isPaid: false,
          },
        },
      },
      include: { members: true },
    });
  }

  // 📋 ดึงบิลทั้งหมดของฉัน (ไม่เอาที่ลบไปแล้ว)
  async findAll(userId: string) {
    const bills = await this.prisma.bill.findMany({
      where: {
        ownerId: userId,
        deletedAt: null, // ✅ Filter Soft Delete
      },
      orderBy: { createdAt: 'desc' },
      take: 50, // ✅ LIMIT data to prevent slow queries
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
      },
    });

    if (bills.length === 0) {
      return [];
    }

    const billIds = bills.map((b) => b.id);

    // Fetch member counts grouping by billId, restricted only to these bills to utilize indexes
    const memberCounts = await this.prisma.billMember.groupBy({
      by: ['billId'],
      where: { billId: { in: billIds } },
      _count: { id: true },
    });

    // Fetch item counts grouping by billId, restricted only to these bills to utilize indexes
    const itemCounts = await this.prisma.billItem.groupBy({
      by: ['billId'],
      where: { billId: { in: billIds } },
      _count: { id: true },
    });

    const memberCountMap = new Map(
      memberCounts.map((c) => [c.billId, c._count.id]),
    );
    const itemCountMap = new Map(
      itemCounts.map((c) => [c.billId, c._count.id]),
    );

    return bills.map((bill) => ({
      ...bill,
      _count: {
        members: memberCountMap.get(bill.id) || 0,
        items: itemCountMap.get(bill.id) || 0,
      },
    }));
  }

  // 🔍 ดูรายละเอียดบิล
  async findOne(id: string) {
    const bill = await this.prisma.bill.findUnique({
      where: { id },
      include: {
        items: { orderBy: { orderIndex: 'asc' }, include: { splits: true } },
        members: true,
        owner: { select: { id: true, firstName: true, avatarUrl: true } },
      },
    });

    if (!bill) throw new NotFoundException('Bill not found');
    if (bill.deletedAt) throw new NotFoundException('Bill has been deleted');

    return bill;
  }

  // 🛠️ แก้ไขบิล
  async update(id: string, userId: string, dto: UpdateBillDto) {
    const bill = await this.prisma.bill.findUnique({ where: { id } });
    if (!bill || bill.deletedAt) throw new NotFoundException('Bill not found');

    if (bill.ownerId !== userId) {
      throw new ForbiddenException('Only owner can update bill');
    }

    return this.prisma.bill.update({
      where: { id },
      data: dto,
    });
  }

  // 🗑️ ลบบิล (Soft Delete)
  async remove(id: string, userId: string) {
    const bill = await this.prisma.bill.findUnique({ where: { id } });
    if (!bill || bill.deletedAt) throw new NotFoundException('Bill not found');

    if (bill.ownerId !== userId) {
      throw new ForbiddenException('Only owner can delete bill');
    }

    // ไม่ลบจริง แต่ใส่เวลา deletedAt และเปลี่ยนสถานะเป็น CANCELLED
    return this.prisma.bill.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'CANCELLED',
      },
    });
  }

  // ✅ ปิดบิล & Snapshot บัญชี
  async close(id: string, userId: string) {
    const bill = await this.prisma.bill.findUnique({ where: { id } });
    if (!bill) throw new NotFoundException('Bill not found');
    if (bill.ownerId !== userId)
      throw new ForbiddenException('Only owner can close bill');

    // คำนวณสรุปยอดเงินล่าสุด เพื่อบันทึกลงฐานข้อมูล
    const summaryData = await this.getSummary(id);

    // หาบัญชี Default ของ Owner
    const bank = await this.prisma.userBankAccount.findFirst({
      where: { userId, isDefault: true },
    });

    // อัปเดตข้อมูลและสมาชิกภายใน Transaction เพื่อความถูกต้องของข้อมูล
    return this.prisma.$transaction(async (tx) => {
      for (const m of summaryData.members) {
        if (m.memberId && m.memberId !== 'owner-fallback') {
          await tx.billMember.update({
            where: { id: m.memberId },
            data: { netAmountToPay: m.netAmount },
          });
        }
      }

      return tx.bill.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          // Snapshot ข้อมูล
          bankName: bank?.bankName || null,
          bankAccount: bank?.accountNumber || null,
          promptPayName: bank?.accountName || null,
          promptPayNumber: bank?.accountNumber || null,
        },
      });
    });
  }

  // 🧠 คำนวณยอดเงิน (Complex Calculation)
  async getSummary(billId: string) {
    const bill = await this.prisma.bill.findUnique({
      where: { id: billId },
      include: {
        items: { include: { splits: true } },
        members: true,
      },
    });

    if (!bill) throw new NotFoundException('Bill not found');

    const inputBill = {
      id: bill.id,
      title: bill.title,
      status: bill.status,
      vatRate: Number(bill.vatRate),
      serviceChargeRate: Number(bill.serviceChargeRate),
      isVatIncluded: bill.isVatIncluded,
      isServiceChargeIncluded: bill.isServiceChargeIncluded,
      discountAmount: Number(bill.discountAmount),
      discountPercent: Number(bill.discountPercent),
      roundingMode: bill.roundingMode as 'NONE' | 'UP' | 'DOWN' | 'NEAREST',
      ownerId: bill.ownerId,
      promptPayNumber: bill.promptPayNumber,
      promptPayName: bill.promptPayName,
      bankName: bill.bankName,
      bankAccount: bill.bankAccount,
      items: bill.items.map((item) => ({
        id: item.id,
        name: item.name,
        totalPrice: Number(item.totalPrice),
        applyVat: item.applyVat,
        applyServiceCharge: item.applyServiceCharge,
        splits: item.splits.map((s) => ({
          memberId: s.memberId,
          weight: Number(s.weight),
        })),
      })),
      members: bill.members.map((m) => ({
        id: m.id,
        name: m.name,
        userId: m.userId,
        isPaid: m.isPaid,
        verifiedAt: m.verifiedAt,
      })),
    };

    const summary = calculateBillSummary(inputBill);

    return {
      ...summary,
      members: summary.members.map((m) => {
        const dbMember = bill.members.find((dbM) => dbM.id === m.memberId);
        return {
          ...m,
          slipAmount: dbMember?.slipAmount ? Number(dbMember.slipAmount) : null,
          slipSender: dbMember?.slipSender ? String(dbMember.slipSender) : null,
          slipRefId: dbMember?.slipRefId ? String(dbMember.slipRefId) : null,
          slipMatchStatus: dbMember?.slipMatchStatus
            ? String(dbMember.slipMatchStatus)
            : null,
          paymentProofUrl: dbMember?.paymentProofUrl
            ? String(dbMember.paymentProofUrl)
            : null,
        };
      }),
    };
  }
}
