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

    // หาบัญชี Default ของ Owner
    const bank = await this.prisma.userBankAccount.findFirst({
      where: { userId, isDefault: true },
    });

    return this.prisma.bill.update({
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

    // เตรียมโครงสร้างข้อมูล
    const memberTotals: any = {};
    bill.members.forEach((m) => {
      // ใช้ ID ของ Member เป็น Key (รองรับทั้ง User จริง และ Guest)
      // แต่เวลา Return จะแปะ userId ไปด้วยเผื่อ Frontend ใช้
      const key = m.userId || m.id;
      memberTotals[key] = {
        memberId: m.id,
        userId: m.userId,
        name: m.name,
        baseAmount: 0,
        scAmount: 0,
        vatAmount: 0,
        netAmount: 0,
        items: [],
      };
    });

    // 1. Loop รายการอาหาร
    for (const item of bill.items) {
      const itemTotalPrice = Number(item.totalPrice);
      const totalWeight = item.splits.reduce(
        (sum, s) => sum + Number(s.weight),
        0,
      );

      if (totalWeight > 0) {
        // มีคนหาร -> แบ่งตามน้ำหนัก
        item.splits.forEach((split) => {
          // หา Key ของคนนี้ (User ID หรือ Member ID)
          const memberKey = split.memberId; // ใน Split มี memberId ที่เชื่อมกับ BillMember อยู่แล้ว

          // ต้อง Map กลับไปหา Key ที่เราตั้งไว้ข้างบน (User ID ถ้ามี, หรือ Member ID)
          // วิธีง่ายสุดคือหาจาก bill.members
          const memberObj = bill.members.find((m) => m.id === split.memberId);
          const targetKey = memberObj ? memberObj.userId || memberObj.id : null;

          if (targetKey && memberTotals[targetKey]) {
            const share = (itemTotalPrice * Number(split.weight)) / totalWeight;
            memberTotals[targetKey].baseAmount += share;
            memberTotals[targetKey].items.push({
              name: item.name,
              amount: share,
              weight: Number(split.weight),
            });
          }
        });
      } else {
        // ไม่มีคนหาร -> เข้า Owner
        const ownerMember = bill.members.find((m) => m.userId === bill.ownerId);
        const ownerKey = bill.ownerId; // Owner ต้องมี UserID เสมอ

        if (memberTotals[ownerKey]) {
          memberTotals[ownerKey].baseAmount += itemTotalPrice;
          memberTotals[ownerKey].items.push({
            name: `${item.name} (Unassigned)`,
            amount: itemTotalPrice,
          });
        }
      }
    }

    // 2. Loop คำนวณ VAT/SC
    const summary = Object.values(memberTotals).map((data: any) => {
      let currentTotal = data.baseAmount;

      // Service Charge (ถ้ายังไม่รวม)
      if (!bill.isServiceChargeIncluded && Number(bill.serviceChargeRate) > 0) {
        data.scAmount = currentTotal * (Number(bill.serviceChargeRate) / 100);
        currentTotal += data.scAmount;
      }

      // VAT (ถ้ายังไม่รวม)
      if (!bill.isVatIncluded && Number(bill.vatRate) > 0) {
        data.vatAmount = currentTotal * (Number(bill.vatRate) / 100);
        currentTotal += data.vatAmount;
      }

      // ปัดเศษทศนิยม 2 ตำแหน่ง (ปัดขึ้นเสมอเพื่อกันขาดทุน)
      data.netAmount = Math.ceil(currentTotal * 100) / 100;

      return data;
    });

    return {
      billId: bill.id,
      title: bill.title,
      config: {
        vat: Number(bill.vatRate),
        sc: Number(bill.serviceChargeRate),
      },
      members: summary,
      grandTotal: summary.reduce((sum, m) => sum + m.netAmount, 0),
    };
  }
}
