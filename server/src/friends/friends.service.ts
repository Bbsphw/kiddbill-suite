// server/src/friends/friends.service.ts

import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateFriendDto } from './dto/create-friend.dto';
import { UpdateFriendDto } from './dto/update-friend.dto';

@Injectable()
export class FriendsService {
  constructor(private prisma: PrismaService) {}

  // ✅ เพิ่มเพื่อนใหม่
  async create(userId: string, dto: CreateFriendDto) {
    // 1. เช็คก่อนว่าชื่อซ้ำไหม (ใน List ของตัวเอง)
    const existing = await this.prisma.friend.findUnique({
      where: {
        userId_nickname: { userId, nickname: dto.nickname },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Friend with nickname "${dto.nickname}" already exists`,
      );
    }

    // 2. สร้าง
    return this.prisma.friend.create({
      data: {
        userId,
        nickname: dto.nickname,
      },
    });
  }

  // 📋 ดึงรายชื่อเพื่อนทั้งหมด
  async findAll(userId: string) {
    return this.prisma.friend.findMany({
      where: { userId },
      orderBy: { nickname: 'asc' }, // เรียงตาม ก-ฮ
    });
  }

  // ✏️ แก้ไขชื่อเพื่อน
  async update(id: string, userId: string, dto: UpdateFriendDto) {
    // เช็คว่ามีเพื่อนคนนี้จริงไหม และเป็นของ User นี้จริงไหม
    const friend = await this.prisma.friend.findUnique({
      where: { id },
    });

    if (!friend || friend.userId !== userId) {
      throw new NotFoundException('Friend not found');
    }

    // ถ้าแก้ชื่อ ต้องเช็คซ้ำอีกรอบว่าชื่อใหม่ไปชนกับเพื่อนคนอื่นไหม
    if (dto.nickname) {
      const duplicate = await this.prisma.friend.findUnique({
        where: { userId_nickname: { userId, nickname: dto.nickname } },
      });
      if (duplicate && duplicate.id !== id) {
        // ถ้าเจอซ้ำ และไม่ใช่คนเดิม
        throw new ConflictException(
          `Friend with nickname "${dto.nickname}" already exists`,
        );
      }
    }

    return this.prisma.friend.update({
      where: { id },
      data: dto,
    });
  }

  // 🗑️ ลบเพื่อน
  async remove(id: string, userId: string) {
    // ใช้ deleteMany เพื่อความปลอดภัยและรวดเร็ว
    // "ลบเพื่อนที่มี ID นี้ และเป็นของ User ID นี้เท่านั้น"
    const result = await this.prisma.friend.deleteMany({
      where: {
        id,
        userId,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException(
        'Friend not found or not authorized to delete',
      );
    }

    return { message: 'Friend deleted successfully' };
  }
}
