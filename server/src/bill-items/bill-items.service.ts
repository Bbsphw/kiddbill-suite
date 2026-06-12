// server/src/bill-items/bill-items.service.ts

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
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

    // Lock condition
    if (bill.status === 'COMPLETED' || bill.status === 'CANCELLED') {
      throw new BadRequestException(
        `Cannot add items to a ${bill.status.toLowerCase()} bill`,
      );
    }

    // 2. เช็คสิทธิ์: ต้องเป็น Owner หรือ Member ในบิลนั้น ถึงจะสั่งอาหารได้
    const isOwner = bill.ownerId === userId;
    const isMember = bill.members.some((m) => m.userId === userId);

    if (!isOwner && !isMember) {
      throw new ForbiddenException('You are not a member of this bill');
    }

    // 3. 🔢 Auto Order Index: หาเลขลำดับล่าสุด แล้ว +1
    const lastItem = await this.prisma.billItem.findFirst({
      where: { billId: dto.billId },
      orderBy: { orderIndex: 'desc' },
    });
    const newOrderIndex = (lastItem?.orderIndex ?? 0) + 1;

    // 4. บันทึก
    return this.prisma.billItem.create({
      data: {
        billId: dto.billId,
        name: dto.name,
        price: dto.price,
        quantity: dto.quantity,
        totalPrice: dto.price * dto.quantity,
        orderIndex: newOrderIndex,
        type: dto.type,
        applyVat: dto.applyVat,
        applyServiceCharge: dto.applyServiceCharge,
      },
    });
  }

  // ✅ แก้ไขรายการ
  async update(id: string, userId: string, dto: UpdateBillItemDto) {
    const item = await this.prisma.billItem.findUnique({
      where: { id },
      include: { bill: true },
    });

    if (!item) throw new NotFoundException('Item not found');

    // Lock condition
    if (item.bill.status === 'COMPLETED' || item.bill.status === 'CANCELLED') {
      throw new BadRequestException(
        `Cannot update items on a ${item.bill.status.toLowerCase()} bill`,
      );
    }

    // 🔒 Security Check: เฉพาะเจ้าของบิล
    if (item.bill.ownerId !== userId) {
      throw new ForbiddenException('Only bill owner can update items');
    }

    // คำนวณราคาใหม่
    const newPrice = dto.price ?? Number(item.price);
    const newQuantity = dto.quantity ?? item.quantity;
    const newTotalPrice = newPrice * newQuantity;

    return this.prisma.billItem.update({
      where: { id },
      data: {
        ...dto,
        totalPrice: newTotalPrice,
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

    // Lock condition
    if (item.bill.status === 'COMPLETED' || item.bill.status === 'CANCELLED') {
      throw new BadRequestException(
        `Cannot delete items from a ${item.bill.status.toLowerCase()} bill`,
      );
    }

    // 🔒 Security Check: เฉพาะเจ้าของบิล
    if (item.bill.ownerId !== userId) {
      throw new ForbiddenException('Only bill owner can delete items');
    }

    return this.prisma.billItem.delete({
      where: { id },
    });
  }
}
