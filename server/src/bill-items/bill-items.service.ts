// server/src/bill-items/bill-items.service.ts

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBillItemDto } from './dto/create-bill-item.dto';
import { UpdateBillItemDto } from './dto/update-bill-item.dto';

@Injectable()
export class BillItemsService {
  constructor(private prisma: PrismaService) {}

  // --- Create New Item ---
  async create(userId: string, dto: CreateBillItemDto) {
    // 1. Verify Bill Access
    const bill = await this.prisma.bill.findUnique({
      where: { id: dto.billId },
      include: { members: true },
    });

    if (!bill) throw new NotFoundException('Bill not found');

    // Check if user is Owner OR Member
    const isOwner = bill.ownerId === userId;
    const isMember = bill.members.some((m) => m.userId === userId);

    if (!isOwner && !isMember) {
      throw new ForbiddenException('You are not a member of this bill');
    }

    // 2. Create Item with calculated total
    return this.prisma.billItem.create({
      data: {
        billId: dto.billId,
        name: dto.name,
        price: dto.price,
        quantity: dto.quantity,
        totalPrice: dto.price * dto.quantity, // Auto-calculate
      },
    });
  }

  // --- Update Item ---
  async update(id: string, userId: string, dto: UpdateBillItemDto) {
    // 1. Find Item & Bill Info
    const item = await this.prisma.billItem.findUnique({
      where: { id },
      include: { bill: true },
    });

    if (!item) throw new NotFoundException('Item not found');

    // 2. Permission Check (Currently only Owner can edit, or the creator of the item)
    // For simplicity: Only Bill Owner can edit for now
    if (item.bill.ownerId !== userId) {
      throw new ForbiddenException('Only bill owner can update items');
    }

    // 3. Recalculate Total Price if price/quantity changes
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

  // --- Remove Item ---
  async remove(id: string, userId: string) {
    const item = await this.prisma.billItem.findUnique({
      where: { id },
      include: { bill: true },
    });

    if (!item) throw new NotFoundException('Item not found');

    // Permission Check
    if (item.bill.ownerId !== userId) {
      throw new ForbiddenException('Only bill owner can delete items');
    }

    return this.prisma.billItem.delete({
      where: { id },
    });
  }
}
