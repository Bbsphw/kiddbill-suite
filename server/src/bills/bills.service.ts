// server/src/bills/bills.service.ts

import { clerkClient } from '@clerk/clerk-sdk-node';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
/**
 * 📝 BillsService: จัดการเกี่ยวกับข้อมูลบิลทั้งหมด
 * ทั้งการสร้าง, แก้ไข, ลบ (Soft Delete) และการดึงข้อมูล
 */
export class BillsService {
  constructor(private prisma: PrismaService) {}

  // 🎲 ฟังก์ชันสำหรับสุ่มรหัส Join Code (6 หลัก) เพื่อใช้เข้าร่วมกลุ่มบิล
  private generateCode(length = 6): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  }

  // ✨ สร้างบิลใหม่
  async create(userId: string, createBillDto: CreateBillDto) {
    let joinCode = '';
    let isUnique = false;
    let attempts = 0;

    // 1. 🔑 สุ่มรหัส Join Code (6 หลัก) และตรวจสอบว่าไม่ซ้ำในระบบ
    while (!isUnique && attempts < 10) {
      joinCode = this.generateCode();
      const count = await this.prisma.bill.count({ where: { joinCode } });
      if (count === 0) isUnique = true;
      attempts++;
    }

    if (!isUnique) throw new Error('Failed to generate unique join code');

    // 2. 👤 ตรวจสอบข้อมูลผู้ใช้ในฐานข้อมูล (Sync ข้อมูลจาก Clerk หากยังไม่มี)
    let user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      console.log(`User ${userId} not found in DB. Syncing from Clerk...`);
      try {
        // 🔄 ดึงข้อมูลโปรไฟล์ล่าสุดจาก Clerk API
        const clerkUser = await clerkClient.users.getUser(userId);
        const email = clerkUser.emailAddresses[0]?.emailAddress;

        // 💾 บันทึกข้อมูลผู้ใช้ลงในฐานข้อมูลของเราเอง
        user = await this.prisma.user.create({
          data: {
            id: userId,
            email: email,
            username: clerkUser.username || `user_${userId.slice(0, 8)}`, // fallback username
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            avatarUrl: clerkUser.imageUrl,
            isGuest: false,
          },
        });
      } catch (error) {
        console.error('Failed to sync user from Clerk:', error);
        // ⚠️ กรณีฉุกเฉิน: สร้างข้อมูลจำลอง (Placeholder) เพื่อให้ระบบทำงานต่อได้
        user = await this.prisma.user.create({
          data: {
            id: userId,
            username: `user_${userId.slice(0, 8)}`,
            firstName: 'Unknown User',
          },
        });
      }
    }

    // กำหนดชื่อที่จะแสดงในรายการสมาชิก (ลำดับความสำคัญ: ชื่อจริง > Username > Owner)
    const ownerName = user.firstName || user.username || 'Owner';

    // 3. 📝 บันทึกข้อมูลบิลลงฐานข้อมูล พร้อมเพิ่มเจ้าของเป็นสมาชิกคนแรก
    return this.prisma.bill.create({
      data: {
        ...createBillDto,
        ownerId: userId,
        joinCode: joinCode,
        status: 'DRAFT', // เริ่มต้นที่สถานะร่าง (Draft)
        members: {
          create: {
            name: ownerName,
            userId: userId,
            isPaid: false, // เริ่มต้นยังไม่ได้จ่ายเงิน
          },
        },
      },
      include: { members: true }, // ส่งข้อมูลสมาชิกกลับไปด้วย
    });
  }

  // 📋 ดึงรายการบิลทั้งหมดของผู้ใช้ (เฉพาะที่ยังไม่ถูกลบ)
  async findAll(userId: string) {
    return this.prisma.bill.findMany({
      where: {
        ownerId: userId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { members: true, items: true } },
      },
    });
  }

  // 🔍 ดึงรายละเอียดของบิล 1 ใบ ตาม ID
  async findOne(id: string) {
    const bill = await this.prisma.bill.findUnique({
      where: { id },
      include: {
        items: { orderBy: { orderIndex: 'asc' } },
        members: true,
        // Optimization: Select เฉพาะ field ที่จำเป็นของ owner
        owner: {
          select: {
            id: true,
            firstName: true,
            avatarUrl: true,
            username: true,
          },
        },
      },
    });

    if (!bill) throw new NotFoundException(`Bill not found`);
    if (bill.deletedAt) throw new NotFoundException(`Bill has been deleted`); // ป้องกันการเข้าถึงบิลที่ถูกลบแบบ Soft Delete

    return bill;
  }

  // 🛠️ แก้ไขข้อมูลบิล
  async update(id: string, userId: string, updateBillDto: UpdateBillDto) {
    // 1. ตรวจสอบว่าบิลมีอยู่จริงและผู้ใช้เป็นเจ้าของหรือไม่
    // ดึงเฉพาะ ownerId มาเช็คเพื่อความรวดเร็ว
    const bill = await this.prisma.bill.findUnique({
      where: { id },
      select: { ownerId: true, deletedAt: true },
    });

    if (!bill) throw new NotFoundException(`Bill not found`);
    if (bill.deletedAt) throw new NotFoundException(`Bill has been deleted`);

    // ตรวจสอบสิทธิ์: ต้องเป็นเจ้าของบิลเท่านั้นถึงจะแก้ไขได้
    if (bill.ownerId !== userId) {
      throw new ForbiddenException(`You are not the owner of this bill`);
    }

    // 2. อัปเดตข้อมูลตามที่ส่งมาใน DTO
    return this.prisma.bill.update({
      where: { id },
      data: updateBillDto,
    });
  }

  // --- FIX: Remove Logic ---
  async remove(id: string, userId: string) {
    // 1. ตรวจสอบการมีอยู่และสิทธิ์ความเป็นเจ้าของ
    const billCheck = await this.prisma.bill.findUnique({
      where: { id },
      select: { ownerId: true, deletedAt: true }, // Select แค่นี้พอ
    });

    if (!billCheck) throw new NotFoundException(`Bill not found`);
    if (billCheck.deletedAt)
      throw new NotFoundException(`Bill already deleted`);

    // ตรวจสอบสิทธิ์: ต้องเป็นเจ้าของบิลเท่านั้นถึงจะลบได้
    if (billCheck.ownerId !== userId) {
      throw new ForbiddenException('You are not allowed to delete this bill');
    }

    // 2. Soft Delete: ไม่ลบข้อมูลออกจาก DB จริงๆ แต่บันทึกวันที่ลบและเปลี่ยนสถานะ
    return this.prisma.bill.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'CANCELLED' },
    });
  }

  // -------------------------------------------------------
  // 🧠 THE BRAIN: ระบบคำนวณเงิน (สำคัญที่สุด)
  // -------------------------------------------------------
  async getSummary(billId: string) {
    // 1. ดึงข้อมูลโคตรครบ (Bill + Items + Splits + Members)
    const bill = await this.prisma.bill.findUnique({
      where: { id: billId },
      include: {
        items: {
          include: { splits: true }, // ดูว่าจานนี้ใครหารบ้าง
        },
        members: true, // เอามา map ชื่อ
      },
    });

    if (!bill) throw new NotFoundException('Bill not found');

    // เตรียมตัวแปรเก็บยอดเงินของแต่ละคน
    // Format: { "userId": { netAmount: 0, items: [] } }
    const memberTotals: Record<
      string,
      {
        name: string;
        baseAmount: number; // ค่าอาหารเพียวๆ
        scAmount: number; // ค่า Service Charge
        vatAmount: number; // ค่า VAT
        netAmount: number; // ยอดสุทธิ
        items: any[];
      }
    > = {};

    // Init Member Map
    bill.members.forEach((m) => {
      memberTotals[m.userId] = {
        name: m.name,
        baseAmount: 0,
        scAmount: 0,
        vatAmount: 0,
        netAmount: 0,
        items: [],
      };
    });

    // 2. วนลูปทุกรายการอาหาร เพื่อหารเงิน
    for (const item of bill.items) {
      const itemTotalPrice = Number(item.totalPrice); // ราคา * จำนวน
      const totalSplits = item.splits.length;

      if (totalSplits > 0) {
        // หารเท่ากัน (ในเวอร์ชันนี้เราใช้ Weight = 1 เสมอไปก่อน)
        const pricePerPerson = itemTotalPrice / totalSplits;

        // แจกจ่ายหนี้ให้แต่ละคน
        item.splits.forEach((split) => {
          if (memberTotals[split.memberId]) {
            // เช็คว่า member ยังอยู่ไหม
            memberTotals[split.memberId].baseAmount += pricePerPerson;
            memberTotals[split.memberId].items.push({
              name: item.name,
              amount: pricePerPerson,
            });
          }
        });
      } else {
        // ⚠️ Case: จานนี้ไม่มีใครเลือกเลย! (Unassigned Item)
        // ทางเลือก: โยนกลับไปให้ Owner รับผิดชอบ หรือ แจ้งเตือน
        // ในที่นี้เราจะโยนให้ Owner
        if (memberTotals[bill.ownerId]) {
          memberTotals[bill.ownerId].baseAmount += itemTotalPrice;
          memberTotals[bill.ownerId].items.push({
            name: `${item.name} (ไม่มีคนหาร)`,
            amount: itemTotalPrice,
          });
        }
      }
    }

    // 3. คำนวณ VAT & Service Charge (Finalizing)
    const summary = Object.keys(memberTotals).map((userId) => {
      const data = memberTotals[userId];
      let currentTotal = data.baseAmount;

      // A. Service Charge (ถ้ายังไม่รวม ให้บวกเพิ่ม)
      // สูตร: ถ้า bill บอกว่า SC 10% และยังไม่รวม -> บวกเพิ่ม
      if (!bill.isServiceChargeIncluded && Number(bill.serviceChargeRate) > 0) {
        const sc = currentTotal * (Number(bill.serviceChargeRate) / 100);
        data.scAmount = sc;
        // SC ถือเป็นรายได้ร้าน ต้องเอามารวมก่อนคิด VAT ไหม?
        // ปกติ: (Price + SC) * VAT
        currentTotal += sc;
      }

      // B. VAT (ถ้ายังไม่รวม ให้บวกเพิ่ม)
      // สูตร: คิดจาก (ค่าอาหาร + SC แล้ว)
      if (!bill.isVatIncluded && Number(bill.vatRate) > 0) {
        const vat = currentTotal * (Number(bill.vatRate) / 100);
        data.vatAmount = vat;
        currentTotal += vat;
      }

      // C. Update Net Amount (ปัดทศนิยม 2 ตำแหน่ง)
      data.netAmount = Math.ceil(currentTotal * 100) / 100; // ปัดเศษขึ้นเล็กน้อยป้องกันขาดทุน

      return {
        userId,
        ...data,
      };
    });

    // 4. Return ผลลัพธ์
    return {
      billId: bill.id,
      title: bill.title,
      config: {
        vat: Number(bill.vatRate),
        sc: Number(bill.serviceChargeRate),
      },
      members: summary,
      totalBillAmount: summary.reduce((sum, m) => sum + m.netAmount, 0),
    };
  }
}
