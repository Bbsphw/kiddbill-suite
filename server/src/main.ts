// server/src/main.ts

import * as dotenv from 'dotenv';
dotenv.config(); // โหลด .env ก่อนเพื่อน

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ZodValidationPipe } from 'nestjs-zod';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('Bootstrap');

  // 🛡️ Global Validation Pipe (สำคัญมาก!)
  // ช่วยกรองข้อมูลขยะที่ส่งมาเกิน DTO ทิ้งไป (whitelist: true)
  // และแปลง Type อัตโนมัติ (transform: true)
  app.useGlobalPipes(new ZodValidationPipe());

  // 🌐 CORS Setup (ความปลอดภัย)
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      // 'https://your-production-domain.com' // ใส่เพิ่มตอน Deploy จริง
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // อนุญาตให้ส่ง Cookie/Auth Header ข้ามโดเมน
  });

  // 🚀 Start Server
  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.log(`🚀 Application is running on: ${await app.getUrl()}`);
  logger.log(`⭐️ Environment: ${process.env.NODE_ENV || 'development'}`);
}
bootstrap();
