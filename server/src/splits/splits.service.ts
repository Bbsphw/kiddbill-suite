// server/src/splits/splits.service.ts

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AssignSplitDto } from './dto/assign-split.dto';

@Injectable()
export class SplitsService {
  constructor(private prisma: PrismaService) {}

  // ✅ กำหนดคนหาร (Assign)
  async assignSplits(userId: string, dto: AssignSplitDto) {
    // 1. หา Item และเช็คว่าเป็นของบิลไหน
    const item = await this.prisma.billItem.findUnique({
      where: { id: dto.itemId },
      include: { bill: true },
    });

    if (!item) throw new NotFoundException('Item not found');

    // 2. เช็คสิทธิ์: ต้องเป็น Owner เท่านั้น (เพื่อความชัวร์)
    // หรือถ้าจะให้สมาชิกช่วยแก้ได้ ก็เช็คว่าเป็น Member ในบิลไหม
    if (item.bill.ownerId !== userId) {
      throw new ForbiddenException('Only bill owner can manage splits');
    }

    // =========================================================
    // 🛡️ 3. Security Validation: สมาชิกที่ส่งมา อยู่ในบิลนี้จริงไหม?
    // =========================================================
    const memberIdsToCheck = dto.splits.map((s) => s.memberId);

    // ดึงรายชื่อ Member ที่ถูกต้องจาก DB
    const validMembers = await this.prisma.billMember.findMany({
      where: {
        billId: item.billId,
        id: { in: memberIdsToCheck },
      },
      select: { id: true },
    });

    // ถ้าจำนวนที่เจอ ไม่เท่ากับจำนวนที่ส่งมา แปลว่ามีคนเนียนส่ง ID มั่วมา
    if (validMembers.length !== memberIdsToCheck.length) {
      // (Optional) หาว่า ID ไหนมั่ว เพื่อแจ้ง Error ละเอียด
      const validIds = validMembers.map((m) => m.id);
      const invalidIds = memberIdsToCheck.filter(
        (id) => !validIds.includes(id),
      );

      throw new BadRequestException(
        `Invalid members (not in this bill): ${invalidIds.join(', ')}`,
      );
    }
    // =========================================================

    // 4. Transaction: ลบอันเก่า -> สร้างอันใหม่
    return this.prisma.$transaction(async (tx) => {
      // A. ลบการหารเดิมของเมนูนี้ทิ้งทั้งหมด
      await tx.itemSplit.deleteMany({
        where: { itemId: dto.itemId },
      });

      // B. เตรียมข้อมูลใหม่
      const creates = dto.splits.map((s) => ({
        itemId: dto.itemId,
        memberId: s.memberId,
        weight: s.weight ?? 1.0, // ถ้าไม่ส่งมา ใช้ 1
        fixedAmount: s.fixedAmount, // ถ้ามี fixedAmount ก็บันทึก
      }));

      // C. บันทึก
      await tx.itemSplit.createMany({
        data: creates,
      });

      return { message: 'Splits updated successfully', count: creates.length };
    });
  }

  // 📋 ดูว่าเมนูนี้ใครหารบ้าง
  async getItemSplits(itemId: string) {
    return this.prisma.itemSplit.findMany({
      where: { itemId },
      include: {
        member: {
          select: { id: true, name: true, userId: true }, // เลือกเฉพาะที่จำเป็น
        },
      },
    });
  }
}
