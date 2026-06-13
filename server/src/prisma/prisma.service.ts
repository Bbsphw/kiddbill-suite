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
    // 1. ดึง Connection String จาก Environment
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is missing');
    }

    const adapter = new PrismaPg(connectionString);

    // 2. เรียกใช้งาน Prisma พร้อม Adapter
    super({
      adapter,
      log: ['query', 'info', 'warn', 'error'],
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
      // 🛡️ บังคับยิง Query เทส Pool ว่าใช้งานได้จริง (Fail-Fast)
      await this.$queryRawUnsafe('SELECT 1');
      this.logger.log('🗄️ Database connected and verified via Prisma Adapter');
    } catch (error) {
      this.logger.error(
        '❌🗄️ Database connection failed. Is PostgreSQL running?',
        error,
      );
      // Fail-fast: Stop the application immediately if the database is unavailable
      process.exit(1);
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('🛑 Database disconnected');
    } catch (error) {
      this.logger.error('❌ Error during database disconnect', error);
    }
  }
}
