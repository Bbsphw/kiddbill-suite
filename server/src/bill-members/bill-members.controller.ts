import {
  Controller,
  Post,
  Patch,
  Body,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { BillMembersService } from './bill-members.service';
import { JoinBillDto } from './dto/join-bill-member.dto';
import { CreateBillMemberDto } from './dto/create-bill-member.dto';
import { ClerkAuthGuard } from '@/auth/clerk-auth.guard';
import { CurrentUser } from '@/auth/current-user.decorator';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';

@Controller('bill-members')
@UseGuards(ClerkAuthGuard) // 🛡️ บังคับ Login
export class BillMembersController {
  constructor(private readonly billMembersService: BillMembersService) {}

  // 1. เข้าร่วมผ่าน Code
  @Post('join')
  join(@CurrentUser() user: { id: string }, @Body() dto: JoinBillDto) {
    return this.billMembersService.join(user.id, dto);
  }

  // 2. เพิ่ม Guest (เจ้าของกดเพิ่ม)
  @Post()
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateBillMemberDto,
  ) {
    return this.billMembersService.create(user.id, dto);
  }

  // 3. ดึงรายชื่อสมาชิก
  @Get(':billId')
  findAll(@Param('billId') billId: string) {
    return this.billMembersService.findAll(billId);
  }

  // 4. แจ้งโอน (Toggle)
  @Patch(':id/toggle-paid')
  togglePaid(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.billMembersService.togglePaidStatus(id, user.id);
  }

  // 5. เจ้าของยืนยัน (Verify)
  @Patch(':id/verify')
  verify(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.billMembersService.verifyPayment(id, user.id);
  }

  // 6. อัปโหลดสลิปตรวจเงินโอน (AI-Assisted)
  @Patch(':id/submit-slip')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 600000 } }) // 🛡️ จำกัดการกดอัปโหลดสลิป 3 ครั้ง / 10 นาที
  submitSlip(
    @Param('id') id: string,
    @Body() dto: { paymentProofUrl: string },
    @CurrentUser() user: { id: string },
  ) {
    return this.billMembersService.submitSlip(id, user.id, dto.paymentProofUrl);
  }
}
