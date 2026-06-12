// server/src/users/users.service.ts

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // 🔄 Sync User (Create or Update)
  // ถูกเรียกเมื่อ User Login ผ่าน Clerk (Frontend ยิงมาบอก)
  async syncUser(dto: CreateUserDto) {
    // 1. เตรียมข้อมูลพื้นฐาน
    const data = {
      email: dto.email,
      username: dto.username || `user_${dto.id.slice(0, 8)}`, // Fallback username
      firstName: dto.firstName,
      lastName: dto.lastName,
      avatarUrl: dto.avatarUrl,
      lastActiveAt: new Date(), // อัปเดตเวลาล่าสุดที่ใช้งาน
      isGuest: false, // User จาก Clerk ต้องไม่ใช่ Guest
    };

    // 2. Upsert (ถ้ามีให้อัปเดต, ถ้าไม่มีให้สร้าง)
    return this.prisma.user.upsert({
      where: { id: dto.id },
      update: data,
      create: {
        id: dto.id,
        ...data,
      },
    });
  }

  // 👤 ดูข้อมูลตัวเอง (Profile)
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: { ownedBills: true, memberships: true },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // ✏️ แก้ไขข้อมูล (Update Profile)
  async update(userId: string, dto: UpdateUserDto) {
    // เช็ค Username ซ้ำ (ถ้ามีการเปลี่ยน Username)
    if (dto.username) {
      const existing = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });
      // ถ้าเจอคนใช้ชื่อนี้ และไม่ใช่ตัวเราเอง -> Error
      if (existing && existing.id !== userId) {
        throw new ConflictException('Username already taken');
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });
  }

  // 🔍 ค้นหา User (สำหรับ Add Friend)
  async searchUsers(query: string, currentUserId: string) {
    return this.prisma.user.findMany({
      where: {
        // 1. ถ้าต้องการ "ซ่อนตัวเอง" ให้เปิดบรรทัดนี้ (ปกติแอพแชทจะซ่อน)
        id: { not: currentUserId },

        // 2. เงื่อนไขการค้นหา (Case Insensitive)
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        // เลือกส่งกลับเฉพาะข้อมูลที่จำเป็น (เพื่อความปลอดภัย)
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
      },
      take: 10, // ลิมิตผลลัพธ์
    });
  }
}
