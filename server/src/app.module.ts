// server/src/app.module.ts

import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { BillsModule } from './bills/bills.module';
import { OcrModule } from './ocr/ocr.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { BillItemsModule } from './bill-items/bill-items.module';

import { ConfigModule } from '@nestjs/config';
import { BillMembersModule } from './bill-members/bill-members.module';
import { BankAccountsModule } from './bank-accounts/bank-accounts.module';
import { SplitsModule } from './splits/splits.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // ให้ทุก module เรียกใช้ .env ได้หมด
    }),
    PrismaModule,
    BillsModule,
    OcrModule,
    UsersModule,
    BillItemsModule,
    BillMembersModule,
    BankAccountsModule,
    SplitsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
