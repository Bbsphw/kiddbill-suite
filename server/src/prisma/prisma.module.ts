// server/src/prisma/prisma.module.ts

import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // 🌐 ทำให้ Service นี้เรียกใช้ได้ทั้งแอปโดยไม่ต้อง import ใน module อื่น
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
