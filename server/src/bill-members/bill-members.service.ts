// server/src/bill-members/bill-members.service.ts

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JoinBillDto } from './dto/join-bill-member.dto';
import { CreateBillMemberDto } from './dto/create-bill-member.dto';
import { clerkClient } from '@clerk/clerk-sdk-node';

@Injectable()
export class BillMembersService {
  constructor(private prisma: PrismaService) {}

  // 🚪 1. เข้าร่วมบิลผ่าน Code (สำหรับ User จริง)
  async join(userId: string, dto: JoinBillDto) {
    // 1. หาบิลจาก Code
    const bill = await this.prisma.bill.findUnique({
      where: { joinCode: dto.joinCode },
      include: { members: true },
    });

    if (!bill) {
      throw new NotFoundException('Invalid join code');
    }

    if (bill.status === 'CANCELLED') {
      throw new BadRequestException('This bill has been cancelled');
    }

    // 2. เช็คว่าเข้าซ้ำไหม?
    const existingMember = bill.members.find((m) => m.userId === userId);
    if (existingMember) {
      return {
        message: 'Already joined',
        member: existingMember,
        billId: bill.id,
      };
    }

    // 3. เตรียมชื่อที่จะแสดง (Display Name)
    let displayName = 'Member';
    // ลองดึงชื่อจาก DB หรือ Clerk
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      displayName = user.firstName || user.username || 'Member';
    } else {
      try {
        const clerkUser = await clerkClient.users.getUser(userId);
        displayName = clerkUser.firstName || 'New Member';
      } catch (e) {
        /* ignore error */
      }
    }

    // 4. สร้างสมาชิก
    const newMember = await this.prisma.billMember.create({
      data: {
        billId: bill.id,
        userId: userId,
        name: displayName,
        isPaid: false,
      },
    });

    return {
      message: 'Joined successfully',
      member: newMember,
      billId: bill.id,
    };
  }

  // ➕ 2. เพิ่ม Guest Member (เจ้าของบิลเพิ่มเอง)
  async create(userId: string, dto: CreateBillMemberDto) {
    // 1. เช็คสิทธิ์ความเป็นเจ้าของ
    const bill = await this.prisma.bill.findUnique({
      where: { id: dto.billId },
    });
    if (!bill) throw new NotFoundException('Bill not found');

    if (bill.ownerId !== userId) {
      throw new ForbiddenException('Only bill owner can add guest members');
    }

    // 2. สร้าง Guest (userId = null)
    return this.prisma.billMember.create({
      data: {
        billId: dto.billId,
        name: dto.name,
        userId: null, // 👈 สำคัญ: ระบุว่าเป็น Guest
      },
    });
  }

  // 📋 3. ดึงรายชื่อสมาชิกทั้งหมด
  async findAll(billId: string) {
    return this.prisma.billMember.findMany({
      where: { billId },
      include: { user: true }, // ดึงข้อมูล User จริงมาด้วย (ถ้ามี)
      orderBy: { createdAt: 'asc' },
    });
  }

  // 💸 4. แจ้งโอนเงิน (Toggle Status)
  async togglePaidStatus(memberId: string, userId: string) {
    const member = await this.prisma.billMember.findUnique({
      where: { id: memberId },
      include: { bill: true },
    });
    if (!member) throw new NotFoundException('Member not found');

    // เช็คสิทธิ์: ต้องเป็น "เจ้าตัว" หรือ "เจ้าของบิล" ถึงจะกดได้
    const isSelf = member.userId === userId;
    const isOwner = member.bill.ownerId === userId;

    if (!isSelf && !isOwner) {
      throw new ForbiddenException('Not authorized to update this member');
    }

    return this.prisma.billMember.update({
      where: { id: memberId },
      data: {
        isPaid: !member.isPaid, // สลับสถานะ
        paidAt: !member.isPaid ? new Date() : null, // ถ้าจ่ายแล้วให้ลงเวลา
      },
    });
  }

  // ✅ 5. เจ้าของกดยืนยัน (Verify)
  async verifyPayment(memberId: string, userId: string) {
    const member = await this.prisma.billMember.findUnique({
      where: { id: memberId },
      include: { bill: true },
    });
    if (!member) throw new NotFoundException('Member not found');

    // ต้องเป็น "เจ้าของบิล" เท่านั้น
    if (member.bill.ownerId !== userId) {
      throw new ForbiddenException('Only owner can verify payments');
    }

    return this.prisma.billMember.update({
      where: { id: memberId },
      data: {
        verifiedAt: new Date(), // ลงเวลายืนยัน
        isPaid: true, // บังคับเป็นจ่ายแล้วเสมอ
        paidAt: member.paidAt || new Date(),
      },
    });
  }
}
