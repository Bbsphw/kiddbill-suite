// server/src/auth/clerk-auth.guard.ts

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { clerkClient } from '@clerk/clerk-sdk-node';

/**
 * 🛡️ ClerkAuthGuard: ตัวป้องกัน (Guard) สำหรับตรวจสอบสิทธิ์การเข้าถึง
 * ทำหน้าที่ตรวจสอบ JWT Token จาก Clerk เพื่อยืนยันตัวตนของผู้ใช้งานก่อนเข้าถึง API
 */
@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);

  // 🔍 ฟังก์ชันหลักในการตัดสินใจว่า Request นี้จะผ่านไปได้หรือไม่
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // ==========================================
    // 🚧 DEV BYPASS MODE (ทางลัดสำหรับ Dev)
    // ==========================================
    // 🕵️‍♂️ ตรวจสอบว่าถ้ามีการส่ง Header 'x-test-user-id' มา และไม่ได้รันบน Production
    // จะอนุญาตให้ผ่านได้ทันทีโดยไม่ต้องใช้ Token จริง (สะดวกเวลาทดสอบผ่าน Postman/Insomnia)
    const testUserId = request.headers['x-test-user-id'];
    const isProduction = process.env.NODE_ENV === 'production';

    if (testUserId && !isProduction) {
      this.logger.warn(`⚠️ Using Dev Bypass for User: ${testUserId}`);
      request.user = { id: testUserId }; // จำลองข้อมูล User ใส่ใน Request
      return true; // ผ่านทันที!
    }
    // ==========================================

    // 🔑 1. ดึง Token จาก Header Authorization (รูปแบบ: Bearer <token>)
    const token = request.headers.authorization?.split(' ')[1];

    if (!token) {
      // ❌ ถ้าไม่มี Token ส่งมา ให้ปฏิเสธการเข้าถึง
      throw new UnauthorizedException('No token provided');
    }

    try {
      // ✅ 2. ตรวจสอบความถูกต้องของ Token ผ่าน Clerk SDK
      const verifiedToken = await clerkClient.verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      // 👤 3. นำข้อมูล User ID (sub) จาก Token มาเก็บไว้ใน request.user
      // เพื่อให้ Controller อื่นๆ เรียกใช้ผ่าน @CurrentUser() ได้
      request.user = { id: verifiedToken.sub };

      return true;
    } catch (error) {
      this.logger.error(error);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
