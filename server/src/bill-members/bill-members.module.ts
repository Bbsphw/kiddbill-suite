import { Module } from '@nestjs/common';
import { BillMembersService } from './bill-members.service';
import { BillMembersController } from './bill-members.controller';

@Module({
  controllers: [BillMembersController],
  providers: [BillMembersService],
})
export class BillMembersModule {}
