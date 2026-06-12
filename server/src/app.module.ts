// server/src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
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

@Module({
  imports: [
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
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
