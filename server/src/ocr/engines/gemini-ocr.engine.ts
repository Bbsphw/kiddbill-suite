import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OcrEngine } from '@/ocr/interfaces/ocr-engine.interface';
import { OcrResultDto } from '@/ocr/dto/ocr-response.dto';

interface GeminiApiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

interface GeminiOcrResult {
  merchantName?: string;
  date?: string;
  items?: Array<{
    name?: string;
    price?: number;
    quantity?: number;
  }>;
  subtotal?: number;
  vat?: number;
  serviceCharge?: number;
  total?: number;
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
export class GeminiOcrEngine implements OcrEngine {
  private readonly apiKey: string;
  private readonly logger = new Logger(GeminiOcrEngine.name);

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
    if (!this.apiKey) {
      this.logger.warn(
        '⚠️ GEMINI_API_KEY is missing in configuration. Gemini OCR Engine will fail requests.',
      );
    }
  }

  async parseReceipt(imageUrl: string): Promise<OcrResultDto> {
    try {
      this.logger.log(`Fetching receipt image from: ${imageUrl}`);
      const response = await fetch(imageUrl, {
        signal: AbortSignal.timeout(10000), // 10 seconds timeout
      });
      if (!response.ok) {
        throw new Error(
          `Failed to fetch image from URL: ${response.statusText}`,
        );
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Determine mime type from URL or fallback
      let mimeType = 'image/jpeg';
      if (imageUrl.toLowerCase().endsWith('.png')) mimeType = 'image/png';
      else if (imageUrl.toLowerCase().endsWith('.webp'))
        mimeType = 'image/webp';

      return await this.processImage(buffer, mimeType);
    } catch (error) {
      this.logger.error('Error in parseReceipt', error);
      const errMsg = error instanceof Error ? error.message : '';
      const fallbackMsg =
        errMsg.includes('aborted') || errMsg.includes('timeout')
          ? 'ไม่สามารถดึงรูปภาพเพื่อสแกนใบเสร็จได้เนื่องจากการเชื่อมต่อหมดเวลา (Timeout)'
          : 'ไม่สามารถดึงรูปภาพเพื่อสแกนใบเสร็จได้';
      throw new BadRequestException(errMsg || fallbackMsg);
    }
  }

  async process(fileBuffer: Buffer): Promise<OcrResultDto> {
    // Default to image/jpeg for raw file buffer upload
    return this.processImage(fileBuffer, 'image/jpeg');
  }

  private async processImage(
    buffer: Buffer,
    mimeType: string,
  ): Promise<OcrResultDto> {
    if (!this.apiKey) {
      throw new BadRequestException(
        'ระบบ OCR คีย์ Gemini API ยังไม่ได้กำหนด กรุณาตรวจสอบการตั้งค่าหลังบ้าน',
      );
    }

    const base64Data = buffer.toString('base64');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;

    const prompt = `
      คุณคือระบบปัญญาประดิษฐ์สแกนใบเสร็จอาหารสำหรับแอปพลิเคชัน Kiddbill (แอปหารค่าอาหาร)
      หน้าที่ของคุณคือการสแกนและแปลงภาพใบเสร็จอาหารนี้ให้เป็นข้อมูล JSON ที่ถูกต้องและครบถ้วน
      
      ข้อกำหนดความปลอดภัยของแอป (Worst-case checks):
      1. ตรวจสอบว่าภาพนี้คือใบเสร็จอาหาร/ใบเสร็จรับเงินจริงหรือไม่? หากภาพนี้ไม่ใช่ใบเสร็จอาหารหรือสลิปการใช้บริการอาหาร ให้คืนค่า JSON ที่มีฟิลด์ "error" บอกเหตุผลว่ารูปภาพนี้ไม่ใช่ใบเสร็จอาหาร
      2. อ่านรายชื่อเมนูอาหาร ราคาต่อชิ้น และจำนวนชิ้นให้ถูกต้อง
      3. วิเคราะห์ยอดรวมย่อย (subtotal), ภาษี (vat), ค่าบริการ (service charge) และยอดรวมทั้งหมด (total) ของใบเสร็จ

      กรุณาคืนค่าข้อมูลกลับมาเป็น JSON ตามรูปแบบ Schema นี้เท่านั้น (ห้ามมี Markdown code block ครอบ เช่น \`\`\`json):
      {
        "merchantName": "ชื่อร้านอาหาร (ถ้าอ่านไม่ออกให้ใช้ 'ร้านอาหารไม่ระบุชื่อ')",
        "date": "วันเวลาที่ระบุในใบเสร็จในรูปแบบ ISO ISO-8601 String เช่น '2026-06-12T12:00:00.000Z' (ถ้าไม่ออกให้ใช้วันเวลาปัจจุบันแทน)",
        "items": [
          {
            "name": "ชื่อรายการอาหารภาษาไทยหรืออังกฤษ",
            "price": ราคาต่อหน่วยเป็นจำนวนตัวเลข (number),
            "quantity": จำนวนชิ้นอาหารเป็นจำนวนเต็มตัวเลข (number)
          }
        ],
        "subtotal": ยอดเงินก่อนบวก VAT และ Service Charge (number),
        "vat": ยอดเงินภาษีมูลค่าเพิ่ม (number, ถ้าไม่มีให้ใส่ 0),
        "serviceCharge": ยอดเงินค่าบริการ (number, ถ้าไม่มีให้ใส่ 0),
        "total": ยอดเงินสุทธิทั้งหมดของใบเสร็จ (number)
      }

      หากรูปภาพไม่ใช่ใบเสร็จอาหาร ให้ส่งคืนโครงสร้างนี้เท่านั้น:
      {
        "error": "รูปภาพนี้ไม่ใช่ใบเสร็จอาหาร"
      }
    `;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                merchantName: {
                  type: 'STRING',
                  description:
                    "ชื่อร้านอาหาร (ถ้าอ่านไม่ออกให้ใช้ 'ร้านอาหารไม่ระบุชื่อ')",
                },
                date: {
                  type: 'STRING',
                  description:
                    'วันเวลาที่ระบุในใบเสร็จในรูปแบบ ISO ISO-8601 String',
                },
                items: {
                  type: 'ARRAY',
                  items: {
                    type: 'OBJECT',
                    properties: {
                      name: {
                        type: 'STRING',
                        description: 'ชื่อรายการอาหารภาษาไทยหรืออังกฤษ',
                      },
                      price: { type: 'NUMBER', description: 'ราคาต่อหน่วย' },
                      quantity: {
                        type: 'NUMBER',
                        description: 'จำนวนชิ้นอาหาร',
                      },
                    },
                    required: ['name', 'price', 'quantity'],
                  },
                },
                subtotal: { type: 'NUMBER' },
                vat: { type: 'NUMBER' },
                serviceCharge: { type: 'NUMBER' },
                total: { type: 'NUMBER' },
                error: {
                  type: 'STRING',
                  description:
                    'หากภาพนี้ไม่ใช่ใบเสร็จอาหารหรือสลิป ให้คืนค่า error บอกเหตุผล',
                },
              },
              required: [
                'merchantName',
                'date',
                'items',
                'subtotal',
                'vat',
                'serviceCharge',
                'total',
              ],
            },
          },
        }),
        signal: AbortSignal.timeout(15000), // 15 seconds timeout
      });

      if (!response.ok) {
        const errText = await response.text();
        this.logger.error(
          `Gemini API returned status ${response.status}: ${errText}`,
        );
        if (response.status === 429) {
          throw new BadRequestException(
            'คุณใช้งานโควตาสแกนภาพเต็มแล้ว (จำกัด 15 ครั้ง/นาที) กรุณากรอกรายการอาหารด้วยตนเองชั่วคราว',
          );
        }
        throw new Error(`Gemini API Error: ${response.statusText}`);
      }

      const resJson = (await response.json()) as GeminiApiResponse;
      const textResponse = resJson.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textResponse) {
        throw new Error('ไม่ได้รับการตอบสนองข้อมูลภาพจาก Gemini AI');
      }

      const parsedData = JSON.parse(textResponse.trim()) as GeminiOcrResult;

      // Check if Gemini reported an error (like "Not a receipt")
      if (parsedData.error) {
        throw new BadRequestException(parsedData.error);
      }

      // Ensure data types are correct and validate dates
      const items = (parsedData.items || []).map((item) => ({
        name: String(item.name || 'รายการไม่มีชื่อ'),
        price: sanitizeNumber(item.price),
        quantity: Math.max(1, Math.round(sanitizeNumber(item.quantity))),
      }));

      // Validate date or default to current date
      let parsedDate = new Date().toISOString();
      try {
        if (parsedData.date) {
          const d = new Date(parsedData.date);
          if (!isNaN(d.getTime())) {
            parsedDate = d.toISOString();
          }
        }
      } catch {
        // ignore invalid date format
      }

      return {
        merchantName: String(parsedData.merchantName || 'ร้านอาหารไม่ระบุชื่อ'),
        date: parsedDate,
        items,
        subtotal: sanitizeNumber(parsedData.subtotal),
        vat: sanitizeNumber(parsedData.vat),
        serviceCharge: sanitizeNumber(parsedData.serviceCharge),
        total: sanitizeNumber(parsedData.total),
      };
    } catch (error) {
      this.logger.error('Failed to communicate with Gemini API', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        'การเชื่อมต่อกับ AI สแกนใบเสร็จขัดข้อง กรุณาลองใหม่อีกครั้ง หรือพิมพ์เมนูอาหารด้วยตนเอง',
      );
    }
  }
}
