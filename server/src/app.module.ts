// server/src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { LoggerModule } from 'nestjs-pino';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { SentryModule, SentryGlobalFilter } from '@sentry/nestjs/setup';
import { validate } from './env';

// Core Modules
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Feature Modules
import { UsersModule } from './users/users.module';
import { BillsModule } from './bills/bills.module';
import { BillItemsModule } from './bill-items/bill-items.module';
import { BillMembersModule } from './bill-members/bill-members.module';
import { BankAccountsModule } from './bank-accounts/bank-accounts.module';
import { SplitsModule } from './splits/splits.module';
import { FriendsModule } from './friends/friends.module';
import { OcrModule } from './ocr/ocr.module';
import { StorageModule } from './storage/storage.module';
import { WebhooksController } from './webhooks/webhooks.controller';

@Module({
  imports: [
    SentryModule.forRoot(),
    // ⚙️ Config: โหลด .env ให้ใช้ได้ทั้งแอป
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        `.env.${process.env.NODE_ENV}.local`,
        `.env.${process.env.NODE_ENV}`,
        '.env.local',
        '.env',
      ],
      validate,
    }),

    // 🛡️ Rate Limiting (In-memory)
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 50,
      },
    ]),

    // 🚀 Background Jobs (Redis)
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
        tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
      },
    }),

    // 📋 Structured Logging (Pino)
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
      },
    }),

    // 🗄️ Database
    PrismaModule,

    // 🧩 Features
    UsersModule,
    BillsModule,
    BillItemsModule,
    BillMembersModule,
    BankAccountsModule,
    SplitsModule,
    FriendsModule,
    OcrModule,
    StorageModule,
  ],
  controllers: [AppController, WebhooksController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
