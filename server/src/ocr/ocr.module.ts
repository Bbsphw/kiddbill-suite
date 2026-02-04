// server/src/ocr/ocr.controller.ts

import { Module } from '@nestjs/common';
import { OcrService } from './ocr.service';
import { OcrController } from './ocr.controller';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@Module({
  imports: [
    // ตั้งค่า Multer ให้เก็บไฟล์ใน Memory (Ram) ชั่วคราว
    // เพื่อส่งต่อให้ AI แล้วทิ้งไป (ไม่ต้อง Save ลง Disk Server)
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // จำกัดขนาด 5MB
      },
    }),
  ],
  controllers: [OcrController],
  providers: [OcrService],
})
export class OcrModule {}
