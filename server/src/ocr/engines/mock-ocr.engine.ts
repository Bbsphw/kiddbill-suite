import 'multer';
import { Injectable } from '@nestjs/common';
import { OcrEngine } from '../interfaces/ocr-engine.interface';
import { OcrResultDto } from '../dto/ocr-response.dto';

@Injectable()
export class MockOcrEngine implements OcrEngine {
  async parseReceipt(file: Express.Multer.File): Promise<OcrResultDto> {
    console.log(`Processing file: ${file.originalname} (${file.size} bytes)`);

    // --- MOCK LOGIC (จำลองว่า AI อ่านเจออะไรบ้าง) ---
    const mockResult: OcrResultDto = {
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
