// server/src/main.ts
import './instrument'; // MUST be first

import * as dotenv from 'dotenv';
dotenv.config(); // โหลด .env ก่อนเพื่อน

import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import { NestFactory } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ZodValidationPipe } from 'nestjs-zod';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));

  // 🔄 Enable API Versioning (e.g. /v1/bills)
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // 🛡️ Global Validation Pipe (สำคัญมาก!)
  // ช่วยกรองข้อมูลขยะที่ส่งมาเกิน DTO ทิ้งไป (whitelist: true)
  // และแปลง Type อัตโนมัติ (transform: true)
  app.useGlobalPipes(new ZodValidationPipe());

  // 📖 Swagger API Docs Setup
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Kiddbill Suite API')
      .setDescription('The API documentation for Kiddbill Suite')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  // 🛡️ Security Headers
  app.use(helmet());

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
  const port = process.env.PORT || 3002;
  // Change 127.0.0.1 to 0.0.0.0 to allow Koyeb container routing
  await app.listen(port, '0.0.0.0');

  const logger = app.get(Logger);
  logger.log(`🚀 Server successfully started on port ${port}`);
  if (process.env.NODE_ENV !== 'production') {
    logger.log(
      `📚 Swagger API Docs available at http://localhost:${port}/api/docs`,
    );
  }
}
void bootstrap();
