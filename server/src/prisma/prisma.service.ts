// apps/api/src/prisma/prisma.service.ts

import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    // 1. ดึง Connection String
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is missing');
    }

    // 2. ส่ง config ให้ PrismaPg (ให้ adapter จัดการสร้าง Pool ภายในเอง)
    // แก้ไขปัญหา pnpm/instanceof pg.Pool mismatch
    const adapter = new PrismaPg({
      connectionString,
    });

    // 3. ส่ง Adapter ให้ PrismaClient
    super({
      adapter,
      log: ['query', 'info', 'warn', 'error'], // เปิด Log ดู Query ได้ถ้าต้องการ Debug
    });

    try {
      const parsed = new URL(connectionString);
      this.logger.log(
        `Database URL: host=${parsed.host}, database=${parsed.pathname}`,
      );
    } catch {
      this.logger.warn('Failed to parse DATABASE_URL as URL object');
    }
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Database connected via Prisma Adapter (pg)');
    } catch (error) {
      this.logger.error('❌ Database connection failed', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('🛑 Database disconnected and pool closed');
    } catch (error) {
      this.logger.error('❌ Error during database disconnect', error);
    }
  }
}
