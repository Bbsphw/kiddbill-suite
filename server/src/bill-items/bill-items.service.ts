// server/src/bill-items/bill-items.service.ts

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBillItemDto } from './dto/create-bill-item.dto';
import { UpdateBillItemDto } from './dto/update-bill-item.dto';

@Injectable()
export class BillItemsService {
  constructor(private prisma: PrismaService) {}

  // ✅ สร้างรายการอาหาร
  async create(userId: string, dto: CreateBillItemDto) {
    // 1. เช็คว่าบิลมีอยู่จริง + ดึงสมาชิกมาเช็คสิทธิ์
    const bill = await this.prisma.bill.findUnique({
      where: { id: dto.billId },
      include: { members: true },
    });

    if (!bill) throw new NotFoundException('Bill not found');

    // 2. เช็คสิทธิ์: ต้องเป็น Owner หรือ Member ในบิลนั้น ถึงจะสั่งอาหารได้
    const isOwner = bill.ownerId === userId;
    const isMember = bill.members.some((m) => m.userId === userId);

    if (!isOwner && !isMember) {
      throw new ForbiddenException('You are not a member of this bill');
    }

    // 3. 🔢 Auto Order Index: หาเลขลำดับล่าสุด แล้ว +1 (เพื่อให้รายการเรียงต่อกันสวยๆ)
    const lastItem = await this.prisma.billItem.findFirst({
      where: { billId: dto.billId },
      orderBy: { orderIndex: 'desc' }, // เรียงมากไปน้อย
    });
    const newOrderIndex = (lastItem?.orderIndex ?? 0) + 1;

    // 4. บันทึก (พร้อมคำนวณ Total Price)
    return this.prisma.billItem.create({
      data: {
        billId: dto.billId,
        name: dto.name,
        price: dto.price,
        quantity: dto.quantity,
        totalPrice: dto.price * dto.quantity, // 💰 Auto Calculate
        orderIndex: newOrderIndex, // 🔢 Auto Index
        type: dto.type,
        applyVat: dto.applyVat,
        applyServiceCharge: dto.applyServiceCharge,
      },
    });
  }

  // ✅ แก้ไขรายการ
  async update(id: string, userId: string, dto: UpdateBillItemDto) {
    // 1. หา Item
    const item = await this.prisma.billItem.findUnique({
      where: { id },
      include: { bill: true },
    });

    if (!item) throw new NotFoundException('Item not found');

    // 2. เช็คสิทธิ์: ให้เฉพาะ Owner แก้ไขได้ (เพื่อความชัวร์)
    // หรือถ้าจะให้คนสั่งแก้ได้ต้องเช็ค logic เพิ่ม แต่เริ่มที่ Owner ก่อนปลอดภัยสุด
    if (item.bill.ownerId !== userId) {
      throw new ForbiddenException('Only bill owner can update items');
    }

    // 3. คำนวณราคาใหม่ (ถ้ามีการแก้ราคาหรือจำนวน)
    const newPrice = dto.price ?? Number(item.price);
    const newQuantity = dto.quantity ?? item.quantity;
    const newTotalPrice = newPrice * newQuantity;

    // 4. อัปเดต
    return this.prisma.billItem.update({
      where: { id },
      data: {
        ...dto,
        totalPrice: newTotalPrice, // 💰 Recalculate
      },
    });
  }

  // ✅ ลบรายการ
  async remove(id: string, userId: string) {
    const item = await this.prisma.billItem.findUnique({
      where: { id },
      include: { bill: true },
    });

    if (!item) throw new NotFoundException('Item not found');

    // เช็คสิทธิ์: เฉพาะ Owner
    if (item.bill.ownerId !== userId) {
      throw new ForbiddenException('Only bill owner can delete items');
    }

    return this.prisma.billItem.delete({
      where: { id },
    });
  }
}
