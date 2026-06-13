// server/src/app.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { Redis } from 'ioredis';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private prisma: PrismaService) {}

  async getHealthCheck() {
    let dbStatus = 'ok';
    let redisStatus = 'ok';
    const issues: string[] = [];

    // 1. Check Database (Prisma)
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (e) {
      dbStatus = 'error';
      issues.push('Database connectivity failed');
      this.logger.error('Diagnostics: Database ping failed', e);
    }

    // 2. Check Redis
    let redisClient: Redis | null = null;
    try {
      redisClient = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
        tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
      });

      // Try pinging
      if (redisClient) {
        await redisClient.ping();
      }
    } catch (e) {
      redisStatus = 'error';
      issues.push('Redis connectivity failed (BullMQ)');
      this.logger.error('Diagnostics: Redis ping failed', e);
    } finally {
      if (redisClient) {
        redisClient.disconnect();
      }
    }

    const overallStatus =
      dbStatus === 'ok' && redisStatus === 'ok' ? 'ok' : 'error';

    return {
      status: overallStatus,
      services: {
        database: dbStatus,
        redis: redisStatus,
        sentry: process.env.SENTRY_DSN ? 'enabled' : 'disabled',
      },
      issues,
      message:
        overallStatus === 'ok'
          ? 'All systems are running 🚀'
          : 'Some systems have errors',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }
}
