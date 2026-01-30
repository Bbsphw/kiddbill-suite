import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssignSplitDto } from './dto/assign-split.dto';

@Injectable()
export class SplitsService {
  constructor(private prisma: PrismaService) {}

  async assignSplits(userId: string, dto: AssignSplitDto) {
    const item = await this.prisma.billItem.findUnique({
      where: { id: dto.itemId },
      include: { bill: true },
    });

    if (!item) throw new NotFoundException('Item not found');
    if (item.bill.ownerId !== userId) {
      throw new ForbiddenException('Only owner can manage splits');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. ลบข้อมูลการหารเก่าทิ้ง
      await tx.itemSplit.deleteMany({
        where: { itemId: dto.itemId },
      });

      // 2. เตรียมข้อมูลใหม่ (Map จาก DTO)
      const creates = dto.splits.map((s) => ({
        itemId: dto.itemId,
        memberId: s.memberId,
        weight: s.weight, // ✅ บันทึก Weight ลง DB
      }));

      // 3. บันทึก
      await tx.itemSplit.createMany({
        data: creates,
      });

      return { message: 'Splits updated', count: creates.length };
    });
  }

  // ดึงข้อมูลว่า Item นี้ใครหารบ้าง
  async getItemSplits(itemId: string) {
    return this.prisma.itemSplit.findMany({
      where: { itemId },
      include: { member: true }, // ดึงชื่อคนมาด้วย
    });
  }
}
