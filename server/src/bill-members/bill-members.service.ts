//

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JoinBillDto } from './dto/join-bill-member.dto';
import { clerkClient } from '@clerk/clerk-sdk-node';

@Injectable()
export class BillMembersService {
  constructor(private prisma: PrismaService) {}

  async join(userId: string, dto: JoinBillDto) {
    // 1. Find Bill by Join Code
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

    // 2. Check if already joined
    const existingMember = bill.members.find((m) => m.userId === userId);
    if (existingMember) {
      return {
        message: 'Already joined',
        member: existingMember,
        billId: bill.id,
      };
    }

    // 3. Get User Info for Display Name
    // (We assume user exists because of AuthGuard, but let's be safe)
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    let displayName = user?.firstName || user?.username || 'Member';

    // If user not in DB (edge case), try syncing from Clerk (Optional but good)
    if (!user) {
      try {
        const clerkUser = await clerkClient.users.getUser(userId);
        displayName = clerkUser.firstName || 'New Member';
      } catch (e) {
        console.log('User fetch failed', e);
      }
    }

    // 4. Create Member
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

  // Get all members of a bill
  async findAll(billId: string) {
    return this.prisma.billMember.findMany({
      where: { billId },
      include: { user: true },
    });
  }
}
