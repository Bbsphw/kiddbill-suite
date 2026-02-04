// apps/api/src/prisma/prisma.service.ts

import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    // 1. สร้าง Connection Pool ด้วย pg
    // ข้อดี: จัดการ Connection ได้ดีกว่า, รองรับ Serverless/Edge ได้ดีขึ้น
    const connectionString = `${process.env.DATABASE_URL}`;

    const pool = new Pool({
      connectionString,
      // สามารถปรับจูน config pool ได้ที่นี่ เช่น:
      // max: 10, (จำนวน connection สูงสุด)
      // idleTimeoutMillis: 30000,
    });

    // 2. เชื่อมต่อ Adapter
    const adapter = new PrismaPg(pool);

    // 3. ส่ง Adapter ให้ PrismaClient
    super({
      adapter,
      log: ['query', 'info', 'warn', 'error'], // เปิด Log ดู Query ได้ถ้าต้องการ Debug
    });
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
    await this.$disconnect();
    this.logger.log('🛑 Database disconnected');
  }
}
