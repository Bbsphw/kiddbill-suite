// apps/api/src/prisma/prisma.service.ts

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // สร้าง Connection Pool ก่อน
    const connectionString = `${process.env.DATABASE_URL}`;

    const pool = new Pool({
      connectionString,
    });

    // เอา Pool ใส่เข้าไปใน Adapter
    const adapter = new PrismaPg(pool);

    // ส่ง Adapter ให้ PrismaClient
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
