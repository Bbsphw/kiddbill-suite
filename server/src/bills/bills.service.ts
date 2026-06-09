// server/src/bills/bills.service.ts

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { clerkClient } from '@clerk/clerk-sdk-node';

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

  // 🎲 ฟังก์ชันสุ่มรหัสห้อง (A-Z, 0-9)
  private generateCode(length = 6): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
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
    return this.prisma.bill.findMany({
      where: {
        ownerId: userId,
        deletedAt: null, // ✅ Filter Soft Delete
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { members: true, items: true } },
      },
    });
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

    // เตรียมโครงสร้างข้อมูล (ใช้ Object.create(null) เพื่อป้องกัน Prototype Pollution)
    const memberTotals = Object.create(null) as Record<string, MemberTotalItem>;

    bill.members.forEach((m) => {
      // ใช้ ID ของ Member เป็น Key
      const key = m.userId || m.id;

      memberTotals[key] = {
        memberId: m.id,
        userId: m.userId,
        name: m.name,
        isPaid: m.isPaid,
        verifiedAt: m.verifiedAt,

        baseAmount: 0,
        scBasis: 0,
        vatBasis: 0,
        vatOnScBasis: 0,

        scAmount: 0,
        vatAmount: 0,
        netAmount: 0,
        items: [],
      };
    });

    // ค้นหา key ของ Owner ใน memberTotals เพื่อใช้รับ Item ที่ไม่มีคนหาร
    let ownerKey = bill.ownerId;
    const ownerMember = bill.members.find((m) => m.userId === bill.ownerId);
    if (ownerMember) {
      ownerKey = ownerMember.userId || ownerMember.id;
    } else {
      // Fallback: หากเจ้าของไม่มี record ใน members เลย
      if (!memberTotals[ownerKey]) {
        memberTotals[ownerKey] = {
          memberId: 'owner-fallback',
          userId: bill.ownerId,
          name: 'Owner (Fallback)',
          isPaid: true,
          verifiedAt: new Date(),
          baseAmount: 0,
          scBasis: 0,
          vatBasis: 0,
          vatOnScBasis: 0,
          scAmount: 0,
          vatAmount: 0,
          netAmount: 0,
          items: [],
        };
      }
    }

    // 1. Loop รายการอาหาร
    for (const item of bill.items) {
      const itemTotalPrice = Number(item.totalPrice);
      const totalWeight = item.splits.reduce(
        (sum: number, s) => sum + Number(s.weight),
        0,
      );

      const applySc = item.applyServiceCharge;
      const applyVat = item.applyVat;

      if (totalWeight > 0) {
        // มีคนหาร
        item.splits.forEach((split) => {
          const memberObj = bill.members.find((m) => m.id === split.memberId);
          const targetKey = memberObj ? memberObj.userId || memberObj.id : null;

          if (targetKey && memberTotals[targetKey]) {
            const share = (itemTotalPrice * Number(split.weight)) / totalWeight;
            memberTotals[targetKey].baseAmount += share;

            if (applySc) {
              memberTotals[targetKey].scBasis =
                (memberTotals[targetKey].scBasis || 0) + share;
            }
            if (applyVat) {
              memberTotals[targetKey].vatBasis =
                (memberTotals[targetKey].vatBasis || 0) + share;
            }
            if (applySc && applyVat) {
              memberTotals[targetKey].vatOnScBasis =
                (memberTotals[targetKey].vatOnScBasis || 0) + share;
            }

            memberTotals[targetKey].items.push({
              name: item.name,
              amount: share,
              weight: Number(split.weight),
            });
          }
        });
      } else {
        // ไม่มีคนหาร -> เข้า Owner
        if (memberTotals[ownerKey]) {
          memberTotals[ownerKey].baseAmount += itemTotalPrice;

          if (applySc) {
            memberTotals[ownerKey].scBasis =
              (memberTotals[ownerKey].scBasis || 0) + itemTotalPrice;
          }
          if (applyVat) {
            memberTotals[ownerKey].vatBasis =
              (memberTotals[ownerKey].vatBasis || 0) + itemTotalPrice;
          }
          if (applySc && applyVat) {
            memberTotals[ownerKey].vatOnScBasis =
              (memberTotals[ownerKey].vatOnScBasis || 0) + itemTotalPrice;
          }

          memberTotals[ownerKey].items.push({
            name: `${item.name} (Unassigned)`,
            amount: itemTotalPrice,
          });
        }
      }
    }

    // 2. Loop คำนวณ VAT/SC
    const summary = Object.values(memberTotals).map((data: MemberTotalItem) => {
      let currentTotal = data.baseAmount;

      const scBasis = data.scBasis || 0;
      const vatBasis = data.vatBasis || 0;
      const vatOnScBasis = data.vatOnScBasis || 0;

      // Calculate Service Charge if not included
      if (!bill.isServiceChargeIncluded && Number(bill.serviceChargeRate) > 0) {
        data.scAmount = scBasis * (Number(bill.serviceChargeRate) / 100);
        currentTotal += data.scAmount;
      } else {
        data.scAmount = 0;
      }

      // Calculate VAT if not included
      if (!bill.isVatIncluded && Number(bill.vatRate) > 0) {
        const scOnVatItems =
          !bill.isServiceChargeIncluded && Number(bill.serviceChargeRate) > 0
            ? vatOnScBasis * (Number(bill.serviceChargeRate) / 100)
            : 0;

        data.vatAmount =
          (vatBasis + scOnVatItems) * (Number(bill.vatRate) / 100);
        currentTotal += data.vatAmount;
      } else {
        data.vatAmount = 0;
      }

      data.netAmount = Math.ceil(currentTotal * 100) / 100;

      return data;
    });

    return {
      billId: bill.id,
      title: bill.title,
      status: bill.status, // ✅ เพิ่ม status กลับไปด้วย Frontend จะได้เช็ค COMPLETED ได้
      config: {
        vat: Number(bill.vatRate),
        sc: Number(bill.serviceChargeRate),
      },
      members: summary,
      grandTotal: summary.reduce(
        (sum: number, m: MemberTotalItem) => sum + m.netAmount,
        0,
      ),

      promptPayNumber: bill.promptPayNumber,
      promptPayName: bill.promptPayName,
      bankName: bill.bankName,
      bankAccount: bill.bankAccount,
    };
  }
}
