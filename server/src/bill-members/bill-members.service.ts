// server/src/bill-members/bill-members.service.ts

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JoinBillDto } from './dto/join-bill-member.dto';
import { CreateBillMemberDto } from './dto/create-bill-member.dto';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { calculateBillSummary } from '@kiddbill/shared';

interface GeminiApiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

interface GeminiSlipResult {
  amount?: number;
  sender?: string;
  refId?: string;
  date?: string;
  error?: string;
}

function sanitizeNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value;
  }
  const str = typeof value === 'string' ? value : '';
  const cleaned = str.trim().replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

@Injectable()
export class BillMembersService {
  private readonly logger = new Logger(BillMembersService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  // 🚪 1. เข้าร่วมบิลผ่าน Code (สำหรับ User จริง)
  async join(userId: string, dto: JoinBillDto) {
    // 1. หาบิลจาก Code
    const bill = await this.prisma.bill.findUnique({
      where: { joinCode: dto.joinCode },
      include: { members: true },
    });

    if (!bill) {
      throw new NotFoundException(
        'ไม่พบรหัสห้องนี้ โปรดตรวจสอบความถูกต้อง (ระวังตัวอักษร 0 กับ O หรือ 1 กับ I)',
      );
    }

    if (bill.status === 'CANCELLED' || bill.status === 'COMPLETED') {
      throw new BadRequestException(
        `Cannot join a ${bill.status.toLowerCase()} bill`,
      );
    }

    // 2. เช็คว่าเข้าซ้ำไหม?
    const existingMember = bill.members.find((m) => m.userId === userId);
    if (existingMember) {
      return {
        message: 'Already joined',
        member: existingMember,
        billId: bill.id,
      };
    }

    // 3. เตรียมชื่อที่จะแสดง (Display Name)
    let displayName = 'Member';
    // ลองดึงชื่อจาก DB หรือ Clerk
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      displayName = user.firstName || user.username || 'Member';
    } else {
      try {
        const clerkUser = await clerkClient.users.getUser(userId);
        displayName = clerkUser.firstName || 'New Member';
      } catch {
        /* ignore error */
      }
    }

    // 4. สร้างสมาชิก
    const newMember = await this.prisma.billMember.create({
      data: {
        billId: bill.id,
        userId: userId,
        name: displayName,
        isPaid: false,
      },
    });

    return {
      message: 'Joined successfully',
      member: newMember,
      billId: bill.id,
    };
  }

  // ➕ 2. เพิ่ม Guest Member (เจ้าของบิลเพิ่มเอง)
  async create(userId: string, dto: CreateBillMemberDto) {
    // 1. เช็คสิทธิ์ความเป็นเจ้าของ
    const bill = await this.prisma.bill.findUnique({
      where: { id: dto.billId },
      include: { members: true },
    });
    if (!bill) throw new NotFoundException('Bill not found');

    if (bill.status === 'COMPLETED' || bill.status === 'CANCELLED') {
      throw new BadRequestException(
        `Cannot add guest members to a ${bill.status.toLowerCase()} bill`,
      );
    }

    if (bill.ownerId !== userId) {
      throw new ForbiddenException('Only bill owner can add guest members');
    }

    // เช็คกรณีชื่อซ้ำในบิล (Case-insensitive)
    const nameExists = bill.members.some(
      (m) => m.name.toLowerCase() === dto.name.toLowerCase(),
    );
    if (nameExists) {
      throw new BadRequestException(
        `A member with the name "${dto.name}" already exists in this bill`,
      );
    }

    // 2. สร้าง Guest (userId = null)
    return this.prisma.billMember.create({
      data: {
        billId: dto.billId,
        name: dto.name,
        userId: null, // 👈 สำคัญ: ระบุว่าเป็น Guest
      },
    });
  }

  // 📋 3. ดึงรายชื่อสมาชิกทั้งหมด
  async findAll(billId: string) {
    return this.prisma.billMember.findMany({
      where: { billId },
      include: { user: true }, // ดึงข้อมูล User จริงมาด้วย (ถ้ามี)
      orderBy: { createdAt: 'asc' },
    });
  }

  // 💸 4. แจ้งโอนเงิน (Toggle Status)
  async togglePaidStatus(memberId: string, userId: string) {
    const member = await this.prisma.billMember.findUnique({
      where: { id: memberId },
      include: { bill: true },
    });
    if (!member) throw new NotFoundException('Member not found');

    if (member.bill.status === 'CANCELLED') {
      throw new BadRequestException(
        'Cannot modify payment status on a cancelled bill',
      );
    }

    // เช็คสิทธิ์: ต้องเป็น "เจ้าตัว" หรือ "เจ้าของบิล" ถึงจะกดได้
    const isSelf = member.userId === userId;
    const isOwner = member.bill.ownerId === userId;

    if (!isSelf && !isOwner) {
      throw new ForbiddenException('Not authorized to update this member');
    }

    return this.prisma.billMember.update({
      where: { id: memberId },
      data: {
        isPaid: !member.isPaid, // สลับสถานะ
        paidAt: !member.isPaid ? new Date() : null, // ถ้าจ่ายแล้วให้ลงเวลา
      },
    });
  }

  // ✅ 5. เจ้าของกดยืนยัน (Verify)
  async verifyPayment(memberId: string, userId: string) {
    const member = await this.prisma.billMember.findUnique({
      where: { id: memberId },
      include: { bill: true },
    });
    if (!member) throw new NotFoundException('Member not found');

    if (member.bill.status === 'CANCELLED') {
      throw new BadRequestException(
        'Cannot verify payment on a cancelled bill',
      );
    }

    // ต้องเป็น "เจ้าของบิล" เท่านั้น
    if (member.bill.ownerId !== userId) {
      throw new ForbiddenException('Only owner can verify payments');
    }

    return this.prisma.billMember.update({
      where: { id: memberId },
      data: {
        verifiedAt: new Date(), // ลงเวลายืนยัน
        isPaid: true, // บังคับเป็นจ่ายแล้วเสมอ
        paidAt: member.paidAt || new Date(),
      },
    });
  }

  async calculateMemberExpectedAmount(memberId: string): Promise<number> {
    const member = await this.prisma.billMember.findUnique({
      where: { id: memberId },
      select: { billId: true },
    });
    if (!member) throw new NotFoundException('Member not found');

    const bill = await this.prisma.bill.findUnique({
      where: { id: member.billId },
      include: {
        items: { include: { splits: true } },
        members: true,
      },
    });
    if (!bill) throw new NotFoundException('Bill not found');

    // Map to inputBill expected by calculateBillSummary
    const inputBill = {
      id: bill.id,
      title: bill.title,
      status: bill.status,
      vatRate: Number(bill.vatRate),
      serviceChargeRate: Number(bill.serviceChargeRate),
      isVatIncluded: bill.isVatIncluded,
      isServiceChargeIncluded: bill.isServiceChargeIncluded,
      discountAmount: Number(bill.discountAmount),
      discountPercent: Number(bill.discountPercent),
      roundingMode: bill.roundingMode as 'NONE' | 'UP' | 'DOWN' | 'NEAREST',
      ownerId: bill.ownerId,
      items: bill.items.map((item) => ({
        id: item.id,
        name: item.name,
        totalPrice: Number(item.totalPrice),
        applyVat: item.applyVat,
        applyServiceCharge: item.applyServiceCharge,
        splits: item.splits.map((s) => ({
          memberId: s.memberId,
          weight: Number(s.weight),
        })),
      })),
      members: bill.members.map((m) => ({
        id: m.id,
        name: m.name,
        userId: m.userId,
        isPaid: m.isPaid,
        verifiedAt: m.verifiedAt,
      })),
    };

    const summary = calculateBillSummary(inputBill);
    const mSummary = summary.members.find((m) => m.memberId === memberId);
    return mSummary ? mSummary.netAmount : 0;
  }

  async submitSlip(memberId: string, userId: string, paymentProofUrl: string) {
    const member = await this.prisma.billMember.findUnique({
      where: { id: memberId },
      include: { bill: true },
    });
    if (!member) throw new NotFoundException('Member not found');

    // Check permissions (must be the member himself or the bill owner)
    if (member.userId !== userId && member.bill.ownerId !== userId) {
      throw new ForbiddenException(
        'Not authorized to submit slip for this member',
      );
    }

    if (member.bill.status === 'CANCELLED') {
      throw new BadRequestException('Cannot submit slip for a cancelled bill');
    }

    // 1. Calculate expected amount
    const expectedAmount = await this.calculateMemberExpectedAmount(memberId);

    // 2. Fetch the image to process via Gemini
    let base64Image = '';
    let mimeType = 'image/jpeg';

    try {
      const response = await fetch(paymentProofUrl, {
        signal: AbortSignal.timeout(10000), // 10 seconds timeout
      });
      if (!response.ok) {
        throw new Error('Failed to fetch slip image');
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      base64Image = buffer.toString('base64');
      if (paymentProofUrl.toLowerCase().endsWith('.png'))
        mimeType = 'image/png';
      else if (paymentProofUrl.toLowerCase().endsWith('.webp'))
        mimeType = 'image/webp';
    } catch (e) {
      // If download fails, we fallback to manual check status, but don't crash the entire request
      this.logger.error('Failed to download slip for AI verification', e);
      return this.prisma.billMember.update({
        where: { id: memberId },
        data: {
          isPaid: true,
          paidAt: new Date(),
          paymentProofUrl,
          slipMatchStatus: 'UNVERIFIED', // indicates AI check was skipped
        },
      });
    }

    // 3. Call Gemini
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    if (!apiKey) {
      // Fallback if no API key
      return this.prisma.billMember.update({
        where: { id: memberId },
        data: {
          isPaid: true,
          paidAt: new Date(),
          paymentProofUrl,
          slipMatchStatus: 'UNVERIFIED',
        },
      });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const prompt = `
      คุณคือ AI ตรวจสอบสลิปโอนเงินธนาคารของประเทศไทย
      หน้าที่ของคุณคือดึงข้อมูลจากรูปภาพสลิปนี้ให้เป็นรูปแบบ JSON (ห้ามมี Markdown code block ครอบ):
      {
        "amount": จำนวนเงินโอนเป็นตัวเลขทศนิยม (number เช่น 150.00),
        "sender": "ชื่อผู้โอนในสลิป (ภาษาไทยหรืออังกฤษ)",
        "refId": "รหัสอ้างอิงการโอนเงิน/เลขที่รายการ (string)",
        "date": "วันเวลาที่โอนในรูปแบบ ISO datetime string"
      }
      หากภาพนี้ไม่ใช่ภาพสลิปโอนเงินของไทย คืนค่าเพียง:
      { "error": "รูปภาพนี้ไม่ใช่สลิปโอนเงินของไทย" }
    `;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                { inlineData: { mimeType, data: base64Image } },
              ],
            },
          ],
          generationConfig: { responseMimeType: 'application/json' },
        }),
        signal: AbortSignal.timeout(15000), // 15 seconds timeout
      });

      if (!response.ok) {
        throw new Error('Gemini API call failed');
      }

      const resJson = (await response.json()) as GeminiApiResponse;
      const text = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('No text returned from Gemini API');
      }

      const parsed = JSON.parse(text.trim()) as GeminiSlipResult;

      if (parsed.error) {
        return this.prisma.billMember.update({
          where: { id: memberId },
          data: {
            isPaid: true,
            paidAt: new Date(),
            paymentProofUrl,
            slipMatchStatus: 'MISMATCHED', // not a valid slip
          },
        });
      }

      const slipAmount = sanitizeNumber(parsed.amount);
      const slipSender = String(parsed.sender || 'ไม่ระบุชื่อ');
      const slipRefId = parsed.refId
        ? String(parsed.refId).trim().toUpperCase()
        : '';

      // Check for slip reuse: Is there another member who already used this refId?
      if (slipRefId) {
        const duplicateRef = await this.prisma.billMember.findFirst({
          where: {
            slipRefId,
            id: { not: memberId }, // exclude self
          },
        });

        if (duplicateRef) {
          return this.prisma.billMember.update({
            where: { id: memberId },
            data: {
              isPaid: true,
              paidAt: new Date(),
              paymentProofUrl,
              slipMatchStatus: 'DUPLICATE', // reused slip!
              slipSender,
              slipAmount,
            },
          });
        }
      }

      // Check if amount matches expected amount (allow tiny margin of 0.05 for rounding)
      const isAmountMatched = Math.abs(slipAmount - expectedAmount) < 0.05;
      const slipMatchStatus = isAmountMatched ? 'MATCHED' : 'MISMATCHED';

      return this.prisma.billMember.update({
        where: { id: memberId },
        data: {
          isPaid: true,
          paidAt: new Date(),
          paymentProofUrl,
          slipAmount,
          slipSender,
          slipRefId: slipRefId || null,
          slipMatchStatus,
        },
      });
    } catch (e) {
      this.logger.error('Failed in submitSlip Gemini processing', e);
      return this.prisma.billMember.update({
        where: { id: memberId },
        data: {
          isPaid: true,
          paidAt: new Date(),
          paymentProofUrl,
          slipMatchStatus: 'UNVERIFIED',
        },
      });
    }
  }
}
