// server/src/ocr/ocr.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class OcrService {
  // ฟังก์ชันรับรูปภาพและแปลงเป็นรายการอาหาร
  async parseReceipt(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');

    // ✅ TODO: ตรงนี้คือจุดที่คุณจะเอา file.buffer ส่งไปให้ AI
    // เช่น Google Cloud Vision API หรือ OpenAI GPT-4o

    console.log(`Processing file: ${file.originalname} (${file.size} bytes)`);

    // --- MOCK LOGIC (จำลองว่า AI อ่านเจออะไรบ้าง) ---
    // เพื่อให้คุณเทส Frontend ได้ทันทีโดยไม่ต้องเสียเงินค่า API
    const mockResult = {
      merchantName: 'MK Restaurants',
      date: new Date().toISOString(),
      items: [
        { name: 'ชุดผักเพื่อสุขภาพ', price: 185, quantity: 1 },
        { name: 'หมูนุ่ม', price: 145, quantity: 2 }, // 2 จาน
        { name: 'เป็ดย่างจานเล็ก', price: 350, quantity: 1 },
        { name: 'บะหมี่หยก (ก้อน)', price: 56, quantity: 2 }, // ก้อนละ 28
        { name: 'น้ำแตงโมปั่น', price: 65, quantity: 1 },
        { name: 'น้ำแข็งเปล่า', price: 0, quantity: 4 },
      ],
      subtotal: 946,
      vat: 66.22,
      serviceCharge: 94.6,
      total: 1106.82,
    };

    // จำลอง Delay เหมือน AI กำลังคิด (1.5 วินาที)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return mockResult;
  }
}
